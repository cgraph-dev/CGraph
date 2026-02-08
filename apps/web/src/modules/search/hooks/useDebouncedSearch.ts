/**
 * Debounced Search Hook
 *
 * Hook that debounces search input before triggering a search.
 *
 * @module modules/search/hooks/useDebouncedSearch
 */

import { useEffect, useState } from 'react';
import { useSearchStore } from '../store';

/**
 * Hook for debounced search
 */
export function useDebouncedSearch(delay: number = 300) {
  const { search, setQuery, query, isLoading } = useSearchStore();
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);

    return () => clearTimeout(timer);
  }, [query, delay]);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      search(debouncedQuery);
    }
  }, [debouncedQuery, search]);

  return {
    query,
    setQuery,
    isSearching: isLoading,
    debouncedQuery,
  };
}
