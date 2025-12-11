import React, { useEffect, useState } from 'react';
import { TRANSLATIONS } from '../translations';
import { Language } from '../types';
import { ArrowRight, HeartPulse } from 'lucide-react';

interface AnxietyHelperProps {
  language: Language;
  onComplete: () => void;
}

export const AnxietyHelper: React.FC<AnxietyHelperProps> = ({ language, onComplete }) => {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');
  const t = TRANSLATIONS[language];

  useEffect(() => {
    const cycle = async () => {
      setPhase('in');
      await new Promise(r => setTimeout(r, 3000));
      setPhase('hold');
      await new Promise(r => setTimeout(r, 2000));
      setPhase('out');
      await new Promise(r => setTimeout(r, 3000));
    };

    const interval = setInterval(cycle, 8000);
    cycle();

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 animate-fade-in bg-white/30 backdrop-blur-xl border border-white/20">
      <div className="max-w-md w-full text-center space-y-8 glass-card p-10 rounded-3xl shadow-2xl relative overflow-hidden">
        
        {/* Background Gradients inside card */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 to-purple-500/5 -z-10" />

        <div className="space-y-4 relative z-10">
           <div className="inline-flex items-center justify-center p-4 bg-blue-50 rounded-full text-blue-600 mb-2 shadow-sm animate-bounce">
             <HeartPulse size={36} />
           </div>
           <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{t.anxietyTitle}</h2>
           <p className="text-slate-600 leading-relaxed font-medium">{t.anxietyText}</p>
        </div>

        <div className="relative h-64 w-full flex items-center justify-center py-8">
          <div 
             className={`absolute w-32 h-32 rounded-full bg-blue-400/30 blur-xl transition-all duration-[3000ms] ease-in-out ${
               phase === 'in' ? 'scale-[2.8] opacity-60' : phase === 'hold' ? 'scale-[2.8] opacity-50' : 'scale-100 opacity-20'
             }`}
          />
          <div 
             className={`absolute w-32 h-32 rounded-full bg-indigo-400/30 blur-lg transition-all duration-[3000ms] ease-in-out ${
               phase === 'in' ? 'scale-[2.0] opacity-70' : phase === 'hold' ? 'scale-[2.0] opacity-60' : 'scale-100 opacity-30'
             }`}
          />
          
          <div 
            className={`
              relative z-10 w-36 h-36 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-2xl shadow-blue-500/40
              flex items-center justify-center text-white font-bold text-xl tracking-wider
              transition-all duration-[3000ms] ease-in-out border-4 border-white/20
              ${phase === 'in' ? 'scale-125' : phase === 'hold' ? 'scale-125' : 'scale-100'}
            `}
          >
             {phase === 'in' && t.breatheIn}
             {phase === 'hold' && t.breatheHold}
             {phase === 'out' && t.breatheOut}
          </div>
        </div>

        <div className="relative z-10">
          <button 
            onClick={onComplete}
            className="group relative inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-slate-800 text-white rounded-full font-bold hover:bg-slate-900 transition-all hover:scale-105 shadow-xl hover:shadow-2xl active:scale-95"
          >
            {t.viewResults} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};