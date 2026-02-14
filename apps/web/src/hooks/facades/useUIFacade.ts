/**
 * UI Facade Hook
 *
 * Composition hook that aggregates notifications,
 * search, calendar, and plugin state into a single UI utilities interface.
 *
 * @example
 * ```tsx
 * const {
 *   notifications, unreadCount,
 *   searchResults, searchQuery,
 *   markAllRead, executeSearch,
 * } = useUIFacade();
 * ```
 *
 * @module hooks/facades/useUIFacade
 */

import { useMemo } from 'react';
import { useNotificationStore } from '@/modules/social/store';
import { useSearchStore } from '@/modules/search/store';
import { useCalendarStore } from '@/modules/settings/store';
import type { Notification } from '@/modules/social/store';
import type { CalendarEvent } from '@/modules/settings/store';
import type {
  SearchUser,
  SearchGroup,
  SearchForum,
  SearchPost,
  SearchMessage,
} from '@/modules/search/store';

export interface UIFacade {
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  isLoadingNotifications: boolean;
  fetchNotifications: (page?: number) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;

  // Search
  searchQuery: string;
  searchUsers: SearchUser[];
  searchGroups: SearchGroup[];
  searchForums: SearchForum[];
  searchPosts: SearchPost[];
  searchMessages: SearchMessage[];
  isSearching: boolean;
  setSearchQuery: (query: string) => void;
  executeSearch: (query: string) => Promise<void>;
  clearSearch: () => void;

  // Calendar
  events: CalendarEvent[];
  fetchEvents: () => Promise<void>;
}

/**
 * Composes notifications, search, calendar, and plugin state.
 */
export function useUIFacade(): UIFacade {
  // Notifications
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const isLoadingNotifications = useNotificationStore((s) => s.isLoading);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  // Search
  const searchQuery = useSearchStore((s) => s.query);
  const searchUsers = useSearchStore((s) => s.users);
  const searchGroups = useSearchStore((s) => s.groups);
  const searchForums = useSearchStore((s) => s.forums);
  const searchPosts = useSearchStore((s) => s.posts);
  const searchMessages = useSearchStore((s) => s.messages);
  const isSearching = useSearchStore((s) => s.isLoading);
  const setSearchQuery = useSearchStore((s) => s.setQuery);
  const executeSearch = useSearchStore((s) => s.search);
  const clearSearch = useSearchStore((s) => s.clearResults);

  // Calendar
  const events = useCalendarStore((s) => s.events);
  const fetchEvents = useCalendarStore((s) => s.fetchEvents);

  return useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoadingNotifications,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      searchQuery,
      searchUsers,
      searchGroups,
      searchForums,
      searchPosts,
      searchMessages,
      isSearching,
      setSearchQuery,
      executeSearch,
      clearSearch,
      events,
      fetchEvents,
    }),
    [
      notifications,
      unreadCount,
      isLoadingNotifications,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      searchQuery,
      searchUsers,
      searchGroups,
      searchForums,
      searchPosts,
      searchMessages,
      isSearching,
      setSearchQuery,
      executeSearch,
      clearSearch,
      events,
      fetchEvents,
    ]
  );
}
