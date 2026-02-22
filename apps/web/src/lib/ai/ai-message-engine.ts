/**
 * AI Message Intelligence Engine
 *
 * Facade class that delegates to feature modules for:
 * - Smart reply suggestions
 * - Message summarization
 * - Sentiment analysis
 * - Language detection and translation
 * - Content moderation
 * - Conversation insights
 * - Spam/scam detection
 * - Topic extraction
 *
 * Uses local ML models where possible for privacy,
 * with optional cloud AI for enhanced features.
 *
 * @version 3.0.0
 * @since v0.7.35
 */

import { createLogger } from '@/lib/logger';
import type {
  SmartReply,
  SentimentAnalysis,
  MessageSummary,
  LanguageDetection,
  ContentModeration,
  TopicExtraction,
  ConversationInsight,
  AIConfig,
} from './types';

// Import feature modules
import { analyzeSentiment } from './sentimentAnalysis';
import { generateSmartReplies } from './smartReplies';
import { summarizeConversation } from './summarizer';
import { detectLanguage } from './languageDetection';
import { moderateContent } from './contentModeration';
import { extractTopics } from './topicExtraction';
import { generateInsights } from './conversationInsights';

// Re-export all types for backward compatibility
export type {
  SmartReply,
  MessageSummary,
  SentimentAnalysis,
  LanguageDetection,
  ContentModeration,
  ConversationInsight,
  TopicExtraction,
  AIConfig,
} from './types';

// Re-export standalone functions for direct use
export { analyzeSentiment, extractEmotions } from './sentimentAnalysis';
export {
  generateSmartReplies,
  categorizeMessage,
  containsQuestion,
  adjustConfidence,
} from './smartReplies';
export {
  summarizeConversation,
  extractKeyPoints,
  generateBriefSummary,
  generateDetailedSummary,
} from './summarizer';
export { detectLanguage } from './languageDetection';
export { moderateContent } from './contentModeration';
export { extractTopics, extractEntities } from './topicExtraction';
export { generateInsights, emptyInsights, generateSuggestions } from './conversationInsights';

const logger = createLogger('AIMessageEngine');

// =============================================================================
// AI MESSAGE ENGINE (Facade)
// =============================================================================

export class AIMessageEngine {
  private _config: AIConfig;

  constructor(config: Partial<AIConfig> = {}) {
    this._config = {
      enableLocalML: config.enableLocalML ?? true,
      enableCloudAI: config.enableCloudAI ?? false,
      privacyMode: config.privacyMode ?? 'strict',
      maxTokens: config.maxTokens ?? 150,
      temperature: config.temperature ?? 0.7,
      language: config.language ?? 'en',
      ...config,
    };
    // Store config for future use in AI features
    logger.debug('Initialized with config:', this._config);
  }

  /** Generate smart reply suggestions for a message */
  async generateSmartReplies(
    message: string,
    context?: { conversationHistory?: string[]; senderName?: string }
  ): Promise<SmartReply[]> {
    return generateSmartReplies(message, context);
  }

  /** Analyze sentiment of a message */
  async analyzeSentiment(text: string): Promise<SentimentAnalysis> {
    return analyzeSentiment(text);
  }

  /** Summarize a conversation */
  async summarizeConversation(
    messages: Array<{ sender: string; content: string; timestamp: number }>
  ): Promise<MessageSummary> {
    return summarizeConversation(messages);
  }

  /** Detect language of text */
  async detectLanguage(text: string): Promise<LanguageDetection> {
    return detectLanguage(text);
  }

  /** Moderate message content for safety */
  async moderateContent(text: string): Promise<ContentModeration> {
    return moderateContent(text);
  }

  /** Extract topics from conversation */
  async extractTopics(messages: Array<{ content: string }>): Promise<TopicExtraction> {
    return extractTopics(messages);
  }

  /** Generate insights about a conversation */
  async generateInsights(
    messages: Array<{ sender: string; content: string; timestamp: number }>
  ): Promise<ConversationInsight> {
    return generateInsights(messages);
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const aiMessageEngine = new AIMessageEngine();
