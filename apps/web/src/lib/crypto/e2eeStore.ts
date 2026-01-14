/**
 * E2EE Store for Web Application
 * 
 * Zustand store for managing E2EE state and operations.
 * 
 * v0.9.0: Integrated Double Ratchet for forward secrecy
 * - Session manager handles per-conversation ratchet state
 * - X3DH for initial key agreement
 * - Double Ratchet for ongoing message encryption
 * 
 * @module lib/crypto/e2eeStore
 */

import { create } from 'zustand';
import { api } from '@/lib/api';
import { e2eeLogger as logger } from '../logger';
import e2ee, {
  KeyBundle,
  ServerPrekeyBundle,
  EncryptedMessage,
  isE2EESetUp,
  generateKeyBundle,
  storeKeyBundle,
  formatKeysForRegistration,
  encryptForRecipient,
  decryptFromSender,
  loadIdentityKeyPair,
  getDeviceId,
  generateDeviceId,
  clearE2EEData,
  generateSafetyNumber,
  fingerprint,
  base64ToArrayBuffer,
  exportPublicKey,
} from './e2ee';
import { sessionManager, type SecureMessage } from './sessionManager';

interface E2EEState {
  // State
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  deviceId: string | null;
  fingerprint: string | null;
  prekeyCount: number;
  useDoubleRatchet: boolean;  // Flag to enable Double Ratchet mode
  
  // Prekey bundle cache
  bundleCache: Map<string, { bundle: ServerPrekeyBundle; expiresAt: number }>;
  
  // Actions
  initialize: () => Promise<void>;
  setupE2EE: () => Promise<void>;
  resetE2EE: () => Promise<void>;
  
  // Legacy encryption (X3DH only, for compatibility)
  encryptMessage: (recipientId: string, plaintext: string) => Promise<EncryptedMessage>;
  decryptMessage: (senderId: string, senderIdentityKey: string, encryptedMessage: EncryptedMessage) => Promise<string>;
  
  // Double Ratchet encryption (v0.9.0+)
  encryptWithRatchet: (recipientId: string, plaintext: string) => Promise<SecureMessage>;
  decryptWithRatchet: (message: SecureMessage, senderIdentityKey?: string) => Promise<string>;
  hasRatchetSession: (recipientId: string) => boolean;
  destroyRatchetSession: (recipientId: string) => Promise<void>;
  getRatchetSessionStats: (recipientId: string) => ReturnType<typeof sessionManager.getSessionStats>;
  
  // Key management
  uploadMorePrekeys: (count?: number) => Promise<number>;
  getPrekeyCount: () => Promise<number>;
  getSafetyNumber: (userId: string) => Promise<string>;
  getDevices: () => Promise<Array<{ device_id: string; created_at: string }>>;
  revokeDevice: (deviceId: string) => Promise<void>;
  handleKeyRevoked: (userId: string, keyId: string) => void;
  
  // Settings
  setUseDoubleRatchet: (enabled: boolean) => void;
  clearError: () => void;
}

