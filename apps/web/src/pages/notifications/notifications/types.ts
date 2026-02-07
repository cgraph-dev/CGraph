/**
 * Notifications Types
 *
 * Type definitions for the notifications page components.
 */

import type { Notification } from '@/modules/social/store';

export type NotificationFilter = 'all' | 'unread';

export interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
  onMarkAsRead: () => void;
  onDelete: () => void;
}

export interface NotificationHeaderProps {
  unreadCount: number;
  onMarkAllRead: () => void;
}

export interface NotificationFilterTabsProps {
  filter: NotificationFilter;
  onFilterChange: (filter: NotificationFilter) => void;
  unreadCount: number;
}

export interface NotificationListProps {
  notifications: Notification[];
  filter: NotificationFilter;
  onNotificationClick: (notification: Notification) => void;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export interface LoadMoreButtonProps {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}

export interface EmptyStateProps {
  filter: NotificationFilter;
}

// Re-export Notification type for convenience
export type { Notification } from '@/modules/social/store';
