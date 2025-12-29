import { create } from 'zustand';
import { api } from '@/lib/api';
import { ensureArray, extractPagination } from '@/lib/apiUtils';

export interface Notification {
  id: string;
  type: 'message' | 'friend_request' | 'group_invite' | 'mention' | 'forum_reply' | 'system';
  title: string;
  body: string;
  isRead: boolean;
  data: Record<string, unknown>;
  sender?: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  hasMore: boolean;

  // Actions
  fetchNotifications: (page?: number) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  addNotification: (notification: Notification) => void;
  clearAll: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  hasMore: true,

  fetchNotifications: async (page = 1) => {
    set({ isLoading: true });
    try {
      const response = await api.get('/api/v1/notifications', {
        params: { page, limit: 20 },
      });
      const newNotifications = ensureArray<Notification>(response.data, 'notifications');
      const meta = extractPagination(response.data);
      const hasMore = newNotifications.length === 20 || meta.hasMore;

      set((state) => ({
        notifications:
          page === 1
            ? newNotifications
            : [...state.notifications, ...newNotifications],
        unreadCount: typeof (response.data as Record<string, unknown>)?.meta === 'object'
          ? ((response.data as Record<string, { unread_count?: number }>).meta?.unread_count ?? newNotifications.filter((n) => !n.isRead).length)
          : newNotifications.filter((n) => !n.isRead).length,
        hasMore,
        isLoading: false,
      }));
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      await api.post(`/api/v1/notifications/${notificationId}/read`);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      throw error;
    }
  },

  markAllAsRead: async () => {
    try {
      await api.post('/api/v1/notifications/read');
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      throw error;
    }
  },

  deleteNotification: async (notificationId: string) => {
    try {
      await api.delete(`/api/v1/notifications/${notificationId}`);
      set((state) => {
        const notification = state.notifications.find((n) => n.id === notificationId);
        return {
          notifications: state.notifications.filter((n) => n.id !== notificationId),
          unreadCount: notification && !notification.isRead
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount,
        };
      });
    } catch (error) {
      throw error;
    }
  },

  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: notification.isRead ? state.unreadCount : state.unreadCount + 1,
    }));
  },

  clearAll: async () => {
    try {
      await api.delete('/api/v1/notifications');
      set({ notifications: [], unreadCount: 0 });
    } catch (error) {
      throw error;
    }
  },
}));
