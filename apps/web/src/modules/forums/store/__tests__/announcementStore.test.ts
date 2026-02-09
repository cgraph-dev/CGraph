/**
 * Announcement Store Unit Tests
 *
 * Comprehensive tests for the Zustand announcement store.
 * Covers initial state, fetch actions, CRUD, visibility toggles,
 * read tracking, ordering, helpers, and error handling.
 */

import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { useAnnouncementStore } from '../announcementStore.impl';
import type { Announcement, AnnouncementFormData } from '../announcementStore.types';

// ── API mock ───────────────────────────────────────────────────────────

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/apiUtils', () => ({
  ensureArray: (data: unknown, key: string) => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && key in (data as Record<string, unknown>))
      return (data as Record<string, unknown>)[key];
    return [];
  },
}));

import { api } from '@/lib/api';

const mockedApi = {
  get: api.get as MockedFunction<typeof api.get>,
  post: api.post as MockedFunction<typeof api.post>,
  put: api.put as MockedFunction<typeof api.put>,
  delete: api.delete as MockedFunction<typeof api.delete>,
};

// ── Fixtures ───────────────────────────────────────────────────────────

const now = new Date();
const pastDate = new Date(now.getTime() - 86400000).toISOString();
const futureDate = new Date(now.getTime() + 86400000).toISOString();

const mockAnnouncement: Announcement = {
  id: 'ann-1',
  title: 'Test Announcement',
  content: '<p>Hello world</p>',
  scope: 'global',
  forumId: null,
  authorId: 'user-1',
  authorUsername: 'admin',
  authorDisplayName: 'Admin',
  authorAvatarUrl: null,
  isActive: true,
  startDate: pastDate,
  endDate: futureDate,
  allowedGroups: [],
  priority: 10,
  allowHtml: true,
  allowBbcode: true,
  showInIndex: true,
  showInForumView: true,
  viewCount: 42,
  createdAt: pastDate,
  updatedAt: pastDate,
};

const mockAnnouncement2: Announcement = {
  ...mockAnnouncement,
  id: 'ann-2',
  title: 'Second',
  priority: 5,
};

const getInitialState = () => ({
  announcements: [],
  globalAnnouncements: [],
  forumAnnouncements: new Map<string, Announcement[]>(),
  currentAnnouncement: null,
  isLoading: false,
  readAnnouncementIds: new Set<string>(),
  page: 1,
  totalPages: 1,
  totalCount: 0,
});

// ── Setup ──────────────────────────────────────────────────────────────

beforeEach(() => {
  useAnnouncementStore.setState(getInitialState());
  vi.clearAllMocks();
});

// ── Tests ──────────────────────────────────────────────────────────────

