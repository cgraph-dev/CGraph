/**
 * useMultiQuote Hook
 *
 * Connects the multi-quote buffer to the post editor.
 * Fetches post content for selected IDs and formats them
 * as BBCode quote blocks for insertion into the editor.
 *
 * @module modules/forums/hooks
 */

import { useCallback, useState } from 'react';
import { useForumStore } from '@/modules/forums/store';
import { api } from '@/lib/api';
import { formatMultiQuote, type QuoteData } from '@/modules/forums/utils/quoteUtils';
import { createLogger } from '@/lib/logger';

const logger = createLogger('MultiQuote');

interface UseMultiQuoteReturn {
  /** Number of posts in the buffer */
  count: number;
  /** Whether any posts are selected */
  hasQuotes: boolean;
  /** Generate formatted quote text from the buffer */
  generateQuoteText: () => Promise<string>;
  /** Clear the buffer */
  clearQuotes: () => void;
  /** Loading state */
  isLoading: boolean;
}

export function useMultiQuote(): UseMultiQuoteReturn {
  const multiQuoteBuffer = useForumStore((s) => s.multiQuoteBuffer);
  const clearMultiQuote = useForumStore((s) => s.clearMultiQuote);
  const [isLoading, setIsLoading] = useState(false);

  const generateQuoteText = useCallback(async (): Promise<string> => {
    if (multiQuoteBuffer.length === 0) return '';

    setIsLoading(true);
    try {
      // Fetch post data for each ID in the buffer
      const quotes: QuoteData[] = [];

      for (const postId of multiQuoteBuffer) {
        try {
          // Try thread posts first, then regular posts
          let res;
          try {
            res = await api.get(`/api/v1/posts/${postId}`);
          } catch {
            // Fall back to accessing via thread post endpoint
            res = await api.get(`/api/v1/thread-posts/${postId}`);
          }

          const post = res.data?.data ?? res.data;
          if (post) {
            quotes.push({
              postId,
              author: post.author?.username ?? post.author?.display_name ?? 'Unknown',
              content: post.content ?? post.body ?? '',
              timestamp: post.inserted_at ?? post.created_at,
            });
          }
        } catch (err) {
          logger.warn(`Failed to fetch post ${postId} for quote`, err);
          // Include a placeholder for unfetchable posts
          quotes.push({
            postId,
            author: 'Unknown',
            content: `[Could not load post ${postId.slice(0, 8)}...]`,
          });
        }
      }

      return formatMultiQuote(quotes, 'bbcode');
    } finally {
      setIsLoading(false);
    }
  }, [multiQuoteBuffer]);

  return {
    count: multiQuoteBuffer.length,
    hasQuotes: multiQuoteBuffer.length > 0,
    generateQuoteText,
    clearQuotes: clearMultiQuote,
    isLoading,
  };
}
