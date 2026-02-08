/**
 * Web Push Notification Service
 *
 * Handles browser push notification registration:
 * - Service worker registration
 * - Permission requests
 * - Push subscription management
 * - Backend token synchronization
 *
 * @version 0.9.0
 */

// Types
export type { PushSubscriptionResult, WebPushState } from './types';

// Service worker & subscription management
export {
  isPushSupported,
  getNotificationPermission,
  registerServiceWorker,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
} from './service-worker';

// Backend registration
export { registerPushWithBackend, unregisterPushFromBackend } from './backend';

// Full registration flows & utilities
export {
  getPushState,
  registerForPushNotifications,
  unregisterFromPushNotifications,
  shouldPromptForPush,
  showTestNotification,
} from './registration';

// Default export for backwards compatibility
import { isPushSupported, getNotificationPermission } from './service-worker';
import {
  getPushState,
  registerForPushNotifications,
  unregisterFromPushNotifications,
  shouldPromptForPush,
  showTestNotification,
} from './registration';
import { subscribeToPush, unsubscribeFromPush } from './service-worker';
import { registerServiceWorker, requestNotificationPermission } from './service-worker';

export default {
  isPushSupported,
  getNotificationPermission,
  getPushState,
  registerServiceWorker,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  registerForPushNotifications,
  unregisterFromPushNotifications,
  shouldPromptForPush,
  showTestNotification,
};