const BUNDLE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const useE2EEStore = create<E2EEState>()((set, get) => ({
  // Initial state
  isInitialized: false,
  isLoading: false,
  error: null,
  deviceId: null,
  fingerprint: null,
  prekeyCount: 0,
  bundleCache: new Map(),
  useDoubleRatchet: true, // Enable Double Ratchet by default in v0.9.0+
  
  /**
   * Initialize E2EE state from storage
   */
  initialize: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const isSetUp = await isE2EESetUp();
      const deviceId = getDeviceId();
      
      let fp: string | null = null;
      if (isSetUp) {
        const identityKey = await loadIdentityKeyPair();
        if (identityKey) {
          const publicKey = await exportPublicKey(identityKey.keyPair.publicKey);
          fp = await fingerprint(publicKey);
        }
        
        // Initialize session manager for Double Ratchet
        await sessionManager.initialize();
        logger.log('Session manager initialized with Double Ratchet support');
      }
      
      set({
        isInitialized: isSetUp,
        deviceId,
        fingerprint: fp,
        isLoading: false,
      });
      
      // Fetch prekey count if initialized
      if (isSetUp) {
        get().getPrekeyCount().catch(console.error);
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize E2EE',
      });
    }
  },
  
  /**
   * Set up E2EE for this device
   */
  setupE2EE: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Generate device ID
      const deviceId = generateDeviceId();
      
      // Generate complete key bundle
      const bundle: KeyBundle = await generateKeyBundle(deviceId, 100);
      
      // Store keys locally
      await storeKeyBundle(bundle);
      
      // Register public keys with server
      const registrationData = await formatKeysForRegistration(bundle);
      await api.post('/api/v1/e2ee/keys', registrationData);
      
      // Get fingerprint
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
  },
  
  /**
   * Reset E2EE (clear all keys)
   */
  resetE2EE: async () => {
    try {
      set({ isLoading: true });
      
      const deviceId = get().deviceId;
      
      // Revoke server keys
      if (deviceId) {
        try {
          await api.delete(`/api/v1/e2ee/keys/${deviceId}`);
        } catch {
          // Ignore error if already revoked
        }
      }
      
      // Clear local keys
      clearE2EEData();
      
      // Clear all Double Ratchet sessions
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
  },
  
  /**
   * Get prekey bundle for a recipient (with caching)
   */
  getRecipientBundle: async (recipientId: string): Promise<ServerPrekeyBundle> => {
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
  },
  
  /**
   * Encrypt a message for a recipient
   */
  encryptMessage: async (recipientId: string, plaintext: string): Promise<EncryptedMessage> => {
    const { isInitialized } = get();
    
    if (!isInitialized) {
      throw new Error('E2EE not initialized');
    }
    
    // Get recipient's prekey bundle
    const recipientBundle = await (get() as any).getRecipientBundle(recipientId);
    
    // Encrypt the message
    return await encryptForRecipient(plaintext, recipientBundle);
  },
  
  /**
   * Decrypt a received message
   */
  decryptMessage: async (
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
  },
  
  /**
   * Upload additional one-time prekeys
   */
  uploadMorePrekeys: async (count: number = 50): Promise<number> => {
    const { isInitialized } = get();
    
    if (!isInitialized) {
      throw new Error('E2EE not initialized');
    }
    
    // Generate new prekeys
    const prekeys: Array<{ key_id: string; public_key: string }> = [];
    
    for (let i = 0; i < count; i++) {
      const keyPair = await crypto.subtle.generateKey(
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        ['deriveKey', 'deriveBits']
      );
      
      const publicKey = await crypto.subtle.exportKey('raw', keyPair.publicKey);
      
      prekeys.push({
        key_id: e2ee.arrayBufferToHex(e2ee.randomBytes(8).buffer as ArrayBuffer),
        public_key: e2ee.arrayBufferToBase64(publicKey),
      });
    }
    
    const response = await api.post('/api/v1/e2ee/prekeys', { prekeys });
    const uploadedCount = response.data.data?.count || count;
    
    set(state => ({ prekeyCount: state.prekeyCount + uploadedCount }));
    
    return uploadedCount;
  },
  
  /**
   * Get current prekey count from server
   */
  getPrekeyCount: async (): Promise<number> => {
    try {
      const response = await api.get('/api/v1/e2ee/prekeys/count');
      const count = response.data.data?.count || 0;
      set({ prekeyCount: count });
      return count;
    } catch {
      return 0;
    }
  },
  
  /**
   * Get safety number for key verification
   */
  getSafetyNumber: async (userId: string): Promise<string> => {
    const { isInitialized } = get();
    
    if (!isInitialized) {
      throw new Error('E2EE not initialized');
    }
    
    const identityKey = await loadIdentityKeyPair();
    if (!identityKey) {
      throw new Error('Identity key not found');
    }
    
    // Get our user ID
    const meResponse = await api.get('/api/v1/me');
    const ourUserId = meResponse.data.data?.id || meResponse.data.id;
    
    // Get their public key
    const recipientBundle = await (get() as any).getRecipientBundle(userId);
    const ourPublicKey = await exportPublicKey(identityKey.keyPair.publicKey);
    const theirPublicKey = base64ToArrayBuffer(recipientBundle.identity_key);
    
    return await generateSafetyNumber(ourPublicKey, ourUserId, theirPublicKey, userId);
  },
  
  /**
   * Get all registered devices for current user
   */
  getDevices: async (): Promise<Array<{ device_id: string; created_at: string }>> => {
    const response = await api.get('/api/v1/e2ee/devices');
    return response.data.data || [];
  },
  
  /**
   * Revoke a device's keys
   */
  revokeDevice: async (deviceId: string): Promise<void> => {
    await api.delete(`/api/v1/e2ee/keys/${deviceId}`);
    
    // If revoking current device, update state
    if (get().deviceId === deviceId) {
      clearE2EEData();
      set({
        isInitialized: false,
        deviceId: null,
        fingerprint: null,
        prekeyCount: 0,
      });
    }
  },
  
  /**
   * Handle a key revocation event from another user.
   * This is called when a contact revokes their key (lost device, security breach).
   * We must immediately invalidate their cached prekey bundle to prevent
   * encrypting messages for a compromised key.
   */
  handleKeyRevoked: (userId: string, keyId: string) => {
    logger.log(`Key revoked for user ${userId}: ${keyId}`);
    
    // Invalidate cached bundle for this user
    const { bundleCache } = get();
    bundleCache.delete(userId);
    
    // Force next encryption to fetch fresh keys
    set({ bundleCache: new Map(bundleCache) });
    
    // Also destroy their ratchet session to force re-establishment
    sessionManager.destroySession(userId).catch(err => {
      logger.error(`Failed to destroy ratchet session for ${userId}:`, err);
    });
    
    logger.log(`Cleared prekey bundle cache and ratchet session for user ${userId} due to key revocation`);
  },
  
  // ===========================================================================
  // DOUBLE RATCHET METHODS (v0.9.0+)
  // ===========================================================================
  
  /**
   * Encrypt a message using Double Ratchet for forward secrecy.
   * 
   * This method establishes a ratchet session if one doesn't exist,
   * then encrypts the message with the current ratchet state.
   * Each message uses a unique key that is immediately discarded.
   * 
   * @param recipientId - The recipient's user ID
   * @param plaintext - The message to encrypt
   * @returns SecureMessage with ratchet header and ciphertext
   */
  encryptWithRatchet: async (recipientId: string, plaintext: string): Promise<SecureMessage> => {
    const { isInitialized } = get();
    
    if (!isInitialized) {
      throw new Error('E2EE not initialized');
    }
    
    // Get recipient's prekey bundle if we don't have a session
    let recipientBundle: ServerPrekeyBundle | undefined;
    if (!sessionManager.hasSession(recipientId)) {
      recipientBundle = await (get() as any).getRecipientBundle(recipientId);
    }
    
    // Get our user ID from the API
    const meResponse = await api.get('/api/v1/me');
    const ourUserId = meResponse.data.data?.id || meResponse.data.id;
    
    // Encrypt with the session manager
    return await sessionManager.encryptMessage(ourUserId, recipientId, plaintext, recipientBundle);
  },
  
  /**
   * Decrypt a message using Double Ratchet.
   * 
   * If this is an initial message, establishes the session from X3DH data.
   * Otherwise, uses the existing ratchet session to decrypt.
   * 
   * @param message - The SecureMessage to decrypt
   * @param senderIdentityKey - Base64-encoded sender identity key (required for initial messages)
   * @returns The decrypted plaintext
   */
  decryptWithRatchet: async (message: SecureMessage, senderIdentityKey?: string): Promise<string> => {
    const { isInitialized } = get();
    
    if (!isInitialized) {
      throw new Error('E2EE not initialized');
    }
    
    // Convert identity key if provided
    const identityKeyBuffer = senderIdentityKey 
      ? base64ToArrayBuffer(senderIdentityKey)
      : undefined;
    
    return await sessionManager.decryptMessage(message, identityKeyBuffer);
  },
  
  /**
   * Check if we have an active ratchet session with a user.
   */
  hasRatchetSession: (recipientId: string): boolean => {
    return sessionManager.hasSession(recipientId);
  },
  
  /**
   * Destroy a ratchet session (e.g., when conversation is deleted).
   */
  destroyRatchetSession: async (recipientId: string): Promise<void> => {
    await sessionManager.destroySession(recipientId);
  },
  
  /**
   * Get statistics for a ratchet session.
   * Useful for debugging and security audits.
   */
  getRatchetSessionStats: (recipientId: string) => {
    return sessionManager.getSessionStats(recipientId);
  },
  
  /**
   * Enable or disable Double Ratchet mode.
   * When disabled, falls back to X3DH-only encryption.
   */
  setUseDoubleRatchet: (enabled: boolean) => {
    set({ useDoubleRatchet: enabled });
    logger.log(`Double Ratchet mode ${enabled ? 'enabled' : 'disabled'}`);
  },
  
  /**
   * Clear error
   */
  clearError: () => {
    set({ error: null });
  },
}));

/**
 * Hook for one-time prekey replenishment
 */
export function usePreKeyReplenishment(threshold: number = 20) {
  const { isInitialized, getPrekeyCount, uploadMorePrekeys } = useE2EEStore();
  
  React.useEffect(() => {
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
    
    // Check on mount and every 5 minutes
    checkAndReplenish();
    const interval = setInterval(checkAndReplenish, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [isInitialized, threshold, getPrekeyCount, uploadMorePrekeys]);
}

// We need React for the hook
import React from 'react';

export default useE2EEStore;
