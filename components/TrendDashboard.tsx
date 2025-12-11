import React, { useState } from 'react';
import { Upload, X, Loader2, Calendar, TrendingUp, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { Language, TrendAnalysisResult } from '../types';
import { TRANSLATIONS } from '../translations';
import { analyzeLongitudinalTrends } from '../services/geminiService';
import { TrendChart } from './TrendChart';
import { AICoach } from './AICoach';

interface TrendDashboardProps {
  language: Language;
  onBack: () => void;
}

export const TrendDashboard: React.FC<TrendDashboardProps> = ({ language, onBack }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<TrendAnalysisResult | null>(null);
  const [selectedBiomarkerIndex, setSelectedBiomarkerIndex] = useState(0);
  const t = TRANSLATIONS[language];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (files.length < 2) return;
    setIsAnalyzing(true);
    try {
      const data = await analyzeLongitudinalTrends(files, true, language); // Using demo mode for stability in this context
      setResults(data);
    } catch (e) {
      console.error(e);
      alert("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- UPLOAD STATE ---
  if (!results && !isAnalyzing) {
    return (
      <div className="animate-stagger-enter max-w-4xl mx-auto">
        <button onClick={onBack} className="mb-6 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold text-sm flex items-center gap-2 transition-colors">
           ← Back
        </button>

        <div className="glass-panel rounded-[2.5rem] p-8 md:p-12 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 relative overflow-hidden group">
            <input 
              type="file" 
              multiple 
              onChange={handleFileChange} 
              className="absolute inset-0 opacity-0 cursor-pointer z-20"
              accept=".jpg,.jpeg,.png,.pdf"
            />
            
            <div className="bg-indigo-50 dark:bg-indigo-900/40 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-500 dark:text-indigo-400 shadow-inner group-hover:scale-110 transition-transform duration-500">
               <Upload size={48} />
            </div>
            
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t.trendUploadTitle}</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 text-lg">{t.uploadMultiple}</p>

            {files.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 relative z-30 pointer-events-none">
                    {files.map((f, i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-md border border-slate-100 dark:border-slate-700 flex items-center justify-between pointer-events-auto">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <FileText size={16} className="text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                                <span className="text-xs font-bold truncate text-slate-700 dark:text-slate-300">{f.name}</span>
                            </div>
                            <button onClick={() => removeFile(i)} className="text-slate-400 hover:text-rose-500"><X size={14} /></button>
                        </div>
                    ))}
                </div>
            )}

            <button 
                onClick={handleAnalyze}
                disabled={files.length < 2}
                className="relative z-30 px-8 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
            >
                {t.analyzeBtn} ({files.length})
            </button>
        </div>
      </div>
    );
  }

  // --- LOADING STATE ---
  if (isAnalyzing) {
    return (
        <div className="h-[600px] flex flex-col items-center justify-center text-center p-12 glass-panel rounded-[2.5rem] shadow-xl animate-pulse max-w-4xl mx-auto">
            <div className="relative mb-8">
               <div className="absolute inset-0 bg-indigo-400 rounded-full blur-2xl opacity-20 animate-pulse"></div>
               <div className="relative w-24 h-24 border-4 border-slate-100 dark:border-slate-700 border-t-indigo-500 rounded-full animate-spin shadow-2xl bg-white dark:bg-slate-800"></div>
               <div className="absolute inset-0 flex items-center justify-center">
                 <TrendingUp className="text-indigo-500 animate-bounce" size={32} />
               </div>
            </div>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4 tracking-tight">{t.analyzingMultiple}</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md text-lg leading-relaxed font-medium">
               Connecting data points across your history...
            </p>
        </div>
    );
  }

  // --- DASHBOARD STATE ---
  return (
    <div className="animate-fade-in-up">
       <div className="flex items-center justify-between mb-8">
         <button onClick={onBack} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-bold text-sm flex items-center gap-2 transition-colors">
           ← Back to Single Analysis
         </button>
         <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t.trendsDashboard}</h1>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Timeline & List */}
          <div className="lg:col-span-3 space-y-4">
             <div className="glass-panel p-6 rounded-3xl border border-white/50 dark:border-slate-700/50">
                <h3 className="font-bold text-slate-400 dark:text-slate-500 text-xs uppercase tracking-widest mb-4">Biomarkers</h3>
                <div className="space-y-2">
                    {results?.biomarkers.map((b, i) => (
                        <div 
                           key={i}
                           onClick={() => setSelectedBiomarkerIndex(i)}
                           className={`p-3 rounded-xl cursor-pointer transition-all border flex items-center justify-between ${
                               i === selectedBiomarkerIndex 
                               ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 shadow-inner' 
                               : 'bg-white/50 dark:bg-slate-800/50 border-transparent hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm'
                           }`}
                        >
                            <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{b.label}</span>
                            <span className="text-lg">{b.emoji}</span>
                        </div>
                    ))}
                </div>
             </div>

             <div className="glass-panel p-6 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-800 text-white shadow-lg">
                <h3 className="font-bold text-indigo-100 text-xs uppercase tracking-widest mb-2">{t.healthScore}</h3>
                <div className="text-5xl font-bold mb-1">{results?.overall_score}</div>
                <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white/90 rounded-full" style={{ width: `${results?.overall_score}%` }}></div>
                </div>
                <p className="text-xs text-indigo-100 mt-3 font-medium opacity-80">Based on aggregate improvements across 12 metrics.</p>
             </div>
          </div>

          {/* Center: Main Chart & Details */}
          <div className="lg:col-span-6 space-y-6">
             {results && (
                 <div className="glass-panel p-6 rounded-3xl border border-white/60 dark:border-slate-700/60 shadow-xl">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${
                                results.biomarkers[selectedBiomarkerIndex].trend_class === 'improved' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 
                                results.biomarkers[selectedBiomarkerIndex].trend_class === 'worsened' ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'
                            }`}>
                                {results.biomarkers[selectedBiomarkerIndex].trend_class}
                            </span>
                            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{results.biomarkers[selectedBiomarkerIndex].label}</h2>
                        </div>
                        <div className="text-right">
                             <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                                 {results.biomarkers[selectedBiomarkerIndex].percent_change > 0 ? '+' : ''}
                                 {results.biomarkers[selectedBiomarkerIndex].percent_change}%
                             </div>
                             <div className="text-xs text-slate-400 font-bold uppercase">Change</div>
                        </div>
                    </div>

                    <TrendChart trend={results.biomarkers[selectedBiomarkerIndex]} />

                    <div className="mt-8 grid grid-cols-2 gap-4">
                        <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wide mb-2">{t.prediction}</h4>
                            <p className="text-xl font-bold text-slate-700 dark:text-slate-200">
                                {results.biomarkers[selectedBiomarkerIndex].predicted_in_3_months} 
                                <span className="text-xs font-normal text-slate-400 ml-1">{results.biomarkers[selectedBiomarkerIndex].values[0].unit}</span>
                            </p>
                        </div>
                        <div className="bg-emerald-50/50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                             <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-wide mb-2">{t.recommendations}</h4>
                             <ul className="text-xs font-medium text-slate-600 dark:text-slate-400 space-y-1">
                                {results.biomarkers[selectedBiomarkerIndex].recommendations.slice(0, 2).map((r, i) => (
                                    <li key={i} className="flex gap-1">• {r}</li>
                                ))}
                             </ul>
                        </div>
                    </div>
                 </div>
             )}
          </div>

          {/* Right: AI Coach */}
          <div className="lg:col-span-3">
              {results && <AICoach language={language} context={results} />}
          </div>

       </div>
    </div>
  );
};