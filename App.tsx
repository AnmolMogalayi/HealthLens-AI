import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { UploadArea } from './components/UploadArea';
import { SummaryCard, KeyFindingsCard, PracticalImplicationsCard, QuestionsCard, EducationCard, TrendAnalysisCard } from './components/ResultCards';
import { Disclaimer } from './components/Disclaimer';
import { AnxietyHelper } from './components/AnxietyHelper';
import { AudioPlayer } from './components/AudioPlayer';
import { TrendDashboard } from './components/TrendDashboard';
import { HealthForecast } from './components/HealthForecast';
import { CommunityComparison } from './components/CommunityComparison';
import { HealthTimeline } from './components/HealthTimeline';
import { DoctorLocator } from './components/DoctorLocator';
import { ShareMenu } from './components/ShareMenu';
import { analyzeMedicalReport, analyzeTrends, generateCommunityInsights, analyzeLongitudinalTrends } from './services/geminiService';
import { downloadPDF } from './services/pdfService';
import { AnalysisResponse, AppStatus, TrendMetric, Language, FindingStatus, AnalysisResult, Theme, CommunityComparisonResult, TrendAnalysisResult } from './types';
import { FileText, X, Loader2, ArrowRight, Download, AlertCircle, RefreshCw, CheckCircle2, Activity, TrendingUp, Calendar } from 'lucide-react';
import { TRANSLATIONS } from './translations';

