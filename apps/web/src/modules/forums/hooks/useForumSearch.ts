/**
 * useForumSearch Hook
 *
 * Debounced search with URL param sync.
 * Returns results, loading state, filters, and control functions.
 *
 * @module modules/forums/hooks/useForumSearch
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForumStore } from '@/modules/forums/store';
import type { ForumSearchFilters } from '@/modules/forums/store/forumStore.types';

const DEBOUNCE_MS = 300;

/** Description. */
/** Hook for forum search. */
export function useForumSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    searchResults,
    searchLoading,
    searchHasMore,
    searchQuery,
    searchFilters,
    searchForums,
    searchMore,
    clearSearch,
  } = useForumStore();

  const [inputValue, setInputValue] = useState(searchParams.get('q') ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync URL → store on mount
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      const filters: ForumSearchFilters = {};
      const type = searchParams.get('type');
      const sort = searchParams.get('sort');
      const dateFrom = searchParams.get('date_from');
      const dateTo = searchParams.get('date_to');
       
      if (type) filters.type = type as ForumSearchFilters['type'];
       
      if (sort) filters.sort = sort as ForumSearchFilters['sort'];
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;
      searchForums(q, filters);
    }
    return () => {
      clearSearch();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search
  const search = useCallback(
    (query: string, filters?: ForumSearchFilters) => {
      setInputValue(query);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (!query.trim()) {
          clearSearch();
          return;
        }
        const mergedFilters = { ...searchFilters, ...filters };
        // Update URL
        const params = new URLSearchParams({ q: query });
        if (mergedFilters.type && mergedFilters.type !== 'all')
          params.set('type', mergedFilters.type);
        if (mergedFilters.sort) params.set('sort', mergedFilters.sort);
        if (mergedFilters.dateFrom) params.set('date_from', mergedFilters.dateFrom);
        if (mergedFilters.dateTo) params.set('date_to', mergedFilters.dateTo);
        setSearchParams(params, { replace: true });
        searchForums(query, mergedFilters);
      }, DEBOUNCE_MS);
    },
    [clearSearch, searchFilters, searchForums, setSearchParams]
  );

  const setFilters = useCallback(
    (filters: ForumSearchFilters) => {
      if (searchQuery) {
        search(searchQuery, filters);
      }
    },
    [search, searchQuery]
  );

  const loadMore = useCallback(() => {
    if (searchHasMore && !searchLoading) {
      searchMore();
    }
  }, [searchHasMore, searchLoading, searchMore]);

  const clear = useCallback(() => {
    setInputValue('');
    setSearchParams({});
    clearSearch();
  }, [clearSearch, setSearchParams]);

  return {
    results: searchResults,
    loading: searchLoading,
    hasMore: searchHasMore,
    query: searchQuery,
    inputValue,
    filters: searchFilters,
    setFilters,
    search,
    loadMore,
    clear,
  };
}

export default useForumSearch;
