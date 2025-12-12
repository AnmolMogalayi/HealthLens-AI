import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResponse, TrendMetric, Language, TrendAnalysisResult, BiomarkerTrend, HealthForecastResult, CommunityComparisonResult, LifeEvent, TimelineAnalysis, MapsResult } from "../types";

// Helper to lazily get the AI client
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from process.env");
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

const ANALYSIS_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    jobId: { type: Type.STRING },
    model: { type: Type.STRING },
    version: { type: Type.STRING },
    analysis: {
      type: Type.OBJECT,
      properties: {
        simpleSummary: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: "Plain summary, 1-3 paragraphs, translated to target language" },
            confidence: { type: Type.NUMBER }
          },
          required: ["text", "confidence"]
        },
        keyFindings: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              label: { type: Type.STRING, description: "Finding label translated to target language" },
              status: { type: Type.STRING, enum: ["normal", "attention", "urgent"] },
              confidence: { type: Type.NUMBER },
              sourceSnippet: { type: Type.STRING },
              extractedValue: {
                type: Type.OBJECT,
                properties: {
                  value: { type: Type.STRING },
                  unit: { type: Type.STRING }
                },
                nullable: true
              }
            },
            required: ["id", "label", "status", "confidence", "sourceSnippet"]
          }
        },
        practicalImplications: {
          type: Type.ARRAY,
          items: { type: Type.STRING, description: "Translated actionable points" },
          description: "3-5 actionable bullet points tailored to daily life"
        },
        questionsForDoctor: {
          type: Type.ARRAY,
          items: { type: Type.STRING, description: "Translated questions" },
          description: "Exactly 5 specific, context-aware questions"
        },
        educationalContext: { type: Type.STRING, description: "Translated educational context" },
        recommendedSpecialist: { type: Type.STRING, description: "Recommended medical specialist type based on findings (e.g. Cardiologist, Endocrinologist). Default to 'General Practitioner' if unsure." },
        specialistReason: { type: Type.STRING, description: "Short rationale for the specialist recommendation." },
        rawOcrText: { type: Type.STRING }
      },
      required: ["simpleSummary", "keyFindings", "practicalImplications", "questionsForDoctor", "educationalContext", "recommendedSpecialist", "specialistReason"]
    },
    meta: {
      type: Type.OBJECT,
      properties: {
        processingTimeMs: { type: Type.NUMBER },
        confidenceScore: { type: Type.NUMBER }
      },
      required: ["processingTimeMs", "confidenceScore"]
    }
  },
  required: ["jobId", "model", "analysis", "meta"]
};

// Trend Schema
const TREND_SCHEMA: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      metric: { type: Type.STRING, description: "Metric name in target language" },
      previousValue: { type: Type.STRING },
      currentValue: { type: Type.STRING },
      unit: { type: Type.STRING },
      direction: { type: Type.STRING, enum: ["up", "down", "stable"] },
      evaluation: { type: Type.STRING, enum: ["improved", "worsened", "stable", "neutral"] }
    },
    required: ["metric", "previousValue", "currentValue", "unit", "direction", "evaluation"]
  }
};

const LONGITUDINAL_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    biomarkers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          key: { type: Type.STRING },
          label: { type: Type.STRING, description: "Display name" },
          desired_direction: { type: Type.STRING, enum: ["lower", "higher", "within_range"] },
          values: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING, description: "YYYY-MM-DD" },
                value: { type: Type.NUMBER },
                unit: { type: Type.STRING },
                confidence: { type: Type.NUMBER }
              },
              required: ["date", "value", "unit"]
            }
          },
          absolute_change: { type: Type.NUMBER },
          percent_change: { type: Type.NUMBER },
          rate_per_month: { type: Type.NUMBER },
          trend_class: { type: Type.STRING, enum: ["improved", "worsened", "stable", "neutral", "fluctuating"] },
          velocity: { type: Type.STRING, enum: ["fast", "moderate", "slow"] },
          emoji: { type: Type.STRING },
          likely_factors: { type: Type.ARRAY, items: { type: Type.STRING } },
          predicted_in_3_months: { type: Type.NUMBER },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          notes: { type: Type.STRING }
        },
        required: ["key", "label", "values", "trend_class", "emoji"]
      }
    },
    overall_score: { type: Type.NUMBER, description: "0-100 score" },
    success_stories_aggregate: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING },
        sample_size: { type: Type.NUMBER },
        top_factors: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              factor: { type: Type.STRING },
              percent: { type: Type.NUMBER }
            }
          }
        }
      }
    }
  },
  required: ["biomarkers", "overall_score"]
};

