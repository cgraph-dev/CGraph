/**
 * Hook for user search with debounced Meilisearch integration.
 * @module modules/social/hooks/useUserSearch
 */
import { useState, useEffect, useMemo, useRef } from 'react';
import debounce from 'lodash.debounce';
import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useUserSearch');

export interface UserSearchResult {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  status: string;
}

export interface UseUserSearchReturn {
  results: UserSearchResult[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Debounced user search hook.
 *
 * Calls `GET /api/v1/search/users` when query length >= 2,
 * debounced by 300ms.
 *
 * @param query - The search query string.
 * @returns Search results, loading state, and error.
 */
export function useUserSearch(query: string): UseUserSearchReturn {
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep a ref to the latest query to avoid stale closure issues
  const latestQuery = useRef(query);
  latestQuery.current = query;

  // Use useMemo to create a stable debounced function (avoids useCallback + debounce lint warning)
  const performSearch = useMemo(
    () =>
      debounce(async (q: string) => {
        // Guard: only search if this is still the latest query
        if (q !== latestQuery.current) return;

        setIsLoading(true);
        setError(null);

        try {
          const res = await api.get('/api/v1/search/users', {
            params: { q },
          });

          // Only update if query hasn't changed during the request
          if (q === latestQuery.current) {
            const users = res.data?.users ?? res.data ?? [];
            setResults(Array.isArray(users) ? users : []);
          }
        } catch (err) {
          logger.error('User search failed:', err);
          if (q === latestQuery.current) {
            setError('Failed to search users');
            setResults([]);
          }
        } finally {
          if (q === latestQuery.current) {
            setIsLoading(false);
          }
        }
      }, 300),
    [],
  );

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    performSearch(query);
  }, [query, performSearch]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      performSearch.cancel();
    };
  }, [performSearch]);

  return { results, isLoading, error };
}
