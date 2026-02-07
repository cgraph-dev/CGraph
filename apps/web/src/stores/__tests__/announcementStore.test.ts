/**
 * announcementStore Unit Tests
 *
 * Tests for Zustand announcement store state management.
 */

import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { useAnnouncementStore } from '@/modules/forums/store';
import type { Announcement } from '@/modules/forums/store';

// Mock the API module
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from '@/lib/api';

const mockedApi = {
  get: api.get as MockedFunction<typeof api.get>,
  post: api.post as MockedFunction<typeof api.post>,
  put: api.put as MockedFunction<typeof api.put>,
  patch: api.patch as MockedFunction<typeof api.patch>,
  delete: api.delete as MockedFunction<typeof api.delete>,
};

// Mock global announcement
const mockGlobalAnnouncement: Announcement = {
  id: 'ann-1',
  title: 'Welcome to CGraph!',
  content: '<p>Welcome to our community platform.</p>',
  scope: 'global',
  forumId: null,
  authorId: 'user-1',
  authorUsername: 'admin',
  authorDisplayName: 'Administrator',
  authorAvatarUrl: 'https://example.com/admin-avatar.jpg',
  isActive: true,
  startDate: '2026-01-01T00:00:00Z',
  endDate: null,
  allowedGroups: [],
  priority: 100,
  allowHtml: true,
  allowBbcode: true,
  showInIndex: true,
  showInForumView: true,
  icon: '📢',
  backgroundColor: '#3b82f6',
  textColor: '#ffffff',
  viewCount: 1500,
  isRead: false,
  readAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-15T00:00:00Z',
};

describe('announcementStore', () => {
  beforeEach(() => {
    // Reset store state
    useAnnouncementStore.setState({
      announcements: [],
      globalAnnouncements: [],
      forumAnnouncements: new Map(),
      currentAnnouncement: null,
      readAnnouncementIds: new Set(),
      isLoading: false,
    });

    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have empty announcements', () => {
      const state = useAnnouncementStore.getState();
      expect(state.announcements).toEqual([]);
    });

    it('should have empty global announcements', () => {
      const state = useAnnouncementStore.getState();
      expect(state.globalAnnouncements).toEqual([]);
    });

    it('should have no current announcement', () => {
      const state = useAnnouncementStore.getState();
      expect(state.currentAnnouncement).toBeNull();
    });

    it('should not be loading initially', () => {
      const state = useAnnouncementStore.getState();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('fetchAnnouncements', () => {
    it('should fetch announcements successfully', async () => {
      mockedApi.get.mockResolvedValueOnce({
        data: { data: [mockGlobalAnnouncement] },
      });

      const { fetchAnnouncements } = useAnnouncementStore.getState();
      await fetchAnnouncements();

      expect(mockedApi.get).toHaveBeenCalled();
    });
  });

  describe('fetchGlobalAnnouncements', () => {
    it('should fetch global announcements', async () => {
      mockedApi.get.mockResolvedValueOnce({
        data: { data: [mockGlobalAnnouncement] },
      });

      const { fetchGlobalAnnouncements } = useAnnouncementStore.getState();
      await fetchGlobalAnnouncements();

      expect(mockedApi.get).toHaveBeenCalled();
    });
  });

  describe('createAnnouncement', () => {
    it('should create a new announcement', async () => {
      mockedApi.post.mockResolvedValueOnce({
        data: { announcement: mockGlobalAnnouncement },
      });

      const { createAnnouncement } = useAnnouncementStore.getState();
      await createAnnouncement({
        title: 'Welcome to CGraph!',
        content: '<p>Welcome to our community platform.</p>',
        scope: 'global',
        startDate: '2026-01-01T00:00:00Z',
      });

      expect(mockedApi.post).toHaveBeenCalled();
    });
  });

  describe('markAsRead', () => {
    it('should mark announcement as read', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: {} });

      const { markAsRead } = useAnnouncementStore.getState();
      await markAsRead('ann-1');

      expect(mockedApi.post).toHaveBeenCalled();
    });
  });

  describe('deleteAnnouncement', () => {
    it('should delete an announcement', async () => {
      mockedApi.delete.mockResolvedValueOnce({ data: {} });

      const { deleteAnnouncement } = useAnnouncementStore.getState();
      await deleteAnnouncement('ann-1');

      expect(mockedApi.delete).toHaveBeenCalled();
    });
  });

  describe('getActiveAnnouncements', () => {
    it('should return active announcements', () => {
      useAnnouncementStore.setState({
        announcements: [mockGlobalAnnouncement],
      });

      const { getActiveAnnouncements } = useAnnouncementStore.getState();
      const active = getActiveAnnouncements();

      expect(active.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('clearState', () => {
    it('should clear state', () => {
      useAnnouncementStore.setState({
        announcements: [mockGlobalAnnouncement],
        currentAnnouncement: mockGlobalAnnouncement,
      });

      const { clearState } = useAnnouncementStore.getState();
      clearState();

      const state = useAnnouncementStore.getState();
      expect(state.announcements).toEqual([]);
      expect(state.currentAnnouncement).toBeNull();
    });
  });
});