const FORECAST_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    riskCategories: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          score: { type: Type.NUMBER, description: "0-100" },
          status: { type: Type.STRING, enum: ["healthy", "monitor", "warning"] }
        }
      }
    },
    topRisks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          currentProbability: { type: Type.NUMBER },
          futureProbabilityNoAction: { type: Type.NUMBER },
          futureProbabilityWithAction: { type: Type.NUMBER },
          impactExplanation: { type: Type.STRING },
          contributingFactors: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                factor: { type: Type.STRING },
                weight: { type: Type.NUMBER }
              }
            }
          }
        }
      }
    },
    actionPlan: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          impact: { type: Type.STRING },
          difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
          timeline: { type: Type.STRING },
          successRate: { type: Type.NUMBER }
        }
      }
    },
    overallOutlook: { type: Type.STRING }
  },
  required: ["riskCategories", "topRisks", "actionPlan", "overallOutlook"]
};

const COMPARISON_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    demographicGroup: { type: Type.STRING },
    metrics: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          metric: { type: Type.STRING },
          userValue: { type: Type.NUMBER },
          unit: { type: Type.STRING },
          percentile: { type: Type.NUMBER },
          populationMean: { type: Type.NUMBER },
          status: { type: Type.STRING, enum: ["excellent", "good", "average", "needs_improvement"] },
          insight: { type: Type.STRING }
        }
      }
    },
    successStories: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          improvementPercentage: { type: Type.NUMBER },
          keyAction: { type: Type.STRING }
        }
      }
    },
    trendingConcerns: { type: Type.ARRAY, items: { type: Type.STRING } },
    motivationalMessage: { type: Type.STRING }
  },
  required: ["demographicGroup", "metrics", "successStories", "trendingConcerns", "motivationalMessage"]
};

// Timeline Correlations Schema
const TIMELINE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    correlations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          biomarker: { type: Type.STRING },
          event: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          type: { type: Type.STRING, enum: ["positive", "negative", "neutral"] }
        }
      }
    },
    patterns: { type: Type.ARRAY, items: { type: Type.STRING } },
    turning_point: {
      type: Type.OBJECT,
      properties: {
        date: { type: Type.STRING },
        description: { type: Type.STRING }
      },
      nullable: true
    },
    future_prediction: { type: Type.STRING }
  },
  required: ["correlations", "patterns", "future_prediction"]
};

const LANG_MAP: Record<Language, string> = {
  en: "English",
  es: "Spanish",
  hi: "Hindi",
  zh: "Simplified Chinese",
  fr: "French",
  de: "German",
  ja: "Japanese",
  pt: "Portuguese",
  ar: "Arabic"
};

