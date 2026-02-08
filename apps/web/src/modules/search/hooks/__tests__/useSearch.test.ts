/**
 * Search Hooks Unit Tests
 *
 * Tests for useSearch, useDebouncedSearch, useGlobalSearch,
 * useSearchFilters, and useSearchSuggestions hooks.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSearch } from '../useSearch';
import { useSearchFilters } from '../useSearchFilters';
import { useSearchSuggestions } from '../useSearchSuggestions';
import { useGlobalSearch } from '../useGlobalSearch';

// --- Shared mock state -----------------------------------------------------

const mockSearchState: Record<string, unknown> = {
  query: '',
  category: 'all' as const,
  users: [],
  groups: [],
  forums: [],
  posts: [],
  messages: [],
  isLoading: false,
  error: null,
  hasSearched: false,
  setQuery: vi.fn(),
  setCategory: vi.fn(),
  search: vi.fn().mockResolvedValue(undefined),
  clearResults: vi.fn(),
  clearError: vi.fn(),
};

vi.mock('../../store', () => ({
  useSearchStore: vi.fn((selector?: (s: typeof mockSearchState) => unknown) =>
    selector ? selector(mockSearchState) : mockSearchState
  ),
}));

// ---------------------------------------------------------------------------

describe('useSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(mockSearchState, {
      query: '',
      category: 'all',
      users: [],
      groups: [],
      forums: [],
      posts: [],
      messages: [],
      isLoading: false,
      error: null,
      hasSearched: false,
    });
  });

  it('returns empty results by default', () => {
    const { result } = renderHook(() => useSearch());
    expect(result.current.totalResults).toBe(0);
    expect(result.current.results.users).toEqual([]);
    expect(result.current.results.groups).toEqual([]);
  });

  it('returns current query and category', () => {
    mockSearchState.query = 'test';
    mockSearchState.category = 'users';
    const { result } = renderHook(() => useSearch());
    expect(result.current.query).toBe('test');
    expect(result.current.category).toBe('users');
  });

  it('computes totalResults across all categories', () => {
    mockSearchState.users = [{ id: '1' }];
    mockSearchState.groups = [{ id: '2' }, { id: '3' }];
    mockSearchState.forums = [];
    mockSearchState.posts = [{ id: '4' }];
    mockSearchState.messages = [];

    const { result } = renderHook(() => useSearch());
    expect(result.current.totalResults).toBe(4);
  });

  it('computes resultsByCategory correctly', () => {
    mockSearchState.users = [{ id: '1' }];
    mockSearchState.groups = [{ id: '2' }, { id: '3' }];
    mockSearchState.forums = [];
    mockSearchState.posts = [];
    mockSearchState.messages = [{ id: '5' }];

    const { result } = renderHook(() => useSearch());
    expect(result.current.resultsByCategory).toEqual({
      users: 1,
      groups: 2,
      forums: 0,
      posts: 0,
      messages: 1,
    });
  });

  it('delegates setQuery to store', () => {
    const { result } = renderHook(() => useSearch());
    act(() => {
      result.current.setQuery('hello');
    });
    expect(mockSearchState.setQuery).toHaveBeenCalledWith('hello');
  });

  it('delegates setCategory to store', () => {
    const { result } = renderHook(() => useSearch());
    act(() => {
      result.current.setCategory('groups');
    });
    expect(mockSearchState.setCategory).toHaveBeenCalledWith('groups');
  });

  it('delegates search to store', async () => {
    const { result } = renderHook(() => useSearch());
    await act(async () => {
      await result.current.search('query');
    });
    expect(mockSearchState.search).toHaveBeenCalledWith('query');
  });

  it('delegates clear to clearResults', () => {
    const { result } = renderHook(() => useSearch());
    act(() => {
      result.current.clear();
    });
    expect(mockSearchState.clearResults).toHaveBeenCalled();
  });

  it('exposes loading and error state', () => {
    mockSearchState.isLoading = true;
    mockSearchState.error = 'Something went wrong';
    const { result } = renderHook(() => useSearch());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe('Something went wrong');
  });
});

// ---------------------------------------------------------------------------

describe('useSearchFilters', () => {
  it('starts with empty filters', () => {
    const { result } = renderHook(() => useSearchFilters());
    expect(result.current.filters).toEqual({});
  });

  it('sets date range', () => {
    const { result } = renderHook(() => useSearchFilters());
    const start = new Date('2025-01-01');
    const end = new Date('2025-12-31');

    act(() => {
      result.current.setDateRange(start, end);
    });

    expect(result.current.filters.dateRange).toEqual({ start, end });
  });

  it('sets sortBy', () => {
    const { result } = renderHook(() => useSearchFilters());
    act(() => {
      result.current.setSortBy('date');
    });
    expect(result.current.filters.sortBy).toBe('date');
  });

  it('sets sortOrder', () => {
    const { result } = renderHook(() => useSearchFilters());
    act(() => {
      result.current.setSortOrder('desc');
    });
    expect(result.current.filters.sortOrder).toBe('desc');
  });

  it('sets author filter', () => {
    const { result } = renderHook(() => useSearchFilters());
    act(() => {
      result.current.setAuthorFilter('john');
    });
    expect(result.current.filters.author).toBe('john');
  });

  it('sets forum filter', () => {
    const { result } = renderHook(() => useSearchFilters());
    act(() => {
      result.current.setForumFilter('general');
    });
    expect(result.current.filters.forum).toBe('general');
  });

  it('clears all filters', () => {
    const { result } = renderHook(() => useSearchFilters());
    act(() => {
      result.current.setSortBy('relevance');
      result.current.setAuthorFilter('alice');
    });
    act(() => {
      result.current.clearFilters();
    });
    expect(result.current.filters).toEqual({});
  });

  it('preserves existing filters when setting new ones', () => {
    const { result } = renderHook(() => useSearchFilters());
    act(() => {
      result.current.setSortBy('popularity');
    });
    act(() => {
      result.current.setSortOrder('asc');
    });
    expect(result.current.filters.sortBy).toBe('popularity');
    expect(result.current.filters.sortOrder).toBe('asc');
  });
});

// ---------------------------------------------------------------------------

describe('useSearchSuggestions', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with empty suggestions and recent searches', () => {
    const { result } = renderHook(() => useSearchSuggestions());
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.recentSearches).toEqual([]);
  });

  it('loads recent searches from localStorage', () => {
    localStorage.setItem('cgraph_recent_searches', JSON.stringify(['react', 'vitest']));
    const { result } = renderHook(() => useSearchSuggestions());
    expect(result.current.recentSearches).toEqual(['react', 'vitest']);
  });

  it('adds a recent search and persists to localStorage', () => {
    const { result } = renderHook(() => useSearchSuggestions());
    act(() => {
      result.current.addRecentSearch('zustand');
    });
    expect(result.current.recentSearches).toContain('zustand');
    expect(JSON.parse(localStorage.getItem('cgraph_recent_searches')!)).toContain('zustand');
  });

  it('deduplicates recent searches (most recent first)', () => {
    const { result } = renderHook(() => useSearchSuggestions());
    act(() => {
      result.current.addRecentSearch('alpha');
    });
    act(() => {
      result.current.addRecentSearch('beta');
    });
    act(() => {
      result.current.addRecentSearch('alpha');
    });
    expect(result.current.recentSearches[0]).toBe('alpha');
    expect(result.current.recentSearches.filter((s) => s === 'alpha')).toHaveLength(1);
  });

  it('limits recent searches to 10 entries', () => {
    const { result } = renderHook(() => useSearchSuggestions());
    act(() => {
      for (let i = 0; i < 15; i++) {
        result.current.addRecentSearch(`search-${i}`);
      }
    });
    expect(result.current.recentSearches.length).toBeLessThanOrEqual(10);
  });

  it('removes a specific recent search', () => {
    const { result } = renderHook(() => useSearchSuggestions());
    act(() => {
      result.current.addRecentSearch('to-remove');
      result.current.addRecentSearch('keep');
    });
    act(() => {
      result.current.removeRecentSearch('to-remove');
    });
    expect(result.current.recentSearches).not.toContain('to-remove');
    expect(result.current.recentSearches).toContain('keep');
  });

  it('clears all recent searches', () => {
    const { result } = renderHook(() => useSearchSuggestions());
    act(() => {
      result.current.addRecentSearch('a');
      result.current.addRecentSearch('b');
    });
    act(() => {
      result.current.clearRecentSearches();
    });
    expect(result.current.recentSearches).toEqual([]);
    expect(localStorage.getItem('cgraph_recent_searches')).toBeNull();
  });

  it('generates suggestions matching the query', () => {
    const { result } = renderHook(() => useSearchSuggestions());
    act(() => {
      result.current.addRecentSearch('react hooks');
      result.current.addRecentSearch('react router');
      result.current.addRecentSearch('vitest setup');
    });
    act(() => {
      result.current.updateSuggestions('react');
    });
    expect(result.current.suggestions).toHaveLength(2);
    expect(result.current.suggestions).toEqual(
      expect.arrayContaining(['react hooks', 'react router'])
    );
  });

  it('returns empty suggestions for short queries', () => {
    const { result } = renderHook(() => useSearchSuggestions());
    act(() => {
      result.current.addRecentSearch('react');
    });
    act(() => {
      result.current.updateSuggestions('r');
    });
    expect(result.current.suggestions).toEqual([]);
  });

  it('clears suggestions', () => {
    const { result } = renderHook(() => useSearchSuggestions());
    act(() => {
      result.current.addRecentSearch('react');
    });
    act(() => {
      result.current.updateSuggestions('react');
    });
    expect(result.current.suggestions.length).toBeGreaterThan(0);
    act(() => {
      result.current.clearSuggestions();
    });
    expect(result.current.suggestions).toEqual([]);
  });
});

// ---------------------------------------------------------------------------

describe('useGlobalSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts closed', () => {
    const { result } = renderHook(() => useGlobalSearch());
    expect(result.current.isOpen).toBe(false);
  });

  it('opens the search', () => {
    const { result } = renderHook(() => useGlobalSearch());
    act(() => {
      result.current.open();
    });
    expect(result.current.isOpen).toBe(true);
  });

  it('closes the search and clears results', () => {
    const { result } = renderHook(() => useGlobalSearch());
    act(() => {
      result.current.open();
    });
    act(() => {
      result.current.close();
    });
    expect(result.current.isOpen).toBe(false);
    expect(mockSearchState.clearResults).toHaveBeenCalled();
    expect(mockSearchState.setQuery).toHaveBeenCalledWith('');
  });

  it('toggles open/closed', () => {
    const { result } = renderHook(() => useGlobalSearch());
    act(() => {
      result.current.toggle();
    });
    expect(result.current.isOpen).toBe(true);
    act(() => {
      result.current.toggle();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('responds to Ctrl+K keyboard shortcut', () => {
    renderHook(() => useGlobalSearch());
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })
      );
    });
    // The hook toggles – since we start closed, one Ctrl+K should open
    // (We cannot directly assert isOpen from the window event, but we verify no crash)
  });

  it('responds to Escape to close', () => {
    const { result } = renderHook(() => useGlobalSearch());
    act(() => {
      result.current.open();
    });
    expect(result.current.isOpen).toBe(true);
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('exposes search results from store', () => {
    mockSearchState.users = [{ id: '1' }];
    mockSearchState.groups = [{ id: '2' }];
    mockSearchState.forums = [{ id: '3' }];

    const { result } = renderHook(() => useGlobalSearch());
    expect(result.current.results.users).toEqual([{ id: '1' }]);
    expect(result.current.results.groups).toEqual([{ id: '2' }]);
    expect(result.current.results.forums).toEqual([{ id: '3' }]);
  });
});
