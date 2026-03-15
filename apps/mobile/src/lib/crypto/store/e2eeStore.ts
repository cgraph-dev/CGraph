/**
 * E2EE Zustand Store for Mobile App
 *
 * Provides encryption functionality via Zustand instead of React Context.
 * Delegates to pq-bridge for PQXDH + Triple Ratchet encryption, with
 * legacy X3DH fallback for backward compatibility with old messages.
 */

import { create } from 'zustand';
import { AppState } from 'react-native';
import * as Device from 'expo-device';
import { useEffect } from 'react';
import api from '../../api';
import { requireAuthenticationIfNeeded, isBiometricLockEnabled } from '../../biometrics';
import { e2eeLogger as logger } from '../../logger';
import e2ee, {
  type KeyBundle,
  type ServerPrekeyBundle,
  type EncryptedMessage,
  isE2EESetUp,
  generateKeyBundle as _legacyGenerateKeyBundle,
  storeKeyBundle as legacyStoreKeyBundle,
  formatKeysForRegistration,
  encryptForRecipient,
  loadIdentityKeyPair,
  loadSignedPreKeyPrivate,
  x3dhRespond,
  getDeviceId,
  clearE2EEData,
  generateSafetyNumber,
  fingerprint,
  loadKEMPreKey,
  storeKEMPreKey,
} from '../e2ee';
import {
  generateKeyBundle as pqGenerateKeyBundle,
  initiateSession as pqInitiateSession,
  encryptMessage as pqEncrypt,
  decryptMessage as pqDecrypt,
  getSessionForRecipient,
  registerRecipientSession,
  hasSessionForRecipient,
  respondToSession as pqRespondToSession,
  hasPQKeys,
  loadIdentityKey as pqLoadIdentityKey,
  type PQKeyBundle,
} from '../pq-bridge';
import { InMemoryProtocolStore } from '@cgraph/crypto';
import { Buffer } from 'buffer';

// ── Types ────────────────────────────────────────────────────────────────────

interface E2EEState {
  isInitialized: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  setupError: string | null;
  reset: () => void;
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

// ── Biometric gate for key access ────────────────────────────────────────────

/**
 * Custom error thrown when biometric authentication is required but fails.
 * Callers can catch this to show appropriate UI.
 */
export class BiometricAuthRequired extends Error {
  constructor(message = 'Biometric authentication required to access encryption keys') {
    super(message);
    this.name = 'BiometricAuthRequired';
  }
}

/**
 * Require biometric authentication before accessing E2EE keys.
 * No-ops when biometric lock is disabled or when already authenticated within timeout.
 */
async function requireBiometricForKeyAccess(): Promise<void> {
  const enabled = await isBiometricLockEnabled();
  if (!enabled) return;

  const result = await requireAuthenticationIfNeeded('Access encryption keys');
  if (!result.success) {
    throw new BiometricAuthRequired(result.error ?? undefined);
  }
}

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
  isInitializing: false,
  error: null,
  setupError: null,

  // Actions
  checkStatus: async () => {
    try {
      set({ isLoading: true });
      // Check for both legacy (X3DH) and new (PQXDH) key presence
      const legacySetUp = await isE2EESetUp();
      const pqSetUp = await hasPQKeys();
      const isSetUp = legacySetUp || pqSetUp;

      set({ isInitialized: isSetUp });

      // If legacy keys exist but no KEM prekey, trigger upgrade
      if (legacySetUp && !pqSetUp) {
        logger.log('Legacy X3DH keys found without KEM prekey — scheduling PQ upgrade');
        // Fire-and-forget: generate and upload KEM prekey to upgrade bundle
        void (async () => {
          try {
            const pqBundle = await pqGenerateKeyBundle(0); // 0 OTKs — just KEM key
            // Store KEM prekey in legacy format too for compat
            await storeKEMPreKey(
              1, // keyId
              pqBundle.pqPreKey.publicKey,
              pqBundle.pqPreKey.secretKey,
              pqBundle.signedPreKey.signature // re-use signed prekey signature for KEM
            );
            // Upload KEM prekey to server
            await api.post('/api/v1/e2ee/prekeys/kem', {
              kyber_prekey: Buffer.from(pqBundle.pqPreKey.publicKey).toString('base64'),
              kyber_prekey_id: 1,
              kyber_prekey_signature: Buffer.from(pqBundle.signedPreKey.signature).toString(
                'base64'
              ),
            });
            logger.log('KEM prekey upgrade complete');
          } catch (err) {
            logger.error('KEM prekey upgrade failed (non-blocking):', err);
          }
        })();
      }
    } catch (err) {
      logger.error('Error checking E2EE status:', err);
      set({ error: 'Failed to check encryption status' });
    } finally {
      set({ isLoading: false });
    }
  },

