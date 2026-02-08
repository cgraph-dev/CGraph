/**
 * Search Filters Hook
 *
 * Hook for managing search filter state.
 *
 * @module modules/search/hooks/useSearchFilters
 */

import { useCallback, useState } from 'react';

/**
 * Hook for search filters
 */
export function useSearchFilters() {
  const [filters, setFilters] = useState<{
    dateRange?: { start: Date; end: Date };
    sortBy?: 'relevance' | 'date' | 'popularity';
    sortOrder?: 'asc' | 'desc';
    author?: string;
    forum?: string;
  }>({});

  const setDateRange = useCallback((start: Date, end: Date) => {
    setFilters((prev) => ({ ...prev, dateRange: { start, end } }));
  }, []);

  const setSortBy = useCallback((sortBy: 'relevance' | 'date' | 'popularity') => {
    setFilters((prev) => ({ ...prev, sortBy }));
  }, []);

  const setSortOrder = useCallback((sortOrder: 'asc' | 'desc') => {
    setFilters((prev) => ({ ...prev, sortOrder }));
  }, []);

  const setAuthorFilter = useCallback((author: string) => {
    setFilters((prev) => ({ ...prev, author }));
  }, []);

  const setForumFilter = useCallback((forum: string) => {
    setFilters((prev) => ({ ...prev, forum }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    filters,
    setDateRange,
    setSortBy,
    setSortOrder,
    setAuthorFilter,
    setForumFilter,
    clearFilters,
  };
}
