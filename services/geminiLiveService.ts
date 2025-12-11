import { GoogleGenAI, LiveServerMessage, Modality, Blob } from "@google/genai";
import { LiveTranscriptItem } from "../types";

// Audio configuration constants
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-09-2025';

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private outputNode: GainNode | null = null;
  private audioSources: Set<AudioBufferSourceNode> = new Set();
  private nextStartTime: number = 0;
  private session: any = null; // Session object from connect promise
  private sessionResolver: ((value: any) => void) | null = null;
  private sessionPromise: Promise<any>;
  private currentInputTranscription = '';
  private currentOutputTranscription = '';

  public onTranscriptUpdate: ((item: LiveTranscriptItem) => void) | null = null;
  public onStatusChange: ((status: { isSpeaking: boolean }) => void) | null = null;
  public onDisconnect: (() => void) | null = null;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
    this.sessionPromise = new Promise((resolve) => {
      this.sessionResolver = resolve;
    });
  }

  async connect(systemInstruction: string) {
    try {
      // 1. Setup Audio Contexts
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.inputAudioContext = new AudioContextClass({ sampleRate: INPUT_SAMPLE_RATE });
      this.outputAudioContext = new AudioContextClass({ sampleRate: OUTPUT_SAMPLE_RATE });
      this.outputNode = this.outputAudioContext.createGain();
      this.outputNode.connect(this.outputAudioContext.destination);

      // 2. Connect to Gemini Live
      const sessionResult = await this.ai.live.connect({
        model: MODEL_NAME,
        callbacks: {
          onopen: this.handleOpen.bind(this),
          onmessage: this.handleMessage.bind(this),
          onclose: this.handleClose.bind(this),
          onerror: (e) => console.error("Gemini Live Error:", e),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }, // Friendly voice
          },
          inputAudioTranscription: { model: "gemini-2.5-flash" }, // Enable input transcription
          outputAudioTranscription: { model: "gemini-2.5-flash" }, // Enable output transcription
          systemInstruction: systemInstruction,
        },
      });
      
      // Note: ai.live.connect returns a promise that resolves to the session
      // However, the patterns usually involve waiting for onopen or just using the returned object
      // The SDK behavior: connect() returns a Promise<LiveSession>
      // We resolve our internal promise wrapper
      // Actually, based on docs, we should assign the result of connect to our session handler
      // But connect is async. 
      // Let's rely on the fact that `sessionResult` IS the session object once resolved.
      this.session = sessionResult;
      if(this.sessionResolver) this.sessionResolver(this.session);

    } catch (error) {
      console.error("Failed to connect to Gemini Live:", error);
      throw error;
    }
  }

  private async handleOpen() {
    console.log("Gemini Live Session Opened");
    await this.startAudioInput();
  }

  private async handleMessage(message: LiveServerMessage) {
    // 1. Handle Transcriptions
    if (message.serverContent?.outputTranscription) {
      this.currentOutputTranscription += message.serverContent.outputTranscription.text;
    } else if (message.serverContent?.inputTranscription) {
      this.currentInputTranscription += message.serverContent.inputTranscription.text;
    }

    if (message.serverContent?.turnComplete) {
      // Input Turn Complete (User finished speaking)
      if (this.currentInputTranscription.trim() && this.onTranscriptUpdate) {
        this.onTranscriptUpdate({
          id: Date.now().toString() + '-user',
          role: 'user',
          text: this.currentInputTranscription,
          timestamp: new Date()
        });
        this.currentInputTranscription = '';
      }
      
      // Output Turn Complete (Model finished speaking) - Logic might need adjustment as chunks arrive
      // Usually output transcription is streamed. We can finalize it when we get a new input or explicit turn end.
      // For simplicity, we send updates as we get them, or wait for a pause.
      // Let's finalize output when we see it.
      if (this.currentOutputTranscription.trim() && this.onTranscriptUpdate) {
         this.onTranscriptUpdate({
          id: Date.now().toString() + '-ai',
          role: 'model',
          text: this.currentOutputTranscription,
          timestamp: new Date()
        });
        this.currentOutputTranscription = '';
      }
    }

    // 2. Handle Audio Output
    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      if (this.onStatusChange) this.onStatusChange({ isSpeaking: true });
      this.queueAudioOutput(base64Audio);
    }

    // 3. Handle Interruption
    if (message.serverContent?.interrupted) {
      console.log("Model interrupted");
      this.stopAudioOutput();
      this.currentOutputTranscription = ''; // Clear stale transcription
    }
  }

  private handleClose() {
    console.log("Gemini Live Session Closed");
    this.cleanup();
    if (this.onDisconnect) this.onDisconnect();
  }

  private async startAudioInput() {
    if (!this.inputAudioContext) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.inputSource = this.inputAudioContext.createMediaStreamSource(stream);
      
      // Use ScriptProcessor for raw PCM access (widely supported)
      this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBlob = this.createPcmBlob(inputData);
        
        // Send to Gemini
        this.sessionPromise.then(session => {
            session.sendRealtimeInput({ media: pcmBlob });
        });
      };

      this.inputSource.connect(this.processor);
      this.processor.connect(this.inputAudioContext.destination); // Required for script processor to run
    } catch (e) {
      console.error("Microphone access failed", e);
    }
  }

  private createPcmBlob(data: Float32Array): Blob {
    // Downsample or convert to 16-bit PCM if needed. 
    // Gemini expects 'audio/pcm;rate=16000' usually.
    // Our context is already 16000Hz.
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      // Clamp and scale
      const s = Math.max(-1, Math.min(1, data[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    return {
      data: this.arrayBufferToBase64(int16.buffer),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private async queueAudioOutput(base64Audio: string) {
    if (!this.outputAudioContext) return;

    // Decode standard PCM (raw bytes) to AudioBuffer
    // Gemini sends raw PCM 24kHz usually.
    // We need to manually convert raw PCM bytes to AudioBuffer because decodeAudioData expects file headers (WAV/MP3).
    const pcmData = this.base64ToArrayBuffer(base64Audio);
    const float32Data = new Float32Array(pcmData.byteLength / 2);
    const dataView = new DataView(pcmData);

    for (let i = 0; i < float32Data.length; i++) {
       const int16 = dataView.getInt16(i * 2, true); // Little endian
       float32Data[i] = int16 / 32768.0;
    }

    const audioBuffer = this.outputAudioContext.createBuffer(1, float32Data.length, OUTPUT_SAMPLE_RATE);
    audioBuffer.getChannelData(0).set(float32Data);

    const source = this.outputAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.outputNode!);
    
    // Schedule
    const currentTime = this.outputAudioContext.currentTime;
    // If nextStartTime is in the past, reset it to now
    if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime;
    }
    
    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;
    this.audioSources.add(source);

    source.onended = () => {
      this.audioSources.delete(source);
      if (this.audioSources.size === 0 && this.onStatusChange) {
         this.onStatusChange({ isSpeaking: false });
      }
    };
  }

  private stopAudioOutput() {
    this.audioSources.forEach(source => {
      try { source.stop(); } catch(e) {}
    });
    this.audioSources.clear();
    this.nextStartTime = 0;
    if (this.onStatusChange) this.onStatusChange({ isSpeaking: false });
  }

  disconnect() {
    // Close session
    if (this.session) {
      // Check if close method exists (it should based on types, but let's be safe)
      // The API might rely on just closing the underlying websocket which the SDK manages
      // Current SDK version might not expose close() directly on the session object if it's a promise result
      // Assuming session has close():
      try { (this.session as any).close(); } catch(e) { console.log(e) }
    }
    this.cleanup();
  }

  private cleanup() {
    this.stopAudioOutput();
    
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.inputSource) {
      this.inputSource.disconnect();
      this.inputSource = null;
    }
    if (this.inputAudioContext) {
      this.inputAudioContext.close();
      this.inputAudioContext = null;
    }
    if (this.outputAudioContext) {
      this.outputAudioContext.close();
      this.outputAudioContext = null;
    }
  }

  mute(isMuted: boolean) {
     if (this.inputSource && this.inputAudioContext) {
        // We can disconnect/connect the processor or just mute the gain
        // Disconnecting processor stops sending data
        if (isMuted) {
            this.inputSource.disconnect(this.processor!);
        } else {
            this.inputSource.connect(this.processor!);
        }
     }
  }
}