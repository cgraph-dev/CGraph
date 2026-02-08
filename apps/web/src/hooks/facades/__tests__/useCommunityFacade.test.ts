/**
 * useCommunityFacade Unit Tests
 *
 * Tests for the community composition facade hook.
 * Validates aggregation of forums, groups, and announcements stores.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCommunityFacade } from '../useCommunityFacade';

// Mock stores
const mockForumState: Record<string, unknown> = {
  forums: [
    { id: 'f-1', name: 'General', slug: 'general' },
    { id: 'f-2', name: 'Tech', slug: 'tech' },
  ],
  currentForum: null,
  posts: [],
  currentPost: null,
  isLoadingForums: false,
  isLoadingPosts: false,
  fetchForums: vi.fn(),
  fetchPosts: vi.fn(),
};

const mockGroupState: Record<string, unknown> = {
  groups: [{ id: 'g-1', name: 'Study Group' }],
  activeGroupId: null,
  activeChannelId: null,
  isLoadingGroups: false,
  fetchGroups: vi.fn(),
  setActiveGroup: vi.fn(),
  setActiveChannel: vi.fn(),
};

const mockAnnouncementState: Record<string, unknown> = {
  announcements: [{ id: 'ann-1', title: 'Welcome!', content: 'New forum version' }],
  fetchAnnouncements: vi.fn(),
};

vi.mock('@/modules/forums/store', () => ({
  useForumStore: vi.fn((selector: (s: typeof mockForumState) => unknown) =>
    selector(mockForumState)
  ),
  useAnnouncementStore: vi.fn((selector: (s: typeof mockAnnouncementState) => unknown) =>
    selector(mockAnnouncementState)
  ),
}));

vi.mock('@/modules/groups/store', () => ({
  useGroupStore: vi.fn((selector: (s: typeof mockGroupState) => unknown) =>
    selector(mockGroupState)
  ),
}));

describe('useCommunityFacade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('forums', () => {
    it('exposes forums list', () => {
      const { result } = renderHook(() => useCommunityFacade());
      expect(result.current.forums).toHaveLength(2);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.current.forums[0] as any).name).toBe('General');
    });

    it('exposes currentForum as null initially', () => {
      const { result } = renderHook(() => useCommunityFacade());
      expect(result.current.currentForum).toBeNull();
    });

    it('exposes posts list', () => {
      const { result } = renderHook(() => useCommunityFacade());
      expect(result.current.posts).toEqual([]);
    });

    it('exposes loading states', () => {
      const { result } = renderHook(() => useCommunityFacade());
      expect(result.current.isLoadingForums).toBe(false);
      expect(result.current.isLoadingPosts).toBe(false);
    });
  });

  describe('groups', () => {
    it('exposes groups list', () => {
      const { result } = renderHook(() => useCommunityFacade());
      expect(result.current.groups).toHaveLength(1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.current.groups[0] as any).name).toBe('Study Group');
    });

    it('exposes activeGroupId', () => {
      const { result } = renderHook(() => useCommunityFacade());
      expect(result.current.activeGroupId).toBeNull();
    });

    it('exposes activeChannelId', () => {
      const { result } = renderHook(() => useCommunityFacade());
      expect(result.current.activeChannelId).toBeNull();
    });

    it('exposes isLoadingGroups', () => {
      const { result } = renderHook(() => useCommunityFacade());
      expect(result.current.isLoadingGroups).toBe(false);
    });
  });

  describe('announcements', () => {
    it('exposes announcements list', () => {
      const { result } = renderHook(() => useCommunityFacade());
      expect(result.current.announcements).toHaveLength(1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.current.announcements[0] as any).title).toBe('Welcome!');
    });
  });

  describe('actions', () => {
    it('exposes all forum actions', () => {
      const { result } = renderHook(() => useCommunityFacade());
      expect(typeof result.current.fetchForums).toBe('function');
      expect(typeof result.current.fetchPosts).toBe('function');
    });

    it('exposes all group actions', () => {
      const { result } = renderHook(() => useCommunityFacade());
      expect(typeof result.current.fetchGroups).toBe('function');
      expect(typeof result.current.setActiveGroup).toBe('function');
      expect(typeof result.current.setActiveChannel).toBe('function');
    });

    it('exposes announcement actions', () => {
      const { result } = renderHook(() => useCommunityFacade());
      expect(typeof result.current.fetchAnnouncements).toBe('function');
    });
  });

  describe('interface completeness', () => {
    it('returns all expected keys', () => {
      const { result } = renderHook(() => useCommunityFacade());
      const keys = Object.keys(result.current);

      const expectedKeys = [
        'forums',
        'currentForum',
        'posts',
        'currentPost',
        'isLoadingForums',
        'isLoadingPosts',
        'fetchForums',
        'fetchPosts',
        'groups',
        'activeGroupId',
        'activeChannelId',
        'isLoadingGroups',
        'fetchGroups',
        'setActiveGroup',
        'setActiveChannel',
        'announcements',
        'fetchAnnouncements',
      ];

      for (const key of expectedKeys) {
        expect(keys).toContain(key);
      }
    });
  });
});
