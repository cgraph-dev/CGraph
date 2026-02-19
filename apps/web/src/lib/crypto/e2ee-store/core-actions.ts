/**
 * E2EE Store — Core Actions
 *
 * Initialization, setup, reset, bundle caching, and settings actions.
 *
 * @module lib/crypto/e2ee-store/core-actions
 */

import type { StoreApi } from 'zustand';
import { api } from '@/lib/api';
import { e2eeLogger as logger } from '../../logger';
import {
  isE2EESetUp,
  generateKeyBundle,
  storeKeyBundle,
  formatKeysForRegistration,
  loadIdentityKeyPair,
  getDeviceId,
  generateDeviceId,
  clearE2EEData,
  exportPublicKey,
  fingerprint,
  type KeyBundle,
} from '../e2ee';
import { sessionManager } from '../sessionManager';
import type { E2EEState, BundleCacheEntry } from './types';
import { BUNDLE_CACHE_TTL } from './types';

type Get = StoreApi<E2EEState>['getState'];
type Set = StoreApi<E2EEState>['setState'];

/**
 * Initialize E2EE state from storage.
 */
export const createInitialize = (set: Set, get: Get) => async (): Promise<void> => {
  try {
    set({ isLoading: true, error: null });

    const isSetUp = await isE2EESetUp();
    const deviceId = await getDeviceId();

    let fp: string | null = null;
    if (isSetUp) {
      const identityKey = await loadIdentityKeyPair();
      if (identityKey) {
        const publicKey = await exportPublicKey(identityKey.keyPair.publicKey);
        fp = await fingerprint(publicKey);
      }

      await sessionManager.initialize();
      logger.log('Session manager initialized with Double Ratchet support');
    }

    set({
      isInitialized: isSetUp,
      deviceId,
      fingerprint: fp,
      isLoading: false,
    });

    if (isSetUp) {
      get()
        .getPrekeyCount()
        .catch((err: unknown) => logger.error('Failed to get prekey count:', err));
    }
  } catch (error) {
    set({
      isLoading: false,
      error: error instanceof Error ? error.message : 'Failed to initialize E2EE',
    });
  }
};

/**
 * Set up E2EE for this device.
 */
export const createSetupE2EE = (set: Set) => async (): Promise<void> => {
  try {
    set({ isLoading: true, error: null });

    const deviceId = generateDeviceId();
    const bundle: KeyBundle = await generateKeyBundle(deviceId, 100);
    await storeKeyBundle(bundle);

    const registrationData = await formatKeysForRegistration(bundle);
    await api.post('/api/v1/e2ee/keys', registrationData);

    const publicKey = await exportPublicKey(bundle.identityKey.keyPair.publicKey);
    const fp = await fingerprint(publicKey);

    set({
      isInitialized: true,
      deviceId,
      fingerprint: fp,
      prekeyCount: 100,
      isLoading: false,
    });
  } catch (error) {
    set({
      isLoading: false,
      error: error instanceof Error ? error.message : 'Failed to set up E2EE',
    });
    throw error;
  }
};

/**
 * Reset E2EE (clear all keys).
 */
export const createResetE2EE = (set: Set, get: Get) => async (): Promise<void> => {
  try {
    set({ isLoading: true });

    const deviceId = get().deviceId;

    if (deviceId) {
      try {
        await api.delete(`/api/v1/e2ee/keys/${deviceId}`);
      } catch {
        // Ignore error if already revoked
      }
    }

    clearE2EEData();
    await sessionManager.destroyAllSessions();

    set({
      isInitialized: false,
      deviceId: null,
      fingerprint: null,
      prekeyCount: 0,
      bundleCache: new Map(),
      isLoading: false,
    });
  } catch (error) {
    set({
      isLoading: false,
      error: error instanceof Error ? error.message : 'Failed to reset E2EE',
    });
    throw error;
  }
};

/**
 * Get prekey bundle for a recipient (with caching).
 */
export const createGetRecipientBundle =
  (set: Set, get: Get) =>
  async (recipientId: string): Promise<BundleCacheEntry['bundle']> => {
    const { bundleCache } = get();
    const cached = bundleCache.get(recipientId);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.bundle;
    }

    const response = await api.get(`/api/v1/e2ee/bundle/${recipientId}`);
    const bundle = response.data.data || response.data;

    bundleCache.set(recipientId, {
      bundle,
      expiresAt: Date.now() + BUNDLE_CACHE_TTL,
    });

    set({ bundleCache: new Map(bundleCache) });
    return bundle;
  };

/**
 * Handle a key revocation event from another user.
 */
export const createHandleKeyRevoked =
  (set: Set, get: Get) =>
  (userId: string, keyId: string): void => {
    logger.log(`Key revoked for user ${userId}: ${keyId}`);

    const { bundleCache } = get();
    bundleCache.delete(userId);
    set({ bundleCache: new Map(bundleCache) });

    sessionManager.destroySession(userId).catch((err) => {
      logger.error(`Failed to destroy ratchet session for ${userId}:`, err);
    });

    logger.log(
      `Cleared prekey bundle cache and ratchet session for user ${userId} due to key revocation`
    );
  };

/**
 * Enable or disable Double Ratchet mode.
 */
export const createSetUseDoubleRatchet =
  (set: Set) =>
  (enabled: boolean): void => {
    set({ useDoubleRatchet: enabled });
    logger.log(`Double Ratchet mode ${enabled ? 'enabled' : 'disabled'}`);
  };

/**
 * Clear error.
 */
export const createClearError = (set: Set) => (): void => {
  set({ error: null });
};
