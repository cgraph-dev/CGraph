/**
 * Service Worker & Push Subscription Management
 *
 * Handles service worker registration, permission requests,
 * and push subscription creation/removal.
 */

import { createLogger } from '@/lib/logger';
import { getVapidPublicKey, urlBase64ToUint8Array } from './vapid';

const logger = createLogger('WebPush:SW');

/**
 * Check if push notifications are supported in the browser
 */
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/**
 * Get the current notification permission status
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Register the service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    logger.warn(' Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    logger.debug(' Service worker registered:', registration.scope);

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;

    return registration;
  } catch (error: unknown) {
    logger.error(
      error instanceof Error ? error : new Error(String(error)),
      'registerServiceWorker'
    );
    return null;
  }
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    logger.warn(' Push notifications not supported');
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  logger.debug(' Permission result:', permission);
  return permission;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  try {
    const vapidKey = await getVapidPublicKey();
    if (!vapidKey) {
      logger.error(new Error('VAPID public key not available'), 'subscribeToPush failed');
      return null;
    }

    const vapidPublicKey = urlBase64ToUint8Array(vapidKey);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidPublicKey as BufferSource,
    });

    logger.debug(' Push subscription created');
    return subscription;
  } catch (error: unknown) {
    logger.error(error instanceof Error ? error : new Error(String(error)), 'subscribeToPush');
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return true;
    }

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      return true;
    }

    const success = await subscription.unsubscribe();
    logger.debug(' Unsubscribed:', success);
    return success;
  } catch (error: unknown) {
    logger.error(error instanceof Error ? error : new Error(String(error)), 'unsubscribeFromPush');
    return false;
  }
}
