/**
 * notificationStore Unit Tests
 *
 * Tests for Zustand notification store state management.
 * Tests cover fetching, marking as read, deleting, and adding notifications.
 */

import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { useNotificationStore, type Notification } from '@/modules/social/store';

// Mock the api module
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

// Import the mocked api after mocking
import { api } from '@/lib/api';

// Mock notification data
const createMockNotification = (overrides: Partial<Notification> = {}): Notification => ({
  id: 'notif-1',
  type: 'message',
  title: 'New Message',
  body: 'You have a new message from John',
  isRead: false,
  data: { conversationId: 'conv-123' },
  sender: {
    id: 'user-1',
    username: 'johndoe',
    displayName: 'John Doe',
    avatarUrl: 'https://example.com/avatar.png',
    avatarBorderId: null,
    avatar_border_id: null,
  },
  createdAt: '2026-01-30T10:00:00Z',
  ...overrides,
});

const mockNotifications: Notification[] = [
  createMockNotification({ id: 'notif-1', isRead: false }),
  createMockNotification({
    id: 'notif-2',
    type: 'friend_request',
    title: 'Friend Request',
    isRead: false,
  }),
  createMockNotification({ id: 'notif-3', type: 'system', title: 'System Update', isRead: true }),
];

// Reset store state after each test
afterEach(() => {
  useNotificationStore.setState({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    hasMore: true,
  });
  vi.clearAllMocks();
});

