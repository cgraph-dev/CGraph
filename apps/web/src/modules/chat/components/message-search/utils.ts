/**
 * Message Search Utilities
 *
 * Helper functions for message search
 */

import type { MessageSearchResult } from './types';

/**
 * LocalStorage key for recent searches
 */
export const RECENT_SEARCHES_KEY = 'cgraph-message-search-recent';

/**
 * Maximum recent searches to store
 */
export const MAX_RECENT_SEARCHES = 5;

/**
 * Search debounce delay in ms
 */
export const SEARCH_DEBOUNCE_MS = 300;

/**
 * Highlight search term in content
 */
export function highlightContent(content: string, searchTerm: string): string {
  if (!searchTerm.trim()) return content;
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return content.replace(
    regex,
    '<mark class="bg-yellow-500/30 text-yellow-200 px-0.5 rounded">$1</mark>'
  );
}

/**
 * Generate mock results for demo/fallback
 */
export function generateMockResults(
  searchQuery: string,
  highlightFn: typeof highlightContent
): MessageSearchResult[] {
  return [
    {
      id: 'mock-1',
      conversationId: 'conv-1',
      conversationName: 'General Chat',
      senderId: 'user-1',
      senderUsername: 'alice',
      content: `Here's what I found about ${searchQuery}...`,
      highlightedContent: highlightFn(`Here's what I found about ${searchQuery}...`, searchQuery),
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      messageType: 'text',
    },
    {
      id: 'mock-2',
      conversationId: 'conv-2',
      conversationName: 'Dev Team',
      senderId: 'user-2',
      senderUsername: 'bob',
      content: `Did you see the latest update on ${searchQuery}?`,
      highlightedContent: highlightFn(
        `Did you see the latest update on ${searchQuery}?`,
        searchQuery
      ),
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      messageType: 'text',
    },
  ];
}

/**
 * Load recent searches from localStorage
 */
export function loadRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore
  }
  return [];
}

/**
 * Save a search term to recent searches
 */
export function saveRecentSearch(term: string, current: string[]): string[] {
  if (!term.trim()) return current;
  const updated = [term, ...current.filter((s) => s !== term)].slice(0, MAX_RECENT_SEARCHES);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  return updated;
}
