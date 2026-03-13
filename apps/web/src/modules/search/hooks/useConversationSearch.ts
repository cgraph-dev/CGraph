/**
 * useConversationSearch — In-conversation message search hook.
 *
 * Searches messages within a specific conversation using the existing
 * GET /api/v1/search/messages endpoint with conversation_id filter.
 *
 * @module modules/search/hooks/useConversationSearch
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useConversationSearch');

export interface ConversationSearchFilters {
  senderId?: string;
  dateFrom?: string;
  dateTo?: string;
  type?: string;
}

export interface SearchMessageResult {
  id: string;
  content: string;
  sender_id: string;
  sender: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
  conversation_id: string;
  type: string;
  inserted_at: string;
  has_attachment: boolean;
}

interface SearchResponse {
  messages: SearchMessageResult[];
  meta: {
    total?: number;
    has_next_page?: boolean;
    next_cursor?: string;
  };
}

/**
 * Hook for searching messages within a specific conversation.
 */
export function useConversationSearch(conversationId: string) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<ConversationSearchFilters>({});
  const [results, setResults] = useState<SearchMessageResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = useCallback(
    async (searchQuery: string, searchFilters: ConversationSearchFilters, append = false) => {
      if (searchQuery.length < 2) {
        if (!append) {
          setResults([]);
          setTotal(0);
          setHasMore(false);
        }
        return;
      }

      // Cancel previous request
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setIsLoading(true);

      try {
        const params: Record<string, string | undefined> = {
          q: searchQuery,
          conversation_id: conversationId,
          from: searchFilters.senderId,
          after: searchFilters.dateFrom,
          before: searchFilters.dateTo,
          has_attachment: searchFilters.type === 'attachment' ? 'true' : undefined,
          per_page: '20',
        };

        if (append && cursor) {
          params.cursor = cursor;
        }

        // Remove undefined params
        const cleanParams = Object.fromEntries(
          Object.entries(params).filter(([, v]) => v !== undefined)
        );

        const response = await api.get<SearchResponse>('/api/v1/search/messages', {
          params: cleanParams,
          signal: abortRef.current.signal,
        });

        const data = response.data;
        const messages = Array.isArray(data.messages) ? data.messages : [];

        if (append) {
          setResults((prev) => [...prev, ...messages]);
        } else {
          setResults(messages);
        }

        setTotal(data.meta?.total ?? messages.length);
        setHasMore(data.meta?.has_next_page ?? false);
        setCursor(data.meta?.next_cursor);
      } catch (err) {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        if ((err as Error).name !== 'AbortError') {
          logger.error('Conversation search failed', err);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, cursor]
  );

  const debouncedSearch = useCallback(
    (searchQuery: string, searchFilters: ConversationSearchFilters) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        search(searchQuery, searchFilters, false);
      }, 300);
    },
    [search]
  );

  const updateQuery = useCallback(
    (newQuery: string) => {
      setQuery(newQuery);
      debouncedSearch(newQuery, filters);
    },
    [filters, debouncedSearch]
  );

  const updateFilters = useCallback(
    (newFilters: ConversationSearchFilters) => {
      setFilters(newFilters);
      if (query.length >= 2) {
        search(query, newFilters, false);
      }
    },
    [query, search]
  );

  const fetchMore = useCallback(() => {
    if (hasMore && !isLoading) {
      search(query, filters, true);
    }
  }, [hasMore, isLoading, query, filters, search]);

  const reset = useCallback(() => {
    setQuery('');
    setFilters({});
    setResults([]);
    setTotal(0);
    setHasMore(false);
    setCursor(undefined);
    abortRef.current?.abort();
  }, []);

  return useMemo(
    () => ({
      query,
      setQuery: updateQuery,
      filters,
      setFilters: updateFilters,
      results,
      isLoading,
      total,
      hasMore,
      fetchMore,
      reset,
    }),
    [
      query,
      updateQuery,
      filters,
      updateFilters,
      results,
      isLoading,
      total,
      hasMore,
      fetchMore,
      reset,
    ]
  );
}
