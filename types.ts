export enum AppStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export enum FindingStatus {
  NORMAL = 'normal',
  ATTENTION = 'attention',
  URGENT = 'urgent'
}

export type Language = 'en' | 'es' | 'hi' | 'zh' | 'fr' | 'de' | 'ja' | 'pt' | 'ar';
export type Theme = 'light' | 'dark';

export interface ExtractedValue {
  value: string;
  unit: string;
}

export interface KeyFinding {
  id: string;
  label: string;
  status: FindingStatus;
  confidence: number;
  sourceSnippet: string;
  extractedValue?: ExtractedValue;
}

export interface AnalysisResult {
  simpleSummary: {
    text: string;
    confidence: number;
  };
  keyFindings: KeyFinding[];
  practicalImplications: string[];
  questionsForDoctor: string[];
  educationalContext: string;
  recommendedSpecialist: string;
  specialistReason: string;
  rawOcrText?: string;
}

export interface AnalysisResponse {
  jobId: string;
  model: string;
  analysis: AnalysisResult;
  meta: {
    processingTimeMs: number;
    confidenceScore: number;
  };
}

// --- Trend & Longitudinal Types ---

export type TrendDirection = 'up' | 'down' | 'stable';
export type TrendEvaluation = 'improved' | 'worsened' | 'stable' | 'neutral' | 'fluctuating';
export type TrendVelocity = 'fast' | 'moderate' | 'slow';
export type DesiredDirection = 'lower' | 'higher' | 'within_range';

export interface DataPoint {
  date: string;
  value: number;
  unit: string;
  confidence: number;
  reportId?: string;
}

export interface BiomarkerTrend {
  key: string;
  label: string;
  desired_direction: DesiredDirection;
  values: DataPoint[];
  absolute_change: number;
  percent_change: number;
  rate_per_month: number;
  trend_class: TrendEvaluation;
  velocity: TrendVelocity;
  emoji: string;
  likely_factors: string[];
  predicted_in_3_months: number;
  recommendations: string[];
  notes?: string;
}

export interface TrendAnalysisResult {
  biomarkers: BiomarkerTrend[];
  overall_score: number;
  success_stories_aggregate: {
    query: string;
    sample_size: number;
    top_factors: { factor: string; percent: number }[];
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
  isThinking?: boolean;
}

export interface TrendMetric { // Legacy type for simple trend card
  metric: string;
  previousValue: string;
  currentValue: string;
  unit: string;
  direction: TrendDirection;
  evaluation: TrendEvaluation;
}

// --- Forecast & Risk Types ---

export interface RiskCategory {
  category: string; // e.g., Cardiovascular, Metabolic
  score: number; // 0-100 (higher is better health)
  status: 'healthy' | 'monitor' | 'warning';
}

export interface SpecificRisk {
  name: string;
  currentProbability: number; // 0-100%
  futureProbabilityNoAction: number;
  futureProbabilityWithAction: number;
  impactExplanation: string;
  contributingFactors: { factor: string; weight: number }[];
}

export interface ActionStep {
  title: string;
  description: string;
  impact: string; // e.g. "Lowers LDL by 10%"
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeline: string; // e.g. "2 weeks"
  successRate: number; // percentage
}

export interface HealthForecastResult {
  riskCategories: RiskCategory[];
  topRisks: SpecificRisk[];
  actionPlan: ActionStep[];
  overallOutlook: string;
}

// --- Community Comparison Types ---

export interface ComparisonMetric {
  metric: string;
  userValue: number;
  unit: string;
  percentile: number; // 0-100
  populationMean: number;
  status: 'excellent' | 'good' | 'average' | 'needs_improvement';
  insight: string; // e.g. "Better than 58% of people your age"
}

export interface SuccessStory {
  title: string;
  description: string;
  improvementPercentage: number;
  keyAction: string;
}

export interface CommunityComparisonResult {
  demographicGroup: string; // e.g. "Adults 35-50"
  metrics: ComparisonMetric[];
  successStories: SuccessStory[];
  trendingConcerns: string[]; // e.g. "Vitamin D deficiency is common..."
  motivationalMessage: string;
}

// --- Timeline & Correlation Types ---

export interface LifeEvent {
  id: string;
  date: string;
  title: string;
  category: 'diet' | 'exercise' | 'medication' | 'lifestyle' | 'stress';
}

export interface TimelineCorrelation {
  id: string;
  title: string; // e.g., "Exercise linked to Cholesterol drop"
  description: string; // "Your LDL dropped 15% 4 weeks after you added 'Daily Jogging'"
  biomarker: string;
  event: string;
  confidence: number;
  type: 'positive' | 'negative' | 'neutral';
}

export interface TimelineAnalysis {
  correlations: TimelineCorrelation[];
  patterns: string[]; // "Glucose spikes in Winter"
  turning_point: {
    date: string;
    description: string;
  } | null;
  future_prediction: string;
}

// --- Voice & Live Types ---

export interface LiveTranscriptItem {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface VoiceSessionState {
  isActive: boolean;
  isMuted: boolean;
  isSpeaking: boolean; // AI is speaking
  volume: number;
  transcript: LiveTranscriptItem[];
}

// --- Maps & Locator Types ---

export interface MapsResult {
  text: string;
  groundingChunks: any[]; // Raw chunks from Gemini
}