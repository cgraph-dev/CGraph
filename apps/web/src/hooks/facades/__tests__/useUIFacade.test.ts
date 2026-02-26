// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/**
 * useUIFacade Unit Tests
 *
 * Tests for the UI utilities composition facade hook.
 * Validates aggregation of notifications, search, and calendar stores.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUIFacade } from '../useUIFacade';

// ── Mock stores ────────────────────────────────────────────────────

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
  useNotificationStore: vi.fn((sel: (s: typeof mockNotificationState) => unknown) =>
    sel(mockNotificationState)
  ),
}));

vi.mock('@/modules/search/store', () => ({
  useSearchStore: vi.fn((sel: (s: typeof mockSearchState) => unknown) => sel(mockSearchState)),
}));

vi.mock('@/modules/settings/store', () => ({
  useCalendarStore: vi.fn((sel: (s: typeof mockCalendarState) => unknown) =>
    sel(mockCalendarState)
  ),
}));

function resetState() {
  mockNotificationState.notifications = [
    { id: 'n-1', type: 'mention', message: 'User mentioned you', read: false },
    { id: 'n-2', type: 'friend_request', message: 'New request', read: true },
  ];
  mockNotificationState.unreadCount = 3;
  mockNotificationState.isLoading = false;
  mockSearchState.query = '';
  mockSearchState.users = [];
  mockSearchState.groups = [];
  mockSearchState.forums = [];
  mockSearchState.posts = [];
  mockSearchState.messages = [];
  mockSearchState.isLoading = false;
  mockCalendarState.events = [{ id: 'e-1', title: 'Team Meeting', date: '2026-02-01' }];
}

describe('useUIFacade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetState();
  });

  // ── Notifications ────────────────────────────────────────────────

  it('exposes notifications list', () => {
    const { result } = renderHook(() => useUIFacade());
    expect(result.current.notifications).toHaveLength(2);
    expect((result.current.notifications[0] as Record<string, unknown>).type).toBe('mention');
  });

  it('exposes empty notifications', () => {
    mockNotificationState.notifications = [];
    const { result } = renderHook(() => useUIFacade());
    expect(result.current.notifications).toEqual([]);
  });

  it('exposes unreadCount', () => {
    const { result } = renderHook(() => useUIFacade());
    expect(result.current.unreadCount).toBe(3);
  });

  it('exposes zero unreadCount', () => {
    mockNotificationState.unreadCount = 0;
    const { result } = renderHook(() => useUIFacade());
    expect(result.current.unreadCount).toBe(0);
  });

  it('exposes isLoadingNotifications false by default', () => {
    const { result } = renderHook(() => useUIFacade());
    expect(result.current.isLoadingNotifications).toBe(false);
  });

  it('exposes isLoadingNotifications true', () => {
    mockNotificationState.isLoading = true;
    const { result } = renderHook(() => useUIFacade());
    expect(result.current.isLoadingNotifications).toBe(true);
  });

  // ── Search ───────────────────────────────────────────────────────

  it('exposes empty searchQuery by default', () => {
    const { result } = renderHook(() => useUIFacade());
    expect(result.current.searchQuery).toBe('');
  });

  it('exposes all search result arrays as empty by default', () => {
    const { result } = renderHook(() => useUIFacade());
    expect(result.current.searchUsers).toEqual([]);
    expect(result.current.searchGroups).toEqual([]);
    expect(result.current.searchForums).toEqual([]);
    expect(result.current.searchPosts).toEqual([]);
    expect(result.current.searchMessages).toEqual([]);
  });

  it('exposes isSearching false by default', () => {
    const { result } = renderHook(() => useUIFacade());
    expect(result.current.isSearching).toBe(false);
  });

  it('exposes isSearching true when loading', () => {
    mockSearchState.isLoading = true;
    const { result } = renderHook(() => useUIFacade());
    expect(result.current.isSearching).toBe(true);
  });

  it('exposes populated search results', () => {
    mockSearchState.users = [{ id: 'u-1', username: 'alice' }];
    mockSearchState.groups = [{ id: 'g-1', name: 'Coders' }];
    mockSearchState.query = 'al';

    const { result } = renderHook(() => useUIFacade());
    expect(result.current.searchUsers).toHaveLength(1);
    expect(result.current.searchGroups).toHaveLength(1);
    expect(result.current.searchQuery).toBe('al');
  });

  // ── Calendar ─────────────────────────────────────────────────────

  it('exposes events from calendar store', () => {
    const { result } = renderHook(() => useUIFacade());
    expect(result.current.events).toHaveLength(1);
    expect((result.current.events[0] as Record<string, unknown>).title).toBe('Team Meeting');
  });

  it('exposes empty events', () => {
    mockCalendarState.events = [];
    const { result } = renderHook(() => useUIFacade());
    expect(result.current.events).toEqual([]);
  });

  // ── Action delegation ────────────────────────────────────────────

  it('fetchNotifications delegates with page arg', () => {
    const { result } = renderHook(() => useUIFacade());
    result.current.fetchNotifications(2);
    expect(mockNotificationState.fetchNotifications).toHaveBeenCalledWith(2);
  });

  it('markAsRead delegates with notificationId', () => {
    const { result } = renderHook(() => useUIFacade());
    result.current.markAsRead('n-1');
    expect(mockNotificationState.markAsRead).toHaveBeenCalledWith('n-1');
  });

  it('markAllAsRead delegates to notification store', () => {
    const { result } = renderHook(() => useUIFacade());
    result.current.markAllAsRead();
    expect(mockNotificationState.markAllAsRead).toHaveBeenCalledOnce();
  });

  it('setSearchQuery delegates with query string', () => {
    const { result } = renderHook(() => useUIFacade());
    result.current.setSearchQuery('hello');
    expect(mockSearchState.setQuery).toHaveBeenCalledWith('hello');
  });

  it('executeSearch delegates with query string', () => {
    const { result } = renderHook(() => useUIFacade());
    result.current.executeSearch('test query');
    expect(mockSearchState.search).toHaveBeenCalledWith('test query');
  });

  it('clearSearch delegates to search store', () => {
    const { result } = renderHook(() => useUIFacade());
    result.current.clearSearch();
    expect(mockSearchState.clearResults).toHaveBeenCalledOnce();
  });

  it('fetchEvents delegates to calendar store', () => {
    const { result } = renderHook(() => useUIFacade());
    result.current.fetchEvents();
    expect(mockCalendarState.fetchEvents).toHaveBeenCalledOnce();
  });

  // ── Interface completeness ───────────────────────────────────────

  it('returns all 18 expected keys', () => {
    const { result } = renderHook(() => useUIFacade());
    const keys = Object.keys(result.current);

    const expected = [
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
    for (const k of expected) expect(keys).toContain(k);
    expect(keys).toHaveLength(expected.length);
  });

  it('all action properties are functions', () => {
    const { result } = renderHook(() => useUIFacade());
    const actions = [
      'fetchNotifications',
      'markAsRead',
      'markAllAsRead',
      'setSearchQuery',
      'executeSearch',
      'clearSearch',
      'fetchEvents',
    ] as const;
    for (const a of actions) {
      expect(typeof result.current[a]).toBe('function');
    }
  });
});