  setupE2EE: async () => {
    try {
      set({ isLoading: true, isInitializing: true, error: null, setupError: null });

      const deviceId = `${Device.modelName || 'unknown'}_${Date.now()}`;

      // Generate full PQXDH key bundle via pq-bridge (ML-KEM-768 + P-256)
      const pqBundle: PQKeyBundle = await pqGenerateKeyBundle(100);

      // Also store keys in legacy format for backward compat with isE2EESetUp()
      const legacyBundle: KeyBundle = {
        deviceId,
        identityKey: {
          publicKey: pqBundle.identityKeyPair.publicKey,
          privateKey: pqBundle.identityKeyPair.privateKey,
          keyId: `pq_${Date.now().toString(36)}`,
        },
        signedPreKey: {
          publicKey: pqBundle.signedPreKey.publicKey,
          privateKey: pqBundle.signedPreKey.privateKey,
          signature: pqBundle.signedPreKey.signature,
          keyId: `spk_${Date.now().toString(36)}`,
        },
        oneTimePreKeys: pqBundle.oneTimePreKeys.map((otk, i) => ({
          publicKey: otk.publicKey,
          privateKey: otk.privateKey,
          keyId: `otk_${i}_${Date.now().toString(36)}`,
        })),
      };
      await legacyStoreKeyBundle(legacyBundle);

      // Format registration data including KEM prekey
      const registrationData = formatKeysForRegistration(legacyBundle, {
        keyId: 1,
        publicKey: pqBundle.pqPreKey.publicKey,
        signature: pqBundle.signedPreKey.signature,
      });

      await api.post('/api/v1/e2ee/keys', registrationData);

      set({ isInitialized: true });
      logger.log('PQXDH E2EE setup complete — keys registered with server');
    } catch (err) {
      logger.error('Error setting up E2EE:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to set up encryption';
      set({ error: errorMsg, setupError: errorMsg });
      throw err;
    } finally {
      set({ isLoading: false, isInitializing: false });
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

    // Gate key access behind biometric when enabled
    await requireBiometricForKeyAccess();

    // Check if we already have an active PQ session for this recipient
    if (hasSessionForRecipient(recipientId)) {
      const session = getSessionForRecipient(recipientId)!;
      const ratchetMsg = await pqEncrypt(session.sessionId, plaintext);

       
      return {
        ciphertext: Buffer.from(JSON.stringify(ratchetMsg)).toString('base64'),
        ephemeralPublicKey: '',
        senderIdentityKey: '',
        recipientIdentityKeyId: recipientId,
        nonce: '',
        protocol_version: 'pqxdh_v1',
        is_encrypted: true,
        session_id: session.sessionId,
      } as EncryptedMessage & {
        protocol_version: string;
        is_encrypted: boolean;
        session_id: string;
      };
    }

    // No active PQ session — initiate PQXDH key exchange
    const recipientBundle = await getRecipientBundle(recipientId);

    // Create an in-memory protocol store for the ratchet
    const identityKey = await pqLoadIdentityKey();
    if (!identityKey) {
      // Fall back to legacy encrypt if PQ keys not available
      logger.log('PQ identity key not found — falling back to legacy X3DH encrypt');
      return await encryptForRecipient(plaintext, recipientBundle);
    }

    const protocolStore = new InMemoryProtocolStore(identityKey, 1);
    const { session } = await pqInitiateSession(recipientBundle, protocolStore);

    // Track the recipient → session mapping
    registerRecipientSession(recipientId, session.sessionId);

    // Encrypt via Triple Ratchet
    const ratchetMsg = await pqEncrypt(session.sessionId, plaintext);

     
    return {
      ciphertext: Buffer.from(JSON.stringify(ratchetMsg)).toString('base64'),
      ephemeralPublicKey: '',
      senderIdentityKey: '',
      recipientIdentityKeyId: recipientId,
      nonce: '',
      protocol_version: 'pqxdh_v1',
      is_encrypted: true,
      session_id: session.sessionId,
    } as EncryptedMessage & { protocol_version: string; is_encrypted: boolean; session_id: string };
  },

  decryptMessage: async (senderId: string, encryptedMessage: EncryptedMessage): Promise<string> => {
    if (!get().isInitialized) {
      throw new Error('E2EE not initialized');
    }

    // Gate key access behind biometric when enabled
    await requireBiometricForKeyAccess();

    // Route based on protocol version
     
    const protocolVersion = (encryptedMessage as EncryptedMessage & { protocol_version?: string })
      .protocol_version;

    if (protocolVersion === 'pqxdh_v1') {
      // PQXDH + Triple Ratchet path
       
      const sessionId = (encryptedMessage as EncryptedMessage & { session_id?: string }).session_id;
      const session = sessionId
        ? undefined // will look up by sessionId in pqDecrypt
        : getSessionForRecipient(senderId);

      const resolvedSessionId = sessionId || session?.sessionId;

      if (!resolvedSessionId) {
        // Incoming PQXDH message but no session — need to respond to initiation
        const identityKey = await pqLoadIdentityKey();
        if (!identityKey) {
          throw new Error('PQ identity key not found — cannot decrypt PQXDH message');
        }
        const protocolStore = new InMemoryProtocolStore(identityKey, 1);
        const ciphertextJson = Buffer.from(encryptedMessage.ciphertext, 'base64').toString('utf-8');
         
        const ratchetMsg = JSON.parse(
          ciphertextJson
        ) as import('@cgraph/crypto').TripleRatchetMessage;
        const newSession = await pqRespondToSession(
          new Uint8Array(Buffer.from(encryptedMessage.ciphertext, 'base64')),
          protocolStore
        );
        registerRecipientSession(senderId, newSession.sessionId);
        // After session is established, the ciphertext itself is the ratchet message
        return await pqDecrypt(newSession.sessionId, ratchetMsg);
      }

      const ciphertextJson = Buffer.from(encryptedMessage.ciphertext, 'base64').toString('utf-8');
       
      const ratchetMsg = JSON.parse(
        ciphertextJson
      ) as import('@cgraph/crypto').TripleRatchetMessage;
      return await pqDecrypt(resolvedSessionId, ratchetMsg);
    }

    // Legacy X3DH fallback for classical_v1, classical_v2, or unversioned messages
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

    // Gate key access behind biometric when enabled
    await requireBiometricForKeyAccess();

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
    // Gate key access behind biometric when enabled
    await requireBiometricForKeyAccess();

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
  reset: () =>
    set({
      isInitialized: false,
      isLoading: true,
      isInitializing: false,
      error: null,
      setupError: null,
    }),
}));

// ── Convenience hooks ────────────────────────────────────────────────────────

/** Selector for just the E2EE state (no actions) */
export function useE2EEState() {
  return useE2EEStore((s) => ({
    isInitialized: s.isInitialized,
    isLoading: s.isLoading,
    isInitializing: s.isInitializing,
    error: s.error,
    setupError: s.setupError,
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
