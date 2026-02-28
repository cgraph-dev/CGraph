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
import { storeKEMPreKey, storeOPKPrivateKeys } from '../e2ee-secure/key-storage';
import { generateKEMPreKey } from '../protocol';
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

    if (isSetUp) {
      // Existing keys found — load identity, initialize session manager
      let fp: string | null = null;
      const identityKey = await loadIdentityKeyPair();
      if (identityKey) {
        const publicKey = await exportPublicKey(identityKey.keyPair.publicKey);
        fp = await fingerprint(publicKey);
      }

      await sessionManager.initialize();
      sessionManager.setUseTripleRatchet(true);
      logger.log('Session manager initialized — PQXDH + Triple Ratchet enabled');

      set({
        isInitialized: true,
        deviceId,
        fingerprint: fp,
        useTripleRatchet: true,
        isLoading: false,
      });

      get()
        .getPrekeyCount()
        .catch((err: unknown) => logger.error('Failed to get prekey count:', err));
    } else {
      // Auto-bootstrap: generate key bundle transparently on first login
      logger.log('E2EE not set up — auto-bootstrapping key bundle');
      try {
        await get().setupE2EE();
        // setupE2EE sets isInitialized, deviceId, fingerprint, isLoading
        // Now initialize session manager with PQXDH enabled
        await sessionManager.initialize();
        sessionManager.setUseTripleRatchet(true);
        set({ useTripleRatchet: true });
        logger.log('Auto-bootstrap complete — PQXDH + Triple Ratchet enabled');
      } catch (setupErr) {
        logger.error('Auto-bootstrap failed:', setupErr);
        set({
          isLoading: false,
          error:
            setupErr instanceof Error ? setupErr.message : 'Failed to auto-bootstrap E2EE',
        });
      }
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
export const createSetupE2EE = (set: Set, _get: Get) => async (): Promise<void> => {
  try {
    set({ isLoading: true, error: null });

    const deviceId = generateDeviceId();
    const bundle: KeyBundle = await generateKeyBundle(deviceId, 100);
    await storeKeyBundle(bundle);

    // Persist OPK private keys for responder-side X3DH/PQXDH
    const opkEntries = bundle.oneTimePreKeys.map((pk) => ({
      keyId: String(pk.keyId),
      privateKey: pk.keyPair.privateKey,
    }));
    await storeOPKPrivateKeys(opkEntries);

    const registrationData = await formatKeysForRegistration(bundle);

    // Generate and store KEM prekey for post-quantum sessions
    // Even if Triple Ratchet is currently disabled, we publish KEM keys
    // so other clients can opportunistically use PQXDH when they enable it.
    let kemRegistrationData: Record<string, unknown> = {};
    try {
      const { exportPublicKey: expPub, arrayBufferToBase64: ab64 } = await import('../e2ee');
      const identityKey = await loadIdentityKeyPair();
      if (identityKey?.signingKeyPair) {
        const signingECKeyPair: import('@cgraph/crypto/x3dh').ECKeyPair = {
          publicKey: identityKey.signingKeyPair.publicKey,
          privateKey: identityKey.signingKeyPair.privateKey,
          rawPublicKey: new Uint8Array(await expPub(identityKey.signingKeyPair.publicKey)),
        };

        const { kemKeyPair, kyberPreKeyId, kyberPreKeySignature } =
          await generateKEMPreKey(signingECKeyPair);

        // Store KEM secret key locally (critical for Bob-side PQ acceptance)
        await storeKEMPreKey(kyberPreKeyId, kemKeyPair.secretKey);

        // Include KEM public key in server registration
        kemRegistrationData = {
          kyber_prekey: ab64(new Uint8Array(kemKeyPair.publicKey).buffer),
          kyber_prekey_id: kyberPreKeyId,
          kyber_prekey_signature: ab64(new Uint8Array(kyberPreKeySignature).buffer),
        };
        logger.log(`Generated KEM prekey (id: ${kyberPreKeyId}) for PQ session support`);
      }
    } catch (kemErr) {
      // Non-fatal: PQ key generation failure should not block classical E2EE setup
      logger.error('Failed to generate KEM prekey (PQ sessions unavailable):', kemErr);
    }

    await api.post('/api/v1/e2ee/keys', { ...registrationData, ...kemRegistrationData });

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

    const { deviceId } = get();

    if (deviceId) {
      try {
        await api.delete(`/api/v1/e2ee/keys/${deviceId}`);
      } catch {
        // Ignore error if already revoked
      }
    }

    await clearE2EEData();
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
 * Enable or disable PQXDH + Triple Ratchet for new sessions.
 * When enabled, new sessions with recipients that publish KEM prekeys
 * will use post-quantum key exchange and the Triple Ratchet protocol.
 */
export const createSetUseTripleRatchet =
  (set: Set) =>
  (enabled: boolean): void => {
    sessionManager.setUseTripleRatchet(enabled);
    set({ useTripleRatchet: enabled });
    logger.log(`Triple Ratchet (PQXDH) mode ${enabled ? 'enabled' : 'disabled'}`);
  };

/**
 * Get the protocol version for an existing session with a recipient.
 */
export const createGetSessionProtocol = () => (recipientId: string) => {
  return sessionManager.getSessionProtocol(recipientId);
};

/**
 * Clear error.
 */
export const createClearError = (set: Set) => (): void => {
  set({ error: null });
};