describe('notificationStore', () => {
  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useNotificationStore.getState();

      expect(state.notifications).toEqual([]);
      expect(state.unreadCount).toBe(0);
      expect(state.isLoading).toBe(false);
      expect(state.hasMore).toBe(true);
    });

    it('should have all required actions defined', () => {
      const state = useNotificationStore.getState();

      expect(typeof state.fetchNotifications).toBe('function');
      expect(typeof state.markAsRead).toBe('function');
      expect(typeof state.markAllAsRead).toBe('function');
      expect(typeof state.deleteNotification).toBe('function');
      expect(typeof state.addNotification).toBe('function');
      expect(typeof state.clearAll).toBe('function');
    });
  });

  describe('fetchNotifications', () => {
    it('should fetch notifications and update state', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: {
          notifications: mockNotifications,
          meta: { unread_count: 2 },
        },
      });

      await useNotificationStore.getState().fetchNotifications();

      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(3);
      expect(state.unreadCount).toBe(2);
      expect(state.isLoading).toBe(false);
      expect(api.get).toHaveBeenCalledWith('/api/v1/notifications', {
        params: { page: 1, limit: 20 },
      });
    });

    it('should set isLoading to true while fetching', async () => {
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      vi.mocked(api.get).mockReturnValueOnce(pendingPromise as Promise<unknown>);

      const fetchPromise = useNotificationStore.getState().fetchNotifications();

      expect(useNotificationStore.getState().isLoading).toBe(true);

      resolvePromise!({ data: { notifications: [], meta: {} } });
      await fetchPromise;

      expect(useNotificationStore.getState().isLoading).toBe(false);
    });

    it('should append notifications when paginating', async () => {
      // First page
      useNotificationStore.setState({
        notifications: [mockNotifications[0]!],
        unreadCount: 1,
      });

      vi.mocked(api.get).mockResolvedValueOnce({
        data: {
          notifications: [mockNotifications[1], mockNotifications[2]],
          meta: { unread_count: 2 },
        },
      });

      await useNotificationStore.getState().fetchNotifications(2);

      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(3);
      expect(api.get).toHaveBeenCalledWith('/api/v1/notifications', {
        params: { page: 2, limit: 20 },
      });
    });

    it('should replace notifications when fetching first page', async () => {
      useNotificationStore.setState({
        notifications: mockNotifications,
        unreadCount: 2,
      });

      const newNotifications = [createMockNotification({ id: 'new-1' })];
      vi.mocked(api.get).mockResolvedValueOnce({
        data: {
          notifications: newNotifications,
          meta: { unread_count: 1 },
        },
      });

      await useNotificationStore.getState().fetchNotifications(1);

      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0]!.id).toBe('new-1');
    });

    it('should handle fetch errors and reset loading state', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Network error'));

      await expect(useNotificationStore.getState().fetchNotifications()).rejects.toThrow(
        'Network error'
      );

      const state = useNotificationStore.getState();
      expect(state.isLoading).toBe(false);
    });

    it('should calculate unread count from notifications when meta is missing', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: {
          notifications: mockNotifications, // 2 unread, 1 read
        },
      });

      await useNotificationStore.getState().fetchNotifications();

      const state = useNotificationStore.getState();
      expect(state.unreadCount).toBe(2);
    });
  });

  describe('markAsRead', () => {
    beforeEach(() => {
      useNotificationStore.setState({
        notifications: mockNotifications,
        unreadCount: 2,
      });
    });

    it('should mark a notification as read', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ data: {} });

      await useNotificationStore.getState().markAsRead('notif-1');

      const state = useNotificationStore.getState();
      const notification = state.notifications.find((n) => n.id === 'notif-1');
      expect(notification?.isRead).toBe(true);
      expect(state.unreadCount).toBe(1);
      expect(api.post).toHaveBeenCalledWith('/api/v1/notifications/notif-1/read');
    });

    it('should decrement unread count but not below zero', async () => {
      useNotificationStore.setState({
        notifications: [createMockNotification({ id: 'notif-1', isRead: false })],
        unreadCount: 0, // Edge case: count is already 0
      });

      vi.mocked(api.post).mockResolvedValueOnce({ data: {} });

      await useNotificationStore.getState().markAsRead('notif-1');

      const state = useNotificationStore.getState();
      expect(state.unreadCount).toBe(0);
    });
  });

  describe('markAllAsRead', () => {
    beforeEach(() => {
      useNotificationStore.setState({
        notifications: mockNotifications,
        unreadCount: 2,
      });
    });

    it('should mark all notifications as read', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ data: {} });

      await useNotificationStore.getState().markAllAsRead();

      const state = useNotificationStore.getState();
      expect(state.notifications.every((n) => n.isRead)).toBe(true);
      expect(state.unreadCount).toBe(0);
      expect(api.post).toHaveBeenCalledWith('/api/v1/notifications/read');
    });
  });

  describe('deleteNotification', () => {
    beforeEach(() => {
      useNotificationStore.setState({
        notifications: mockNotifications,
        unreadCount: 2,
      });
    });

    it('should delete a notification and decrement unread count for unread notification', async () => {
      vi.mocked(api.delete).mockResolvedValueOnce({ data: {} });

      await useNotificationStore.getState().deleteNotification('notif-1');

      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(2);
      expect(state.notifications.find((n) => n.id === 'notif-1')).toBeUndefined();
      expect(state.unreadCount).toBe(1);
      expect(api.delete).toHaveBeenCalledWith('/api/v1/notifications/notif-1');
    });

    it('should delete a notification without decrementing unread count for read notification', async () => {
      vi.mocked(api.delete).mockResolvedValueOnce({ data: {} });

      await useNotificationStore.getState().deleteNotification('notif-3'); // Already read

      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(2);
      expect(state.notifications.find((n) => n.id === 'notif-3')).toBeUndefined();
      expect(state.unreadCount).toBe(2); // Unchanged
    });
  });

  describe('addNotification', () => {
    it('should add a new notification to the beginning of the list', () => {
      useNotificationStore.setState({
        notifications: [mockNotifications[1]!],
        unreadCount: 1,
      });

      const newNotification = createMockNotification({
        id: 'new-notif',
        title: 'Brand New',
        isRead: false,
      });

      useNotificationStore.getState().addNotification(newNotification);

      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(2);
      expect(state.notifications[0]!.id).toBe('new-notif');
      expect(state.unreadCount).toBe(2);
    });

    it('should increment unread count for unread notification', () => {
      useNotificationStore.setState({
        notifications: [],
        unreadCount: 0,
      });

      const newNotification = createMockNotification({ isRead: false });

      useNotificationStore.getState().addNotification(newNotification);

      expect(useNotificationStore.getState().unreadCount).toBe(1);
    });

    it('should not increment unread count for already read notification', () => {
      useNotificationStore.setState({
        notifications: [],
        unreadCount: 0,
      });

      const readNotification = createMockNotification({ isRead: true });

      useNotificationStore.getState().addNotification(readNotification);

      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });
  });

  describe('clearAll', () => {
    it('should clear all notifications and reset unread count', async () => {
      useNotificationStore.setState({
        notifications: mockNotifications,
        unreadCount: 2,
      });

      vi.mocked(api.delete).mockResolvedValueOnce({ data: {} });

      await useNotificationStore.getState().clearAll();

      const state = useNotificationStore.getState();
      expect(state.notifications).toEqual([]);
      expect(state.unreadCount).toBe(0);
      expect(api.delete).toHaveBeenCalledWith('/api/v1/notifications');
    });
  });

  describe('unread count tracking', () => {
    it('should correctly track unread count through multiple operations', async () => {
      // Start with empty state
      expect(useNotificationStore.getState().unreadCount).toBe(0);

      // Add unread notification
      useNotificationStore
        .getState()
        .addNotification(createMockNotification({ id: 'n1', isRead: false }));
      expect(useNotificationStore.getState().unreadCount).toBe(1);

      // Add another unread notification
      useNotificationStore
        .getState()
        .addNotification(createMockNotification({ id: 'n2', isRead: false }));
      expect(useNotificationStore.getState().unreadCount).toBe(2);

      // Add read notification
      useNotificationStore
        .getState()
        .addNotification(createMockNotification({ id: 'n3', isRead: true }));
      expect(useNotificationStore.getState().unreadCount).toBe(2);

      // Mark one as read
      vi.mocked(api.post).mockResolvedValueOnce({ data: {} });
      await useNotificationStore.getState().markAsRead('n1');
      expect(useNotificationStore.getState().unreadCount).toBe(1);

      // Delete unread notification
      vi.mocked(api.delete).mockResolvedValueOnce({ data: {} });
      await useNotificationStore.getState().deleteNotification('n2');
      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });

    it('should handle different notification types correctly', () => {
      const types: Notification['type'][] = [
        'message',
        'friend_request',
        'group_invite',
        'mention',
        'forum_reply',
        'system',
      ];

      types.forEach((type, index) => {
        useNotificationStore
          .getState()
          .addNotification(createMockNotification({ id: `notif-${index}`, type, isRead: false }));
      });

      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(6);
      expect(state.unreadCount).toBe(6);
    });
  });
});
