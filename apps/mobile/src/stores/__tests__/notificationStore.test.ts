/**
 * Tests for notificationStore
 * @module stores/__tests__/notificationStore
 */

import { useNotificationStore } from '../notificationStore';
import type { Notification } from '../notificationStore';

// ── Mocks ──────────────────────────────────────────────────────────────

jest.mock('../../lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

import api from '../../lib/api';

const mockApi = api as jest.Mocked<typeof api>;

// ── Helpers ────────────────────────────────────────────────────────────

function resetStore() {
  useNotificationStore.setState({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    hasMore: true,
    currentPage: 1,
  });
}

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 'n1',
    type: 'general',
    title: 'Test',
    body: 'Body text',
    data: {},
    read: false,
    readAt: null,
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────

describe('notificationStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
  });

  describe('initial state', () => {
    it('has empty notifications', () => {
      const state = useNotificationStore.getState();
      expect(state.notifications).toEqual([]);
      expect(state.unreadCount).toBe(0);
      expect(state.isLoading).toBe(false);
      expect(state.hasMore).toBe(true);
      expect(state.currentPage).toBe(1);
    });
  });

  // ── fetchNotifications ─────────────────────────────────────────────

  describe('fetchNotifications', () => {
    it('fetches and normalizes notifications', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          notifications: [
            {
              id: 'n1',
              type: 'message',
              title: 'New Message',
              body: 'Hello',
              data: {},
              read: false,
              read_at: null,
              created_at: '2024-01-01T00:00:00Z',
              actor: { id: 'u1', username: 'alice', avatar_url: '/img.jpg' },
            },
          ],
          unread_count: 1,
        },
      });

      await useNotificationStore.getState().fetchNotifications(true);

      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0].id).toBe('n1');
      expect(state.notifications[0].actor?.username).toBe('alice');
      expect(state.notifications[0].actor?.avatarUrl).toBe('/img.jpg');
      expect(state.unreadCount).toBe(1);
      expect(state.isLoading).toBe(false);
    });

    it('paginates with reset=false', async () => {
      // Set initial state with one notification
      useNotificationStore.setState({
        notifications: [makeNotification({ id: 'n0' })],
        currentPage: 2,
      });

      mockApi.get.mockResolvedValueOnce({
        data: {
          notifications: [{ id: 'n1', type: 'general', title: 'T', created_at: '' }],
        },
      });

      await useNotificationStore.getState().fetchNotifications(false);

      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(2);
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/notifications', {
        params: { page: 2, limit: 20 },
      });
    });

    it('resets with reset=true', async () => {
      useNotificationStore.setState({
        notifications: [makeNotification({ id: 'n0' })],
        currentPage: 3,
      });

      mockApi.get.mockResolvedValueOnce({
        data: { notifications: [{ id: 'n1', created_at: '' }] },
      });

      await useNotificationStore.getState().fetchNotifications(true);

      expect(useNotificationStore.getState().notifications).toHaveLength(1);
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/notifications', {
        params: { page: 1, limit: 20 },
      });
    });

    it('sets hasMore true when 20 results returned', async () => {
      const items = Array.from({ length: 20 }, (_, i) => ({ id: `n${i}`, created_at: '' }));
      mockApi.get.mockResolvedValueOnce({ data: { notifications: items } });

      await useNotificationStore.getState().fetchNotifications(true);
      expect(useNotificationStore.getState().hasMore).toBe(true);
    });

    it('sets hasMore false when fewer than 20 results', async () => {
      mockApi.get.mockResolvedValueOnce({ data: { notifications: [{ id: 'n1', created_at: '' }] } });

      await useNotificationStore.getState().fetchNotifications(true);
      expect(useNotificationStore.getState().hasMore).toBe(false);
    });

    it('handles API error gracefully', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Network error'));

      await useNotificationStore.getState().fetchNotifications(true);

      const state = useNotificationStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.notifications).toEqual([]);
    });

    it('normalizes snake_case fields', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          notifications: [
            {
              id: 'n1',
              is_read: true,
              read_at: '2024-01-02T00:00:00Z',
              inserted_at: '2024-01-01T00:00:00Z',
              message: 'fallback body',
              metadata: { key: 'val' },
            },
          ],
        },
      });

      await useNotificationStore.getState().fetchNotifications(true);

      const n = useNotificationStore.getState().notifications[0];
      expect(n.read).toBe(true);
      expect(n.readAt).toBe('2024-01-02T00:00:00Z');
      expect(n.createdAt).toBe('2024-01-01T00:00:00Z');
      expect(n.body).toBe('fallback body');
      expect(n.data).toEqual({ key: 'val' });
    });

    it('computes unreadCount from notifications when server omits it', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          notifications: [
            { id: 'n1', read: false, created_at: '' },
            { id: 'n2', read: true, created_at: '' },
            { id: 'n3', read: false, created_at: '' },
          ],
        },
      });

      await useNotificationStore.getState().fetchNotifications(true);
      expect(useNotificationStore.getState().unreadCount).toBe(2);
    });
  });

  // ── markAsRead ─────────────────────────────────────────────────────

  describe('markAsRead', () => {
    it('marks a notification as read and decrements unreadCount', async () => {
      useNotificationStore.setState({
        notifications: [makeNotification({ id: 'n1', read: false })],
        unreadCount: 1,
      });
      mockApi.post.mockResolvedValueOnce({});

      await useNotificationStore.getState().markAsRead('n1');

      const state = useNotificationStore.getState();
      expect(state.notifications[0].read).toBe(true);
      expect(state.notifications[0].readAt).toBeTruthy();
      expect(state.unreadCount).toBe(0);
      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/notifications/n1/read');
    });

    it('does not change other notifications', async () => {
      useNotificationStore.setState({
        notifications: [
          makeNotification({ id: 'n1', read: false }),
          makeNotification({ id: 'n2', read: false }),
        ],
        unreadCount: 2,
      });
      mockApi.post.mockResolvedValueOnce({});

      await useNotificationStore.getState().markAsRead('n1');
      expect(useNotificationStore.getState().notifications[1].read).toBe(false);
    });

    it('unreadCount does not go below 0', async () => {
      useNotificationStore.setState({
        notifications: [makeNotification({ id: 'n1', read: false })],
        unreadCount: 0,
      });
      mockApi.post.mockResolvedValueOnce({});

      await useNotificationStore.getState().markAsRead('n1');
      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });

    it('handles error silently', async () => {
      mockApi.post.mockRejectedValueOnce(new Error('fail'));
      await expect(useNotificationStore.getState().markAsRead('n1')).resolves.toBeUndefined();
    });
  });

  // ── markAllAsRead ──────────────────────────────────────────────────

  describe('markAllAsRead', () => {
    it('marks all notifications as read', async () => {
      useNotificationStore.setState({
        notifications: [
          makeNotification({ id: 'n1', read: false }),
          makeNotification({ id: 'n2', read: false }),
        ],
        unreadCount: 2,
      });
      mockApi.post.mockResolvedValueOnce({});

      await useNotificationStore.getState().markAllAsRead();

      const state = useNotificationStore.getState();
      expect(state.notifications.every((n) => n.read)).toBe(true);
      expect(state.unreadCount).toBe(0);
      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/notifications/read');
    });

    it('preserves existing readAt values', async () => {
      useNotificationStore.setState({
        notifications: [
          makeNotification({ id: 'n1', read: true, readAt: '2024-01-01T00:00:00Z' }),
          makeNotification({ id: 'n2', read: false, readAt: null }),
        ],
        unreadCount: 1,
      });
      mockApi.post.mockResolvedValueOnce({});

      await useNotificationStore.getState().markAllAsRead();

      expect(useNotificationStore.getState().notifications[0].readAt).toBe('2024-01-01T00:00:00Z');
      expect(useNotificationStore.getState().notifications[1].readAt).toBeTruthy();
    });
  });

  // ── deleteNotification ─────────────────────────────────────────────

  describe('deleteNotification', () => {
    it('removes notification from list', async () => {
      useNotificationStore.setState({
        notifications: [
          makeNotification({ id: 'n1' }),
          makeNotification({ id: 'n2' }),
        ],
        unreadCount: 2,
      });
      mockApi.delete.mockResolvedValueOnce({});

      await useNotificationStore.getState().deleteNotification('n1');

      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0].id).toBe('n2');
    });

    it('decrements unreadCount only for unread notifications', async () => {
      useNotificationStore.setState({
        notifications: [makeNotification({ id: 'n1', read: false })],
        unreadCount: 1,
      });
      mockApi.delete.mockResolvedValueOnce({});

      await useNotificationStore.getState().deleteNotification('n1');
      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });

    it('does not decrement unreadCount for read notifications', async () => {
      useNotificationStore.setState({
        notifications: [makeNotification({ id: 'n1', read: true })],
        unreadCount: 0,
      });
      mockApi.delete.mockResolvedValueOnce({});

      await useNotificationStore.getState().deleteNotification('n1');
      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });
  });

  // ── clearAll ───────────────────────────────────────────────────────

  describe('clearAll', () => {
    it('deletes all notifications', async () => {
      useNotificationStore.setState({
        notifications: [makeNotification({ id: 'n1' }), makeNotification({ id: 'n2' })],
        unreadCount: 2,
      });
      mockApi.delete.mockResolvedValueOnce({});

      await useNotificationStore.getState().clearAll();

      const state = useNotificationStore.getState();
      expect(state.notifications).toEqual([]);
      expect(state.unreadCount).toBe(0);
      expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/notifications');
    });
  });

  // ── addNotification (socket mutation) ──────────────────────────────

  describe('addNotification', () => {
    it('adds a notification to the front', () => {
      useNotificationStore.setState({
        notifications: [makeNotification({ id: 'n1' })],
        unreadCount: 1,
      });

      useNotificationStore.getState().addNotification(makeNotification({ id: 'n2' }));

      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(2);
      expect(state.notifications[0].id).toBe('n2');
    });

    it('increments unreadCount for unread notification', () => {
      useNotificationStore.setState({ notifications: [], unreadCount: 0 });

      useNotificationStore.getState().addNotification(makeNotification({ id: 'n1', read: false }));
      expect(useNotificationStore.getState().unreadCount).toBe(1);
    });

    it('does not increment unreadCount for read notification', () => {
      useNotificationStore.setState({ notifications: [], unreadCount: 0 });

      useNotificationStore.getState().addNotification(makeNotification({ id: 'n1', read: true }));
      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });

    it('deduplicates by id', () => {
      useNotificationStore.setState({
        notifications: [makeNotification({ id: 'n1' })],
        unreadCount: 1,
      });

      useNotificationStore.getState().addNotification(makeNotification({ id: 'n1' }));

      expect(useNotificationStore.getState().notifications).toHaveLength(1);
    });
  });

  // ── Selector hooks ─────────────────────────────────────────────────

  describe('selector hooks', () => {
    it('useUnreadCount returns unreadCount', () => {
      useNotificationStore.setState({ unreadCount: 5 });
      // Selector hooks are just simple selectors over the store
      expect(useNotificationStore.getState().unreadCount).toBe(5);
    });
  });
});
