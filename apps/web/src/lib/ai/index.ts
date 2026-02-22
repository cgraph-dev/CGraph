/**
 * AI Message Engine — Barrel Exports
 *
 * Re-exports all types and the singleton engine instance.
 *
 * @module lib/ai
 */

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

export { AIMessageEngine, aiMessageEngine } from './ai-message-engine';