// Synthetic Demo Data - Simple English Fallback for now, could be expanded
const DEMO_RESPONSE: AnalysisResponse = {
  jobId: "demo-12345",
  model: "demo-mode",
  meta: { processingTimeMs: 450, confidenceScore: 0.98 },
  analysis: {
    simpleSummary: {
      text: "The blood test results indicate that your lipid panel shows elevated cholesterol levels, specifically LDL. However, your complete blood count (CBC) and metabolic panel are largely within normal ranges. There are no signs of acute infection or anemia.",
      confidence: 0.95
    },
    keyFindings: [
      {
        id: "f1",
        label: "Total Cholesterol",
        status: "attention" as any,
        confidence: 0.99,
        sourceSnippet: "Cholesterol, Total: 240 mg/dL",
        extractedValue: { value: "240", unit: "mg/dL" }
      },
      {
        id: "f2",
        label: "LDL Cholesterol",
        status: "urgent" as any,
        confidence: 0.98,
        sourceSnippet: "LDL Calc: 165 mg/dL",
        extractedValue: { value: "165", unit: "mg/dL" }
      },
      {
        id: "f3",
        label: "Hemoglobin A1c",
        status: "normal" as any,
        confidence: 0.99,
        sourceSnippet: "HbA1c: 5.4 %",
        extractedValue: { value: "5.4", unit: "%" }
      },
      {
        id: "f4",
        label: "Vitamin D",
        status: "attention" as any,
        confidence: 0.92,
        sourceSnippet: "Vit D, 25-OH: 28 ng/mL",
        extractedValue: { value: "28", unit: "ng/mL" }
      }
    ],
    practicalImplications: [
      "Consider reducing intake of saturated fats (red meat, full-fat dairy) to lower LDL.",
      "Increase dietary fiber intake through oats, beans, and fruits.",
      "A daily vitamin D supplement may be beneficial; discuss dosage with your provider."
    ],
    questionsForDoctor: [
      "Should I start a statin medication for my cholesterol?",
      "What is the target LDL level for someone with my profile?",
      "Do I need a follow-up lipid panel in 3 or 6 months?",
      "Are there specific exercises that help raise HDL cholesterol?",
      "Should I take a specific dosage of Vitamin D3?"
    ],
    educationalContext: "LDL (Low-Density Lipoprotein) is often called 'bad' cholesterol because it collects in the walls of your blood vessels. Higher levels increase the risk of heart disease. Vitamin D is essential for bone health and immune function; levels below 30 ng/mL are often considered insufficient.",
    recommendedSpecialist: "Cardiologist",
    specialistReason: "Elevated LDL levels and borderline Total Cholesterol suggest cardiovascular risk factors that may require specialist management.",
    rawOcrText: "Sample extracted text..."
  }
};

const DEMO_TRENDS: TrendMetric[] = [
  { metric: "Total Cholesterol", previousValue: "260", currentValue: "240", unit: "mg/dL", direction: "down", evaluation: "improved" },
  { metric: "LDL Cholesterol", previousValue: "185", currentValue: "165", unit: "mg/dL", direction: "down", evaluation: "improved" },
  { metric: "Hemoglobin A1c", previousValue: "5.3", currentValue: "5.4", unit: "%", direction: "up", evaluation: "stable" },
  { metric: "Vitamin D", previousValue: "22", currentValue: "28", unit: "ng/mL", direction: "up", evaluation: "improved" }
];

const DEMO_FORECAST: HealthForecastResult = {
  riskCategories: [
    { category: "Cardiovascular", score: 65, status: "warning" },
    { category: "Metabolic", score: 85, status: "healthy" },
    { category: "Nutritional", score: 72, status: "monitor" },
    { category: "Inflammation", score: 90, status: "healthy" },
    { category: "Liver Health", score: 88, status: "healthy" },
    { category: "Kidney Health", score: 92, status: "healthy" }
  ],
  topRisks: [
    {
      name: "Cardiovascular Risk",
      currentProbability: 28,
      futureProbabilityNoAction: 35,
      futureProbabilityWithAction: 18,
      impactExplanation: "Elevated LDL and borderline Total Cholesterol increase plaque buildup risk.",
      contributingFactors: [
        { factor: "LDL Cholesterol", weight: 45 },
        { factor: "Total Cholesterol", weight: 30 },
        { factor: "Vitamin D Deficiency", weight: 15 },
        { factor: "Age/Gender Factor", weight: 10 }
      ]
    }
  ],
  actionPlan: [
    {
      title: "Mediterranean-Style Diet",
      description: "Replace red meat with fish 3x/week and use olive oil.",
      impact: "Lowers LDL by ~15%",
      difficulty: "Medium",
      timeline: "8-12 weeks",
      successRate: 73
    },
    {
      title: "150 mins Weekly Cardio",
      description: "30 mins brisk walking, 5 days a week.",
      impact: "Improves overall cardio health",
      difficulty: "Medium",
      timeline: "Ongoing",
      successRate: 68
    },
    {
      title: "Vitamin D Supplementation",
      description: "Discuss 1000-2000 IU daily with your doctor.",
      impact: "Normalizes levels in 3 mo",
      difficulty: "Easy",
      timeline: "3 months",
      successRate: 92
    }
  ],
  overallOutlook: "While your cardiovascular markers require attention, your overall metabolic and organ health is strong. Taking action now on cholesterol can significantly reduce future risk."
};

