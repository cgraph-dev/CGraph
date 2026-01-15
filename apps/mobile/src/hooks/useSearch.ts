/**
 * useSearch Hook
 * 
 * React hook for global search functionality across the app.
 * Provides search results, suggestions, and search history.
 * 
 * @module hooks/useSearch
 * @since v0.9.0
 */

import { useState, useCallback, useRef } from 'react';
import * as searchService from '../services/searchService';
import { 
  GlobalSearchResponse, 
  SearchResult, 
  SearchSuggestion, 
  SearchFilters,
  UserSearchResult,
  GroupSearchResult,
  MessageSearchResult,
  ForumSearchResult,
  PostSearchResult,
} from '../services/searchService';

interface SearchState {
  query: string;
  results: SearchResult[];
  totals: GlobalSearchResponse['totals'] | null;
  suggestions: SearchSuggestion[];
  recentSearches: SearchSuggestion[];
  trendingSearches: SearchSuggestion[];
  isSearching: boolean;
  isLoadingSuggestions: boolean;
  error: string | null;
  hasMore: boolean;
}

interface UseSearchOptions {
  debounceMs?: number;
  limit?: number;
}

interface UseSearchReturn extends SearchState {
  // Search functions
  search: (query: string, filters?: SearchFilters) => Promise<void>;
  searchMore: () => Promise<void>;
  searchUsers: (query: string) => Promise<UserSearchResult[]>;
  searchGroups: (query: string) => Promise<GroupSearchResult[]>;
  searchMessages: (query: string) => Promise<MessageSearchResult[]>;
  searchForums: (query: string) => Promise<ForumSearchResult[]>;
  searchPosts: (query: string) => Promise<PostSearchResult[]>;
  
  // Suggestion functions
  loadSuggestions: (query: string) => Promise<void>;
  loadRecentSearches: () => Promise<void>;
  loadTrendingSearches: () => Promise<void>;
  clearRecentSearches: () => Promise<void>;
  
  // State management
  setQuery: (query: string) => void;
  clearResults: () => void;
}

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const { limit = 20 } = options;
  
  const [state, setState] = useState<SearchState>({
    query: '',
    results: [],
    totals: null,
    suggestions: [],
    recentSearches: [],
    trendingSearches: [],
    isSearching: false,
    isLoadingSuggestions: false,
    error: null,
    hasMore: false,
  });

  const offsetRef = useRef(0);
  const currentFiltersRef = useRef<SearchFilters | undefined>();
  const searchAbortRef = useRef<AbortController | null>(null);

  // ==================== SEARCH FUNCTIONS ====================

  const search = useCallback(async (query: string, filters?: SearchFilters) => {
    if (!query.trim()) {
      setState(prev => ({ ...prev, results: [], totals: null, hasMore: false }));
      return;
    }

    // Cancel previous search
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
    }
    searchAbortRef.current = new AbortController();

    setState(prev => ({ ...prev, query, isSearching: true, error: null }));
    offsetRef.current = 0;
    currentFiltersRef.current = filters;

    try {
      const response = await searchService.globalSearch(query, { limit, offset: 0, filters });
      
      setState(prev => ({
        ...prev,
        results: response.results,
        totals: response.totals,
        isSearching: false,
        hasMore: response.hasMore,
      }));
      
      offsetRef.current = response.results.length;
      
      // Save to search history
      await searchService.saveSearchToHistory(query).catch(() => {});
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setState(prev => ({
          ...prev,
          isSearching: false,
          error: error.message || 'Search failed',
        }));
      }
    }
  }, [limit]);

  const searchMore = useCallback(async () => {
    if (state.isSearching || !state.hasMore || !state.query) return;

    setState(prev => ({ ...prev, isSearching: true }));

    try {
      const response = await searchService.globalSearch(state.query, {
        limit,
        offset: offsetRef.current,
        filters: currentFiltersRef.current,
      });

      setState(prev => ({
        ...prev,
        results: [...prev.results, ...response.results],
        isSearching: false,
        hasMore: response.hasMore,
      }));

      offsetRef.current += response.results.length;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isSearching: false,
        error: error.message || 'Failed to load more results',
      }));
    }
  }, [limit, state.query, state.isSearching, state.hasMore]);

  const searchUsers = useCallback(async (query: string): Promise<UserSearchResult[]> => {
    try {
      return await searchService.searchUsers(query, { limit });
    } catch (error) {
      console.error('User search failed:', error);
      return [];
    }
  }, [limit]);

  const searchGroups = useCallback(async (query: string): Promise<GroupSearchResult[]> => {
    try {
      return await searchService.searchGroups(query, { limit });
    } catch (error) {
      console.error('Group search failed:', error);
      return [];
    }
  }, [limit]);

  const searchMessages = useCallback(async (query: string): Promise<MessageSearchResult[]> => {
    try {
      return await searchService.searchMessages(query, { limit });
    } catch (error) {
      console.error('Message search failed:', error);
      return [];
    }
  }, [limit]);

  const searchForums = useCallback(async (query: string): Promise<ForumSearchResult[]> => {
    try {
      return await searchService.searchForums(query, { limit });
    } catch (error) {
      console.error('Forum search failed:', error);
      return [];
    }
  }, [limit]);

  const searchPosts = useCallback(async (query: string): Promise<PostSearchResult[]> => {
    try {
      return await searchService.searchPosts(query, { limit });
    } catch (error) {
      console.error('Post search failed:', error);
      return [];
    }
  }, [limit]);

  // ==================== SUGGESTION FUNCTIONS ====================

  const loadSuggestions = useCallback(async (query: string) => {
    if (!query.trim()) {
      setState(prev => ({ ...prev, suggestions: [] }));
      return;
    }

    setState(prev => ({ ...prev, isLoadingSuggestions: true }));

    try {
      const suggestions = await searchService.getSearchSuggestions(query);
      setState(prev => ({ ...prev, suggestions, isLoadingSuggestions: false }));
    } catch (error) {
      setState(prev => ({ ...prev, isLoadingSuggestions: false }));
    }
  }, []);

  const loadRecentSearches = useCallback(async () => {
    try {
      const recentSearches = await searchService.getRecentSearches();
      setState(prev => ({ ...prev, recentSearches }));
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  }, []);

  const loadTrendingSearches = useCallback(async () => {
    try {
      const trendingSearches = await searchService.getTrendingSearches();
      setState(prev => ({ ...prev, trendingSearches }));
    } catch (error) {
      console.error('Failed to load trending searches:', error);
    }
  }, []);

  const clearRecentSearches = useCallback(async () => {
    try {
      await searchService.clearRecentSearches();
      setState(prev => ({ ...prev, recentSearches: [] }));
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
    }
  }, []);

  // ==================== STATE MANAGEMENT ====================

  const setQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, query }));
  }, []);

  const clearResults = useCallback(() => {
    setState(prev => ({
      ...prev,
      results: [],
      totals: null,
      hasMore: false,
      error: null,
    }));
    offsetRef.current = 0;
  }, []);

  return {
    ...state,
    search,
    searchMore,
    searchUsers,
    searchGroups,
    searchMessages,
    searchForums,
    searchPosts,
    loadSuggestions,
    loadRecentSearches,
    loadTrendingSearches,
    clearRecentSearches,
    setQuery,
    clearResults,
  };
}

export default useSearch;
