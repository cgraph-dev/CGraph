/**
 * Main Search Hook
 *
 * Core search hook that orchestrates the search store.
 *
 * @module modules/search/hooks/useSearch
 * @version 1.0.0
 */

import { useCallback, useMemo } from 'react';
import { useSearchStore } from '../store';
import type { SearchCategory } from '../store';

/**
 * Main search hook
 */
export function useSearch() {
  const {
    query,
    category,
    users,
    groups,
    forums,
    posts,
    messages,
    isLoading,
    error,
    hasSearched,
    setQuery,
    setCategory,
    search,
    clearResults,
    clearError,
  } = useSearchStore();

  const totalResults = useMemo(
    () => users.length + groups.length + forums.length + posts.length + messages.length,
    [users, groups, forums, posts, messages]
  );

  const resultsByCategory = useMemo(
    () => ({
      users: users.length,
      groups: groups.length,
      forums: forums.length,
      posts: posts.length,
      messages: messages.length,
    }),
    [users, groups, forums, posts, messages]
  );

  const handleSearch = useCallback(
    async (searchQuery?: string) => {
      await search(searchQuery);
    },
    [search]
  );

  const handleSetQuery = useCallback(
    (newQuery: string) => {
      setQuery(newQuery);
    },
    [setQuery]
  );

  const handleSetCategory = useCallback(
    (newCategory: SearchCategory) => {
      setCategory(newCategory);
    },
    [setCategory]
  );

  const clear = useCallback(() => {
    clearResults();
  }, [clearResults]);

  return {
    query,
    category,
    results: {
      users,
      groups,
      forums,
      posts,
      messages,
    },
    totalResults,
    resultsByCategory,
    isLoading,
    error,
    hasSearched,
    setQuery: handleSetQuery,
    setCategory: handleSetCategory,
    search: handleSearch,
    clear,
    clearError,
  };
}
