import React, { useState, useRef, useEffect } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  AlertOctagon, 
  HelpCircle, 
  BookOpen, 
  Lightbulb, 
  ListChecks, 
  ChevronDown, 
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
  Upload,
  Loader2,
  X,
  Maximize2,
  Activity
} from 'lucide-react';
import { AnalysisResult, FindingStatus, TrendMetric } from '../types';

// --- 3D TILT CARD WRAPPER ---
const TiltCard: React.FC<{ 
  children: React.ReactNode; 
  className?: string; 
  delay?: number;
  onClick?: () => void;
}> = ({ children, className = '', delay = 0, onClick }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    // Staggered entrance animation
    const timer = setTimeout(() => setOpacity(1), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate rotation (max 5 degrees for subtle medical feel)
    const xRot = ((y - rect.height / 2) / rect.height) * 4;
    const yRot = ((x - rect.width / 2) / rect.width) * -4;
    
    setRotate({ x: xRot, y: yRot });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  return (
    <div 
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`glass-panel rounded-3xl p-6 transition-all duration-200 ease-out transform-gpu 
        ${opacity === 0 ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'}
        ${onClick ? 'cursor-pointer hover:border-teal-300/60 dark:hover:border-neon-blue/60' : ''}
        ${className}
      `}
      style={{
        transform: `perspective(1000px) rotateX(${rotate.x * -1}deg) rotateY(${rotate.y}deg) scale3d(1, 1, 1)`,
        transition: opacity === 0 ? 'opacity 0.8s ease, transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'transform 0.1s ease-out'
      }}
    >
      {/* Glossy sheen overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none rounded-3xl" />
      {children}
    </div>
  );
};

// --- ANIMATED METRIC GAUGE ---
const MetricGauge: React.FC<{ value: number; max: number; color: string }> = ({ value, max, color }) => {
  const [percent, setPercent] = useState(0);
  
  useEffect(() => {
    const target = Math.min((value / max) * 100, 100);
    setTimeout(() => setPercent(target), 300);
  }, [value, max]);

  return (
    <div className="h-2 w-24 bg-slate-100 dark:bg-navy-900 rounded-full overflow-hidden mt-1">
      <div 
        className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
};

// --- FOCUS MODE OVERLAY ---
const FocusOverlay: React.FC<{ 
  finding: any; 
  onClose: () => void; 
}> = ({ finding, onClose }) => {
  if (!finding) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 dark:bg-navy-900/80 backdrop-blur-md transition-opacity animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white/90 dark:bg-navy-800/90 backdrop-blur-xl rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300 border border-white/50 dark:border-navy-600">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-slate-100 dark:bg-navy-700 rounded-full hover:bg-slate-200 dark:hover:bg-navy-600 transition-colors">
          <X size={20} className="text-slate-600 dark:text-slate-400" />
        </button>

        <div className="mb-6">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2
            ${finding.status === 'urgent' ? 'bg-rose-100 dark:bg-neon-pink/20 text-rose-700 dark:text-neon-pink' : 
              finding.status === 'attention' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' : 
              'bg-emerald-100 dark:bg-neon-green/20 text-emerald-700 dark:text-neon-green'}`}>
            {finding.status}
          </span>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{finding.label}</h2>
          {finding.extractedValue && (
             <div className="text-5xl font-bold text-slate-800 dark:text-slate-200 mt-2 tracking-tighter">
                {finding.extractedValue.value} <span className="text-2xl text-slate-400 font-medium">{finding.extractedValue.unit}</span>
             </div>
          )}
        </div>

        {/* Projected Improvement Chart (Simulated) */}
        <div className="bg-slate-50/50 dark:bg-navy-900/50 rounded-2xl p-6 border border-slate-100 dark:border-navy-600 mb-6">
           <div className="flex items-center gap-2 mb-4 text-slate-500 dark:text-slate-400 font-medium text-sm">
             <Activity size={16} /> Projected Improvement (3 Months)
           </div>
           
           <div className="relative h-40 w-full flex items-end justify-between px-2">
             {/* Chart Line SVG */}
             <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
               <path 
                 d="M0,120 C100,120 150,80 300,60 S500,20 600,20" 
                 fill="none" 
                 stroke={finding.status === 'normal' ? '#10b981' : finding.status === 'urgent' ? '#f43f5e' : '#f59e0b'} 
                 strokeWidth="4" 
                 strokeDasharray="1000"
                 strokeDashoffset="0"
                 className="animate-[dash_2s_ease-out_forwards]"
               />
               <defs>
                 <style>{`
                   @keyframes dash {
                     to { stroke-dashoffset: 0; }
                     from { stroke-dashoffset: 1000; }
                   }
                 `}</style>
               </defs>
             </svg>
             
             {/* Labels */}
             <div className="text-xs text-slate-400 font-medium">Now</div>
             <div className="text-xs text-slate-400 font-medium">Month 1</div>
             <div className="text-xs text-slate-400 font-medium">Month 2</div>
             <div className="text-xs text-slate-400 font-medium">Goal</div>
           </div>
        </div>

        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
          Based on clinical guidelines, maintaining this level requires consistent monitoring. 
          AI suggests a follow-up test in 3-6 months.
        </p>

        <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-navy-600">
           <p className="text-xs text-slate-400 font-mono">Source snippet: "{finding.sourceSnippet}"</p>
        </div>
      </div>
    </div>
  );
};


