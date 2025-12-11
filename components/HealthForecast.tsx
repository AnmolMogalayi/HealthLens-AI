import React, { useState } from 'react';
import { Sparkles, TrendingUp, ShieldCheck, ChevronDown, ChevronUp, Brain, AlertTriangle, ArrowRight } from 'lucide-react';
import { AnalysisResponse, HealthForecastResult, Language } from '../types';
import { TRANSLATIONS } from '../translations';
import { generateHealthForecast } from '../services/geminiService';
import { RiskRadarChart } from './RiskRadarChart';

interface HealthForecastProps {
  analysis: AnalysisResponse;
  language: Language;
  isDemoMode: boolean;
}

export const HealthForecast: React.FC<HealthForecastProps> = ({ analysis, language, isDemoMode }) => {
  const [forecast, setForecast] = useState<HealthForecastResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRisk, setExpandedRisk] = useState<number | null>(null);
  const t = TRANSLATIONS[language];

  const handleGenerateForecast = async () => {
    setIsLoading(true);
    try {
      const result = await generateHealthForecast(analysis, isDemoMode, language);
      setForecast(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!forecast) {
    return (
      <div className="mt-8 animate-stagger-enter">
        <div className="glass-panel p-8 rounded-3xl bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-navy-800 dark:to-navy-800 border border-indigo-100/50 dark:border-neon-blue/20 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 dark:bg-neon-blue/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="p-4 bg-white dark:bg-navy-700 rounded-2xl shadow-lg mb-6 text-indigo-600 dark:text-neon-blue">
               <Brain size={40} className="animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{t.forecastTitle}</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-8">{t.forecastSubtitle}</p>
            
            <button
              onClick={handleGenerateForecast}
              disabled={isLoading}
              className="px-8 py-4 bg-slate-900 dark:bg-neon-blue text-white rounded-2xl font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-70 flex items-center gap-3"
            >
              {isLoading ? (
                <>
                  <Sparkles className="animate-spin" size={20} /> {t.generatingForecast}
                </>
              ) : (
                <>
                  <Sparkles size={20} /> {t.generateForecast}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12 space-y-8 animate-fade-in-up">
       <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 dark:bg-navy-700 text-indigo-600 dark:text-neon-blue rounded-lg">
             <Brain size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t.forecastTitle}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Based on predictive analysis of 6 key dimensions</p>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Radar Chart Section */}
          <div className="lg:col-span-5">
             <div className="glass-panel p-6 rounded-3xl border border-white/60 dark:border-navy-600 h-full flex flex-col">
                <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                   <TrendingUp size={18} className="text-indigo-500 dark:text-neon-blue" /> {t.riskOverview}
                </h3>
                <div className="flex-grow flex items-center justify-center">
                   <RiskRadarChart data={forecast.riskCategories} />
                </div>
                <div className="mt-4 p-4 bg-slate-50/50 dark:bg-navy-900/50 rounded-xl text-sm text-slate-600 dark:text-slate-400 leading-relaxed border border-slate-100 dark:border-navy-700">
                   {forecast.overallOutlook}
                </div>
             </div>
          </div>

          {/* Detailed Risks & Plan */}
          <div className="lg:col-span-7 space-y-6">
             
             {/* Risk Cards */}
             <div className="space-y-4">
               {forecast.topRisks.map((risk, idx) => (
                 <div key={idx} className="glass-panel rounded-2xl border border-indigo-100 dark:border-navy-600 overflow-hidden transition-all duration-300">
                    <div 
                      onClick={() => setExpandedRisk(expandedRisk === idx ? null : idx)}
                      className="p-5 flex items-center justify-between cursor-pointer bg-white/40 dark:bg-navy-800/40 hover:bg-white/60 dark:hover:bg-navy-700/60"
                    >
                       <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${risk.currentProbability > 50 ? 'bg-rose-100 dark:bg-neon-pink/20 text-rose-600 dark:text-neon-pink' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'}`}>
                             <AlertTriangle size={20} />
                          </div>
                          <div>
                             <h4 className="font-bold text-slate-800 dark:text-white">{risk.name}</h4>
                             <div className="flex items-center gap-2 text-xs font-medium mt-1">
                                <span className="text-slate-500 dark:text-slate-400">Current Risk:</span>
                                <span className={risk.currentProbability > 50 ? 'text-rose-600 dark:text-neon-pink' : 'text-amber-600 dark:text-amber-400'}>{risk.currentProbability}%</span>
                             </div>
                          </div>
                       </div>
                       {expandedRisk === idx ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                    </div>

                    {expandedRisk === idx && (
                       <div className="p-5 pt-0 bg-white/40 dark:bg-navy-800/40 border-t border-slate-100 dark:border-navy-600">
                          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 mt-4 leading-relaxed">{risk.impactExplanation}</p>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4">
                             <div className="bg-rose-50 dark:bg-neon-pink/10 p-3 rounded-xl border border-rose-100 dark:border-neon-pink/30">
                                <p className="text-[10px] font-bold text-rose-400 dark:text-neon-pink uppercase tracking-wide mb-1">{t.ifNoAction}</p>
                                <p className="text-xl font-bold text-rose-700 dark:text-white">{risk.futureProbabilityNoAction}% <span className="text-sm font-normal text-rose-500 dark:text-neon-pink">risk</span></p>
                             </div>
                             <div className="bg-emerald-50 dark:bg-neon-green/10 p-3 rounded-xl border border-emerald-100 dark:border-neon-green/30">
                                <p className="text-[10px] font-bold text-emerald-500 dark:text-neon-green uppercase tracking-wide mb-1">{t.ifActionTaken}</p>
                                <p className="text-xl font-bold text-emerald-700 dark:text-white">{risk.futureProbabilityWithAction}% <span className="text-sm font-normal text-emerald-500 dark:text-neon-green">risk</span></p>
                             </div>
                          </div>

                          <div>
                             <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Key Factors</p>
                             <div className="flex flex-wrap gap-2">
                                {risk.contributingFactors.map((f, i) => (
                                   <span key={i} className="px-2 py-1 bg-slate-100 dark:bg-navy-900 text-slate-600 dark:text-slate-300 rounded-md text-xs font-medium border border-slate-200 dark:border-navy-700">
                                      {f.factor}
                                   </span>
                                ))}
                             </div>
                          </div>
                       </div>
                    )}
                 </div>
               ))}
             </div>

             {/* Action Plan */}
             <div className="glass-panel p-6 rounded-3xl border border-emerald-100/50 dark:border-neon-green/30 bg-gradient-to-br from-emerald-50/30 to-teal-50/30 dark:from-navy-800 dark:to-navy-800">
                <h3 className="font-bold text-slate-700 dark:text-white mb-4 flex items-center gap-2">
                   <ShieldCheck size={18} className="text-emerald-600 dark:text-neon-green" /> {t.actionPlan}
                </h3>
                
                <div className="space-y-3">
                   {forecast.actionPlan.map((step, i) => (
                      <div key={i} className="flex gap-4 p-4 bg-white/60 dark:bg-navy-700/60 rounded-xl border border-white dark:border-navy-600 shadow-sm hover:shadow-md transition-all">
                         <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 dark:bg-neon-blue text-white flex items-center justify-center font-bold text-sm">
                            {i + 1}
                         </div>
                         <div className="flex-grow">
                            <div className="flex justify-between items-start mb-1">
                               <h4 className="font-bold text-slate-800 dark:text-white text-sm">{step.title}</h4>
                               <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-neon-green/20 text-emerald-700 dark:text-neon-green rounded-full">{step.difficulty}</span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{step.description}</p>
                            <div className="flex items-center gap-4 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                               <span className="flex items-center gap-1"><TrendingUp size={12} className="text-emerald-500 dark:text-neon-green" /> {step.impact}</span>
                               <span className="text-slate-300 dark:text-navy-600">|</span>
                               <span>{step.timeline}</span>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>

          </div>
       </div>

       <div className="flex justify-center mt-8 mb-4">
          <p className="text-xs text-slate-400 bg-slate-100 dark:bg-navy-800 px-4 py-2 rounded-full font-medium">
             Disclaimer: This forecast is a simulation based on statistical models, not a medical diagnosis.
          </p>
       </div>
    </div>
  );
};