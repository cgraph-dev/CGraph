/**
 * VAPID Key Management
 *
 * Handles VAPID public key retrieval from environment or API,
 * and base64-to-Uint8Array conversion for subscription.
 */

import { createLogger } from '@/lib/logger';
import { api } from '@/lib/api';

const logger = createLogger('WebPush:VAPID');

// VAPID public key - loaded from environment or fetched from API
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

// Cache for VAPID key fetched from API
let cachedVapidKey: string | null = null;

/**
 * Get VAPID public key (from env or API)
 */
export async function getVapidPublicKey(): Promise<string | null> {
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
  } catch (error: unknown) {
    logger.error(error instanceof Error ? error : new Error(String(error)), 'getVapidPublicKey');
  }

  return null;
}

/**
 * Convert a base64 string to Uint8Array (for VAPID key)
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
