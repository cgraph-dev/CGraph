/**
 * useAI Hook
 *
 * React hook for AI-powered messaging features.
 * Wraps the aiService with loading/error state management.
 *
 * Features:
 * - Conversation summarization
 * - Smart reply suggestions
 * - Content moderation
 * - Sentiment analysis
 *
 * @module features/messaging/hooks/useAI
 */

import { useState, useCallback } from 'react';
import * as aiService from '@/services/aiService';
import type {
  ConversationSummary,
  SmartReply,
  ModerationResult,
  SentimentResult,
} from '@/services/aiService';

export function useAI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const summarize = useCallback(
    async (
      conversationId: string,
      messageIds?: string[]
    ): Promise<ConversationSummary | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await aiService.summarizeConversation(conversationId, messageIds);
        return result;
      } catch (e) {
        setError('Failed to summarize conversation');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const smartReplies = useCallback(
    async (messageId: string): Promise<SmartReply[] | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await aiService.generateSmartReplies(messageId);
        return result;
      } catch (e) {
        setError('Failed to generate smart replies');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const moderate = useCallback(
    async (content: string): Promise<ModerationResult | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await aiService.moderateContent(content);
        return result;
      } catch (e) {
        setError('Failed to moderate content');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const analyzeSentiment = useCallback(
    async (content: string): Promise<SentimentResult | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await aiService.analyzeSentiment(content);
        return result;
      } catch (e) {
        setError('Failed to analyze sentiment');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    isLoading,
    error,
    summarize,
    smartReplies,
    moderate,
    analyzeSentiment,
  };
}
