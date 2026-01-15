/**
 * useNotifications Hook
 * 
 * React hook for accessing notification features throughout the app.
 * Provides notification list, unread counts, and management actions.
 * 
 * @module hooks/useNotifications
 * @since v0.9.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as notificationsService from '../services/notificationsService';
import { Notification, NotificationGroup, NotificationStats, NotificationType } from '../services/notificationsService';

const CACHE_DURATION = 30000; // 30 seconds

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface NotificationsState {
  notifications: Notification[];
  grouped: NotificationGroup[];
  stats: NotificationStats | null;
  unreadCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  hasMore: boolean;
}

interface UseNotificationsOptions {
  autoLoad?: boolean;
  limit?: number;
}

interface UseNotificationsReturn extends NotificationsState {
  // Refresh functions
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  refreshStats: () => Promise<void>;
  
  // Actions
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markTypeAsRead: (type: NotificationType) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  
  // Computed
  unreadNotifications: Notification[];
  readNotifications: Notification[];
}

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const { autoLoad = true, limit = 50 } = options;
  
  const [state, setState] = useState<NotificationsState>({
    notifications: [],
    grouped: [],
    stats: null,
    unreadCount: 0,
    isLoading: false,
    isRefreshing: false,
    error: null,
    hasMore: true,
  });

  const offsetRef = useRef(0);
  const cacheRef = useRef<{
    notifications?: CacheEntry<Notification[]>;
    stats?: CacheEntry<NotificationStats>;
  }>({});

  const isCacheValid = useCallback(<T>(entry?: CacheEntry<T>): entry is CacheEntry<T> => {
    if (!entry) return false;
    return Date.now() - entry.timestamp < CACHE_DURATION;
  }, []);

  // ==================== REFRESH FUNCTIONS ====================

  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, isRefreshing: true, error: null }));
    offsetRef.current = 0;
    
    try {
      const [notifications, unreadCount] = await Promise.all([
        notificationsService.getNotifications({ limit, offset: 0 }),
        notificationsService.getUnreadCount(),
      ]);
      
      cacheRef.current.notifications = { data: notifications, timestamp: Date.now() };
      
      setState(prev => ({
        ...prev,
        notifications,
        unreadCount,
        isRefreshing: false,
        hasMore: notifications.length >= limit,
      }));
      
      offsetRef.current = notifications.length;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isRefreshing: false,
        error: error.message || 'Failed to load notifications',
      }));
    }
  }, [limit]);

  const loadMore = useCallback(async () => {
    if (state.isLoading || !state.hasMore) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const newNotifications = await notificationsService.getNotifications({
        limit,
        offset: offsetRef.current,
      });
      
      setState(prev => ({
        ...prev,
        notifications: [...prev.notifications, ...newNotifications],
        isLoading: false,
        hasMore: newNotifications.length >= limit,
      }));
      
      offsetRef.current += newNotifications.length;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to load more notifications',
      }));
    }
  }, [limit, state.isLoading, state.hasMore]);

  const refreshStats = useCallback(async () => {
    try {
      const stats = await notificationsService.getNotificationStats();
      cacheRef.current.stats = { data: stats, timestamp: Date.now() };
      setState(prev => ({ ...prev, stats, unreadCount: stats.unread }));
    } catch (error) {
      console.error('Failed to refresh notification stats:', error);
    }
  }, []);

  // ==================== ACTIONS ====================

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationsService.markAsRead(notificationId);
      
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsService.markAllAsRead();
      
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, []);

  const markTypeAsRead = useCallback(async (type: NotificationType) => {
    try {
      await notificationsService.markTypeAsRead(type);
      
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(n =>
          n.type === type ? { ...n, read: true } : n
        ),
      }));
      
      // Refresh stats to get accurate count
      await refreshStats();
    } catch (error) {
      console.error('Failed to mark type as read:', error);
    }
  }, [refreshStats]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const notification = state.notifications.find(n => n.id === notificationId);
      
      await notificationsService.deleteNotification(notificationId);
      
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.filter(n => n.id !== notificationId),
        unreadCount: notification && !notification.read 
          ? Math.max(0, prev.unreadCount - 1) 
          : prev.unreadCount,
      }));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, [state.notifications]);

  const deleteAllNotifications = useCallback(async () => {
    try {
      await notificationsService.deleteAllNotifications();
      
      setState(prev => ({
        ...prev,
        notifications: [],
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
    }
  }, []);

  // ==================== COMPUTED VALUES ====================

  const unreadNotifications = state.notifications.filter(n => !n.read);
  const readNotifications = state.notifications.filter(n => n.read);

  // ==================== EFFECTS ====================

  useEffect(() => {
    if (autoLoad) {
      if (isCacheValid(cacheRef.current.notifications)) {
        setState(prev => ({
          ...prev,
          notifications: cacheRef.current.notifications!.data,
        }));
      } else {
        refresh();
      }
    }
  }, [autoLoad, refresh, isCacheValid]);

  return {
    ...state,
    refresh,
    loadMore,
    refreshStats,
    markAsRead,
    markAllAsRead,
    markTypeAsRead,
    deleteNotification,
    deleteAllNotifications,
    unreadNotifications,
    readNotifications,
  };
}

export default useNotifications;
