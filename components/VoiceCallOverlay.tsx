import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, PhoneOff, Download, Activity, User, Sparkles } from 'lucide-react';
import { GeminiLiveService } from '../services/geminiLiveService';
import { LiveTranscriptItem, Language } from '../types';
import { TRANSLATIONS } from '../translations';
import { jsPDF } from 'jspdf';

interface VoiceCallOverlayProps {
  onClose: () => void;
  systemContext: any; // Full analysis context
  language: Language;
}

export const VoiceCallOverlay: React.FC<VoiceCallOverlayProps> = ({ onClose, systemContext, language }) => {
  const [status, setStatus] = useState<'connecting' | 'active' | 'error'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // AI speaking status
  const [transcript, setTranscript] = useState<LiveTranscriptItem[]>([]);
  const serviceRef = useRef<GeminiLiveService | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[language];

  useEffect(() => {
    // Initialize Service
    const initService = async () => {
      try {
        const apiKey = process.env.API_KEY || '';
        if (!apiKey) throw new Error("No API Key");

        const service = new GeminiLiveService(apiKey);
        serviceRef.current = service;

        // Setup callbacks
        service.onTranscriptUpdate = (item) => {
          setTranscript(prev => [...prev, item]);
          // Auto scroll
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        };
        
        service.onStatusChange = (s) => {
          setIsSpeaking(s.isSpeaking);
        };
        
        service.onDisconnect = () => {
          onClose();
        };

        // Construct System Prompt
        const systemInstruction = `
          You are "Dr. AI", a compassionate, knowledgeable, and empathetic health coach. 
          You are speaking with a user about their medical report via a voice call.
          
          Context of their report: ${JSON.stringify(systemContext)}.
          
          Rules:
          1. Speak naturally, concisely, and clearly. Use short sentences suitable for audio.
          2. Be encouraging but realistic.
          3. Do not use complex medical jargon without explaining it simply.
          4. If the user asks something not in the report, give general health advice but clarify you don't have that specific data.
          5. If the user seems anxious, use a calming tone.
          6. STRICTLY: Do not diagnose. State you are an AI assistant for educational purposes.
        `;

        await service.connect(systemInstruction);
        setStatus('active');
      } catch (e) {
        console.error(e);
        setStatus('error');
      }
    };

    initService();

    return () => {
      if (serviceRef.current) {
        serviceRef.current.disconnect();
      }
    };
  }, [systemContext, onClose]);

  const toggleMute = () => {
    if (serviceRef.current) {
      serviceRef.current.mute(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const handleEndCall = () => {
    if (serviceRef.current) serviceRef.current.disconnect();
    onClose();
  };

  const downloadTranscript = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Voice Session Transcript - HealthLens AI", 20, 20);
    
    let y = 40;
    doc.setFontSize(11);
    
    transcript.forEach(item => {
      const role = item.role === 'model' ? "Dr. AI: " : "You: ";
      const text = doc.splitTextToSize(role + item.text, 170);
      
      if (y + (text.length * 7) > 280) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFont("helvetica", item.role === 'model' ? "bold" : "normal");
      doc.text(text, 20, y);
      y += (text.length * 7) + 5;
    });

    doc.save("voice-transcript.pdf");
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900/95 backdrop-blur-2xl text-white animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
           <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
           <span className="font-mono text-sm tracking-widest uppercase opacity-70">Live Session</span>
        </div>
        <button 
          onClick={handleEndCall}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <PhoneOff size={24} />
        </button>
      </div>

      {/* Main Visualizer Area */}
      <div className="flex-grow flex flex-col items-center justify-center relative overflow-hidden p-8">
         {/* Background Glow */}
         <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/30 rounded-full blur-[100px] transition-all duration-500 ${isSpeaking ? 'scale-150 opacity-100' : 'scale-100 opacity-50'}`} />
         
         {/* Central Avatar / Waveform */}
         <div className="relative z-10 flex flex-col items-center gap-8">
            <div className={`
               w-32 h-32 rounded-full flex items-center justify-center border-4 shadow-[0_0_50px_rgba(99,102,241,0.5)]
               transition-all duration-300 ease-in-out
               ${isSpeaking 
                 ? 'border-indigo-400 bg-indigo-500/20 scale-110' 
                 : 'border-slate-700 bg-slate-800/50 scale-100'
               }
            `}>
               {isSpeaking ? (
                 <Activity size={48} className="text-indigo-400 animate-bounce" />
               ) : (
                 <Sparkles size={48} className="text-slate-500" />
               )}
            </div>

            <div className="text-center space-y-2">
               <h2 className="text-3xl font-bold tracking-tight">Dr. AI</h2>
               <p className="text-indigo-300 font-medium animate-pulse">
                  {status === 'connecting' ? t.voiceConnecting : isSpeaking ? t.voiceSpeaking : t.voiceListening}
               </p>
            </div>
         </div>
      </div>

      {/* Transcript Area */}
      <div className="h-48 bg-black/20 border-t border-white/10 p-4 overflow-y-auto scroll-smooth" ref={scrollRef}>
         <div className="max-w-2xl mx-auto space-y-4">
            {transcript.length === 0 && (
               <p className="text-center text-slate-500 text-sm italic mt-4">{t.voiceDisclaimer}</p>
            )}
            {transcript.map((item) => (
               <div key={item.id} className={`flex gap-3 ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {item.role === 'model' && (
                     <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0"><Sparkles size={14} /></div>
                  )}
                  <div className={`p-3 rounded-2xl text-sm max-w-[80%] ${
                     item.role === 'user' 
                     ? 'bg-slate-800 text-white rounded-tr-none' 
                     : 'bg-white/10 text-slate-200 rounded-tl-none'
                  }`}>
                     {item.text}
                  </div>
                  {item.role === 'user' && (
                     <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0"><User size={14} /></div>
                  )}
               </div>
            ))}
         </div>
      </div>

      {/* Controls */}
      <div className="p-8 pb-10 flex justify-center items-center gap-8 bg-black/40 backdrop-blur-md">
         <button 
           onClick={toggleMute}
           className={`p-4 rounded-full transition-all ${isMuted ? 'bg-white text-slate-900' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
         >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
         </button>
         
         <button 
           onClick={handleEndCall}
           className="p-6 rounded-full bg-red-600 text-white hover:bg-red-700 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-red-900/50"
         >
            <PhoneOff size={32} />
         </button>

         <button 
           onClick={downloadTranscript}
           disabled={transcript.length === 0}
           className="p-4 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition-all disabled:opacity-50"
           title={t.downloadTranscript}
         >
            <Download size={24} />
         </button>
      </div>
    </div>
  );
};