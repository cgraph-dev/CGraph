/**
 * E2EE React Context and Hook for Mobile App
 * 
 * Provides a convenient interface for using E2EE throughout the app.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as Device from 'expo-device';
import api from '../api';
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
  loadIdentityKeyPair,
  getDeviceId,
  clearE2EEData,
  generateSafetyNumber,
  fingerprint,
} from './e2ee';
import { Buffer } from 'buffer';

interface E2EEContextType {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Setup and initialization
  setupE2EE: () => Promise<void>;
  resetE2EE: () => Promise<void>;
  
  // Encryption/decryption
  encryptMessage: (recipientId: string, plaintext: string) => Promise<EncryptedMessage>;
  decryptMessage: (senderId: string, encryptedMessage: EncryptedMessage) => Promise<string>;
  
  // Key management
  uploadMorePrekeys: (count?: number) => Promise<number>;
  getPrekeyCount: () => Promise<number>;
  
  // Verification
  getSafetyNumber: (userId: string) => Promise<string>;
  getFingerprint: () => Promise<string | null>;
  
  // Device management
  getDevices: () => Promise<Array<{ device_id: string; created_at: string }>>;
  revokeDevice: (deviceId: string) => Promise<void>;
}

const E2EEContext = createContext<E2EEContextType | null>(null);

interface E2EEProviderProps {
  children: ReactNode;
}

// Cache for recipient prekey bundles
const prekeyBundleCache = new Map<string, { bundle: ServerPrekeyBundle; expiresAt: number }>();
const BUNDLE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function E2EEProvider({ children }: E2EEProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Check if E2EE is already set up on mount
  useEffect(() => {
    checkE2EEStatus();
  }, []);
  
  const checkE2EEStatus = async () => {
    try {
      setIsLoading(true);
      const isSetUp = await isE2EESetUp();
      setIsInitialized(isSetUp);
    } catch (err) {
      console.error('Error checking E2EE status:', err);
      setError('Failed to check encryption status');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Initialize E2EE for this device
   * Generates key bundle and registers with server
   */
  const setupE2EE = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Generate device ID
      const deviceId = `${Device.modelName || 'unknown'}_${Date.now()}`;
      
      // Generate complete key bundle
      const bundle: KeyBundle = await generateKeyBundle(deviceId, 100);
      
      // Store keys securely
      await storeKeyBundle(bundle);
      
      // Register public keys with server
      const registrationData = formatKeysForRegistration(bundle);
      await api.post('/api/v1/e2ee/keys', registrationData);
      
      setIsInitialized(true);
    } catch (err) {
      console.error('Error setting up E2EE:', err);
      setError('Failed to set up encryption');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Reset E2EE (clear all keys and start fresh)
   */
  const resetE2EE = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Clear local keys
      await clearE2EEData();
      
      // Revoke server keys
      const deviceId = await getDeviceId();
      if (deviceId) {
        try {
          await api.delete(`/api/v1/e2ee/keys/${deviceId}`);
        } catch {
          // Ignore error if already revoked
        }
      }
      
      setIsInitialized(false);
      prekeyBundleCache.clear();
    } catch (err) {
      console.error('Error resetting E2EE:', err);
      setError('Failed to reset encryption');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Get prekey bundle for a recipient (with caching)
   */
  const getRecipientBundle = async (recipientId: string): Promise<ServerPrekeyBundle> => {
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
  };
  
  /**
   * Encrypt a message for a specific recipient
   */
  const encryptMessage = useCallback(async (
    recipientId: string,
    plaintext: string
  ): Promise<EncryptedMessage> => {
    if (!isInitialized) {
      throw new Error('E2EE not initialized');
    }
    
    // Get recipient's prekey bundle
    const recipientBundle = await getRecipientBundle(recipientId);
    
    // Encrypt the message
    return await encryptForRecipient(plaintext, recipientBundle);
  }, [isInitialized]);
  
  /**
   * Decrypt a received message
   */
  const decryptMessage = useCallback(async (
    _senderId: string,
    encryptedMessage: EncryptedMessage
  ): Promise<string> => {
    if (!isInitialized) {
      throw new Error('E2EE not initialized');
    }
    
    // For decryption, we need to compute the shared secret using sender's ephemeral key
    // and our identity key / signed prekey
    
    // This is a simplified implementation - in production, you'd implement
    // the full X3DH receiver side
    
    // Load our identity key
    const identityKey = await loadIdentityKeyPair();
    if (!identityKey) {
      throw new Error('Identity key not found');
    }
    
    // Compute shared secret (receiver side of X3DH)
    const ephemeralPublic = Buffer.from(encryptedMessage.ephemeralPublicKey, 'base64');
    const nonce = Buffer.from(encryptedMessage.nonce, 'base64');
    const ciphertext = Buffer.from(encryptedMessage.ciphertext, 'base64');
    
    // Derive shared secret (simplified - mirror of sender's computation)
    const combined = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      combined[i] = 
        (identityKey.privateKey[i] || 0) ^
        (ephemeralPublic[i] || 0);
    }
    
    // Use SHA-256 as fallback HKDF
    const sharedSecret = await e2ee.sha256(combined);
    
    // Decrypt
    return await e2ee.decryptMessage(
      new Uint8Array(ciphertext),
      new Uint8Array(nonce),
      sharedSecret
    );
  }, [isInitialized]);
  
  /**
   * Upload additional one-time prekeys
   */
  const uploadMorePrekeys = useCallback(async (count: number = 50): Promise<number> => {
    if (!isInitialized) {
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
  }, [isInitialized]);
  
  /**
   * Get current prekey count from server
   */
  const getPrekeyCount = useCallback(async (): Promise<number> => {
    const response = await api.get('/api/v1/e2ee/prekeys/count');
    return response.data.data?.count || 0;
  }, []);
  
  /**
   * Get safety number for key verification with another user
   */
  const getSafetyNumber = useCallback(async (userId: string): Promise<string> => {
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
    const recipientBundle = await getRecipientBundle(userId);
    const theirIdentityKey = Buffer.from(recipientBundle.identity_key, 'base64');
    
    return await generateSafetyNumber(
      identityKey.publicKey,
      ourUserId,
      new Uint8Array(theirIdentityKey),
      userId
    );
  }, [isInitialized]);
  
  /**
   * Get fingerprint of our identity key
   */
  const getFingerprint = useCallback(async (): Promise<string | null> => {
    const identityKey = await loadIdentityKeyPair();
    if (!identityKey) {
      return null;
    }
    return await fingerprint(identityKey.publicKey);
  }, []);
  
  /**
   * Get all registered devices for current user
   */
  const getDevices = useCallback(async (): Promise<Array<{ device_id: string; created_at: string }>> => {
    const response = await api.get('/api/v1/e2ee/devices');
    return response.data.data || [];
  }, []);
  
  /**
   * Revoke a device's keys
   */
  const revokeDevice = useCallback(async (deviceId: string): Promise<void> => {
    await api.delete(`/api/v1/e2ee/keys/${deviceId}`);
    
    // If revoking current device, update state
    const currentDeviceId = await getDeviceId();
    if (currentDeviceId === deviceId) {
      await clearE2EEData();
      setIsInitialized(false);
    }
  }, []);
  
  const value: E2EEContextType = {
    isInitialized,
    isLoading,
    error,
    setupE2EE,
    resetE2EE,
    encryptMessage,
    decryptMessage,
    uploadMorePrekeys,
    getPrekeyCount,
    getSafetyNumber,
    getFingerprint,
    getDevices,
    revokeDevice,
  };
  
  return (
    <E2EEContext.Provider value={value}>
      {children}
    </E2EEContext.Provider>
  );
}

/**
 * Hook to use E2EE functionality
 */
export function useE2EE(): E2EEContextType {
  const context = useContext(E2EEContext);
  if (!context) {
    throw new Error('useE2EE must be used within an E2EEProvider');
  }
  return context;
}

/**
 * Hook for one-time prekey replenishment
 * Automatically uploads more prekeys when count gets low
 */
export function usePreKeyReplenishment(threshold: number = 20) {
  const { isInitialized, getPrekeyCount, uploadMorePrekeys } = useE2EE();
  
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
    
    // Check on mount and every 5 minutes
    checkAndReplenish();
    const interval = setInterval(checkAndReplenish, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [isInitialized, getPrekeyCount, uploadMorePrekeys, threshold]);
}

export default {
  E2EEProvider,
  useE2EE,
  usePreKeyReplenishment,
};
