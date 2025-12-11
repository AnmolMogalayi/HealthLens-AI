import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Zap, Volume2 } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface AudioPlayerProps {
  text: string;
  language: Language;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ text, language }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const t = TRANSLATIONS[language];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const handlePlay = () => {
    if (!synthRef.current) return;

    if (isPaused) {
      synthRef.current.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    if (isPlaying) {
      synthRef.current.pause();
      setIsPaused(true);
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to select an appropriate voice for the language
    const voices = synthRef.current.getVoices();
    let voice = voices.find(v => v.lang.startsWith(language));
    
    // Fallback logic for better voice matching
    if (!voice && language === 'en') voice = voices.find(v => v.lang.startsWith('en-US'));
    if (!voice && language === 'es') voice = voices.find(v => v.lang.startsWith('es-ES'));
    if (!voice && language === 'hi') voice = voices.find(v => v.lang.startsWith('hi-IN'));
    if (!voice && language === 'zh') voice = voices.find(v => v.lang.startsWith('zh-CN'));
    
    if (voice) utterance.voice = voice;
    utterance.lang = language;
    utterance.rate = speed;

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
    setIsPlaying(true);
  };

  const handleStop = () => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  const toggleSpeed = () => {
    const nextSpeed = speed === 1 ? 1.5 : speed === 1.5 ? 2 : speed === 2 ? 0.75 : 1;
    setSpeed(nextSpeed);
    
    // If currently playing, we need to restart to apply speed change effectively in most browsers
    if (isPlaying || isPaused) {
      handleStop();
      // Small timeout to allow cancellation to process
      setTimeout(() => {
        // Re-trigger play with new speed (state update handled in next render, but for immediate effect we might need to rely on the updated state in the next cycle. 
        // For simplicity in this UX, stopping is sufficient feedback that settings changed, user can press play again.)
      }, 50);
    }
  };

  return (
    <div className="glass-card rounded-xl p-4 mb-6 flex items-center justify-between border border-blue-100/50 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 shadow-md">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white rounded-full text-blue-600 shadow-sm border border-blue-100">
          <Volume2 size={20} />
        </div>
        <div>
          <h4 className="font-bold text-slate-800 text-sm">{t.audioRead}</h4>
          <p className="text-xs text-slate-500 font-medium">
             {isPlaying ? 'Playing...' : isPaused ? 'Paused' : 'Ready'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Speed Control */}
        <button 
          onClick={toggleSpeed}
          className="flex items-center justify-center w-10 h-10 rounded-full text-xs font-bold text-slate-600 hover:bg-white hover:text-blue-600 transition-all border border-transparent hover:border-blue-100"
          title={t.audioSpeed}
        >
          {speed}x
        </button>

        {/* Play/Pause */}
        <button
          onClick={handlePlay}
          className={`
            w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md hover:scale-105 active:scale-95
            ${isPlaying 
              ? 'bg-white text-blue-600 border border-blue-100' 
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
            }
          `}
          title={isPlaying ? t.audioPause : t.audioPlay}
        >
          {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
        </button>

        {/* Stop */}
        {(isPlaying || isPaused) && (
          <button
            onClick={handleStop}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
            title={t.audioStop}
          >
            <Square size={16} fill="currentColor" />
          </button>
        )}
      </div>
    </div>
  );
};