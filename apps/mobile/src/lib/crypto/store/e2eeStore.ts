/**
 * E2EE Zustand Store for Mobile App
 *
 * Provides encryption functionality via Zustand instead of React Context.
 * Replaces E2EEContext.tsx with a standalone store.
 */

import { create } from 'zustand';
import { AppState } from 'react-native';
import * as Device from 'expo-device';
import { useEffect } from 'react';
import api from '../../api';
import { e2eeLogger as logger } from '../../logger';
import e2ee, {
  type KeyBundle,
  type ServerPrekeyBundle,
  type EncryptedMessage,
  isE2EESetUp,
  generateKeyBundle,
  storeKeyBundle,
  formatKeysForRegistration,
  encryptForRecipient,
  loadIdentityKeyPair,
  loadSignedPreKeyPrivate,
  x3dhRespond,
  getDeviceId,
  clearE2EEData,
  generateSafetyNumber,
  fingerprint,
  bundleSupportsPQ,
  loadKEMPreKey,
} from '../e2ee';
import { Buffer } from 'buffer';

// ── Types ────────────────────────────────────────────────────────────────────

interface E2EEState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
}

interface E2EEActions {
  /** Check if E2EE is already set up */
  checkStatus: () => Promise<void>;
  /** Initialize E2EE for this device */
  setupE2EE: () => Promise<void>;
  /** Reset E2EE (clear all keys) */
  resetE2EE: () => Promise<void>;
  /** Encrypt a message for a recipient */
  encryptMessage: (recipientId: string, plaintext: string) => Promise<EncryptedMessage>;
  /** Decrypt a received message */
  decryptMessage: (senderId: string, encryptedMessage: EncryptedMessage) => Promise<string>;
  /** Upload additional one-time prekeys */
  uploadMorePrekeys: (count?: number) => Promise<number>;
  /** Get current prekey count from server */
  getPrekeyCount: () => Promise<number>;
  /** Handle a key revocation event */
  handleKeyRevoked: (userId: string, keyId: string) => void;
  /** Get safety number for key verification */
  getSafetyNumber: (userId: string) => Promise<string>;
  /** Get fingerprint of our identity key */
  getFingerprint: () => Promise<string | null>;
  /** Get all registered devices */
  getDevices: () => Promise<Array<{ device_id: string; created_at: string }>>;
  /** Revoke a device's keys */
  revokeDevice: (deviceId: string) => Promise<void>;
}

export type E2EEStore = E2EEState & E2EEActions;

// ── Prekey bundle cache (module-level) ──────────────────────────────────────