const DEMO_COMPARISON: CommunityComparisonResult = {
  demographicGroup: "Adults 35-50",
  metrics: [
    {
      metric: "LDL Cholesterol",
      userValue: 165,
      unit: "mg/dL",
      percentile: 72,
      populationMean: 130,
      status: "needs_improvement",
      insight: "Higher than 72% of people in your age group."
    },
    {
      metric: "Total Cholesterol",
      userValue: 240,
      unit: "mg/dL",
      percentile: 65,
      populationMean: 200,
      status: "average",
      insight: "Slightly above the average range for your demographic."
    },
    {
      metric: "Hemoglobin A1c",
      userValue: 5.4,
      unit: "%",
      percentile: 45,
      populationMean: 5.5,
      status: "good",
      insight: "Better than 55% of your peers. Great metabolic health!"
    }
  ],
  successStories: [
    {
      title: "Reduced LDL by 25%",
      description: "Many users in your bracket improved by switching to plant-based breakfasts.",
      improvementPercentage: 25,
      keyAction: "Dietary Change"
    },
    {
      title: "Boosted Vitamin D",
      description: "Daily walks and supplementation normalized levels in 3 months.",
      improvementPercentage: 40,
      keyAction: "Lifestyle + Supplement"
    }
  ],
  trendingConcerns: ["Vitamin D Deficiency", "Elevated LDL in early 40s", "Screen time eye strain"],
  motivationalMessage: "You're doing great with your blood sugar! Focusing on cholesterol now is the single best step for long-term vitality."
};

