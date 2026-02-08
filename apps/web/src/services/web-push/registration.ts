/**
 * Push Notification Registration Flows
 *
 * Orchestrates the full registration/unregistration flows
 * and provides utility functions for push state management.
 */

import { createLogger } from '@/lib/logger';
import type { PushSubscriptionResult, WebPushState } from './types';
import {
  isPushSupported,
  registerServiceWorker,
  requestNotificationPermission,
  subscribeToPush,
} from './service-worker';
import { registerPushWithBackend, unregisterPushFromBackend } from './backend';

const logger = createLogger('WebPush:Registration');

/**
 * Get the current push notification state
 */
export async function getPushState(): Promise<WebPushState> {
  if (!isPushSupported()) {
    return {
      supported: false,
      permission: 'unsupported',
      registered: false,
    };
  }

  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = registration ? await registration.pushManager.getSubscription() : null;

  return {
    supported: true,
    permission: Notification.permission,
    registered: !!subscription,
  };
}

/**
 * Full push notification registration flow
 */
export async function registerForPushNotifications(): Promise<PushSubscriptionResult> {
  if (!isPushSupported()) {
    return { success: false, error: 'Push notifications not supported' };
  }

  // Step 1: Request permission
  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    return { success: false, error: 'Permission not granted' };
  }

  // Step 2: Register service worker
  const registration = await registerServiceWorker();
  if (!registration) {
    return { success: false, error: 'Service worker registration failed' };
  }

  // Step 3: Subscribe to push
  const subscription = await subscribeToPush(registration);
  if (!subscription) {
    return { success: false, error: 'Push subscription failed' };
  }

  // Step 4: Register with backend
  return registerPushWithBackend(subscription);
}

/**
 * Full unregistration flow
 */
export async function unregisterFromPushNotifications(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return true;
    }

    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      // Unregister from backend first
      await unregisterPushFromBackend(subscription);
      // Then unsubscribe locally
      await subscription.unsubscribe();
    }

    return true;
  } catch (error: unknown) {
    logger.error(
      error instanceof Error ? error : new Error(String(error)),
      'unregisterFromPushNotifications'
    );
    return false;
  }
}

/**
 * Check if we should prompt for push notification permission
 */
export function shouldPromptForPush(): boolean {
  if (!isPushSupported()) return false;

  const permission = Notification.permission;
  return permission === 'default';
}

/**
 * Show a browser notification (for testing)
 */
export async function showTestNotification(): Promise<boolean> {
  if (!isPushSupported()) return false;

  if (Notification.permission !== 'granted') {
    await requestNotificationPermission();
  }

  if (Notification.permission !== 'granted') return false;

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return false;

  await registration.showNotification('CGraph', {
    body: 'Push notifications are working!',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'test-notification',
    data: {
      url: '/settings/notifications',
      type: 'test',
    },
  });

  return true;
}
