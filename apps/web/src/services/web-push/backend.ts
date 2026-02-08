/**
 * Backend Push Registration
 *
 * Handles registering/unregistering push subscriptions with the backend API,
 * plus device identification helpers.
 */

import { createLogger } from '@/lib/logger';
import { api } from '@/lib/api';
import type { PushSubscriptionResult } from './types';

const logger = createLogger('WebPush:Backend');

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
      logger.debug(' Token registered with backend');
      return { success: true, subscription };
    }

    return {
      success: false,
      error: `Unexpected response: ${response.status}`,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(
      error instanceof Error ? error : new Error(String(error)),
      'Backend registration failed:',
      message
    );
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
    logger.debug(' Token unregistered from backend');
    return true;
  } catch (error: unknown) {
    logger.error(
      error instanceof Error ? error : new Error(String(error)),
      'unregisterPushFromBackend'
    );
    return false;
  }
}
