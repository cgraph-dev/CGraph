/**
 * Web Push Notification Service
 *
 * Re-export barrel — all implementation lives in ./web-push/
 *
 * @version 0.9.0
 */

export type { PushSubscriptionResult, WebPushState } from './web-push/types';

export {
  isPushSupported,
  getNotificationPermission,
  registerServiceWorker,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
} from './web-push/service-worker';

export { registerPushWithBackend, unregisterPushFromBackend } from './web-push/backend';

export {
  getPushState,
  registerForPushNotifications,
  unregisterFromPushNotifications,
  shouldPromptForPush,
  showTestNotification,
} from './web-push/registration';

// Default export for backwards compatibility
import { isPushSupported, getNotificationPermission } from './web-push/service-worker';
import {
  getPushState,
  registerForPushNotifications,
  unregisterFromPushNotifications,
  shouldPromptForPush,
  showTestNotification,
} from './web-push/registration';
import { subscribeToPush, unsubscribeFromPush } from './web-push/service-worker';
import { registerServiceWorker, requestNotificationPermission } from './web-push/service-worker';

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
