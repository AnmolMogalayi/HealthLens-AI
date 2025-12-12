import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface DisclaimerProps {
  title: string;
  text: string;
}

export const Disclaimer: React.FC<DisclaimerProps> = ({ title, text }) => {
  return (
    <div className="mt-8 mb-8 glass-card rounded-xl p-6 flex gap-4 border border-slate-300 dark:border-navy-600 bg-slate-100/90 dark:bg-navy-800/90 shadow-sm transition-colors">
      <div className="p-3 bg-slate-300 dark:bg-navy-700 rounded-full h-fit flex-shrink-0 text-slate-700 dark:text-slate-300">
        <ShieldAlert size={24} />
      </div>
      <div className="text-xs leading-relaxed">
        <p className="font-bold mb-2 text-slate-800 dark:text-slate-200 uppercase tracking-wide text-xs">{title}</p>
        <p className="text-slate-700 dark:text-slate-300 font-medium opacity-90">{text}</p>
      </div>
    </div>
  );
};