const prekeyBundleCache = new Map<string, { bundle: ServerPrekeyBundle; expiresAt: number }>();
const BUNDLE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getRecipientBundle(recipientId: string): Promise<ServerPrekeyBundle> {
  const cached = prekeyBundleCache.get(recipientId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.bundle;
  }

  const response = await api.get(`/api/v1/e2ee/bundle/${recipientId}`);
  const bundle = response.data.data || response.data;

  prekeyBundleCache.set(recipientId, {
    bundle,
    expiresAt: Date.now() + BUNDLE_CACHE_TTL,
  });

  return bundle;
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useE2EEStore = create<E2EEStore>((set, get) => ({
  // State
  isInitialized: false,
  isLoading: true,
  error: null,

  // Actions
  checkStatus: async () => {
    try {
      set({ isLoading: true });
      const isSetUp = await isE2EESetUp();
      set({ isInitialized: isSetUp });
    } catch (err) {
      logger.error('Error checking E2EE status:', err);
      set({ error: 'Failed to check encryption status' });
    } finally {
      set({ isLoading: false });
    }
  },

  setupE2EE: async () => {
    try {
      set({ isLoading: true, error: null });

      const deviceId = `${Device.modelName || 'unknown'}_${Date.now()}`;
      const bundle: KeyBundle = await generateKeyBundle(deviceId, 100);
      await storeKeyBundle(bundle);

      // Include KEM prekey in registration if one exists (Phase 2: auto-generate)
      const kemPreKey = await loadKEMPreKey();
      const registrationData = formatKeysForRegistration(
        bundle,
        kemPreKey
          ? {
              keyId: kemPreKey.keyId,
              publicKey: kemPreKey.publicKey,
              signature: kemPreKey.signature,
            }
          : undefined
      );
      await api.post('/api/v1/e2ee/keys', registrationData);

      set({ isInitialized: true });
    } catch (err) {
      logger.error('Error setting up E2EE:', err);
      set({ error: 'Failed to set up encryption' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  resetE2EE: async () => {
    try {
      set({ isLoading: true });

      await clearE2EEData();

      const deviceId = await getDeviceId();
      if (deviceId) {
        try {
          await api.delete(`/api/v1/e2ee/keys/${deviceId}`);
        } catch {
          // Ignore error if already revoked
        }
      }

      set({ isInitialized: false });
      prekeyBundleCache.clear();
    } catch (err) {
      logger.error('Error resetting E2EE:', err);
      set({ error: 'Failed to reset encryption' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  encryptMessage: async (recipientId: string, plaintext: string): Promise<EncryptedMessage> => {
    if (!get().isInitialized) {
      throw new Error('E2EE not initialized');
    }

    const recipientBundle = await getRecipientBundle(recipientId);
    return await encryptForRecipient(plaintext, recipientBundle);
  },

  decryptMessage: async (
    _senderId: string,
    encryptedMessage: EncryptedMessage
  ): Promise<string> => {
    if (!get().isInitialized) {
      throw new Error('E2EE not initialized');
    }

    const identityKey = await loadIdentityKeyPair();
    if (!identityKey) {
      throw new Error('Identity key not found');
    }

    // Load signed prekey private for X3DH responder side
    const signedPreKeyPkcs8 = await loadSignedPreKeyPrivate();
    if (!signedPreKeyPkcs8) {
      throw new Error('Signed prekey not found — cannot derive shared secret');
    }

    const senderIdentityKey = new Uint8Array(
      Buffer.from(encryptedMessage.senderIdentityKey, 'base64')
    );
    const ephemeralPublic = new Uint8Array(
      Buffer.from(encryptedMessage.ephemeralPublicKey, 'base64')
    );
    const nonce = Buffer.from(encryptedMessage.nonce, 'base64');
    const ciphertext = Buffer.from(encryptedMessage.ciphertext, 'base64');

    // Perform X3DH key agreement (responder side) — mirrors initiator's ECDH
    const { sharedSecret } = await x3dhRespond(
      identityKey,
      signedPreKeyPkcs8,
      senderIdentityKey,
      ephemeralPublic
    );

    return await e2ee.decryptMessage(
      new Uint8Array(ciphertext),
      new Uint8Array(nonce),
      sharedSecret
    );
  },

  uploadMorePrekeys: async (count: number = 50): Promise<number> => {
    if (!get().isInitialized) {
      throw new Error('E2EE not initialized');
    }

    const prekeys: Array<{ key_id: string; public_key: string }> = [];

    for (let i = 0; i < count; i++) {
      const prekey = await e2ee.generatePreKeyPair();
      prekeys.push({
        key_id: prekey.keyId,
        public_key: Buffer.from(prekey.publicKey).toString('base64'),
      });
    }

    const response = await api.post('/api/v1/e2ee/prekeys', { prekeys });
    return response.data.data?.count || count;
  },

  getPrekeyCount: async (): Promise<number> => {
    const response = await api.get('/api/v1/e2ee/prekeys/count');
    return response.data.data?.count || 0;
  },

  handleKeyRevoked: (userId: string, keyId: string) => {
    logger.log(`Key revoked for user ${userId}: ${keyId}`);
    prekeyBundleCache.delete(userId);
    logger.log(`Cleared prekey bundle cache for user ${userId} due to key revocation`);
  },

  getSafetyNumber: async (userId: string): Promise<string> => {
    if (!get().isInitialized) {
      throw new Error('E2EE not initialized');
    }

    const identityKey = await loadIdentityKeyPair();
    if (!identityKey) {
      throw new Error('Identity key not found');
    }

    const meResponse = await api.get('/api/v1/me');
    const ourUserId = meResponse.data.data?.id || meResponse.data.id;

    const recipientBundle = await getRecipientBundle(userId);
    const theirIdentityKey = Buffer.from(recipientBundle.identity_key, 'base64');

    return await generateSafetyNumber(
      identityKey.publicKey,
      ourUserId,
      new Uint8Array(theirIdentityKey),
      userId
    );
  },

  getFingerprint: async (): Promise<string | null> => {
    const identityKey = await loadIdentityKeyPair();
    if (!identityKey) {
      return null;
    }
    return await fingerprint(identityKey.publicKey);
  },

  getDevices: async (): Promise<Array<{ device_id: string; created_at: string }>> => {
    const response = await api.get('/api/v1/e2ee/devices');
    return response.data.data || [];
  },

  revokeDevice: async (deviceId: string): Promise<void> => {
    await api.delete(`/api/v1/e2ee/keys/${deviceId}`);

    const currentDeviceId = await getDeviceId();
    if (currentDeviceId === deviceId) {
      await clearE2EEData();
      set({ isInitialized: false });
    }
  },
}));

// ── Convenience hooks ────────────────────────────────────────────────────────

/** Selector for just the E2EE state (no actions) */
export function useE2EEState() {
  return useE2EEStore((s) => ({
    isInitialized: s.isInitialized,
    isLoading: s.isLoading,
    error: s.error,
  }));
}

/**
 * Hook for one-time prekey replenishment.
 * Automatically uploads more prekeys when count gets low.
 */
export function usePreKeyReplenishment(threshold: number = 20) {
  const isInitialized = useE2EEStore((s) => s.isInitialized);
  const getPrekeyCount = useE2EEStore((s) => s.getPrekeyCount);
  const uploadMorePrekeys = useE2EEStore((s) => s.uploadMorePrekeys);

  useEffect(() => {
    if (!isInitialized) return;

    const checkAndReplenish = async () => {
      try {
        const count = await getPrekeyCount();
        if (count < threshold) {
          const toUpload = 100 - count;
          await uploadMorePrekeys(toUpload);
          logger.log(`Replenished ${toUpload} one-time prekeys`);
        }
      } catch (err) {
        logger.error('Error replenishing prekeys:', err);
      }
    };

    checkAndReplenish();

    let interval: ReturnType<typeof setInterval> | null = null;
    const getDelay = () => (AppState.currentState === 'active' ? 5 * 60 * 1000 : 20 * 60 * 1000);

    const startInterval = () => {
      if (interval) clearInterval(interval);
      interval = setInterval(checkAndReplenish, getDelay());
    };

    startInterval();
    const sub = AppState.addEventListener('change', startInterval);

    return () => {
      if (interval) clearInterval(interval);
      sub.remove();
    };
  }, [isInitialized, getPrekeyCount, uploadMorePrekeys, threshold]);
}
