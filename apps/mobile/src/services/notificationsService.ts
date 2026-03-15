/**
 * Notifications Service
 *
 * Backend API integration for notifications:
 * - Fetch notifications
 * - Mark as read
 * - Notification preferences
 * - Push token registration
 *
 * @module services/notificationsService
 * @since v0.9.0
 */

import api from '../lib/api';

// ==================== TYPES ====================

export type NotificationType =
  | 'message'
  | 'friend_request'
  | 'friend_accepted'
  | 'group_invite'
  | 'group_mention'
  | 'channel_mention'
  | 'forum_reply'
  | 'forum_mention'
  | 'achievement'
  | 'level_up'
  | 'streak_reminder'
  | 'quest_completed'
  | 'gift_received'
  | 'event_reminder'
  | 'event_invite'
  | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  imageUrl: string | null;
  actionUrl: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
  read: boolean;
  createdAt: string;
  expiresAt: string | null;
  sender: NotificationSender | null;
}

export interface NotificationSender {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface NotificationGroup {
  type: NotificationType;
  count: number;
  latestNotification: Notification;
  unreadCount: number;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
}

export interface PushToken {
  id: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceName: string | null;
  createdAt: string;
  lastUsedAt: string;
}

export interface NotificationPreference {
  type: NotificationType;
  enabled: boolean;
  push: boolean;
  email: boolean;
  inApp: boolean;
}

// ==================== NOTIFICATIONS API ====================

/**
 * Get notifications
 */
export async function getNotifications(options?: {
  limit?: number;
  offset?: number;
  type?: NotificationType;
  unreadOnly?: boolean;
}): Promise<Notification[]> {
  const params = {
    limit: options?.limit || 50,
    offset: options?.offset || 0,
    type: options?.type,
    unread_only: options?.unreadOnly,
  };
  const response = await api.get('/api/v1/notifications', { params });
  return (response.data.data || response.data.notifications || []).map(transformNotification);
}

/**
 * Get notification by ID
 */
export async function getNotification(notificationId: string): Promise<Notification> {
  const response = await api.get(`/api/v1/notifications/${notificationId}`);
  return transformNotification(response.data.data || response.data);
}

/**
 * Get grouped notifications
 */
export async function getGroupedNotifications(): Promise<NotificationGroup[]> {
  const response = await api.get('/api/v1/notifications/grouped');
  return (response.data.data || response.data.groups || []).map(transformNotificationGroup);
}

/**
 * Get notification stats
 */
export async function getNotificationStats(): Promise<NotificationStats> {
  const response = await api.get('/api/v1/notifications/stats');
  return transformNotificationStats(response.data.data || response.data);
}

/**
 * Get unread count
 */
export async function getUnreadCount(): Promise<number> {
  const response = await api.get('/api/v1/notifications/unread/count');
  return response.data.data?.count ?? response.data.count ?? 0;
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  await api.post(`/api/v1/notifications/${notificationId}/read`);
}

/**
 * Mark multiple notifications as read
 */
export async function markMultipleAsRead(notificationIds: string[]): Promise<void> {
  await api.post('/api/v1/notifications/read', { notification_ids: notificationIds });
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<void> {
  await api.post('/api/v1/notifications/read-all');
}

/**
 * Mark notifications of a type as read
 */
export async function markTypeAsRead(type: NotificationType): Promise<void> {
  await api.post('/api/v1/notifications/read-type', { type });
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  await api.delete(`/api/v1/notifications/${notificationId}`);
}

/**
 * Delete all notifications
 */
export async function deleteAllNotifications(): Promise<void> {
  await api.delete('/api/v1/notifications');
}

/**
 * Delete read notifications
 */
export async function deleteReadNotifications(): Promise<void> {
  await api.delete('/api/v1/notifications/read');
}

// ==================== PUSH TOKENS API ====================

/**
 * Register push token
 */
export async function registerPushToken(
  token: string,
  platform: 'ios' | 'android' | 'web',
  deviceName?: string
): Promise<PushToken> {
  const response = await api.post('/api/v1/notifications/push-tokens', {
    token,
    platform,
    device_name: deviceName,
  });
  return transformPushToken(response.data.data || response.data);
}

/**
 * Unregister push token
 */
export async function unregisterPushToken(token: string): Promise<void> {
  await api.delete('/api/v1/notifications/push-tokens', { data: { token } });
}

/**
 * Get registered push tokens
 */
export async function getPushTokens(): Promise<PushToken[]> {
  const response = await api.get('/api/v1/notifications/push-tokens');
  return (response.data.data || response.data.tokens || []).map(transformPushToken);
}

// ==================== PREFERENCES API ====================

/**
 * Get notification preferences
 */
export async function getNotificationPreferences(): Promise<NotificationPreference[]> {
  const response = await api.get('/api/v1/users/me/notification-preferences');
  return (response.data.data || response.data.preferences || []).map(
    transformNotificationPreference
  );
}

/**
 * Update notification preference
 */
export async function updateNotificationPreference(
  type: NotificationType,
  settings: Partial<Omit<NotificationPreference, 'type'>>
): Promise<NotificationPreference> {
  const response = await api.patch(`/api/v1/users/me/notification-preferences/${type}`, {
    enabled: settings.enabled,
    push: settings.push,
    email: settings.email,
    in_app: settings.inApp,
  });
  return transformNotificationPreference(response.data.data || response.data);
}

/**
 * Disable all notifications
 */
export async function disableAllNotifications(): Promise<void> {
  await api.post('/api/v1/users/me/notification-preferences/disable-all');
}

/**
 * Enable all notifications
 */
export async function enableAllNotifications(): Promise<void> {
  await api.post('/api/v1/users/me/notification-preferences/enable-all');
}

// ==================== TRANSFORMERS ====================

/** API response type for transform functions */
/** API response data 2014 typed as any at the boundary, return types enforce safety */
type ApiData = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

function transformNotificationSender(data: ApiData): NotificationSender | null {
  if (!data) return null;
  return {
    id: data.id,
    username: data.username,
    displayName: data.display_name || data.displayName || null,
    avatarUrl: data.avatar_url || data.avatarUrl || null,
  };
}

function transformNotification(data: ApiData): Notification {
  return {
    id: data.id,
    type: data.type,
    title: data.title,
    body: data.body || data.message || '',
    imageUrl: data.image_url || data.imageUrl || null,
    actionUrl: data.action_url || data.actionUrl || null,
    data: data.data || {},
    read: data.read ?? data.is_read ?? false,
    createdAt: data.created_at || data.createdAt,
    expiresAt: data.expires_at || data.expiresAt || null,
    sender: transformNotificationSender(data.sender),
  };
}

function transformNotificationGroup(data: ApiData): NotificationGroup {
  return {
    type: data.type,
    count: data.count || 0,
    latestNotification: transformNotification(
      data.latest_notification || data.latestNotification || data.latest
    ),
    unreadCount: data.unread_count ?? data.unreadCount ?? 0,
  };
}

function transformNotificationStats(data: ApiData): NotificationStats {
   
  const byType: Record<NotificationType, number> = {} as Record<NotificationType, number>;

  if (data.by_type) {
    Object.entries(data.by_type).forEach(([key, value]) => {
       
      byType[key as NotificationType] = value as number;
    });
  } else if (data.byType) {
    Object.entries(data.byType).forEach(([key, value]) => {
       
      byType[key as NotificationType] = value as number;
    });
  }

  return {
    total: data.total || 0,
    unread: data.unread || 0,
    byType,
  };
}

function transformPushToken(data: ApiData): PushToken {
  return {
    id: data.id,
    token: data.token,
    platform: data.platform,
    deviceName: data.device_name || data.deviceName || null,
    createdAt: data.created_at || data.createdAt,
    lastUsedAt: data.last_used_at || data.lastUsedAt,
  };
}

function transformNotificationPreference(data: ApiData): NotificationPreference {
  return {
    type: data.type,
    enabled: data.enabled ?? true,
    push: data.push ?? true,
    email: data.email ?? true,
    inApp: data.in_app ?? data.inApp ?? true,
  };
}
