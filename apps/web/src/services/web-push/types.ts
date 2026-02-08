/**
 * Web Push Notification Types
 *
 * Shared type definitions for the web push notification service.
 */

export interface PushSubscriptionResult {
  success: boolean;
  subscription?: PushSubscription;
  error?: string;
}

export interface WebPushState {
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
  registered: boolean;
}
