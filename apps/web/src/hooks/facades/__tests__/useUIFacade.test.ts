/**
 * useUIFacade Unit Tests
 *
 * Tests for the UI utilities composition facade hook.
 * Validates aggregation of notifications, search, and calendar stores.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUIFacade } from '../useUIFacade';

// Mock stores
const mockNotificationState: Record<string, unknown> = {
  notifications: [
    { id: 'n-1', type: 'mention', message: 'User mentioned you', read: false },
    { id: 'n-2', type: 'friend_request', message: 'New request', read: true },
  ],
  unreadCount: 3,
  isLoading: false,
  fetchNotifications: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
};

const mockSearchState: Record<string, unknown> = {
  query: '',
  users: [],
  groups: [],
  forums: [],
  posts: [],
  messages: [],
  isLoading: false,
  setQuery: vi.fn(),
  search: vi.fn(),
  clearResults: vi.fn(),
};

const mockCalendarState: Record<string, unknown> = {
  events: [{ id: 'e-1', title: 'Team Meeting', date: '2026-02-01' }],
  fetchEvents: vi.fn(),
};

vi.mock('@/modules/social/store', () => ({
  useNotificationStore: vi.fn((selector: (s: typeof mockNotificationState) => unknown) =>
    selector(mockNotificationState)
  ),
}));

vi.mock('@/modules/search/store', () => ({
  useSearchStore: vi.fn((selector: (s: typeof mockSearchState) => unknown) =>
    selector(mockSearchState)
  ),
}));

vi.mock('@/modules/settings/store', () => ({
  useCalendarStore: vi.fn((selector: (s: typeof mockCalendarState) => unknown) =>
    selector(mockCalendarState)
  ),
}));

describe('useUIFacade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('notifications', () => {
    it('exposes notifications list', () => {
      const { result } = renderHook(() => useUIFacade());
      expect(result.current.notifications).toHaveLength(2);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.current.notifications[0] as any).type).toBe('mention');
    });

    it('exposes unreadCount', () => {
      const { result } = renderHook(() => useUIFacade());
      expect(result.current.unreadCount).toBe(3);
    });

    it('exposes isLoadingNotifications', () => {
      const { result } = renderHook(() => useUIFacade());
      expect(result.current.isLoadingNotifications).toBe(false);
    });

    it('exposes notification actions', () => {
      const { result } = renderHook(() => useUIFacade());
      expect(typeof result.current.fetchNotifications).toBe('function');
      expect(typeof result.current.markAsRead).toBe('function');
      expect(typeof result.current.markAllAsRead).toBe('function');
    });
  });

  describe('search', () => {
    it('exposes searchQuery as empty string', () => {
      const { result } = renderHook(() => useUIFacade());
      expect(result.current.searchQuery).toBe('');
    });

    it('exposes empty search result arrays', () => {
      const { result } = renderHook(() => useUIFacade());
      expect(result.current.searchUsers).toEqual([]);
      expect(result.current.searchGroups).toEqual([]);
      expect(result.current.searchForums).toEqual([]);
      expect(result.current.searchPosts).toEqual([]);
      expect(result.current.searchMessages).toEqual([]);
    });

    it('exposes isSearching', () => {
      const { result } = renderHook(() => useUIFacade());
      expect(result.current.isSearching).toBe(false);
    });

    it('exposes search actions', () => {
      const { result } = renderHook(() => useUIFacade());
      expect(typeof result.current.setSearchQuery).toBe('function');
      expect(typeof result.current.executeSearch).toBe('function');
      expect(typeof result.current.clearSearch).toBe('function');
    });

    it('exposes search results when populated', () => {
      mockSearchState.users = [
        { id: 'u-1', username: 'alice' },
        { id: 'u-2', username: 'bob' },
      ];
      mockSearchState.query = 'al';

      const { result } = renderHook(() => useUIFacade());
      expect(result.current.searchUsers).toHaveLength(2);
      expect(result.current.searchQuery).toBe('al');

      // Restore
      mockSearchState.users = [];
      mockSearchState.query = '';
    });
  });

  describe('calendar', () => {
    it('exposes events list', () => {
      const { result } = renderHook(() => useUIFacade());
      expect(result.current.events).toHaveLength(1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.current.events[0] as any).title).toBe('Team Meeting');
    });

    it('exposes fetchEvents', () => {
      const { result } = renderHook(() => useUIFacade());
      expect(typeof result.current.fetchEvents).toBe('function');
    });
  });

  describe('interface completeness', () => {
    it('returns all expected keys', () => {
      const { result } = renderHook(() => useUIFacade());
      const keys = Object.keys(result.current);

      const expectedKeys = [
        'notifications',
        'unreadCount',
        'isLoadingNotifications',
        'fetchNotifications',
        'markAsRead',
        'markAllAsRead',
        'searchQuery',
        'searchUsers',
        'searchGroups',
        'searchForums',
        'searchPosts',
        'searchMessages',
        'isSearching',
        'setSearchQuery',
        'executeSearch',
        'clearSearch',
        'events',
        'fetchEvents',
      ];

      for (const key of expectedKeys) {
        expect(keys).toContain(key);
      }
    });
  });
});
