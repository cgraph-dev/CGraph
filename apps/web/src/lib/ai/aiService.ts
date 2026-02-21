/**
 * AI Service Client — Backend-powered AI features
 *
 * Replaces local heuristic-only implementations with backend LLM calls.
 * Falls back to local heuristics when backend is unavailable.
 *
 * Features:
 * - Conversation summarization (streamed via WebSocket)
 * - Smart reply suggestions
 * - Content moderation
 * - Sentiment analysis
 *
 * @module lib/ai/aiService
 */

import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';
import type { SmartReply, SentimentAnalysis, MessageSummary, ContentModeration } from './types';

// Local fallbacks
import { summarizeConversation as localSummarize } from './summarizer';
import { generateSmartReplies as localSmartReplies } from './smartReplies';
import { moderateContent as localModerate } from './contentModeration';
import { analyzeSentiment as localSentiment } from './sentimentAnalysis';

const logger = createLogger('AIService');

// =============================================================================
// Configuration
// =============================================================================

export interface AIServiceConfig {
  /** Use backend AI (default: true if authenticated) */
  useBackend: boolean;
  /** Timeout for AI requests in ms */
  timeout: number;
  /** Fallback to local heuristics on backend failure */
  fallbackToLocal: boolean;
}

const defaultConfig: AIServiceConfig = {
  useBackend: true,
  timeout: 15_000,
  fallbackToLocal: true,
};

let _config = { ...defaultConfig };

export function configureAIService(config: Partial<AIServiceConfig>): void {
  _config = { ..._config, ...config };
}

// =============================================================================
// Summarization
// =============================================================================

/**
 * Summarize a conversation — calls backend AI endpoint with local fallback.
 */
export async function summarizeConversation(
  messages: Array<{ sender: string; content: string; timestamp: number }>
): Promise<MessageSummary> {
  if (!_config.useBackend) {
    return localSummarize(messages);
  }

  try {
    const response = await api.post('/api/v1/ai/summarize', {
      messages: messages.map((m) => ({
        sender: m.sender,
        content: m.content,
        timestamp: m.timestamp,
      })),
    });

    const data = response.data?.data;
    if (data) {
      return {
        brief: data.brief || '',
        detailed: data.detailed || '',
        keyPoints: data.key_points || [],
        actionItems: data.action_items || [],
        decisions: data.decisions || [],
        questions: [],
      };
    }

    throw new Error('Invalid response format');
  } catch (error) {
    logger.warn('Backend summarization failed, falling back to local', error);
    if (_config.fallbackToLocal) {
      return localSummarize(messages);
    }
    throw error;
  }
}

// =============================================================================
// Smart Replies
// =============================================================================

/**
 * Generate smart reply suggestions — backend with local fallback.
 */
export async function generateSmartReplies(
  message: string,
  context?: { conversationHistory?: string[]; senderName?: string }
): Promise<SmartReply[]> {
  if (!_config.useBackend) {
    return localSmartReplies(message, context);
  }

  try {
    const response = await api.post('/api/v1/ai/smart-replies', {
      message,
      context: context?.conversationHistory?.join('\n') || '',
    });

    const data = response.data?.data;
    if (Array.isArray(data)) {
      return data.map((r: { text: string; confidence: number; category: string }, idx: number) => ({
        id: `sr-${idx}-${Date.now()}`,
        text: r.text,
        confidence: r.confidence,
        tone: 'casual' as const,
        category: r.category as SmartReply['category'],
      }));
    }

    throw new Error('Invalid response');
  } catch (error) {
    logger.warn('Backend smart replies failed, falling back', error);
    if (_config.fallbackToLocal) {
      return localSmartReplies(message, context);
    }
    throw error;
  }
}

// =============================================================================
// Content Moderation
// =============================================================================

/**
 * Moderate content — backend with local fallback.
 */
