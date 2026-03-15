/**
 * Notification store implementation.
 * @module
 */
// Logger reserved for future debugging
// import { createLogger } from '@/lib/logger';
// const _logger = createLogger('NotificationStore');

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { api } from '@/lib/api';
import { ensureArray, extractPagination } from '@/lib/apiUtils';

/** Maximum notifications kept in memory to prevent unbounded growth. */
const MAX_NOTIFICATIONS = 200;

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
    avatarBorderId?: string | null;
    avatar_border_id?: string | null;
  };
  createdAt: string;
}

export interface NotificationState {
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
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set) => ({
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

           
          const responseData = response.data as Record<string, unknown>; // safe downcast – API response field

           
          const metaUnreadCount = (responseData?.meta as Record<string, number> | undefined) // safe downcast – API response field
            ?.unread_count;
          const calculatedUnreadCount = newNotifications.filter((n) => !n.isRead).length;

          set((state) => {
            const merged =
              page === 1 ? newNotifications : [...state.notifications, ...newNotifications];
            return {
              notifications: merged.slice(0, MAX_NOTIFICATIONS),
              unreadCount: metaUnreadCount ?? calculatedUnreadCount,
              hasMore,
              isLoading: false,
            };
          });
        } catch (error: unknown) {
          set({ isLoading: false });
          throw error;
        }
      },

      markAsRead: async (notificationId: string) => {
        await api.post(`/api/v1/notifications/${notificationId}/read`);
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      },

      markAllAsRead: async () => {
        await api.post('/api/v1/notifications/read');
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
        }));
      },

      deleteNotification: async (notificationId: string) => {
        await api.delete(`/api/v1/notifications/${notificationId}`);
        set((state) => {
          const notification = state.notifications.find((n) => n.id === notificationId);
          return {
            notifications: state.notifications.filter((n) => n.id !== notificationId),
            unreadCount:
              notification && !notification.isRead
                ? Math.max(0, state.unreadCount - 1)
                : state.unreadCount,
          };
        });
      },

      addNotification: (notification: Notification) => {
        set((state) => ({
          notifications: [notification, ...state.notifications].slice(0, MAX_NOTIFICATIONS),
          unreadCount: notification.isRead ? state.unreadCount : state.unreadCount + 1,
        }));
      },

      clearAll: async () => {
        await api.delete('/api/v1/notifications');
        set({ notifications: [], unreadCount: 0 });
      },

      reset: () =>
        set({
          notifications: [],
          unreadCount: 0,
          isLoading: false,
          hasMore: true,
        }),
    }),
    {
      name: 'NotificationStore',
      enabled: import.meta.env.DEV,
    }
  )
);
