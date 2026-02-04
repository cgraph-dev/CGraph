/**
 * Search Hooks
 *
 * Custom React hooks for search functionality.
 *
 * @module modules/search/hooks
 * @version 1.0.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
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

/**
 * Hook for user search
 */
export function useUserSearch() {
  const { users, isLoading, search, setCategory, category } = useSearchStore();

  useEffect(() => {
    if (category !== 'users') {
      setCategory('users');
    }
  }, [category, setCategory]);

  const searchUsers = useCallback(
    async (query: string) => {
      setCategory('users');
      await search(query);
    },
    [search, setCategory]
  );

  return {
    users,
    isLoading,
    search: searchUsers,
  };
}

/**
 * Hook for group search
 */
export function useGroupSearch() {
  const { groups, isLoading, search, setCategory, category } = useSearchStore();

  useEffect(() => {
    if (category !== 'groups') {
      setCategory('groups');
    }
  }, [category, setCategory]);

  const searchGroups = useCallback(
    async (query: string) => {
      setCategory('groups');
      await search(query);
    },
    [search, setCategory]
  );

  return {
    groups,
    isLoading,
    search: searchGroups,
  };
}

/**
 * Hook for forum search
 */
export function useForumSearch() {
  const { forums, posts, isLoading, search, setCategory } = useSearchStore();

  const searchForums = useCallback(
    async (query: string) => {
      setCategory('forums');
      await search(query);
    },
    [search, setCategory]
  );

  const searchPosts = useCallback(
    async (query: string) => {
      setCategory('posts');
      await search(query);
    },
    [search, setCategory]
  );

  return {
    forums,
    posts,
    isLoading,
    searchForums,
    searchPosts,
  };
}

/**
 * Hook for search suggestions/autocomplete
 */
export function useSearchSuggestions() {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('cgraph_recent_searches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored) as string[]);
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

  // Generate suggestions based on input
  const updateSuggestions = useCallback(
    (query: string) => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }
      // Filter recent searches that match the query
      const matchingRecent = recentSearches.filter((s) =>
        s.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(matchingRecent.slice(0, 5));
    },
    [recentSearches]
  );

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  const addRecentSearch = useCallback((query: string) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s !== query);
      const updated = [query, ...filtered].slice(0, 10);
      localStorage.setItem('cgraph_recent_searches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem('cgraph_recent_searches');
  }, []);

  const removeRecentSearch = useCallback((query: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s !== query);
      localStorage.setItem('cgraph_recent_searches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    suggestions,
    recentSearches,
    updateSuggestions,
    clearSuggestions,
    addRecentSearch,
    clearRecentSearches,
    removeRecentSearch,
  };
}

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

/**
 * Hook for global search (command palette style)
 */
export function useGlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const { search, clearResults, query, setQuery, isLoading, users, groups, forums } =
    useSearchStore();

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    clearResults();
    setQuery('');
  }, [clearResults, setQuery]);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggle, close]);

  return {
    isOpen,
    query,
    isLoading,
    results: { users, groups, forums },
    open,
    close,
    toggle,
    setQuery,
    search,
  };
}
