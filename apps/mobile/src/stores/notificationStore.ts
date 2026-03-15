/**
 * Mobile Notification Store
 *
 * Real Zustand store for push/in-app notifications.
 * Leverages the existing API client for notification CRUD.
 * Real-time delivery is handled via the addNotification mutation,
 * called from the socket layer when notification events arrive.
 *
 * @module stores/notificationStore
 * @since v0.9.31
 */

import { create } from 'zustand';
import api from '../lib/api';

// ── Types ──────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  readAt: string | null;
  createdAt: string;
  actor?: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
}

function normalizeNotification(raw: Record<string, unknown>): Notification {
   
  const actor = raw.actor as Record<string, unknown> | undefined;
  return {
     
    id: raw.id as string,

     
    type: (raw.type || 'general') as string,

    title: String(raw.title || ''),

    body: String(raw.body || raw.message || ''),

     
    data: (raw.data || raw.metadata || {}) as Record<string, unknown>,

     
    read: (raw.read ?? raw.is_read ?? false) as boolean,

     
    readAt: (raw.read_at || raw.readAt || null) as string | null,

    createdAt: String(raw.created_at || raw.createdAt || raw.inserted_at || ''),
    actor: actor
      ? {
          id: String(actor.id || ''),

          username: String(actor.username || ''),

           
          avatarUrl: (actor.avatar_url || actor.avatarUrl || null) as string | null,
        }
      : undefined,
  };
}

// ── Store Interface ────────────────────────────────────────────────────

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  hasMore: boolean;
  currentPage: number;

  // Actions
  fetchNotifications: (reset?: boolean) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAll: () => Promise<void>;

  // Socket mutation
  addNotification: (notification: Notification) => void;
  reset: () => void;
}

// ── Store ──────────────────────────────────────────────────────────────

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  hasMore: true,
  currentPage: 1,

  fetchNotifications: async (reset = false) => {
    const page = reset ? 1 : get().currentPage;
    set({ isLoading: true });
    try {
      const response = await api.get('/api/v1/notifications', {
        params: { page, limit: 20 },
      });
      const raw = response.data?.notifications || response.data?.data || response.data || [];
      const notifications = (Array.isArray(raw) ? raw : []).map((n: Record<string, unknown>) =>
        normalizeNotification(n)
      );
      const hasMore = notifications.length === 20;
      const unreadCount = response.data?.unread_count ?? response.data?.unreadCount;

      set((state) => ({
        notifications: reset
          ? notifications
          : [...state.notifications, ...notifications].slice(0, 200),
        hasMore,
        currentPage: page + 1,
        isLoading: false,
        unreadCount:
          unreadCount !== undefined
            ? unreadCount
            : (reset
                ? notifications
                : [...state.notifications, ...notifications].slice(0, 200)
              ).filter((n) => !n.read).length,
      }));
    } catch {
      set({ isLoading: false });
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      await api.post(`/api/v1/notifications/${notificationId}/read`);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true, readAt: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch {
      // silently fail
    }
  },

  markAllAsRead: async () => {
    try {
      await api.post('/api/v1/notifications/read');
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          read: true,
          readAt: n.readAt || new Date().toISOString(),
        })),
        unreadCount: 0,
      }));
    } catch {
      // silently fail
    }
  },

  deleteNotification: async (notificationId: string) => {
    try {
      await api.delete(`/api/v1/notifications/${notificationId}`);
      set((state) => {
        const notification = state.notifications.find((n) => n.id === notificationId);
        return {
          notifications: state.notifications.filter((n) => n.id !== notificationId),
          unreadCount:
            notification && !notification.read
              ? Math.max(0, state.unreadCount - 1)
              : state.unreadCount,
        };
      });
    } catch {
      // silently fail
    }
  },

  clearAll: async () => {
    try {
      await api.delete('/api/v1/notifications');
      set({ notifications: [], unreadCount: 0 });
    } catch {
      // silently fail
    }
  },

  addNotification: (notification: Notification) => {
    set((state) => {
      if (state.notifications.some((n) => n.id === notification.id)) return state;
      return {
        notifications: [notification, ...state.notifications],
        unreadCount: notification.read ? state.unreadCount : state.unreadCount + 1,
      };
    });
  },
  reset: () =>
    set({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      hasMore: true,
      currentPage: 1,
    }),
}));

// ── Selector hooks ───────────────────────────────────────────────────

export const useUnreadCount = () => useNotificationStore((s) => s.unreadCount);
export const useNotifications = () => useNotificationStore((s) => s.notifications);

export default useNotificationStore;
