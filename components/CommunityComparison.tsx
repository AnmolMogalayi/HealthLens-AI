import React, { useMemo } from 'react';
import { CommunityComparisonResult, Language } from '../types';
import { TRANSLATIONS } from '../translations';
import { Users, TrendingUp, Award, Info, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, ReferenceLine, YAxis } from 'recharts';

interface CommunityComparisonProps {
  data: CommunityComparisonResult | null;
  isLoading: boolean;
  language: Language;
}

// Generate bell curve data points
const generateBellCurveData = () => {
  const data = [];
  for (let x = -3.5; x <= 3.5; x += 0.1) {
    const y = Math.exp(-0.5 * Math.pow(x, 2)) / Math.sqrt(2 * Math.PI);
    data.push({ x, y });
  }
  return data;
};

// Approximate Z-score from percentile (0-100)
const getZScore = (percentile: number) => {
   const p = percentile / 100;
   if (p >= 0.99) return 2.5;
   if (p <= 0.01) return -2.5;
   
   // Standard inverse cumulative normal distribution approximation
   const t = Math.sqrt(-2 * Math.log(Math.min(p, 1 - p)));
   const c0 = 2.515517; 
   const c1 = 0.802853; 
   const c2 = 0.010328; 
   const d1 = 1.432788; 
   const d2 = 0.189269; 
   const d3 = 0.001308; 
   const z = t - ((c2 * t + c1) * t + c0) / (((d3 * t + d2) * t + d1) * t + 1);
   
   return p < 0.5 ? -z : z;
};

export const CommunityComparison: React.FC<CommunityComparisonProps> = ({ data, isLoading, language }) => {
  const t = TRANSLATIONS[language];
  const bellCurveData = useMemo(() => generateBellCurveData(), []);

  if (isLoading) {
    return (
      <div className="col-span-1 md:col-span-2 lg:col-span-3 mt-8">
        <div className="glass-panel p-6 rounded-3xl border border-blue-100 dark:border-navy-600 animate-pulse bg-white/50 dark:bg-navy-800/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-200 dark:bg-navy-700 rounded-lg w-10 h-10"></div>
            <div className="space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-navy-700 rounded w-48"></div>
                <div className="h-3 bg-slate-200 dark:bg-navy-700 rounded w-32"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-40 bg-slate-100 dark:bg-navy-900 rounded-2xl"></div>
            ))}
          </div>
          <div className="mt-6 flex justify-center">
              <span className="text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                  <Users size={16} className="animate-bounce" /> {t.loadingCommunity}
              </span>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="col-span-1 md:col-span-2 lg:col-span-3 mt-8 animate-fade-in-up">
      <div className="glass-panel p-8 rounded-3xl border border-indigo-100/60 dark:border-navy-600 bg-gradient-to-b from-white/80 to-indigo-50/30 dark:from-navy-800/80 dark:to-navy-900/80 shadow-xl">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-neon-blue rounded-xl">
               <Users size={24} />
             </div>
             <div>
               <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                 {t.communityTitle}
                 <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-navy-700 text-xs text-slate-500 border border-slate-200 dark:border-navy-600 uppercase tracking-wide">
                   {data.demographicGroup}
                 </span>
               </h3>
               <p className="text-sm text-slate-500 dark:text-slate-400">{t.communitySubtitle}</p>
             </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs font-medium rounded-full border border-amber-100 dark:border-amber-900/50">
             <Info size={14} /> {t.communityDisclaimer}
          </div>
        </div>

        {/* Motivational Banner */}
        <div className="mb-8 p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl shadow-lg flex items-start gap-4">
           <div className="p-2 bg-white/20 rounded-full mt-1">
             <Award size={20} />
           </div>
           <div>
             <p className="font-bold text-lg mb-1">Dr. AI Insight</p>
             <p className="opacity-90 text-sm leading-relaxed">{data.motivationalMessage}</p>
           </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {data.metrics.map((metric, idx) => {
            const zScore = getZScore(metric.percentile);
            const isGood = metric.status === 'excellent' || metric.status === 'good';
            
            return (
              <div key={idx} className="bg-white dark:bg-navy-900/50 rounded-2xl p-5 border border-slate-100 dark:border-navy-700 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                 <div className="flex justify-between items-start mb-2 relative z-10">
                    <h4 className="font-bold text-slate-700 dark:text-slate-200">{metric.metric}</h4>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      isGood 
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-neon-green' 
                        : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-neon-pink'
                    }`}>
                      {metric.userValue} <span className="text-[10px] opacity-70">{metric.unit}</span>
                    </span>
                 </div>
                 
                 <div className="h-32 w-full relative z-10">
                   <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={bellCurveData}>
                       <defs>
                         <linearGradient id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor={isGood ? "#10b981" : "#f43f5e"} stopOpacity={0.1}/>
                           <stop offset="95%" stopColor={isGood ? "#10b981" : "#f43f5e"} stopOpacity={0}/>
                         </linearGradient>
                       </defs>
                       <XAxis hide type="number" dataKey="x" domain={[-3.5, 3.5]} />
                       <YAxis hide domain={[0, 'auto']} />
                       <Area 
                         type="basis" 
                         dataKey="y" 
                         stroke={isGood ? "#10b981" : "#f43f5e"} 
                         fill={`url(#grad-${idx})`} 
                         strokeWidth={2}
                       />
                       <ReferenceLine 
                         x={zScore} 
                         stroke={isGood ? "#059669" : "#e11d48"} 
                         strokeDasharray="3 3"
                         label={{ 
                            position: 'top', 
                            value: t.youAreHere, 
                            fill: isGood ? "#059669" : "#e11d48", 
                            fontSize: 10,
                            fontWeight: 'bold'
                         }} 
                       />
                     </AreaChart>
                   </ResponsiveContainer>
                 </div>

                 <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                   {metric.insight}
                 </p>
              </div>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* Success Stories */}
           <div className="bg-slate-50 dark:bg-navy-800/50 rounded-2xl p-5 border border-slate-100 dark:border-navy-700">
              <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                 <TrendingUp size={16} className="text-emerald-500" /> {t.successStories}
              </h4>
              <div className="space-y-4">
                 {data.successStories.map((story, i) => (
                    <div key={i} className="flex gap-3">
                       <div className="w-10 h-10 rounded-full bg-white dark:bg-navy-700 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-neon-blue shadow-sm border border-slate-100 dark:border-navy-600 flex-shrink-0">
                          {story.improvementPercentage}%
                       </div>
                       <div>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{story.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{story.description}</p>
                          <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                             <Award size={10} /> {story.keyAction}
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           {/* Trending Concerns */}
           <div className="bg-slate-50 dark:bg-navy-800/50 rounded-2xl p-5 border border-slate-100 dark:border-navy-700">
              <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                 <Users size={16} className="text-blue-500" /> {t.trendingConcerns}
              </h4>
              <div className="flex flex-wrap gap-2">
                 {data.trendingConcerns.map((concern, i) => (
                    <span key={i} className="px-3 py-1.5 bg-white dark:bg-navy-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium border border-slate-200 dark:border-navy-600 shadow-sm flex items-center gap-1">
                       <ArrowUpRight size={12} className="text-slate-400" /> {concern}
                    </span>
                 ))}
              </div>
              <div className="mt-6 p-3 bg-blue-50 dark:bg-navy-900/50 rounded-xl text-xs text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
                 Join 2,400+ people in your age group tracking their metabolic health this month.
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};