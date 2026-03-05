/**
 * AI Service
 *
 * Backend API integration for AI-powered features:
 * - Conversation summarization
 * - Smart reply suggestions
 * - Content moderation
 * - Sentiment analysis
 *
 * @module services/aiService
 * @since v0.10.0
 */

import api from '../lib/api';

// ==================== TYPES ====================

export interface ConversationSummary {
  brief: string;
  detailed: string;
  keyPoints: string[];
  actionItems: string[];
  decisions: string[];
}

export interface SmartReply {
  text: string;
  confidence: number;
  category: string;
}

export interface ModerationResult {
  safe: boolean;
  confidence: number;
  categories: string[];
  action: 'allow' | 'flag' | 'block';
}

export interface SentimentResult {
  score: number;
  confidence: number;
  sentiment: string;
  emotions: Record<string, number>;
}

// ==================== API METHODS ====================

/**
 * Summarize a conversation using backend AI.
 * Endpoint: POST /api/v1/ai/summarize
 */
export async function summarizeConversation(
  conversationId: string,
  messageIds?: string[]
): Promise<ConversationSummary> {
  const response = await api.post('/api/v1/ai/summarize', {
    conversation_id: conversationId,
    message_ids: messageIds,
  });
  const data = response.data?.data || response.data;
  return {
    brief: data.brief || '',
    detailed: data.detailed || '',
    keyPoints: data.key_points || [],
    actionItems: data.action_items || [],
    decisions: data.decisions || [],
  };
}

/**
 * Generate smart reply suggestions for a message.
 * Endpoint: POST /api/v1/ai/smart-replies
 */
export async function generateSmartReplies(
  messageId: string
): Promise<SmartReply[]> {
  const response = await api.post('/api/v1/ai/smart-replies', {
    message_id: messageId,
  });
  const data = response.data?.data || response.data;
  return Array.isArray(data)
    ? data.map((r: { text: string; confidence: number; category: string }) => ({
        text: r.text,
        confidence: r.confidence,
        category: r.category,
      }))
    : [];
}

/**
 * Check content safety via AI moderation.
 * Endpoint: POST /api/v1/ai/moderate
 */
export async function moderateContent(
  content: string
): Promise<ModerationResult> {
  const response = await api.post('/api/v1/ai/moderate', { content });
  const data = response.data?.data || response.data;
  return {
    safe: data.safe ?? true,
    confidence: data.confidence ?? 0.5,
    categories: data.categories || [],
    action: data.action || 'allow',
  };
}

/**
 * Analyze text sentiment.
 * Endpoint: POST /api/v1/ai/sentiment
 */
export async function analyzeSentiment(
  content: string
): Promise<SentimentResult> {
  const response = await api.post('/api/v1/ai/sentiment', { content });
  const data = response.data?.data || response.data;
  return {
    score: data.score ?? 0,
    confidence: data.confidence ?? 0.5,
    sentiment: data.sentiment || 'neutral',
    emotions: data.emotions || {},
  };
}