export async function moderateContentAI(text: string): Promise<ContentModeration> {
  if (!_config.useBackend) {
    return localModerate(text);
  }

  try {
    const response = await api.post('/api/v1/ai/moderate', {
      content: text,
    });

    const data = response.data?.data;
    if (data) {
      return {
        isSafe: data.safe ?? true,
        flags: {
          spam: (data.categories || []).includes('spam'),
          scam: (data.categories || []).includes('scam'),
          harassment: (data.categories || []).includes('harassment'),
          hateSpeech: (data.categories || []).includes('hate_speech'),
          violence: (data.categories || []).includes('violence'),
          adult: (data.categories || []).includes('sexual'),
          selfHarm: (data.categories || []).includes('self_harm'),
          misinformation: false,
        },
        severity: mapConfidenceToSeverity(data.confidence, data.safe),
        confidence: data.confidence ?? 0.5,
        suggestedAction: mapAction(data.action),
      };
    }

    throw new Error('Invalid response');
  } catch (error) {
    logger.warn('Backend moderation failed, falling back', error);
    if (_config.fallbackToLocal) {
      return localModerate(text);
    }
    throw error;
  }
}

// =============================================================================
// Sentiment Analysis
// =============================================================================

/**
 * Analyze sentiment — backend with local fallback.
 */
export async function analyzeSentimentAI(text: string): Promise<SentimentAnalysis> {
  if (!_config.useBackend) {
    return localSentiment(text);
  }

  try {
    const response = await api.post('/api/v1/ai/sentiment', {
      text,
    });

    const data = response.data?.data;
    if (data) {
      return {
        score: data.score ?? 0,
        magnitude: data.confidence ?? 0.5,
        label: mapScoreToLabel(data.score ?? 0),
        emotions: {
          joy: 0,
          sadness: 0,
          anger: 0,
          fear: 0,
          surprise: 0,
          disgust: 0,
          trust: 0,
          anticipation: 0,
          ...(data.emotions || {}),
        },
        dominantEmotion: data.sentiment || 'neutral',
      };
    }

    throw new Error('Invalid response');
  } catch (error) {
    logger.warn('Backend sentiment analysis failed, falling back', error);
    if (_config.fallbackToLocal) {
      return localSentiment(text);
    }
    throw error;
  }
}

// =============================================================================
// Streaming Summarization via WebSocket
// =============================================================================

export interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onComplete: (summary?: MessageSummary) => void;
  onError: (error: string) => void;
}

/**
 * Stream a summarization response via the AI Phoenix Channel.
 * Requires an active WebSocket connection.
 */
export function streamSummarize(
  channel: {
    push: (
      event: string,
      payload: unknown
    ) => { receive: (status: string, cb: (resp: unknown) => void) => unknown };
  },
  messages: Array<{ sender: string; content: string; timestamp: number }>,
  _callbacks: StreamCallbacks
): () => void {
  // Push summarize_stream event
  channel.push('summarize_stream', {
    messages: messages.map((m) => ({
      sender: m.sender,
      content: m.content,
      timestamp: m.timestamp,
    })),
  });

  // Set up event listeners (caller should handle channel.on() bindings)
  logger.debug('Stream summarization started');

  // Return cleanup function
  return () => {
    logger.debug('Stream summarization cleanup');
  };
}

// =============================================================================
// Internal helpers — map backend response formats to typed interfaces
// =============================================================================

function mapConfidenceToSeverity(
  confidence: number | undefined,
  safe: boolean | undefined
): ContentModeration['severity'] {
  if (safe) return 'none';
  const c = confidence ?? 0.5;
  if (c > 0.9) return 'critical';
  if (c > 0.7) return 'high';
  if (c > 0.4) return 'medium';
  return 'low';
}

function mapAction(action: string | undefined): ContentModeration['suggestedAction'] {
  switch (action) {
    case 'allow':
      return 'allow';
    case 'flag':
      return 'review';
    case 'block':
      return 'block';
    default:
      return 'allow';
  }
}

function mapScoreToLabel(score: number): SentimentAnalysis['label'] {
  if (score <= -0.6) return 'very_negative';
  if (score <= -0.2) return 'negative';
  if (score <= 0.2) return 'neutral';
  if (score <= 0.6) return 'positive';
  return 'very_positive';
}
