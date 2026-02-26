/**
 * useSearchHistory Hook
 *
 * Manages search history in localStorage.
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'forumSearchHistory';
const MAX_HISTORY_ITEMS = 10;

/**
 * unknown for the forums module.
 */
/**
 * Hook for managing search history.
 */
export function useSearchHistory() {
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Load search history from localStorage on mount
  useEffect(() => {
    const history = localStorage.getItem(STORAGE_KEY);
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch {
        setSearchHistory([]);
      }
    }
  }, []);

  /**
   * Add a search query to history
   */
  const addToHistory = useCallback((searchQuery: string) => {
    setSearchHistory((prev) => {
      const newHistory = [searchQuery, ...prev.filter((h) => h !== searchQuery)].slice(
        0,
        MAX_HISTORY_ITEMS
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  /**
   * Generate suggestions from history
   */
  const getSuggestions = useCallback(
    (partial: string, limit = 5): string[] => {
      if (!partial) return searchHistory.slice(0, limit);
      return searchHistory
        .filter((h) => h.toLowerCase().includes(partial.toLowerCase()))
        .slice(0, limit);
    },
    [searchHistory]
  );

  /**
   * Clear all history
   */
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    searchHistory,
    addToHistory,
    getSuggestions,
    clearHistory,
  };
}
