/**
 * Notification Store Unit Tests
 *
 * Comprehensive tests for the Zustand notification store.
 * Covers initial state, fetch with pagination, mark as read,
 * mark all as read, delete, add, clearAll, and error handling.
 */

import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import type { AxiosResponse } from 'axios';

// ── API mock ───────────────────────────────────────────────────────────

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/apiUtils', () => ({
  ensureArray: (_data: unknown, key: string) => {
    if (Array.isArray(_data)) return _data;
    if (_data && typeof _data === 'object' && key in (_data as Record<string, unknown>))
      return (_data as Record<string, unknown>)[key];
    return [];
  },
  extractPagination: (data: unknown) => {
    const d = data as Record<string, unknown>;
    return { hasMore: (d?.meta as Record<string, boolean>)?.has_more ?? false };
  },
}));

import { api } from '@/lib/api';
import { useNotificationStore, type Notification } from '../notificationStore.impl';

const mockedApi = {
  get: api.get as MockedFunction<typeof api.get>,
  post: api.post as MockedFunction<typeof api.post>,
  delete: api.delete as MockedFunction<typeof api.delete>,
};

// ── Fixtures ───────────────────────────────────────────────────────────

const mkNotif = (overrides: Partial<Notification> = {}): Notification => ({
  id: 'notif-1',
  type: 'message',
  title: 'New Message',
  body: 'You have a new message',
  isRead: false,
  data: {},
  sender: {
    id: 'user-1',
    username: 'alice',
    displayName: 'Alice',
    avatarUrl: null,
  },
  createdAt: '2025-06-01T12:00:00Z',
  ...overrides,
});

const notif1 = mkNotif();
const notif2 = mkNotif({ id: 'notif-2', type: 'friend_request', title: 'Friend Request' });
const notifRead = mkNotif({ id: 'notif-3', isRead: true });

const getInitialState = () => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  hasMore: true,
});

// ── Setup ──────────────────────────────────────────────────────────────

beforeEach(() => {
  useNotificationStore.setState(getInitialState());
  vi.clearAllMocks();
});

// ── Tests ──────────────────────────────────────────────────────────────

