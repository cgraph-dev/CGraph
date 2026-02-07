/**
 * AI Message Engine Type Definitions
 *
 * Interfaces for smart replies, sentiment analysis, language detection,
 * content moderation, conversation insights, and topic extraction.
 *
 * @module lib/ai/types
 */

// =============================================================================
// TYPES
// =============================================================================

export interface SmartReply {
  id: string;
  text: string;
  confidence: number;
  tone: 'casual' | 'professional' | 'friendly' | 'empathetic' | 'humorous';
  category: 'affirmative' | 'negative' | 'question' | 'acknowledgment' | 'action';
}

export interface MessageSummary {
  brief: string; // One sentence summary
  detailed: string; // Paragraph summary
  keyPoints: string[]; // Bullet points
  actionItems: string[]; // Extracted tasks
  decisions: string[]; // Decisions made
  questions: string[]; // Unanswered questions
}

export interface SentimentAnalysis {
  score: number; // -1 to 1 (negative to positive)
  magnitude: number; // 0 to 1 (intensity)
  label: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    disgust: number;
    trust: number;
    anticipation: number;
  };
  dominantEmotion: string;
}

export interface LanguageDetection {
  language: string; // ISO 639-1 code
  confidence: number;
  alternatives: Array<{ language: string; confidence: number }>;
  isMultilingual: boolean;
  segments?: Array<{ text: string; language: string }>;
}

export interface ContentModeration {
  isSafe: boolean;
  flags: {
    spam: boolean;
    scam: boolean;
    harassment: boolean;
    hateSpeech: boolean;
    violence: boolean;
    adult: boolean;
    selfHarm: boolean;
    misinformation: boolean;
  };
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  suggestedAction: 'allow' | 'warn' | 'filter' | 'block' | 'review';
  explanation?: string;
}

export interface ConversationInsight {
  participationRate: Record<string, number>;
  responseTime: {
    average: number;
    fastest: number;
    slowest: number;
  };
  topicsDiscussed: Array<{ topic: string; frequency: number; sentiment: number }>;
  engagementScore: number;
  communicationStyle: {
    formality: number; // 0 = casual, 1 = formal
    verbosity: number; // 0 = concise, 1 = verbose
    emotionality: number; // 0 = rational, 1 = emotional
  };
  suggestions: string[];
}

export interface TopicExtraction {
  topics: Array<{
    name: string;
    confidence: number;
    keywords: string[];
    sentiment: number;
    messageCount: number;
  }>;
  categories: string[];
  entities: Array<{
    text: string;
    type: 'person' | 'organization' | 'location' | 'date' | 'money' | 'product' | 'event';
    confidence: number;
  }>;
}

export interface AIConfig {
  enableLocalML: boolean;
  enableCloudAI: boolean;
  cloudEndpoint?: string;
  apiKey?: string;
  privacyMode: 'strict' | 'balanced' | 'permissive';
  maxTokens: number;
  temperature: number;
  language: string;
}