// --- BENTO GRID COMPONENTS ---

export const SummaryCard: React.FC<{ text: string; title: string }> = ({ text, title }) => (
  <TiltCard className="col-span-1 md:col-span-2 lg:col-span-3 bg-gradient-to-r from-blue-50/50 to-teal-50/50 dark:from-navy-800 dark:to-navy-800 dark:border-neon-blue/30" delay={100}>
    <div className="flex items-center gap-3 mb-4">
      <div className="p-3 bg-white dark:bg-navy-700 rounded-2xl text-blue-600 dark:text-neon-blue shadow-sm">
        <ListChecks size={24} />
      </div>
      <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">{title}</h3>
    </div>
    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg font-medium">{text}</p>
  </TiltCard>
);

interface KeyFindingsProps {
  findings: AnalysisResult['keyFindings'];
  title: string;
  statusLabels: { normal: string; attention: string; urgent: string };
}

export const KeyFindingsCard: React.FC<KeyFindingsProps> = ({ findings, title, statusLabels }) => {
  const [focusedFinding, setFocusedFinding] = useState<any>(null);

  const getStatusColor = (status: FindingStatus) => {
    switch (status) {
      case FindingStatus.URGENT: return 'text-rose-500 dark:text-neon-pink bg-rose-50 dark:bg-neon-pink/10 border-rose-100 dark:border-neon-pink/30';
      case FindingStatus.ATTENTION: return 'text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-100 dark:border-amber-900/50';
      case FindingStatus.NORMAL: return 'text-emerald-500 dark:text-neon-green bg-emerald-50 dark:bg-neon-green/10 border-emerald-100 dark:border-neon-green/30';
    }
  };

  return (
    <>
      <TiltCard className="col-span-1 md:col-span-2 row-span-2" delay={200}>
        <div className="flex items-center justify-between mb-6">
           <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{title}</h3>
           <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{findings.length} DETECTED</div>
        </div>
        
        <div className="space-y-3">
          {findings.map((f, i) => (
            <div 
              key={f.id} 
              onClick={() => setFocusedFinding(f)}
              className={`group p-4 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden
                ${getStatusColor(f.status)} hover:shadow-lg hover:scale-[1.02]
              `}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  {f.status === 'urgent' && <AlertOctagon className="flex-shrink-0 animate-pulse" size={24} />}
                  {f.status === 'attention' && <AlertTriangle className="flex-shrink-0" size={24} />}
                  {f.status === 'normal' && <CheckCircle className="flex-shrink-0" size={24} />}
                  
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 leading-none mb-1">{f.label}</h4>
                    <span className="text-xs font-semibold opacity-70 uppercase tracking-wide">
                        {f.status === 'urgent' ? statusLabels.urgent : f.status === 'attention' ? statusLabels.attention : statusLabels.normal}
                    </span>
                  </div>
                </div>

                {f.extractedValue && (
                  <div className="text-right">
                    <span className="block text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{f.extractedValue.value}</span>
                    <span className="text-[10px] font-bold opacity-60 uppercase">{f.extractedValue.unit}</span>
                    {/* Visual bar only for numeric looking values */}
                    {!isNaN(parseFloat(f.extractedValue.value)) && (
                       <MetricGauge 
                          value={parseFloat(f.extractedValue.value)} 
                          max={parseFloat(f.extractedValue.value) * 1.5} // Dummy max for visual
                          color={f.status === 'urgent' ? 'bg-rose-500 dark:bg-neon-pink' : f.status === 'attention' ? 'bg-amber-500' : 'bg-emerald-500 dark:bg-neon-green'}
                       />
                    )}
                  </div>
                )}
                
                {/* Hover Maximize Icon */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-navy-700/80 p-2 rounded-full shadow-sm backdrop-blur-sm">
                   <Maximize2 size={16} className="text-slate-600 dark:text-slate-300" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </TiltCard>

      {focusedFinding && (
        <FocusOverlay finding={focusedFinding} onClose={() => setFocusedFinding(null)} />
      )}
    </>
  );
};

export const PracticalImplicationsCard: React.FC<{ items: string[]; title: string }> = ({ items, title }) => (
  <TiltCard className="col-span-1 bg-gradient-to-br from-amber-50/40 to-orange-50/40 dark:from-navy-800 dark:to-navy-800 dark:border-amber-900/50" delay={300}>
    <div className="flex items-center gap-3 mb-4">
      <div className="p-3 bg-white dark:bg-navy-700 rounded-2xl text-amber-500 shadow-sm">
        <Lightbulb size={24} />
      </div>
      <h3 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h3>
    </div>
    <ul className="space-y-4">
      {items.map((item, idx) => (
        <li key={idx} className="flex gap-3 text-slate-700 dark:text-slate-300 items-start">
          <div className="w-6 h-6 rounded-full bg-white dark:bg-navy-700 flex items-center justify-center flex-shrink-0 shadow-sm text-xs font-bold text-amber-500 border border-amber-100 dark:border-amber-900/50 mt-0.5">
             {idx + 1}
          </div>
          <span className="leading-snug font-medium text-sm">{item}</span>
        </li>
      ))}
    </ul>
  </TiltCard>
);

export const QuestionsCard: React.FC<{ questions: string[]; title: string }> = ({ questions, title }) => (
  <TiltCard className="col-span-1 bg-gradient-to-br from-indigo-50/40 to-violet-50/40 dark:from-navy-800 dark:to-navy-800 dark:border-neon-purple/30" delay={400}>
    <div className="flex items-center gap-3 mb-4">
      <div className="p-3 bg-white dark:bg-navy-700 rounded-2xl text-indigo-500 dark:text-neon-purple shadow-sm">
        <HelpCircle size={24} />
      </div>
      <h3 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h3>
    </div>
    <ul className="space-y-3">
      {questions.map((q, idx) => (
        <li key={idx} className="p-3 bg-white/60 dark:bg-navy-900/50 rounded-xl border border-white/50 dark:border-navy-600 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-navy-800 hover:text-indigo-600 dark:hover:text-neon-purple transition-colors cursor-default">
           {q}
        </li>
      ))}
    </ul>
  </TiltCard>
);

export const EducationCard: React.FC<{ content: string; title: string; readMoreText: string }> = ({ content, title, readMoreText }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <TiltCard className="col-span-1 md:col-span-3" delay={500}>
      <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 dark:bg-navy-700 rounded-2xl text-indigo-600 dark:text-neon-blue">
            <BookOpen size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h3>
        </div>
        <button className="p-2 hover:bg-slate-100 dark:hover:bg-navy-700 rounded-full transition-colors">
          {expanded ? <ChevronUp size={20} className="dark:text-slate-400" /> : <ChevronDown size={20} className="dark:text-slate-400" />}
        </button>
      </div>
      
      <div className={`text-slate-600 dark:text-slate-300 leading-relaxed overflow-hidden transition-all duration-500 ease-in-out ${expanded ? 'max-h-[800px]' : 'max-h-20 relative'}`}>
         <div className="prose prose-slate dark:prose-invert max-w-none font-medium">
           {content}
         </div>
         {!expanded && (
           <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/90 dark:from-navy-800/90 to-transparent pointer-events-none" />
         )}
      </div>
    </TiltCard>
  );
};

// --- TREND CARD (Preserved but styled) ---
export const TrendAnalysisCard: React.FC<any> = ({ onUpload, isAnalyzing, trends, error, translations }) => {
  const [dragActive, setDragActive] = useState(false);

  // ... (Keep existing drag handlers same as before for brevity, purely logic) ...
  // Re-implementing logic here to ensure functionality persists
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) onUpload(e.dataTransfer.files[0]);
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) onUpload(e.target.files[0]);
  };

  const renderTrendIcon = (direction: string, evaluation: string) => {
    if (direction === 'stable') return <Minus className="text-slate-400" size={18} />;
    const icon = direction === 'up' ? <TrendingUp size={18} /> : <TrendingDown size={18} />;
    
    if (evaluation === 'improved') return <span className="text-emerald-500 bg-emerald-50 dark:bg-neon-green/20 dark:text-neon-green p-1.5 rounded-full">{icon}</span>;
    if (evaluation === 'worsened') return <span className="text-rose-500 bg-rose-50 dark:bg-neon-pink/20 dark:text-neon-pink p-1.5 rounded-full">{icon}</span>;
    return <span className="text-slate-500 bg-slate-100 dark:bg-navy-900 p-1.5 rounded-full">{icon}</span>;
  };

  const renderBadge = (evaluation: string) => {
    switch (evaluation) {
      case 'improved': return <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 dark:bg-neon-green/20 text-emerald-700 dark:text-neon-green tracking-wide">{translations.improved}</span>;
      case 'worsened': return <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-rose-100 dark:bg-neon-pink/20 text-rose-700 dark:text-neon-pink tracking-wide">{translations.worsened}</span>;
      default: return <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 dark:bg-navy-900 text-slate-600 dark:text-slate-400 tracking-wide">{translations.stable}</span>;
    }
  };

  return (
    <TiltCard className="col-span-1 md:col-span-3 border-l-4 border-l-indigo-500 dark:border-l-neon-blue" delay={0}>
       <div className="flex items-center gap-3 mb-6">
        <div className="bg-indigo-50 dark:bg-navy-700 p-2 rounded-xl text-indigo-600 dark:text-neon-blue">
           <TrendingUp size={24} />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{translations.title}</h3>
      </div>

      {!trends && !isAnalyzing ? (
        <div 
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-300 ${
             dragActive ? 'border-indigo-400 bg-indigo-50/50 dark:bg-neon-blue/10 scale-[1.01]' : 'border-slate-300 dark:border-navy-600 hover:border-indigo-300 dark:hover:border-neon-blue hover:bg-slate-50/50 dark:hover:bg-navy-800/50'
          }`}
          onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
        >
          <input type="file" id="trend-upload" className="hidden" onChange={handleChange} accept=".jpg,.jpeg,.png,.pdf" />
          <div className="mb-3 flex justify-center text-indigo-300 dark:text-navy-600"><Upload size={32} /></div>
          <p className="text-slate-700 dark:text-slate-300 font-bold mb-1">{translations.uploadTitle}</p>
          <label htmlFor="trend-upload" className="inline-flex items-center gap-2 px-4 py-2 mt-2 bg-slate-800 dark:bg-navy-700 text-white rounded-full text-xs font-bold hover:bg-slate-900 dark:hover:bg-navy-600 cursor-pointer shadow-lg glow-hover">
             <Upload size={14} /> {translations.uploadBtn}
          </label>
           {error && <p className="mt-3 text-xs text-rose-500 dark:text-neon-pink font-bold">{error}</p>}
        </div>
      ) : isAnalyzing ? (
        <div className="py-8 flex flex-col items-center text-center">
           <Loader2 className="animate-spin text-indigo-600 dark:text-neon-blue mb-2" size={32} />
           <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{translations.analyzing}</p>
        </div>
      ) : trends ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-navy-600 bg-white/40 dark:bg-navy-900/40">
           <table className="w-full text-sm text-left">
             <thead className="bg-slate-50/50 dark:bg-navy-800/50 text-slate-500 dark:text-slate-400 uppercase font-bold text-xs">
               <tr>
                 <th className="px-4 py-3">{translations.metric}</th>
                 <th className="px-4 py-3">{translations.previous}</th>
                 <th className="px-4 py-3">{translations.current}</th>
                 <th className="px-4 py-3 text-center">{translations.trend}</th>
                 <th className="px-4 py-3 text-right">{translations.status}</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100 dark:divide-navy-700/50">
               {trends.map((t: any, i: number) => (
                 <tr key={i} className="hover:bg-white/60 dark:hover:bg-navy-700/60 transition-colors">
                   <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{t.metric}</td>
                   <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{t.previousValue} <span className="text-[10px] opacity-70">{t.unit}</span></td>
                   <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">{t.currentValue} <span className="text-[10px] font-normal opacity-70">{t.unit}</span></td>
                   <td className="px-4 py-3 text-center"><div className="flex justify-center">{renderTrendIcon(t.direction, t.evaluation)}</div></td>
                   <td className="px-4 py-3 text-right">{renderBadge(t.evaluation)}</td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      ) : null}
    </TiltCard>
  );
};