interface AppError {
  message: string;
  type: 'analysis' | 'download' | 'trend' | 'general';
  retry?: () => void;
}

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('en');
  // Initialize theme from localStorage or system preference
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme) return savedTheme;
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    }
    return 'light';
  });

  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [showAnxietyHelper, setShowAnxietyHelper] = useState(false);

  // Community Comparison State
  const [communityData, setCommunityData] = useState<CommunityComparisonResult | null>(null);
  const [isCommunityLoading, setIsCommunityLoading] = useState(false);

  // New State for View Mode
  const [viewMode, setViewMode] = useState<'single' | 'trends' | 'timeline'>('single');

  // Trend Analysis State (Single File Comparison)
  const [trendStatus, setTrendStatus] = useState<'idle' | 'analyzing' | 'success' | 'error'>('idle');
  const [trends, setTrends] = useState<TrendMetric[] | null>(null);
  const [trendError, setTrendError] = useState<string | null>(null);

  // Timeline Data State (Needs robust longitudinal data)
  // For demo purposes, we will load this when entering timeline view if not present
  const [longitudinalData, setLongitudinalData] = useState<TrendAnalysisResult | null>(null);

  const t = TRANSLATIONS[language];

  // Effect to handle body class for theme and persistence
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Pre-load demo longitudinal data if switching to timeline in demo mode
  useEffect(() => {
    if (viewMode === 'timeline' && isDemoMode && !longitudinalData) {
       // Trigger dummy load
       analyzeLongitudinalTrends([], true, language).then(setLongitudinalData);
    }
  }, [viewMode, isDemoMode, longitudinalData, language]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Generate text for the audio player
  const readableText = useMemo(() => {
    if (!analysis) return "";
    const { simpleSummary, keyFindings, practicalImplications, questionsForDoctor, educationalContext } = analysis.analysis;
    
    let text = `${t.resultsTitle}. `;
    text += `${t.simpleSummary}. ${simpleSummary.text} `;
    
    text += `${t.keyFindings}. `;
    keyFindings.forEach(finding => {
      text += `${finding.label}: ${finding.status === 'urgent' ? t.statusUrgent : finding.status === 'attention' ? t.statusAttention : t.statusNormal}. ${finding.extractedValue ? finding.extractedValue.value + ' ' + finding.extractedValue.unit : ''}. `;
    });

    text += `${t.practicalImplications}. `;
    practicalImplications.forEach(imp => text += `${imp}. `);

    text += `${t.educationalContext}. ${educationalContext}`;

    return text;
  }, [analysis, language, t]);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setStatus(AppStatus.UPLOADING);
    setError(null);
    setTrends(null); 
    setTrendStatus('idle');
    setCommunityData(null);
    setShowAnxietyHelper(false);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
      setStatus(AppStatus.IDLE); 
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleCancel = () => {
    setFile(null);
    setPreviewUrl(null);
    setAnalysis(null);
    setStatus(AppStatus.IDLE);
    setError(null);
    setTrends(null);
    setTrendStatus('idle');
    setCommunityData(null);
    setShowAnxietyHelper(false);
  };

  const shouldTriggerAnxietyHelper = (result: AnalysisResult) => {
    const hasUrgent = result.keyFindings.some(f => f.status === FindingStatus.URGENT);
    const attentionCount = result.keyFindings.filter(f => f.status === FindingStatus.ATTENTION).length;
    return hasUrgent || attentionCount >= 2;
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setError(null);
    setStatus(AppStatus.ANALYZING);
    setIsCommunityLoading(true); // Start loading community data state

    try {
      const result = await analyzeMedicalReport(file, isDemoMode, language);
      setAnalysis(result);
      if (shouldTriggerAnxietyHelper(result.analysis)) {
        setShowAnxietyHelper(true);
      }
      setStatus(AppStatus.SUCCESS);

      // Trigger community comparison asynchronously after main analysis success
      generateCommunityInsights(result, isDemoMode, language)
        .then(data => {
            setCommunityData(data);
        })
        .catch(err => {
            console.error("Community comparison failed:", err);
            // Optionally set silent error or null, don't break main flow
        })
        .finally(() => {
            setIsCommunityLoading(false);
        });

    } catch (err: any) {
      console.error(err);
      setStatus(AppStatus.ERROR);
      setIsCommunityLoading(false);
      setError({
        message: err.message || "We couldn't analyze this report. Please ensure the image is clear and try again.",
        type: 'analysis',
        retry: handleAnalyze
      });
    }
  };

  const handleTrendUpload = async (previousFile: File) => {
    if (!file) return;
    setTrendStatus('analyzing');
    setTrendError(null);
    try {
      const results = await analyzeTrends(file, previousFile, isDemoMode, language);
      setTrends(results);
      setTrendStatus('success');
    } catch (err: any) {
      console.error(err);
      setTrendStatus('error');
      setTrendError("Failed to compare reports. Please ensure the previous report is legible.");
    }
  };

  const handleDownloadPdf = async () => {
    if (!analysis) return;
    setError(null);
    const shouldRedact = window.confirm(
      "Would you like to redact patient information from the PDF?\n\nClick OK for a redacted version.\nClick Cancel for the full version."
    );
    setIsDownloading(true);
    try {
      await downloadPDF(analysis.analysis, { redact: shouldRedact });
    } catch (err: any) {
      console.error("PDF Download failed", err);
      setError({
        message: "Failed to generate the PDF file. Please try again.",
        type: 'download',
        retry: handleDownloadPdf
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const dismissError = () => {
    setError(null);
    if (status === AppStatus.ERROR) {
      setStatus(AppStatus.IDLE);
    }
  };

  // Helper to determine if file is PDF (robust check)
  const isPdf = file ? (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) : false;

  return (
    <div className={`min-h-screen relative font-sans text-slate-800 dark:text-[#B8C5D0] transition-colors duration-300 ${theme}`}>
      
      <div className="breathing-bg" />
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[-1]" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}>
      </div>

      <Header 
        language={language}
        onLanguageChange={setLanguage}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {showAnxietyHelper && (
        <AnxietyHelper 
          language={language} 
          onComplete={() => setShowAnxietyHelper(false)} 
        />
      )}

      <main className={`flex-grow container mx-auto px-4 py-8 sm:px-6 lg:px-8 max-w-7xl transition-all duration-700 ${showAnxietyHelper ? 'blur-lg scale-95 opacity-50 pointer-events-none' : ''}`}>
        
        {error && (
           <div className="glass-panel bg-red-50/80 dark:bg-rose-900/20 border-red-200 dark:border-rose-900/50 text-red-700 dark:text-rose-300 px-6 py-4 rounded-2xl mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-lg gap-4 animate-stagger-enter">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 dark:bg-rose-900/50 rounded-xl text-red-600 dark:text-rose-400 shadow-sm">
                  <AlertCircle className="flex-shrink-0" size={24} />
                </div>
                <div>
                  <p className="font-bold text-red-900 dark:text-rose-200 text-lg">
                    {error.type === 'analysis' ? t.errorAnalysis : 
                     error.type === 'download' ? t.errorDownload : t.errorGeneric}
                  </p>
                  <p className="text-sm text-red-700 dark:text-rose-300/80 font-medium">{error.message}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {error.retry && (
                   <button 
                     onClick={error.retry}
                     className="flex items-center gap-2 text-sm font-bold bg-white dark:bg-navy-800 border border-red-200 dark:border-rose-800 text-red-700 dark:text-rose-300 hover:bg-red-50 dark:hover:bg-rose-900/30 px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow-md glow-hover"
                   >
                     <RefreshCw size={16} /> {t.retry}
                   </button>
                )}
                <button onClick={dismissError} className="text-red-400 hover:text-red-700 dark:hover:text-rose-300 p-2 hover:bg-red-100 dark:hover:bg-rose-900/30 rounded-full transition-colors"><X size={20} /></button>
              </div>
           </div>
        )}

        {/* --- VIEW MODE ROUTING --- */}
        {viewMode === 'trends' ? (
           <TrendDashboard language={language} onBack={() => setViewMode('single')} />
        ) : viewMode === 'timeline' ? (
           <HealthTimeline data={longitudinalData} language={language} isDemoMode={isDemoMode} onBack={() => setViewMode('single')} />
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          
          <div className="lg:col-span-4 space-y-8 h-fit lg:sticky lg:top-28">
            
            {/* View Mode Entry Buttons */}
            {!file && (
                <div className="space-y-4 animate-stagger-enter">
                    {/* Compare Reports Button */}
                    <div onClick={() => setViewMode('trends')}>
                        <div className="glass-panel p-4 rounded-2xl border border-indigo-200/50 dark:border-navy-600 hover:border-indigo-400 dark:hover:border-neon-blue cursor-pointer group transition-all hover:shadow-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-indigo-50 dark:bg-navy-700 p-2 rounded-lg text-indigo-500 dark:text-neon-blue group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                    <TrendingUp size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-white">{t.compareReports}</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Analyze timeline & trends</p>
                                </div>
                            </div>
                            <ArrowRight size={20} className="text-indigo-300 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-neon-blue group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>

                    {/* Timeline Button */}
                    <div onClick={() => setViewMode('timeline')}>
                        <div className="glass-panel p-4 rounded-2xl border border-purple-200/50 dark:border-navy-600 hover:border-purple-400 dark:hover:border-neon-purple cursor-pointer group transition-all hover:shadow-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-purple-50 dark:bg-navy-700 p-2 rounded-lg text-purple-500 dark:text-neon-purple group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                    <Calendar size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-white">{t.timelineTitle}</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Interactive journey & events</p>
                                </div>
                            </div>
                            <ArrowRight size={20} className="text-purple-300 dark:text-slate-500 group-hover:text-purple-500 dark:group-hover:text-neon-purple group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>
                </div>
            )}

            {!file ? (
              <div className="animate-stagger-enter">
                 <UploadArea onFileSelect={handleFileSelect} disabled={false} language={language} />
              </div>
            ) : (
              <div className="glass-panel rounded-3xl relative overflow-hidden group animate-stagger-enter shadow-2xl">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 via-blue-500 to-teal-400 dark:from-neon-green dark:via-neon-blue dark:to-neon-green" />
                 <button 
                  onClick={handleCancel}
                  className="absolute top-4 right-4 p-2 bg-white/80 dark:bg-navy-700/80 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 rounded-full transition-all border border-slate-200 dark:border-navy-600 hover:border-red-200 z-10 shadow-sm hover:shadow-md hover:scale-110"
                >
                  <X size={20} />
                </button>
                <div className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="bg-emerald-100 dark:bg-emerald-900/20 p-3 rounded-full text-emerald-600 dark:text-neon-green animate-bounce shadow-sm"><CheckCircle2 size={24} /></div>
                    <div>
                       <p className="text-xs font-bold text-emerald-600 dark:text-neon-green uppercase tracking-widest">{t.uploadReady}</p>
                       <h3 className="font-bold text-slate-900 dark:text-white text-lg truncate max-w-[200px] sm:max-w-xs leading-tight">{file.name}</h3>
                    </div>
                  </div>
                  {isPdf ? (
                     <div className="bg-slate-50/50 dark:bg-navy-900/50 rounded-2xl p-10 flex justify-center border border-slate-200/60 dark:border-navy-600 shadow-inner"><FileText size={64} className="text-slate-400 dark:text-slate-500 drop-shadow-sm" /></div>
                  ) : (
                    <div className="relative h-64 bg-slate-50/50 dark:bg-navy-900/50 rounded-2xl overflow-hidden border border-slate-200/60 dark:border-navy-600 shadow-inner group-hover:shadow-md transition-shadow">
                       <img src={previewUrl || ''} alt="Preview" className="w-full h-full object-contain" />
                    </div>
                  )}
                  <div className="mt-5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-navy-600 pt-4 font-medium">
                     <span className="font-mono bg-slate-100 dark:bg-navy-700 px-3 py-1.5 rounded-lg">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                     <span className="font-bold bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 px-3 py-1.5 rounded-lg">{file.type.split('/')[1]?.toUpperCase() || 'FILE'}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="animate-stagger-enter" style={{ animationDelay: '0.1s' }}>
              <button
                onClick={handleAnalyze}
                disabled={!file || status === AppStatus.ANALYZING || status === AppStatus.SUCCESS}
                className={`
                  w-full py-5 px-6 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 relative overflow-hidden group glow-hover
                  ${!file 
                    ? 'bg-slate-200 dark:bg-navy-700 text-slate-400 dark:text-slate-500 cursor-not-allowed' 
                    : status === AppStatus.ANALYZING 
                      ? 'bg-blue-400 dark:bg-neon-blue text-white cursor-wait shadow-inner'
                      : status === AppStatus.SUCCESS
                        ? 'bg-emerald-500 dark:bg-neon-green text-white cursor-default shadow-lg'
                        : 'bg-slate-900 dark:bg-gradient-to-r dark:from-neon-blue dark:to-neon-purple text-white shadow-xl hover:scale-[1.02]'
                  }
                `}
              >
                {status === AppStatus.ANALYZING ? (
                  <><Loader2 className="animate-spin" /> {t.analyzing}</>
                ) : status === AppStatus.SUCCESS ? (
                  <>{t.analysisComplete}</>
                ) : (
                  <>{t.analyzeBtn} <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
            </div>
            
            <div className="glass-panel bg-white/40 dark:bg-navy-800/40 p-6 rounded-2xl border border-white/50 dark:border-navy-600 text-sm text-slate-600 dark:text-slate-400 animate-stagger-enter" style={{ animationDelay: '0.2s' }}>
               <p className="font-bold mb-2 flex items-center gap-2 text-slate-800 dark:text-white"><div className="w-2 h-2 rounded-full bg-teal-400 dark:bg-neon-blue animate-pulse"></div> {t.privacyTitle}</p>
               <p className="opacity-80 leading-relaxed pl-4">{t.privacyDesc}</p>
            </div>
          </div>

          {/* RIGHT COLUMN: Results */}
          <div className="lg:col-span-8">
            {status === AppStatus.ANALYZING ? (
              <div className="h-[600px] flex flex-col items-center justify-center text-center p-12 glass-panel rounded-[2.5rem] shadow-xl animate-pulse">
                <div className="relative mb-8">
                   <div className="absolute inset-0 bg-blue-400 dark:bg-neon-blue rounded-full blur-2xl opacity-20 animate-pulse"></div>
                   <div className="relative w-24 h-24 border-4 border-slate-100 dark:border-navy-600 border-t-blue-500 dark:border-t-neon-blue rounded-full animate-spin shadow-2xl bg-white dark:bg-navy-800"></div>
                   <div className="absolute inset-0 flex items-center justify-center"><Activity className="text-blue-500 dark:text-neon-blue animate-bounce" size={32} /></div>
                </div>
                <h3 className="text-3xl font-bold text-slate-800 dark:text-white mb-4 tracking-tight">{t.analyzing}</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md text-lg leading-relaxed font-medium">We are processing your biometric data securely. This may take a moment.</p>
              </div>
            ) : status === AppStatus.SUCCESS && analysis ? (
              <div className="space-y-8 animate-stagger-enter">
                 {/* Results Header with explicit Z-index for menu */}
                 <div className="relative z-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/30 dark:bg-navy-800/50 backdrop-blur-md p-4 rounded-3xl border border-white/40 dark:border-navy-600">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight px-4">{t.resultsTitle}</h2>
                    <div className="flex gap-3 w-full sm:w-auto">
                       <ShareMenu label={t.shareBtn} />
                       <button onClick={handleDownloadPdf} disabled={isDownloading} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-slate-900 dark:bg-neon-blue rounded-xl hover:bg-slate-800 dark:hover:bg-cyan-400 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed glow-hover">
                          {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />} {t.pdfBtn}
                       </button>
                    </div>
                 </div>
                 
                 <AudioPlayer text={readableText} language={language} />
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                    <TrendAnalysisCard onUpload={handleTrendUpload} isAnalyzing={trendStatus === 'analyzing'} trends={trends} error={trendError} translations={{ title: t.trendTitle, uploadTitle: t.trendUploadTitle, uploadDesc: t.trendUploadDesc, uploadBtn: t.trendUploadBtn, analyzing: t.trendAnalyzing, analyzingDesc: t.trendAnalyzingDesc, metric: t.trendMetric, previous: t.trendPrevious, current: t.trendCurrent, trend: t.trendDirection, status: t.trendStatus, uploadNew: t.trendUploadNew, improved: t.trendImproved, worsened: t.trendWorsened, stable: t.trendStable }} />
                    <SummaryCard text={analysis.analysis.simpleSummary.text} title={t.simpleSummary} />
                    <KeyFindingsCard findings={analysis.analysis.keyFindings} title={t.keyFindings} statusLabels={{ normal: t.statusNormal, attention: t.statusAttention, urgent: t.statusUrgent }} />
                    <PracticalImplicationsCard items={analysis.analysis.practicalImplications} title={t.practicalImplications} />
                    <QuestionsCard questions={analysis.analysis.questionsForDoctor} title={t.questionsForDoctor} />
                    <EducationCard content={analysis.analysis.educationalContext} title={t.educationalContext} readMoreText={t.readMore} />
                    
                    {/* Forecast & Community Section Integration */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-3">
                       <HealthForecast analysis={analysis} language={language} isDemoMode={isDemoMode} />
                    </div>

                    <DoctorLocator 
                       specialist={analysis.analysis.recommendedSpecialist || 'General Practitioner'}
                       reason={analysis.analysis.specialistReason || 'General consultation.'}
                       isDemoMode={isDemoMode}
                       language={language}
                    />

                    <CommunityComparison data={communityData} isLoading={isCommunityLoading} language={language} />

                    <div className="col-span-1 md:col-span-2 lg:col-span-3"><Disclaimer title={t.disclaimerTitle} text={t.disclaimerText} /></div>
                 </div>
              </div>
            ) : (
              <div className="h-full min-h-[600px] flex flex-col items-center justify-center text-center p-10 glass-panel rounded-[2.5rem] border-2 border-dashed border-slate-200/60 dark:border-navy-600 text-slate-400 group">
                <div className="bg-slate-50 dark:bg-navy-700 p-8 rounded-full mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500"><FileText size={64} className="opacity-30" /></div>
                <p className="text-2xl font-bold text-slate-300 dark:text-slate-500">Awaiting Input</p>
                <p className="text-sm mt-2 opacity-60 font-medium">Select a file from the scanning panel to begin</p>
              </div>
            )}
          </div>
        </div>
        )}
      </main>
    </div>
  );
};

export default App;