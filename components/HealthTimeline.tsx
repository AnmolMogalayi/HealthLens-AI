import React, { useState, useMemo } from 'react';
import { 
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, Scatter, Dot
} from 'recharts';
import { 
  Calendar, Plus, Brain, Sparkles, TrendingUp, AlertTriangle, 
  CheckCircle2, ArrowRight, X, Activity, Filter 
} from 'lucide-react';
import { TrendAnalysisResult, Language, LifeEvent, TimelineAnalysis, BiomarkerTrend } from '../types';
import { TRANSLATIONS } from '../translations';
import { analyzeTimelineCorrelations } from '../services/geminiService';

interface HealthTimelineProps {
  data: TrendAnalysisResult | null;
  language: Language;
  isDemoMode: boolean;
  onBack: () => void;
}

const CATEGORY_COLORS = {
  diet: '#10b981', // Emerald
  exercise: '#3b82f6', // Blue
  medication: '#8b5cf6', // Violet
  lifestyle: '#f59e0b', // Amber
  stress: '#ef4444', // Red
};

export const HealthTimeline: React.FC<HealthTimelineProps> = ({ data, language, isDemoMode, onBack }) => {
  const [selectedBiomarkerIdx, setSelectedBiomarkerIdx] = useState<number>(0);
  const [timeScale, setTimeScale] = useState<'all' | '1y' | '6m'>('all');
  const [lifeEvents, setLifeEvents] = useState<LifeEvent[]>([
    { id: '1', date: '2023-11-01', title: 'Started Mediterranean Diet', category: 'diet' },
    { id: '2', date: '2024-01-15', title: 'Joined Gym', category: 'exercise' }
  ]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<LifeEvent>>({ category: 'lifestyle' });
  const [insights, setInsights] = useState<TimelineAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const t = TRANSLATIONS[language];
  const selectedTrend = data?.biomarkers[selectedBiomarkerIdx];

  // Process data for Chart
  const chartData = useMemo(() => {
    if (!selectedTrend) return [];
    
    // Sort values by date
    const sortedValues = [...selectedTrend.values].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Map to chart format
    return sortedValues.map(v => ({
      date: v.date,
      value: v.value,
      unit: v.unit,
      timestamp: new Date(v.date).getTime()
    }));
  }, [selectedTrend]);

  // Handle Event Addition
  const handleAddEvent = () => {
    if (newEvent.date && newEvent.title) {
      setLifeEvents([...lifeEvents, { ...newEvent, id: Date.now().toString() } as LifeEvent]);
      setShowEventModal(false);
      setNewEvent({ category: 'lifestyle' });
    }
  };

  // Trigger Gemini Analysis
  const handleGenerateInsights = async () => {
    if (!data) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeTimelineCorrelations(data, lifeEvents, isDemoMode, language);
      setInsights(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Custom Chart Components
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="glass-panel p-3 rounded-xl border border-white/50 dark:border-navy-600 shadow-xl text-xs dark:bg-navy-800/95 backdrop-blur-md">
          <p className="font-bold text-slate-700 dark:text-white mb-1">{d.date}</p>
          <p className="text-lg font-bold text-indigo-600 dark:text-neon-blue">
            {d.value} <span className="text-xs font-normal text-slate-400">{d.unit}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomDot = (props: any) => {
    const { cx, cy, stroke, payload } = props;
    // Determine color based on value (mock logic: simple range check for demo)
    // In real app, check against reference ranges
    const isGood = payload.value < 200; // Example threshold
    return (
      <svg x={cx - 6} y={cy - 6} width={12} height={12} fill="white" viewBox="0 0 12 12">
         <circle cx="6" cy="6" r="6" stroke={isGood ? '#10b981' : '#f59e0b'} strokeWidth="3" fill="white" />
      </svg>
    );
  };

  if (!data) return null;

  return (
    <div className="animate-fade-in-up min-h-screen pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
           <button onClick={onBack} className="mb-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-bold text-sm flex items-center gap-2 transition-colors">
             ← Back
           </button>
           <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
             <Activity className="text-indigo-500 dark:text-neon-blue" />
             {t.timelineTitle}
           </h1>
           <p className="text-slate-500 dark:text-slate-400">{t.timelineSubtitle}</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setShowEventModal(true)}
             className="px-4 py-2 bg-white dark:bg-navy-700 border border-slate-200 dark:border-navy-600 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm"
           >
             <Plus size={16} /> {t.addEvent}
           </button>
           <button 
             onClick={handleGenerateInsights}
             disabled={isAnalyzing}
             className="px-4 py-2 bg-slate-900 dark:bg-neon-blue text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg glow-hover"
           >
             {isAnalyzing ? <Brain className="animate-spin" size={16} /> : <Sparkles size={16} />} 
             {t.generateInsights}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Controls & List */}
        <div className="lg:col-span-3 space-y-6">
           {/* Biomarker Selector */}
           <div className="glass-panel p-4 rounded-2xl border border-white/50 dark:border-navy-600 max-h-[400px] overflow-y-auto">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                 <Filter size={12} /> Biomarkers
              </h3>
              <div className="space-y-1">
                 {data.biomarkers.map((b, i) => (
                    <button
                       key={i}
                       onClick={() => setSelectedBiomarkerIdx(i)}
                       className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                          i === selectedBiomarkerIdx 
                          ? 'bg-indigo-50 dark:bg-navy-700 text-indigo-700 dark:text-neon-blue shadow-sm' 
                          : 'hover:bg-slate-50 dark:hover:bg-navy-800 text-slate-600 dark:text-slate-400'
                       }`}
                    >
                       <span>{b.label}</span>
                       <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${b.trend_class === 'improved' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                          {b.trend_class}
                       </span>
                    </button>
                 ))}
              </div>
           </div>

           {/* Event List */}
           <div className="glass-panel p-4 rounded-2xl border border-white/50 dark:border-navy-600">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                 <Calendar size={12} /> Life Events
              </h3>
              <div className="space-y-2">
                 {lifeEvents.length === 0 && <p className="text-xs text-slate-400 italic">{t.noEvents}</p>}
                 {lifeEvents.map((e) => (
                    <div key={e.id} className="flex items-center gap-2 text-xs p-2 bg-white/50 dark:bg-navy-800/50 rounded-lg border border-slate-100 dark:border-navy-700">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[e.category] }} />
                       <div className="flex-grow">
                          <p className="font-bold text-slate-700 dark:text-slate-300">{e.title}</p>
                          <p className="text-slate-400">{e.date}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Center: Visualization */}
        <div className="lg:col-span-9 space-y-6">
           
           {/* Main Chart Card */}
           <div className="glass-panel p-6 rounded-3xl border border-white/60 dark:border-navy-600 shadow-xl bg-white/40 dark:bg-navy-800/40 backdrop-blur-xl relative overflow-hidden">
               {/* Grid Background */}
               <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                    style={{ backgroundImage: 'linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
               </div>

               <div className="flex justify-between items-center mb-6 relative z-10">
                  <div>
                     <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{selectedTrend?.label}</h2>
                     <p className="text-sm text-slate-500 dark:text-slate-400">
                        Trending {selectedTrend?.percent_change > 0 ? 'up' : 'down'} by {Math.abs(selectedTrend?.percent_change)}%
                     </p>
                  </div>
                  <div className="flex bg-slate-100 dark:bg-navy-900 rounded-lg p-1">
                     {(['all', '1y', '6m'] as const).map(scale => (
                        <button
                           key={scale}
                           onClick={() => setTimeScale(scale)}
                           className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                              timeScale === scale 
                              ? 'bg-white dark:bg-navy-700 text-indigo-600 dark:text-white shadow-sm' 
                              : 'text-slate-400 hover:text-slate-600'
                           }`}
                        >
                           {scale.toUpperCase()}
                        </button>
                     ))}
                  </div>
               </div>

               <div className="h-[400px] w-full relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                     <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                        <defs>
                           <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                           </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                        <XAxis 
                           dataKey="date" 
                           tick={{ fontSize: 10, fill: '#94a3b8' }} 
                           axisLine={false} 
                           tickLine={false}
                           dy={10}
                        />
                        <YAxis 
                           tick={{ fontSize: 10, fill: '#94a3b8' }} 
                           axisLine={false} 
                           tickLine={false}
                           domain={['auto', 'auto']}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        
                        {/* Life Event Lines */}
                        {lifeEvents.map(event => (
                           <ReferenceLine 
                              key={event.id}
                              x={event.date} 
                              stroke={CATEGORY_COLORS[event.category]} 
                              strokeDasharray="3 3"
                              label={{ 
                                 position: 'top', 
                                 value: event.title, 
                                 fill: CATEGORY_COLORS[event.category],
                                 fontSize: 10,
                                 fontWeight: 'bold',
                                 bgStyle: { fill: 'white', opacity: 0.8 } // Recharts types can be finicky here, simple text mostly works
                              }} 
                           />
                        ))}

                        <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                        <Line type="monotone" dataKey="value" stroke="none" dot={<CustomDot />} activeDot={{ r: 8 }} />
                     </ComposedChart>
                  </ResponsiveContainer>
               </div>
           </div>

           {/* AI Insights Section */}
           {insights && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-stagger-enter">
                 {/* Correlations */}
                 <div className="glass-panel p-6 rounded-3xl border border-indigo-100 dark:border-navy-600 bg-gradient-to-br from-indigo-50/50 to-white dark:from-navy-800 dark:to-navy-900">
                    <h3 className="font-bold text-indigo-700 dark:text-neon-blue mb-4 flex items-center gap-2">
                       <Brain size={18} /> {t.insightsTitle}
                    </h3>
                    <div className="space-y-4">
                       {insights.correlations.map(c => (
                          <div key={c.id} className="p-3 bg-white/70 dark:bg-navy-800 rounded-xl border border-indigo-50 dark:border-navy-700 shadow-sm">
                             <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-slate-800 dark:text-white text-sm">{c.title}</h4>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${c.type === 'positive' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                   {(c.confidence * 100).toFixed(0)}% Conf
                                </span>
                             </div>
                             <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">{c.description}</p>
                          </div>
                       ))}
                    </div>
                 </div>

                 {/* Predictions & Turning Points */}
                 <div className="space-y-6">
                    {insights.turning_point && (
                       <div className="glass-panel p-5 rounded-3xl border border-amber-100 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-900/10">
                          <h3 className="font-bold text-amber-600 dark:text-amber-400 text-sm mb-2 flex items-center gap-2">
                             <CheckCircle2 size={16} /> {t.turningPoint}
                          </h3>
                          <p className="text-sm font-bold text-slate-800 dark:text-white">{insights.turning_point.date}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{insights.turning_point.description}</p>
                       </div>
                    )}
                    
                    <div className="glass-panel p-5 rounded-3xl border border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-900/10">
                        <h3 className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mb-2 flex items-center gap-2">
                             <TrendingUp size={16} /> {t.futurePrediction}
                        </h3>
                        <p className="text-sm text-slate-700 dark:text-slate-300 italic font-medium">"{insights.future_prediction}"</p>
                    </div>
                 </div>
              </div>
           )}

        </div>
      </div>

      {/* Add Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowEventModal(false)} />
           <div className="relative bg-white dark:bg-navy-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 border border-slate-100 dark:border-navy-600">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-slate-800 dark:text-white">{t.addEvent}</h3>
                 <button onClick={() => setShowEventModal(false)}><X className="text-slate-400" /></button>
              </div>
              
              <div className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">{t.eventDate}</label>
                    <input 
                       type="date" 
                       className="w-full p-3 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                       onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">{t.eventTitle}</label>
                    <input 
                       type="text" 
                       placeholder="e.g., Started Keto, New Medication"
                       className="w-full p-3 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                       onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">{t.eventType}</label>
                    <div className="flex flex-wrap gap-2">
                       {(['diet', 'exercise', 'medication', 'lifestyle', 'stress'] as const).map(cat => (
                          <button
                             key={cat}
                             onClick={() => setNewEvent({...newEvent, category: cat})}
                             className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize border transition-all ${
                                newEvent.category === cat 
                                ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-white border-indigo-300' 
                                : 'bg-white dark:bg-navy-700 text-slate-500 border-slate-200 dark:border-navy-600'
                             }`}
                          >
                             {cat}
                          </button>
                       ))}
                    </div>
                 </div>

                 <button 
                    onClick={handleAddEvent}
                    className="w-full py-3 bg-slate-900 dark:bg-neon-blue text-white rounded-xl font-bold mt-4 hover:scale-[1.02] transition-transform shadow-lg"
                 >
                    Save Event
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};