describe('NotificationStore', () => {
  // ── Initial state ────────────────────────────────────────────────

  describe('Initial state', () => {
    it('starts with empty notifications', () => {
      expect(useNotificationStore.getState().notifications).toEqual([]);
    });

    it('starts with unreadCount 0', () => {
      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });

    it('starts not loading', () => {
      expect(useNotificationStore.getState().isLoading).toBe(false);
    });

    it('starts with hasMore true', () => {
      expect(useNotificationStore.getState().hasMore).toBe(true);
    });
  });

  // ── fetchNotifications ───────────────────────────────────────────

  describe('fetchNotifications', () => {
    it('sets isLoading during fetch', async () => {
      mockedApi.get.mockImplementation(() => new Promise(() => {}));
      useNotificationStore.getState().fetchNotifications();
      await vi.waitFor(() => expect(useNotificationStore.getState().isLoading).toBe(true));
    });

    it('replaces notifications on page 1', async () => {
      useNotificationStore.setState({ notifications: [notifRead] });
      mockedApi.get.mockResolvedValueOnce({
        data: { notifications: [notif1, notif2] },
      } as AxiosResponse);

      await useNotificationStore.getState().fetchNotifications(1);

      const s = useNotificationStore.getState();
      expect(s.notifications).toHaveLength(2);
      expect(s.isLoading).toBe(false);
    });

    it('appends on subsequent pages', async () => {
      useNotificationStore.setState({ notifications: [notif1] });
      mockedApi.get.mockResolvedValueOnce({
        data: { notifications: [notif2] },
      } as AxiosResponse);

      await useNotificationStore.getState().fetchNotifications(2);

      expect(useNotificationStore.getState().notifications).toHaveLength(2);
    });

    it('passes page and limit params', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: { notifications: [] } } as AxiosResponse);

      await useNotificationStore.getState().fetchNotifications(3);

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/notifications', {
        params: { page: 3, limit: 20 },
      });
    });

    it('defaults to page 1', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: { notifications: [] } } as AxiosResponse);
      await useNotificationStore.getState().fetchNotifications();
      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/notifications', {
        params: { page: 1, limit: 20 },
      });
    });

    it('resets isLoading on error', async () => {
      mockedApi.get.mockRejectedValueOnce(new Error('network'));
      await expect(useNotificationStore.getState().fetchNotifications()).rejects.toThrow('network');
      expect(useNotificationStore.getState().isLoading).toBe(false);
    });

    it('calculates unreadCount from notifications', async () => {
      mockedApi.get.mockResolvedValueOnce({
        data: { notifications: [notif1, notif2, notifRead] },
      } as AxiosResponse);

      await useNotificationStore.getState().fetchNotifications(1);

      // 2 unread (notif1, notif2), 1 read
      expect(useNotificationStore.getState().unreadCount).toBe(2);
    });
  });

  // ── markAsRead ───────────────────────────────────────────────────

  describe('markAsRead', () => {
    it('marks a notification as read', async () => {
      useNotificationStore.setState({ notifications: [notif1, notif2], unreadCount: 2 });
      mockedApi.post.mockResolvedValueOnce({} as AxiosResponse);

      await useNotificationStore.getState().markAsRead('notif-1');

      const s = useNotificationStore.getState();
      expect(s.notifications[0].isRead).toBe(true);
      expect(s.notifications[1].isRead).toBe(false);
      expect(s.unreadCount).toBe(1);
    });

    it('calls correct API endpoint', async () => {
      useNotificationStore.setState({ notifications: [notif1], unreadCount: 1 });
      mockedApi.post.mockResolvedValueOnce({} as AxiosResponse);

      await useNotificationStore.getState().markAsRead('notif-1');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/notifications/notif-1/read');
    });

    it('does not go below 0 unread', async () => {
      useNotificationStore.setState({ notifications: [notif1], unreadCount: 0 });
      mockedApi.post.mockResolvedValueOnce({} as AxiosResponse);

      await useNotificationStore.getState().markAsRead('notif-1');
      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });
  });

  // ── markAllAsRead ────────────────────────────────────────────────

  describe('markAllAsRead', () => {
    it('marks all notifications as read', async () => {
      useNotificationStore.setState({ notifications: [notif1, notif2], unreadCount: 2 });
      mockedApi.post.mockResolvedValueOnce({} as AxiosResponse);

      await useNotificationStore.getState().markAllAsRead();

      const s = useNotificationStore.getState();
      expect(s.notifications.every((n) => n.isRead)).toBe(true);
      expect(s.unreadCount).toBe(0);
    });

    it('calls bulk read endpoint', async () => {
      mockedApi.post.mockResolvedValueOnce({} as AxiosResponse);
      await useNotificationStore.getState().markAllAsRead();
      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/notifications/read');
    });
  });

  // ── deleteNotification ───────────────────────────────────────────

  describe('deleteNotification', () => {
    it('removes notification from list', async () => {
      useNotificationStore.setState({ notifications: [notif1, notif2], unreadCount: 2 });
      mockedApi.delete.mockResolvedValueOnce({} as AxiosResponse);

      await useNotificationStore.getState().deleteNotification('notif-1');

      const s = useNotificationStore.getState();
      expect(s.notifications).toHaveLength(1);
      expect(s.notifications[0].id).toBe('notif-2');
    });

    it('decrements unreadCount for unread notification', async () => {
      useNotificationStore.setState({ notifications: [notif1], unreadCount: 1 });
      mockedApi.delete.mockResolvedValueOnce({} as AxiosResponse);

      await useNotificationStore.getState().deleteNotification('notif-1');
      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });

    it('does not decrement unreadCount for read notification', async () => {
      useNotificationStore.setState({ notifications: [notifRead], unreadCount: 0 });
      mockedApi.delete.mockResolvedValueOnce({} as AxiosResponse);

      await useNotificationStore.getState().deleteNotification('notif-3');
      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });

    it('calls correct API endpoint', async () => {
      useNotificationStore.setState({ notifications: [notif1] });
      mockedApi.delete.mockResolvedValueOnce({} as AxiosResponse);

      await useNotificationStore.getState().deleteNotification('notif-1');
      expect(mockedApi.delete).toHaveBeenCalledWith('/api/v1/notifications/notif-1');
    });
  });

  // ── addNotification ──────────────────────────────────────────────

  describe('addNotification', () => {
    it('prepends notification to list', () => {
      useNotificationStore.setState({ notifications: [notif2], unreadCount: 1 });

      useNotificationStore.getState().addNotification(notif1);

      const s = useNotificationStore.getState();
      expect(s.notifications[0].id).toBe('notif-1');
      expect(s.notifications).toHaveLength(2);
    });

    it('increments unreadCount for unread notification', () => {
      useNotificationStore.setState({ notifications: [], unreadCount: 0 });
      useNotificationStore.getState().addNotification(notif1);
      expect(useNotificationStore.getState().unreadCount).toBe(1);
    });

    it('does not increment unreadCount for read notification', () => {
      useNotificationStore.setState({ notifications: [], unreadCount: 0 });
      useNotificationStore.getState().addNotification(notifRead);
      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });
  });

  // ── clearAll ─────────────────────────────────────────────────────

  describe('clearAll', () => {
    it('removes all notifications', async () => {
      useNotificationStore.setState({ notifications: [notif1, notif2], unreadCount: 2 });
      mockedApi.delete.mockResolvedValueOnce({} as AxiosResponse);

      await useNotificationStore.getState().clearAll();

      const s = useNotificationStore.getState();
      expect(s.notifications).toEqual([]);
      expect(s.unreadCount).toBe(0);
    });

    it('calls bulk delete endpoint', async () => {
      mockedApi.delete.mockResolvedValueOnce({} as AxiosResponse);
      await useNotificationStore.getState().clearAll();
      expect(mockedApi.delete).toHaveBeenCalledWith('/api/v1/notifications');
    });
  });
});