const DEMO_TIMELINE: TimelineAnalysis = {
  correlations: [
    {
      id: "c1",
      title: "Diet Change Impact",
      description: "Your cholesterol levels showed a significant 15% drop 6 weeks after you marked 'Started Mediterranean Diet'.",
      biomarker: "LDL Cholesterol",
      event: "Started Mediterranean Diet",
      confidence: 0.92,
      type: "positive"
    },
    {
      id: "c2",
      title: "Seasonal Vitamin D",
      description: "Vitamin D levels tend to dip in Winter months based on your history.",
      biomarker: "Vitamin D",
      event: "Winter Season",
      confidence: 0.85,
      type: "negative"
    }
  ],
  patterns: [
    "Glucose levels spike during holiday months (Dec-Jan).",
    "Consistent improvement in liver enzymes correlating with increased exercise."
  ],
  turning_point: {
    date: "2023-11-15",
    description: "This date marks your best metabolic health score in the last 2 years, coinciding with regular cardio."
  },
  future_prediction: "If current trajectory continues, LDL is projected to reach optimal range (<100 mg/dL) by next quarter."
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeMedicalReport = async (
  file: File,
  isDemoMode: boolean,
  language: Language
): Promise<AnalysisResponse> => {
  if (isDemoMode) {
    // Note: In a real app we would have translated demo data
    return new Promise((resolve) => setTimeout(() => resolve(DEMO_RESPONSE), 2500));
  }

  const base64Data = await fileToBase64(file);
  const targetLang = LANG_MAP[language];

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data
            }
          },
          {
            text: `You are an expert medical analyst AI. Analyze the provided medical report image. 
            Extract key findings, summarize the results in plain ${targetLang}, and provide actionable context in ${targetLang}. 
            Translate all string values (label, summary, implications, etc.) into ${targetLang}.
            Classify findings into 'normal', 'attention', or 'urgent' based on standard clinical ranges visible in the document or general medical knowledge.
            Identify the specific medical specialist (e.g., Cardiologist, Endocrinologist, Hematologist) that would be most appropriate for follow-up based on the abnormal findings.
            Strictly follow the JSON schema provided.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA,
        temperature: 0.1,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AnalysisResponse;

  } catch (error) {
    console.error("Analysis Failed:", error);
    throw new Error("Failed to analyze the document. Please try again.");
  }
};

export const findNearbySpecialists = async (
  specialist: string,
  lat: number,
  lng: number,
  isDemoMode: boolean,
  language: Language
): Promise<MapsResult> => {
  if (isDemoMode) {
    return new Promise((resolve) => setTimeout(() => resolve({
        text: `Based on your location, here are some highly-rated ${specialist}s nearby:\n\n1. **Heart & Vascular Institute** (0.8 miles) - 4.8 stars\n2. **City Cardiology Center** (1.2 miles) - 4.6 stars\n3. **Dr. Sarah Smith, MD** (1.5 miles) - 4.9 stars`,
        // Simulate structured grounding chunks for the demo
        groundingChunks: [
          {
            web: { title: "Heart & Vascular Institute", uri: "#" },
            maps: { title: "Heart & Vascular Institute", googleMapsUri: "https://maps.google.com", rating: 4.8, userRatingCount: 124, formattedAddress: "123 Medical Center Dr, San Francisco, CA" }
          },
          {
            web: { title: "City Cardiology Center", uri: "#" },
            maps: { title: "City Cardiology Center", googleMapsUri: "https://maps.google.com", rating: 4.6, userRatingCount: 89, formattedAddress: "456 Health Blvd, San Francisco, CA" }
          },
          {
            web: { title: "Dr. Sarah Smith, MD", uri: "#" },
            maps: { title: "Dr. Sarah Smith, MD", googleMapsUri: "https://maps.google.com", rating: 4.9, userRatingCount: 215, formattedAddress: "789 Wellness Way, San Francisco, CA" }
          }
        ]
    }), 2000));
  }

  try {
    const ai = getAiClient();
    const targetLang = LANG_MAP[language];
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find top-rated ${specialist}s near me. Provide a list with doctor/clinic names, distance, rating, and address. Respond in ${targetLang}.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
            retrievalConfig: {
                latLng: {
                    latitude: lat,
                    longitude: lng
                }
            }
        }
      }
    });

    const text = response.text;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    return { text, groundingChunks };

  } catch (error) {
    console.error("Find Specialists Failed:", error);
    throw new Error("Failed to find specialists nearby.");
  }
};

export const analyzeTrends = async (
  currentFile: File,
  previousFile: File,
  isDemoMode: boolean,
  language: Language
): Promise<TrendMetric[]> => {
  if (isDemoMode) {
     // Note: In a real app we would have translated demo data
    return new Promise((resolve) => setTimeout(() => resolve(DEMO_TRENDS), 2000));
  }

  const currentBase64 = await fileToBase64(currentFile);
  const previousBase64 = await fileToBase64(previousFile);
  const targetLang = LANG_MAP[language];

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          { text: "Image 1: CURRENT Medical Report" },
          { inlineData: { mimeType: currentFile.type, data: currentBase64 } },
          { text: "Image 2: PREVIOUS Medical Report" },
          { inlineData: { mimeType: previousFile.type, data: previousBase64 } },
          {
            text: `Compare the Current Report (Image 1) with the Previous Report (Image 2).
            Extract matching health metrics found in both documents.
            For each metric, identify the previous value and current value.
            Translate metric names to ${targetLang}.
            Determine the 'direction' (up/down/stable).
            Determine the 'evaluation':
            - 'improved' if the change is clinically beneficial (e.g. LDL going down, Vitamin D going up to range).
            - 'worsened' if the change is negative (e.g. LDL going up).
            - 'stable' if the change is negligible.
            - 'neutral' if the change is not clearly good or bad.
            
            Return a JSON array of these comparisons.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: TREND_SCHEMA,
        temperature: 0.1,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as TrendMetric[];
  } catch (error) {
    console.error("Trend Analysis Failed:", error);
    throw new Error("Failed to compare documents.");
  }
};

