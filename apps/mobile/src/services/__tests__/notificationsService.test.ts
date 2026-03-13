/**
 * Tests for notificationsService
 * @module services/__tests__/notificationsService
 */

jest.mock('../../lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

import api from '../../lib/api';
import {
  getNotifications,
  getNotification,
  getGroupedNotifications,
  getNotificationStats,
  getUnreadCount,
  markAsRead,
  markMultipleAsRead,
  markAllAsRead,
  markTypeAsRead,
  deleteNotification,
  deleteAllNotifications,
  deleteReadNotifications,
  registerPushToken,
  unregisterPushToken,
  getPushTokens,
  getNotificationPreferences,
  updateNotificationPreference,
  disableAllNotifications,
  enableAllNotifications,
} from '../notificationsService';

const mockApi = api as jest.Mocked<typeof api>;

// ── Tests ──────────────────────────────────────────────────────────────

describe('notificationsService', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── getNotifications ───────────────────────────────────────────────

  describe('getNotifications', () => {
    it('fetches notifications with default params', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 'n1',
              type: 'message',
              title: 'New Message',
              body: 'Hello',
              read: false,
              created_at: '2024-01-01T00:00:00Z',
              sender: { id: 'u1', username: 'alice', display_name: 'Alice', avatar_url: '/a.jpg' },
            },
          ],
        },
      });

      const result = await getNotifications();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('n1');
      expect(result[0].sender?.displayName).toBe('Alice');
      expect(result[0].sender?.avatarUrl).toBe('/a.jpg');
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/notifications', {
        params: { limit: 50, offset: 0, type: undefined, unread_only: undefined },
      });
    });

    it('passes custom options', async () => {
      mockApi.get.mockResolvedValueOnce({ data: { data: [] } });

      await getNotifications({ limit: 10, offset: 5, type: 'friend_request', unreadOnly: true });

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/notifications', {
        params: { limit: 10, offset: 5, type: 'friend_request', unread_only: true },
      });
    });

    it('transforms snake_case fields', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          notifications: [
            {
              id: 'n1',
              type: 'system',
              title: 'T',
              message: 'fallback body',
              is_read: true,
              image_url: '/img.png',
              action_url: '/action',
              created_at: '2024-01-01',
              expires_at: '2024-12-31',
            },
          ],
        },
      });

      const result = await getNotifications();

      expect(result[0].body).toBe('fallback body');
      expect(result[0].read).toBe(true);
      expect(result[0].imageUrl).toBe('/img.png');
      expect(result[0].actionUrl).toBe('/action');
      expect(result[0].expiresAt).toBe('2024-12-31');
    });

    it('handles null sender', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: { data: [{ id: 'n1', type: 'system', title: 'T', created_at: '' }] },
      });

      const result = await getNotifications();
      expect(result[0].sender).toBeNull();
    });
  });

  // ── getNotification ────────────────────────────────────────────────

  describe('getNotification', () => {
    it('fetches a single notification', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: { data: { id: 'n1', type: 'message', title: 'T', created_at: '' } },
      });

      const result = await getNotification('n1');

      expect(result.id).toBe('n1');
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/notifications/n1');
    });
  });

  // ── getGroupedNotifications ────────────────────────────────────────

  describe('getGroupedNotifications', () => {
    it('fetches and transforms grouped notifications', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          data: [
            {
              type: 'message',
              count: 5,
              latest_notification: { id: 'n1', type: 'message', title: 'T', created_at: '' },
              unread_count: 3,
            },
          ],
        },
      });

      const result = await getGroupedNotifications();

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('message');
      expect(result[0].count).toBe(5);
      expect(result[0].unreadCount).toBe(3);
      expect(result[0].latestNotification.id).toBe('n1');
    });
  });

  // ── getNotificationStats ───────────────────────────────────────────

  describe('getNotificationStats', () => {
    it('fetches stats with by_type (snake_case)', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: { data: { total: 50, unread: 10, by_type: { message: 30, system: 20 } } },
      });

      const result = await getNotificationStats();

      expect(result.total).toBe(50);
      expect(result.unread).toBe(10);
      expect(result.byType.message).toBe(30);
      expect(result.byType.system).toBe(20);
    });

    it('fetches stats with byType (camelCase)', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: { data: { total: 10, unread: 2, byType: { friend_request: 3 } } },
      });

      const result = await getNotificationStats();
      expect(result.byType.friend_request).toBe(3);
    });
  });

  // ── getUnreadCount ─────────────────────────────────────────────────

  describe('getUnreadCount', () => {
    it('returns count from data.count', async () => {
      mockApi.get.mockResolvedValueOnce({ data: { count: 7 } });

      expect(await getUnreadCount()).toBe(7);
    });

    it('returns count from data.data.count', async () => {
      mockApi.get.mockResolvedValueOnce({ data: { data: { count: 3 } } });

      expect(await getUnreadCount()).toBe(3);
    });

    it('defaults to 0', async () => {
      mockApi.get.mockResolvedValueOnce({ data: {} });

      expect(await getUnreadCount()).toBe(0);
    });
  });

  // ── Mark as read ───────────────────────────────────────────────────

  describe('markAsRead', () => {
    it('marks a notification as read', async () => {
      mockApi.post.mockResolvedValueOnce({});

      await markAsRead('n1');

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/notifications/n1/read');
    });
  });

  describe('markMultipleAsRead', () => {
    it('marks multiple notifications as read', async () => {
      mockApi.post.mockResolvedValueOnce({});

      await markMultipleAsRead(['n1', 'n2', 'n3']);

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/notifications/read', {
        notification_ids: ['n1', 'n2', 'n3'],
      });
    });
  });

  describe('markAllAsRead', () => {
    it('marks all as read', async () => {
      mockApi.post.mockResolvedValueOnce({});
      await markAllAsRead();
      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/notifications/read-all');
    });
  });

  describe('markTypeAsRead', () => {
    it('marks type as read', async () => {
      mockApi.post.mockResolvedValueOnce({});
      await markTypeAsRead('friend_request');
      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/notifications/read-type', {
        type: 'friend_request',
      });
    });
  });

  // ── Delete ─────────────────────────────────────────────────────────

  describe('deleteNotification', () => {
    it('deletes a notification', async () => {
      mockApi.delete.mockResolvedValueOnce({});
      await deleteNotification('n1');
      expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/notifications/n1');
    });
  });

  describe('deleteAllNotifications', () => {
    it('deletes all', async () => {
      mockApi.delete.mockResolvedValueOnce({});
      await deleteAllNotifications();
      expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/notifications');
    });
  });

  describe('deleteReadNotifications', () => {
    it('deletes read notifications', async () => {
      mockApi.delete.mockResolvedValueOnce({});
      await deleteReadNotifications();
      expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/notifications/read');
    });
  });

  // ── Push tokens ────────────────────────────────────────────────────

  describe('registerPushToken', () => {
    it('registers a push token', async () => {
      mockApi.post.mockResolvedValueOnce({
        data: {
          data: {
            id: 'pt1',
            token: 'expo-token-123',
            platform: 'ios',
            device_name: 'iPhone 15',
            created_at: '2024-01-01',
            last_used_at: '2024-01-01',
          },
        },
      });

      const result = await registerPushToken('expo-token-123', 'ios', 'iPhone 15');

      expect(result.id).toBe('pt1');
      expect(result.token).toBe('expo-token-123');
      expect(result.platform).toBe('ios');
      expect(result.deviceName).toBe('iPhone 15');
      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/notifications/push-tokens', {
        token: 'expo-token-123',
        platform: 'ios',
        device_name: 'iPhone 15',
      });
    });
  });

  describe('unregisterPushToken', () => {
    it('unregisters a token', async () => {
      mockApi.delete.mockResolvedValueOnce({});
      await unregisterPushToken('token-abc');
      expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/notifications/push-tokens', {
        data: { token: 'token-abc' },
      });
    });
  });

  describe('getPushTokens', () => {
    it('fetches push tokens', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 'pt1',
              token: 'tok',
              platform: 'android',
              created_at: '',
              last_used_at: '',
            },
          ],
        },
      });

      const result = await getPushTokens();

      expect(result).toHaveLength(1);
      expect(result[0].platform).toBe('android');
    });
  });

  // ── Preferences ────────────────────────────────────────────────────

  describe('getNotificationPreferences', () => {
    it('fetches preferences', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: {
          data: [{ type: 'message', enabled: true, push: true, email: false, in_app: true }],
        },
      });

      const result = await getNotificationPreferences();

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('message');
      expect(result[0].inApp).toBe(true);
      expect(result[0].email).toBe(false);
    });

    it('defaults missing booleans to true', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: { data: [{ type: 'system' }] },
      });

      const result = await getNotificationPreferences();
      expect(result[0].enabled).toBe(true);
      expect(result[0].push).toBe(true);
      expect(result[0].email).toBe(true);
      expect(result[0].inApp).toBe(true);
    });
  });

  describe('updateNotificationPreference', () => {
    it('updates a preference', async () => {
      mockApi.patch.mockResolvedValueOnce({
        data: {
          data: { type: 'message', enabled: false, push: false, email: true, in_app: false },
        },
      });

      const result = await updateNotificationPreference('message', {
        enabled: false,
        push: false,
        email: true,
        inApp: false,
      });

      expect(result.type).toBe('message');
      expect(result.enabled).toBe(false);
      expect(mockApi.patch).toHaveBeenCalledWith(
        '/api/v1/users/me/notification-preferences/message',
        { enabled: false, push: false, email: true, in_app: false }
      );
    });
  });

  describe('disableAllNotifications', () => {
    it('disables all', async () => {
      mockApi.post.mockResolvedValueOnce({});
      await disableAllNotifications();
      expect(mockApi.post).toHaveBeenCalledWith(
        '/api/v1/users/me/notification-preferences/disable-all'
      );
    });
  });

  describe('enableAllNotifications', () => {
    it('enables all', async () => {
      mockApi.post.mockResolvedValueOnce({});
      await enableAllNotifications();
      expect(mockApi.post).toHaveBeenCalledWith(
        '/api/v1/users/me/notification-preferences/enable-all'
      );
    });
  });
});
