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

import { api } from '@/lib/api';

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

// VAPID public key - loaded from environment or fetched from API
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

// Cache for VAPID key fetched from API
let cachedVapidKey: string | null = null;

/**
 * Get VAPID public key (from env or API)
 */
async function getVapidPublicKey(): Promise<string | null> {
  // Return env key if available
  if (VAPID_PUBLIC_KEY) {
    return VAPID_PUBLIC_KEY;
  }

  // Return cached key
  if (cachedVapidKey) {
    return cachedVapidKey;
  }

  // Fetch from backend
  try {
    const response = await api.get('/api/v1/web-push/vapid-key');
    if (response.data?.data?.vapid_public_key) {
      cachedVapidKey = response.data.data.vapid_public_key;
      return cachedVapidKey;
    }
  } catch (error) {
    console.error('[WebPush] Failed to fetch VAPID key from backend:', error);
  }

  return null;
}

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
 * Register the service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[WebPush] Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[WebPush] Service worker registered:', registration.scope);

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;

    return registration;
  } catch (error) {
    console.error('[WebPush] Service worker registration failed:', error);
    return null;
  }
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    console.warn('[WebPush] Push notifications not supported');
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  console.log('[WebPush] Permission result:', permission);
  return permission;
}

/**
 * Convert a base64 string to Uint8Array (for VAPID key)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
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
      console.error('[WebPush] VAPID public key not available');
      return null;
    }

    const vapidPublicKey = urlBase64ToUint8Array(vapidKey);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidPublicKey as BufferSource,
    });

    console.log('[WebPush] Push subscription created');
    return subscription;
  } catch (error) {
    console.error('[WebPush] Push subscription failed:', error);
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
    console.log('[WebPush] Unsubscribed:', success);
    return success;
  } catch (error) {
    console.error('[WebPush] Unsubscribe failed:', error);
    return false;
  }
}

/**
 * Register push subscription with the backend
 */
export async function registerPushWithBackend(
  subscription: PushSubscription
): Promise<PushSubscriptionResult> {
  try {
    // Convert subscription to JSON for backend
    const subscriptionData = subscription.toJSON();

    const response = await api.post('/api/v1/web-push/subscribe', {
      subscription: {
        endpoint: subscriptionData.endpoint,
        keys: subscriptionData.keys,
        expirationTime: subscriptionData.expirationTime,
      },
      device_id: getDeviceId(),
      device_name: getBrowserName(),
    });

    if (response.status === 201 || response.status === 200) {
      console.log('[WebPush] Token registered with backend');
      return { success: true, subscription };
    }

    return {
      success: false,
      error: `Unexpected response: ${response.status}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[WebPush] Backend registration failed:', message);
    return { success: false, error: message };
  }
}

/**
 * Unregister push subscription from the backend
 */
export async function unregisterPushFromBackend(subscription: PushSubscription): Promise<boolean> {
  try {
    const subscriptionData = subscription.toJSON();

    await api.delete('/api/v1/web-push/unsubscribe', {
      data: { endpoint: subscriptionData.endpoint },
    });
    console.log('[WebPush] Token unregistered from backend');
    return true;
  } catch (error) {
    console.error('[WebPush] Backend unregistration failed:', error);
    return false;
  }
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
  } catch (error) {
    console.error('[WebPush] Unregistration failed:', error);
    return false;
  }
}

/**
 * Get or create a unique device ID for this browser
 */
function getDeviceId(): string {
  const storageKey = 'cgraph_device_id';
  let deviceId = localStorage.getItem(storageKey);

  if (!deviceId) {
    deviceId = `web-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(storageKey, deviceId);
  }

  return deviceId;
}

/**
 * Get a friendly browser name
 */
function getBrowserName(): string {
  const ua = navigator.userAgent;

  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';

  return 'Web Browser';
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
