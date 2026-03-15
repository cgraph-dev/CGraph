/**
 * E2EE Store — Encryption Actions
 *
 * Legacy X3DH and Double Ratchet encryption/decryption actions,
 * plus key management operations.
 *
 * @module lib/crypto/e2ee-store/encryption-actions
 */

import type { StoreApi } from 'zustand';
import { api } from '@/lib/api';
import e2ee, {
  encryptForRecipient,
  decryptFromSender,
  loadIdentityKeyPair,
  clearE2EEData,
  generateSafetyNumber,
  exportPublicKey,
  base64ToArrayBuffer,
} from '../e2ee';
import { sessionManager } from '../sessionManager';
import type { E2EEState, EncryptedMessage, ServerPrekeyBundle, SecureMessage } from './types';

type Get = StoreApi<E2EEState>['getState'];
type Set = StoreApi<E2EEState>['setState'];

// ---------------------------------------------------------------------------
// Legacy encryption (X3DH only)
// ---------------------------------------------------------------------------

/**
 * Encrypt a message for a recipient (X3DH).
 */
export const createEncryptMessage =
  (_set: Set, get: Get) =>
  async (recipientId: string, plaintext: string): Promise<EncryptedMessage> => {
    const { isInitialized } = get();
    if (!isInitialized) {
      throw new Error('E2EE not initialized');
    }

    const recipientBundle = await get().getRecipientBundle(recipientId);
    return await encryptForRecipient(plaintext, recipientBundle);
  };

/**
 * Decrypt a received message (X3DH).
 */
export const createDecryptMessage =
  (_set: Set, get: Get) =>
  async (
    _senderId: string,
    senderIdentityKey: string,
    encryptedMessage: EncryptedMessage
  ): Promise<string> => {
    const { isInitialized } = get();
    if (!isInitialized) {
      throw new Error('E2EE not initialized');
    }

    const senderKey = base64ToArrayBuffer(senderIdentityKey);
    return await decryptFromSender(encryptedMessage, senderKey);
  };

// ---------------------------------------------------------------------------
// Double Ratchet encryption (v0.9.0+)
// ---------------------------------------------------------------------------

/**
 * Encrypt a message using Double Ratchet for forward secrecy.
 */
export const createEncryptWithRatchet =
  (_set: Set, get: Get) =>
  async (recipientId: string, plaintext: string): Promise<SecureMessage> => {
    const { isInitialized } = get();
    if (!isInitialized) {
      throw new Error('E2EE not initialized');
    }

    let recipientBundle: ServerPrekeyBundle | undefined;
    if (!sessionManager.hasSession(recipientId)) {
      recipientBundle = await get().getRecipientBundle(recipientId);
    }

    const meResponse = await api.get('/api/v1/me');
    const ourUserId = meResponse.data.data?.id || meResponse.data.id;

    return await sessionManager.encryptMessage(ourUserId, recipientId, plaintext, recipientBundle);
  };

/**
 * Decrypt a message using Double Ratchet.
 */
export const createDecryptWithRatchet =
  (_set: Set, get: Get) =>
  async (message: SecureMessage, senderIdentityKey?: string): Promise<string> => {
    const { isInitialized } = get();
    if (!isInitialized) {
      throw new Error('E2EE not initialized');
    }

    const identityKeyBuffer = senderIdentityKey
      ? base64ToArrayBuffer(senderIdentityKey)
      : undefined;

    return await sessionManager.decryptMessage(message, identityKeyBuffer);
  };

/**
 * Check if we have an active ratchet session with a user.
 */
export const createHasRatchetSession =
  () =>
  (recipientId: string): boolean => {
    return sessionManager.hasSession(recipientId);
  };

/**
 * Destroy a ratchet session.
 */
export const createDestroyRatchetSession =
  () =>
  async (recipientId: string): Promise<void> => {
    await sessionManager.destroySession(recipientId);
  };

/**
 * Get statistics for a ratchet session.
 */
export const createGetRatchetSessionStats = () => (recipientId: string) => {
  return sessionManager.getSessionStats(recipientId);
};

// ---------------------------------------------------------------------------
// Key management
// ---------------------------------------------------------------------------

/**
 * Upload additional one-time prekeys.
 */
export const createUploadMorePrekeys =
  (set: Set, get: Get) =>
  async (count: number = 50): Promise<number> => {
    const { isInitialized } = get();
    if (!isInitialized) {
      throw new Error('E2EE not initialized');
    }

    const prekeys: Array<{ key_id: string; public_key: string }> = [];

    for (let i = 0; i < count; i++) {
      const keyPair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
        'deriveKey',
        'deriveBits',
      ]);

      const publicKey = await crypto.subtle.exportKey('raw', keyPair.publicKey);

      prekeys.push({
         
        key_id: e2ee.arrayBufferToHex(e2ee.randomBytes(8).buffer as ArrayBuffer), // safe downcast – structural boundary
        public_key: e2ee.arrayBufferToBase64(publicKey),
      });
    }

    const response = await api.post('/api/v1/e2ee/keys/prekeys', { prekeys });
    const uploadedCount = response.data.data?.count || count;

    set((state) => ({ prekeyCount: state.prekeyCount + uploadedCount }));
    return uploadedCount;
  };

/**
 * Get current prekey count from server.
 */
export const createGetPrekeyCount = (set: Set) => async (): Promise<number> => {
  try {
    const response = await api.get('/api/v1/e2ee/keys/count');
    const count = response.data.data?.count || 0;
    set({ prekeyCount: count });
    return count;
  } catch {
    return 0;
  }
};

/**
 * Get safety number for key verification.
 */
export const createGetSafetyNumber =
  (_set: Set, get: Get) =>
  async (userId: string): Promise<string> => {
    const { isInitialized } = get();
    if (!isInitialized) {
      throw new Error('E2EE not initialized');
    }

    const identityKey = await loadIdentityKeyPair();
    if (!identityKey) {
      throw new Error('Identity key not found');
    }

    const meResponse = await api.get('/api/v1/me');
    const ourUserId = meResponse.data.data?.id || meResponse.data.id;

    const recipientBundle = await get().getRecipientBundle(userId);
    const ourPublicKey = await exportPublicKey(identityKey.keyPair.publicKey);
    const theirPublicKey = base64ToArrayBuffer(recipientBundle.identity_key);

    return await generateSafetyNumber(ourPublicKey, ourUserId, theirPublicKey, userId);
  };

/**
 * Get all registered devices for the current user.
 */
export const createGetDevices =
  () => async (): Promise<Array<{ device_id: string; created_at: string }>> => {
    const response = await api.get('/api/v1/e2ee/devices');
    return response.data.data || [];
  };

/**
 * Revoke a device's keys.
 */
export const createRevokeDevice =
  (set: Set, get: Get) =>
  async (deviceId: string): Promise<void> => {
    await api.delete(`/api/v1/e2ee/devices/${deviceId}`);

    if (get().deviceId === deviceId) {
      clearE2EEData();
      set({
        isInitialized: false,
        deviceId: null,
        fingerprint: null,
        prekeyCount: 0,
      });
    }
  };
