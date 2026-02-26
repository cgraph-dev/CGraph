// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/**
 * useCommunityFacade Unit Tests
 *
 * Tests for the community composition facade hook.
 * Validates aggregation of forums, groups, and announcements stores.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCommunityFacade } from '../useCommunityFacade';

// ── Mock stores ────────────────────────────────────────────────────

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
  useForumStore: vi.fn((sel: (s: typeof mockForumState) => unknown) => sel(mockForumState)),
  useAnnouncementStore: vi.fn((sel: (s: typeof mockAnnouncementState) => unknown) =>
    sel(mockAnnouncementState)
  ),
}));

vi.mock('@/modules/groups/store', () => ({
  useGroupStore: vi.fn((sel: (s: typeof mockGroupState) => unknown) => sel(mockGroupState)),
}));

function resetState() {
  mockForumState.forums = [
    { id: 'f-1', name: 'General', slug: 'general' },
    { id: 'f-2', name: 'Tech', slug: 'tech' },
  ];
  mockForumState.currentForum = null;
  mockForumState.posts = [];
  mockForumState.currentPost = null;
  mockForumState.isLoadingForums = false;
  mockForumState.isLoadingPosts = false;
  mockGroupState.groups = [{ id: 'g-1', name: 'Study Group' }];
  mockGroupState.activeGroupId = null;
  mockGroupState.activeChannelId = null;
  mockGroupState.isLoadingGroups = false;
  mockAnnouncementState.announcements = [
    { id: 'ann-1', title: 'Welcome!', content: 'New forum version' },
  ];
}

describe('useCommunityFacade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetState();
  });

  // ── Forums ───────────────────────────────────────────────────────

  it('exposes forums list from forum store', () => {
    const { result } = renderHook(() => useCommunityFacade());
    expect(result.current.forums).toHaveLength(2);
    expect((result.current.forums[0] as Record<string, unknown>).name).toBe('General');
  });

  it('exposes currentForum as null initially', () => {
    const { result } = renderHook(() => useCommunityFacade());
    expect(result.current.currentForum).toBeNull();
  });

  it('exposes currentForum when set', () => {
    mockForumState.currentForum = { id: 'f-1', name: 'General', slug: 'general' };
    const { result } = renderHook(() => useCommunityFacade());
    expect(result.current.currentForum).not.toBeNull();
    expect((result.current.currentForum as Record<string, unknown>).slug).toBe('general');
  });

  it('exposes empty posts by default', () => {
    const { result } = renderHook(() => useCommunityFacade());
    expect(result.current.posts).toEqual([]);
  });

  it('exposes currentPost as null by default', () => {
    const { result } = renderHook(() => useCommunityFacade());
    expect(result.current.currentPost).toBeNull();
  });

  it('exposes currentPost when set', () => {
    mockForumState.currentPost = { id: 'p-1', title: 'Hello World' };
    const { result } = renderHook(() => useCommunityFacade());
    expect((result.current.currentPost as Record<string, unknown>).title).toBe('Hello World');
  });

  it('exposes forum loading states', () => {
    const { result } = renderHook(() => useCommunityFacade());
    expect(result.current.isLoadingForums).toBe(false);
    expect(result.current.isLoadingPosts).toBe(false);
  });

  it('reflects isLoadingForums true', () => {
    mockForumState.isLoadingForums = true;
    const { result } = renderHook(() => useCommunityFacade());
    expect(result.current.isLoadingForums).toBe(true);
  });

  // ── Groups ───────────────────────────────────────────────────────

  it('exposes groups list', () => {
    const { result } = renderHook(() => useCommunityFacade());
    expect(result.current.groups).toHaveLength(1);
    expect((result.current.groups[0] as Record<string, unknown>).name).toBe('Study Group');
  });

  it('exposes null activeGroupId and activeChannelId by default', () => {
    const { result } = renderHook(() => useCommunityFacade());
    expect(result.current.activeGroupId).toBeNull();
    expect(result.current.activeChannelId).toBeNull();
  });

  it('exposes activeGroupId when set', () => {
    mockGroupState.activeGroupId = 'g-1';
    const { result } = renderHook(() => useCommunityFacade());
    expect(result.current.activeGroupId).toBe('g-1');
  });

  it('exposes activeChannelId when set', () => {
    mockGroupState.activeChannelId = 'ch-1';
    const { result } = renderHook(() => useCommunityFacade());
    expect(result.current.activeChannelId).toBe('ch-1');
  });

  it('exposes isLoadingGroups', () => {
    mockGroupState.isLoadingGroups = true;
    const { result } = renderHook(() => useCommunityFacade());
    expect(result.current.isLoadingGroups).toBe(true);
  });

  // ── Announcements ───────────────────────────────────────────────

  it('exposes announcements list', () => {
    const { result } = renderHook(() => useCommunityFacade());
    expect(result.current.announcements).toHaveLength(1);
    expect((result.current.announcements[0] as Record<string, unknown>).title).toBe('Welcome!');
  });

  it('exposes empty announcements', () => {
    mockAnnouncementState.announcements = [];
    const { result } = renderHook(() => useCommunityFacade());
    expect(result.current.announcements).toEqual([]);
  });

  // ── Action delegation ────────────────────────────────────────────

  it('fetchForums delegates to forum store', () => {
    const { result } = renderHook(() => useCommunityFacade());
    result.current.fetchForums();
    expect(mockForumState.fetchForums).toHaveBeenCalledOnce();
  });

  it('fetchPosts delegates with slug and page', () => {
    const { result } = renderHook(() => useCommunityFacade());
    result.current.fetchPosts('general', 2);
    expect(mockForumState.fetchPosts).toHaveBeenCalledWith('general', 2);
  });

  it('fetchGroups delegates to group store', () => {
    const { result } = renderHook(() => useCommunityFacade());
    result.current.fetchGroups();
    expect(mockGroupState.fetchGroups).toHaveBeenCalledOnce();
  });

  it('setActiveGroup delegates with groupId', () => {
    const { result } = renderHook(() => useCommunityFacade());
    result.current.setActiveGroup('g-1');
    expect(mockGroupState.setActiveGroup).toHaveBeenCalledWith('g-1');
  });

  it('setActiveChannel delegates with channelId', () => {
    const { result } = renderHook(() => useCommunityFacade());
    result.current.setActiveChannel('ch-5');
    expect(mockGroupState.setActiveChannel).toHaveBeenCalledWith('ch-5');
  });

  it('fetchAnnouncements delegates to announcement store', () => {
    const { result } = renderHook(() => useCommunityFacade());
    result.current.fetchAnnouncements();
    expect(mockAnnouncementState.fetchAnnouncements).toHaveBeenCalledOnce();
  });

  // ── Interface completeness ───────────────────────────────────────

  it('returns all 17 expected keys', () => {
    const { result } = renderHook(() => useCommunityFacade());
    const keys = Object.keys(result.current);

    const expected = [
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
    for (const k of expected) expect(keys).toContain(k);
    expect(keys).toHaveLength(expected.length);
  });

  it('all action properties are functions', () => {
    const { result } = renderHook(() => useCommunityFacade());
    const actions = [
      'fetchForums',
      'fetchPosts',
      'fetchGroups',
      'setActiveGroup',
      'setActiveChannel',
      'fetchAnnouncements',
    ] as const;
    for (const a of actions) {
      expect(typeof result.current[a]).toBe('function');
    }
  });
});