export const analyzeLongitudinalTrends = async (
  files: File[],
  isDemoMode: boolean,
  language: Language
): Promise<TrendAnalysisResult> => {
  if (isDemoMode) {
    return new Promise((resolve) => setTimeout(() => resolve({
      ...DEMO_RESPONSE, // Reusing existing structure for demo simplicity or define specific demo data
      // ... actual longitudinal demo data is lengthy, using simplified placeholder from existing file if needed
      // returning minimal valid structure for compilation
      biomarkers: [],
      overall_score: 75,
      success_stories_aggregate: { query: "", sample_size: 0, top_factors: [] }
    }), 3000));
  }

  try {
    // 1. Convert all files to Base64 parts
    const fileParts = await Promise.all(files.map(async (file, index) => {
      const b64 = await fileToBase64(file);
      return [
        { text: `Document ${index + 1} (Filename: ${file.name})` },
        { inlineData: { mimeType: file.type, data: b64 } }
      ];
    }));
    
    // Flatten the array of arrays
    const contentParts = fileParts.flat();
    const targetLang = LANG_MAP[language];

    // 2. Construct the prompt
    contentParts.push({
      text: `You are an expert clinical data analyst. 
      Input: A list of medical reports (Document 1 to ${files.length}). 
      Task: Analyze all reports together to extract longitudinal trends.
      1. Extract the Date for each report (YYYY-MM-DD). If no date found, use sequential order provided.
      2. Group extracted biomarkers across reports. Map synonyms to a canonical key (e.g. "Total Chol" -> "total_cholesterol").
      3. Compute metrics: absolute_change, percent_change, rate_per_month.
      4. Determine trend_class (improved, worsened, stable) based on clinical desired direction (e.g., lower is better for LDL, higher better for HDL).
      5. Translate labels and insights to ${targetLang}.
      6. Provide a 'overall_score' (0-100) based on aggregate health trends.
      
      Return ONLY JSON matching the following schema.`
    });

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: { parts: contentParts },
      config: {
        responseMimeType: "application/json",
        responseSchema: LONGITUDINAL_SCHEMA,
        temperature: 0.1,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as TrendAnalysisResult;

  } catch (error) {
    console.error("Longitudinal Analysis Failed:", error);
    throw new Error("Failed to analyze trends.");
  }
};

export const generateHealthForecast = async (
  currentAnalysis: AnalysisResponse,
  isDemoMode: boolean,
  language: Language
): Promise<HealthForecastResult> => {
  if (isDemoMode) {
    return new Promise((resolve) => setTimeout(() => resolve(DEMO_FORECAST), 3000));
  }

  try {
    const targetLang = LANG_MAP[language];
    const prompt = `
      Act as an advanced medical AI with predictive capabilities.
      Based on the following analysis of a patient's current medical report:
      ${JSON.stringify(currentAnalysis.analysis.keyFindings)}

      Task:
      1. Analyze Current State: Identify specific patterns in biomarkers (Cardiovascular, Metabolic, Nutritional, etc.).
      2. Project Trajectories: Predict probable future values in 3-6 months if no action is taken vs if positive action is taken.
      3. Risk Assessment: Assign scores (0-100, where 100 is perfect health) to 6 health categories: Cardiovascular, Metabolic, Nutritional, Inflammation, Liver Health, Kidney Health.
      4. Prevention Plan: Generate a 3-step actionable plan with expected impact and success rates based on clinical studies.
      5. Translate all output strings to ${targetLang}.

      Return ONLY JSON matching the schema provided.
    `;

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: FORECAST_SCHEMA,
        temperature: 0.2, // Slightly higher for "reasoning" simulation
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as HealthForecastResult;
  } catch (error) {
    console.error("Forecast Generation Failed:", error);
    throw new Error("Failed to generate forecast.");
  }
};

export const generateCommunityInsights = async (
  analysis: AnalysisResponse,
  isDemoMode: boolean,
  language: Language
): Promise<CommunityComparisonResult> => {
  if (isDemoMode) {
    return new Promise((resolve) => setTimeout(() => resolve(DEMO_COMPARISON), 3500));
  }

  try {
    const targetLang = LANG_MAP[language];
    const prompt = `
      Act as a medical data analyst with access to anonymized population health datasets.
      Based on the provided analysis findings:
      ${JSON.stringify(analysis.analysis.keyFindings)}

      Task:
      1. Identify the likely demographic group (e.g. "Adults 30-45" or inferred from report if available, otherwise default to "Adults").
      2. For the top 3 most significant biomarkers, compare the user's values against general population statistics for that demographic.
      3. Calculate approximate percentiles (0-100) where higher percentile means *worse* health for negative markers (like LDL) or *better* health for positive markers (like Vitamin D). Actually, simplify: Percentile 0-100 where 100 is the "worst" end of the distribution curve (highest risk). 
         Wait, let's stick to a standard: Percentile 0-100.
         Create an 'insight' string like "Higher than 72% of peers".
      4. Provide 2 anonymous 'Success Stories' relevant to the findings (e.g. "People who improved LDL did X").
      5. List 3 trending health concerns for this demographic.
      6. Write a short, encouraging motivational message.
      7. Translate all text to ${targetLang}.

      Return ONLY JSON matching the schema provided.
    `;

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: COMPARISON_SCHEMA,
        temperature: 0.25,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as CommunityComparisonResult;
  } catch (error) {
    console.error("Community Insights Generation Failed:", error);
    throw new Error("Failed to generate community insights.");
  }
};

export const analyzeTimelineCorrelations = async (
  trends: TrendAnalysisResult,
  lifeEvents: LifeEvent[],
  isDemoMode: boolean,
  language: Language
): Promise<TimelineAnalysis> => {
  if (isDemoMode) {
    return new Promise((resolve) => setTimeout(() => resolve(DEMO_TIMELINE), 3000));
  }

  try {
    const targetLang = LANG_MAP[language];
    const prompt = `
      Act as a smart medical data scientist.
      
      Input 1: Patient's longitudinal biomarker data:
      ${JSON.stringify(trends)}

      Input 2: Patient's reported life events:
      ${JSON.stringify(lifeEvents)}

      Task:
      1. Correlate Events with Data: Identify if specific life events (e.g., "Started Diet") coincide with or precede significant changes in biomarkers (e.g., cholesterol drop).
      2. Identify Patterns: Look for seasonal trends or recurring patterns in the biomarker data values.
      3. Find Turning Point: Identify the specific date range where the patient's health showed the most significant positive shift.
      4. Predict: Based on the current slope/velocity of the trends, predict a likely health outcome in 3 months.
      5. Translate everything to ${targetLang}.

      Return ONLY JSON matching the schema provided.
    `;

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: TIMELINE_SCHEMA,
        temperature: 0.2,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as TimelineAnalysis;
  } catch (error) {
    console.error("Timeline Analysis Failed:", error);
    throw new Error("Failed to analyze timeline.");
  }
};