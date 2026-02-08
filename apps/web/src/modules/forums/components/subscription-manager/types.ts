/**
 * Subscription Manager Types
 *
 * Type definitions for the subscription manager module.
 *
 * @module modules/forums/components/subscription-manager/types
 */

export type NotificationMode = 'instant' | 'daily' | 'weekly' | 'none';
export type SubscriptionType = 'forum' | 'board' | 'thread';

export interface Subscription {
  id: string;
  type: SubscriptionType;
  targetId: string;
  targetName: string;
  targetPath?: string;
  notificationMode: NotificationMode;
  emailNotifications: boolean;
  pushNotifications: boolean;
  unreadCount: number;
  createdAt: Date;
}

export interface SubscriptionManagerProps {
  className?: string;
}

export interface SubscriptionCounts {
  all: number;
  forum: number;
  board: number;
  thread: number;
}