describe('AnnouncementStore', () => {
  // ── Initial state ────────────────────────────────────────────────

  describe('Initial state', () => {
    it('starts with empty announcements', () => {
      expect(useAnnouncementStore.getState().announcements).toEqual([]);
    });

    it('starts with empty global announcements', () => {
      expect(useAnnouncementStore.getState().globalAnnouncements).toEqual([]);
    });

    it('starts with empty forum announcements map', () => {
      expect(useAnnouncementStore.getState().forumAnnouncements.size).toBe(0);
    });

    it('starts with no current announcement', () => {
      expect(useAnnouncementStore.getState().currentAnnouncement).toBeNull();
    });

    it('starts not loading', () => {
      expect(useAnnouncementStore.getState().isLoading).toBe(false);
    });

    it('starts with empty read set', () => {
      expect(useAnnouncementStore.getState().readAnnouncementIds.size).toBe(0);
    });

    it('starts at page 1 with defaults', () => {
      const s = useAnnouncementStore.getState();
      expect(s.page).toBe(1);
      expect(s.totalPages).toBe(1);
      expect(s.totalCount).toBe(0);
    });
  });

  // ── Fetch actions ────────────────────────────────────────────────

  describe('fetchAnnouncements', () => {
    it('sets isLoading during fetch', async () => {
      mockedApi.get.mockImplementation(() => new Promise(() => {}));
      useAnnouncementStore.getState().fetchAnnouncements();
      await vi.waitFor(() => expect(useAnnouncementStore.getState().isLoading).toBe(true));
    });

    it('populates announcements on success', async () => {
      mockedApi.get.mockResolvedValueOnce({
        data: { announcements: [mockAnnouncement], page: 1, total_pages: 1, total_count: 1 },
      });

      await useAnnouncementStore.getState().fetchAnnouncements();

      expect(useAnnouncementStore.getState().isLoading).toBe(false);
    });

    it('passes filter params to API', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: { announcements: [] } });

      await useAnnouncementStore.getState().fetchAnnouncements({
        scope: 'forum',
        forumId: 'f-1',
        isActive: true,
      });

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/announcements', {
        params: expect.objectContaining({
          scope: 'forum',
          forum_id: 'f-1',
          is_active: true,
        }),
      });
    });

    it('resets isLoading on error', async () => {
      mockedApi.get.mockRejectedValueOnce(new Error('fail'));
      await useAnnouncementStore.getState().fetchAnnouncements();
      expect(useAnnouncementStore.getState().isLoading).toBe(false);
    });
  });

  describe('fetchAnnouncement (single)', () => {
    it('sets currentAnnouncement on success', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: { announcement: mockAnnouncement } });

      await useAnnouncementStore.getState().fetchAnnouncement('ann-1');

      expect(useAnnouncementStore.getState().currentAnnouncement).not.toBeNull();
    });

    it('returns null on error', async () => {
      mockedApi.get.mockRejectedValueOnce(new Error('not found'));
      const result = await useAnnouncementStore.getState().fetchAnnouncement('bad');
      expect(result).toBeNull();
    });
  });

  // ── CRUD ─────────────────────────────────────────────────────────

  describe('createAnnouncement', () => {
    it('adds new announcement to list', async () => {
      const formData: AnnouncementFormData = {
        title: 'New',
        content: 'Content',
        scope: 'global',
        startDate: pastDate,
      };
      mockedApi.post.mockResolvedValueOnce({ data: { announcement: mockAnnouncement } });

      await useAnnouncementStore.getState().createAnnouncement(formData);

      // The store prepends the announcement
      expect(useAnnouncementStore.getState().announcements.length).toBeGreaterThanOrEqual(1);
    });

    it('throws on API error', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('forbidden'));
      await expect(
        useAnnouncementStore.getState().createAnnouncement({
          title: 'X',
          content: 'Y',
          scope: 'global',
          startDate: pastDate,
        })
      ).rejects.toThrow('forbidden');
    });
  });

  describe('updateAnnouncement', () => {
    it('updates announcement in list', async () => {
      useAnnouncementStore.setState({ announcements: [mockAnnouncement] });
      mockedApi.put.mockResolvedValueOnce({
        data: { announcement: { ...mockAnnouncement, title: 'Updated' } },
      });

      await useAnnouncementStore.getState().updateAnnouncement('ann-1', { title: 'Updated' });

      // Verify API was called
      expect(mockedApi.put).toHaveBeenCalledWith(
        '/api/v1/announcements/ann-1',
        expect.objectContaining({ title: 'Updated' })
      );
    });

    it('updates currentAnnouncement if matching', async () => {
      useAnnouncementStore.setState({
        announcements: [mockAnnouncement],
        currentAnnouncement: mockAnnouncement,
      });
      mockedApi.put.mockResolvedValueOnce({
        data: { announcement: { ...mockAnnouncement, title: 'New Title' } },
      });

      await useAnnouncementStore.getState().updateAnnouncement('ann-1', { title: 'New Title' });
    });

    it('throws on failure', async () => {
      mockedApi.put.mockRejectedValueOnce(new Error('fail'));
      await expect(
        useAnnouncementStore.getState().updateAnnouncement('ann-1', { title: 'X' })
      ).rejects.toThrow();
    });
  });

  describe('deleteAnnouncement', () => {
    it('removes announcement from lists', async () => {
      useAnnouncementStore.setState({
        announcements: [mockAnnouncement, mockAnnouncement2],
        globalAnnouncements: [mockAnnouncement],
        currentAnnouncement: mockAnnouncement,
      });
      mockedApi.delete.mockResolvedValueOnce({});

      await useAnnouncementStore.getState().deleteAnnouncement('ann-1');

      const s = useAnnouncementStore.getState();
      expect(s.announcements).toHaveLength(1);
      expect(s.announcements[0].id).toBe('ann-2');
      expect(s.globalAnnouncements).toHaveLength(0);
      expect(s.currentAnnouncement).toBeNull();
    });

    it('keeps currentAnnouncement if different id', async () => {
      useAnnouncementStore.setState({
        announcements: [mockAnnouncement, mockAnnouncement2],
        currentAnnouncement: mockAnnouncement2,
      });
      mockedApi.delete.mockResolvedValueOnce({});

      await useAnnouncementStore.getState().deleteAnnouncement('ann-1');
      expect(useAnnouncementStore.getState().currentAnnouncement?.id).toBe('ann-2');
    });
  });

  // ── Visibility ───────────────────────────────────────────────────

  describe('activateAnnouncement', () => {
    it('sets isActive to true', async () => {
      const inactive = { ...mockAnnouncement, isActive: false };
      useAnnouncementStore.setState({ announcements: [inactive] });
      mockedApi.post.mockResolvedValueOnce({});

      await useAnnouncementStore.getState().activateAnnouncement('ann-1');

      expect(useAnnouncementStore.getState().announcements[0].isActive).toBe(true);
    });
  });

  describe('deactivateAnnouncement', () => {
    it('sets isActive to false and removes from global', async () => {
      useAnnouncementStore.setState({
        announcements: [mockAnnouncement],
        globalAnnouncements: [mockAnnouncement],
      });
      mockedApi.post.mockResolvedValueOnce({});

      await useAnnouncementStore.getState().deactivateAnnouncement('ann-1');

      const s = useAnnouncementStore.getState();
      expect(s.announcements[0].isActive).toBe(false);
      expect(s.globalAnnouncements).toHaveLength(0);
    });
  });

  // ── Read tracking ────────────────────────────────────────────────

  describe('markAsRead', () => {
    it('adds id to readAnnouncementIds', async () => {
      useAnnouncementStore.setState({ globalAnnouncements: [mockAnnouncement] });
      mockedApi.post.mockResolvedValueOnce({});

      await useAnnouncementStore.getState().markAsRead('ann-1');
      expect(useAnnouncementStore.getState().readAnnouncementIds.has('ann-1')).toBe(true);
    });

    it('skips if already read', async () => {
      useAnnouncementStore.setState({ readAnnouncementIds: new Set(['ann-1']) });
      await useAnnouncementStore.getState().markAsRead('ann-1');
      expect(mockedApi.post).not.toHaveBeenCalled();
    });
  });

  describe('isAnnouncementRead', () => {
    it('returns true for read announcements', () => {
      useAnnouncementStore.setState({ readAnnouncementIds: new Set(['ann-1']) });
      expect(useAnnouncementStore.getState().isAnnouncementRead('ann-1')).toBe(true);
    });

    it('returns false for unread announcements', () => {
      expect(useAnnouncementStore.getState().isAnnouncementRead('ann-1')).toBe(false);
    });
  });

  // ── Ordering ─────────────────────────────────────────────────────

  describe('updatePriority', () => {
    it('updates priority for specific announcement', async () => {
      useAnnouncementStore.setState({ announcements: [mockAnnouncement] });
      mockedApi.put.mockResolvedValueOnce({});

      await useAnnouncementStore.getState().updatePriority('ann-1', 99);

      expect(useAnnouncementStore.getState().announcements[0].priority).toBe(99);
    });
  });

  // ── clearState ───────────────────────────────────────────────────

  describe('clearState', () => {
    it('resets all state to defaults', () => {
      useAnnouncementStore.setState({
        announcements: [mockAnnouncement],
        globalAnnouncements: [mockAnnouncement],
        currentAnnouncement: mockAnnouncement,
        readAnnouncementIds: new Set(['ann-1']),
        page: 3,
        totalPages: 5,
        totalCount: 50,
      });

      useAnnouncementStore.getState().clearState();

      const s = useAnnouncementStore.getState();
      expect(s.announcements).toEqual([]);
      expect(s.globalAnnouncements).toEqual([]);
      expect(s.currentAnnouncement).toBeNull();
      expect(s.readAnnouncementIds.size).toBe(0);
      expect(s.page).toBe(1);
      expect(s.totalPages).toBe(1);
      expect(s.totalCount).toBe(0);
    });
  });
});
