import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface DisclaimerProps {
  title: string;
  text: string;
}

export const Disclaimer: React.FC<DisclaimerProps> = ({ title, text }) => {
  return (
    <div className="mt-8 mb-8 glass-card rounded-xl p-5 flex gap-4 border border-slate-200/60 bg-slate-50/50 hover:bg-slate-50/80 transition-colors">
      <div className="p-2 bg-slate-200 rounded-full h-fit flex-shrink-0 text-slate-600">
        <ShieldAlert size={20} />
      </div>
      <div className="text-xs text-slate-500 leading-relaxed">
        <p className="font-bold mb-1 text-slate-700 uppercase tracking-wide text-[10px]">{title}</p>
        <p className="opacity-80">{text}</p>
      </div>
    </div>
  );
};