/**
 * E2EE Hook - React hook wrapper for E2EE crypto operations
 *
 * Provides a clean React interface for:
 * - E2EE initialization and setup
 * - Key generation and management
 * - Message encryption/decryption
 * - Key verification (safety numbers)
 * - Session management
 *
 * @module hooks/useE2EE
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import * as e2ee from '../lib/crypto/e2ee';
import api from '../lib/api';
import type {
  KeyBundle,
  IdentityKeyPair,
  ServerPrekeyBundle,
  EncryptedMessage,
  Session,
} from '../lib/crypto/e2ee';
import { createLogger } from '../lib/logger';

const logger = createLogger('useE2EE');

// API response types
interface RegistrationResponse {
  success: boolean;
  identity_key_id: string;
  device_id: string;
}

interface PrekeyBundleResponse {
  identity_key: string;
  identity_key_id: string;
  signed_prekey: string;
  signed_prekey_signature: string;
  signed_prekey_id: string;
  one_time_prekey?: string;
  one_time_prekey_id?: string;
}

interface E2EEState {
  isSetUp: boolean;
  isInitializing: boolean;
  identityKey: IdentityKeyPair | null;
  deviceId: string | null;
  fingerprint: string | null;
  error: string | null;
}

interface UseE2EEReturn {
  // State
  isSetUp: boolean;
  isInitializing: boolean;
  isLoading: boolean;
  identityKey: IdentityKeyPair | null;
  deviceId: string | null;
  fingerprint: string | null;
  error: string | null;

  // Setup actions
  setupE2EE: () => Promise<boolean>;
  resetE2EE: () => Promise<void>;
  checkSetup: () => Promise<boolean>;

  // Key operations
  generateNewKeys: (numOneTimePreKeys?: number) => Promise<KeyBundle | null>;
  registerKeysWithServer: (bundle: KeyBundle) => Promise<boolean>;
  refreshOneTimePreKeys: (count?: number) => Promise<boolean>;

  // Encryption/Decryption
  encryptMessage: (recipientId: string, plaintext: string) => Promise<EncryptedMessage | null>;
  decryptMessage: (
    ciphertext: string,
    nonce: string,
    sharedSecret: Uint8Array
  ) => Promise<string | null>;

  // Verification
  generateSafetyNumber: (
    theirIdentityKey: Uint8Array,
    theirUserId: string
  ) => Promise<string | null>;
  copySafetyNumber: (safetyNumber: string) => Promise<void>;
  getFingerprint: (publicKey?: Uint8Array) => Promise<string | null>;

  // Session management
  getSession: (recipientId: string) => Promise<Session | null>;
  hasSession: (recipientId: string) => Promise<boolean>;
  clearSession: (recipientId: string) => Promise<void>;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for key operations

export function useE2EE(userId?: string): UseE2EEReturn {
  const [state, setState] = useState<E2EEState>({
    isSetUp: false,
    isInitializing: true,
    identityKey: null,
    deviceId: null,
    fingerprint: null,
    error: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const lastCheckRef = useRef<number>(0);
  const setupPromiseRef = useRef<Promise<boolean> | null>(null);

  /**
   * Check if E2EE is already set up
   */
  const checkSetup = useCallback(async (): Promise<boolean> => {
    try {
      const now = Date.now();
      if (now - lastCheckRef.current < CACHE_DURATION && state.isSetUp) {
        return true;
      }

      const isSetUp = await e2ee.isE2EESetUp();
      const identityKey = isSetUp ? await e2ee.loadIdentityKeyPair() : null;
      const deviceId = isSetUp ? await e2ee.getDeviceId() : null;
      const fingerprint =
        identityKey && isSetUp ? await e2ee.fingerprint(identityKey.publicKey) : null;

      setState((prev) => ({
        ...prev,
        isSetUp,
        isInitializing: false,
        identityKey,
        deviceId,
        fingerprint,
        error: null,
      }));

      lastCheckRef.current = now;
      return isSetUp;
    } catch (error) {
      logger.error('Failed to check E2EE setup', { error });
      setState((prev) => ({
        ...prev,
        isInitializing: false,
        error: 'Failed to check E2EE status',
      }));
      return false;
    }
  }, [state.isSetUp]);

  /**
   * Initialize E2EE on mount
   */
  useEffect(() => {
    checkSetup();
  }, [checkSetup]);

  /**
   * Generate new key bundle
   */
  const generateNewKeys = useCallback(
    async (numOneTimePreKeys: number = 100): Promise<KeyBundle | null> => {
      try {
        setIsLoading(true);
        setState((prev) => ({ ...prev, error: null }));

        // Generate device ID if not available
        let deviceId = await e2ee.getDeviceId();
        if (!deviceId) {
          const randomBytes = e2ee.randomBytes(16);
          deviceId = Buffer.from(randomBytes).toString('hex');
        }

        const bundle = await e2ee.generateKeyBundle(deviceId, numOneTimePreKeys);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        logger.info('Generated new key bundle', { deviceId, numPreKeys: numOneTimePreKeys });
        return bundle;
      } catch (error) {
        logger.error('Failed to generate keys', { error });
        setState((prev) => ({
          ...prev,
          error: 'Failed to generate encryption keys',
        }));
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Register keys with server
   */
  const registerKeysWithServer = useCallback(async (bundle: KeyBundle): Promise<boolean> => {
    try {
      setIsLoading(true);
      setState((prev) => ({ ...prev, error: null }));

      const keysForServer = e2ee.formatKeysForRegistration(bundle);
      const response = await api.post<RegistrationResponse>('/api/v1/e2ee/keys', keysForServer);

      if (response.data.success) {
        await e2ee.storeKeyBundle(bundle);

        const fingerprint = await e2ee.fingerprint(bundle.identityKey.publicKey);

        setState((prev) => ({
          ...prev,
          isSetUp: true,
          identityKey: bundle.identityKey,
          deviceId: bundle.deviceId,
          fingerprint,
          error: null,
        }));

        lastCheckRef.current = Date.now();
        logger.info('Registered keys with server');
        return true;
      }

      throw new Error('Server rejected key registration');
    } catch (error) {
      logger.error('Failed to register keys', { error });
      setState((prev) => ({
        ...prev,
        error: 'Failed to register encryption keys with server',
      }));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Complete E2EE setup (generate + register)
   * Prevents duplicate setup calls
   */
  const setupE2EE = useCallback(async (): Promise<boolean> => {
    // Return existing promise if setup is in progress
    if (setupPromiseRef.current) {
      return setupPromiseRef.current;
    }

    // Check if already set up
    const alreadySetUp = await checkSetup();
    if (alreadySetUp) {
      return true;
    }

    // Create new setup promise
    setupPromiseRef.current = (async () => {
      try {
        setState((prev) => ({ ...prev, isInitializing: true, error: null }));

        const bundle = await generateNewKeys();
        if (!bundle) {
          return false;
        }

        const registered = await registerKeysWithServer(bundle);
        if (!registered) {
          return false;
        }

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        logger.info('E2EE setup complete');
        return true;
      } catch (error) {
        logger.error('E2EE setup failed', { error });
        setState((prev) => ({
          ...prev,
          error: 'Failed to set up end-to-end encryption',
        }));
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return false;
      } finally {
        setState((prev) => ({ ...prev, isInitializing: false }));
        setupPromiseRef.current = null;
      }
    })();

    return setupPromiseRef.current;
  }, [checkSetup, generateNewKeys, registerKeysWithServer]);

  /**
   * Reset E2EE (clear all keys and sessions)
   */
  const resetE2EE = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      // Notify server of key reset
      try {
        await api.delete('/api/v1/e2ee/keys');
      } catch {
        // Continue with local cleanup even if server fails
        logger.warn('Failed to notify server of key reset');
      }

      await e2ee.clearE2EEData();

      setState({
        isSetUp: false,
        isInitializing: false,
        identityKey: null,
        deviceId: null,
        fingerprint: null,
        error: null,
      });

      lastCheckRef.current = 0;
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      logger.info('E2EE data cleared');
    } catch (error) {
      logger.error('Failed to reset E2EE', { error });
      setState((prev) => ({
        ...prev,
        error: 'Failed to reset encryption',
      }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh one-time prekeys
   */
  const refreshOneTimePreKeys = useCallback(async (count: number = 50): Promise<boolean> => {
    try {
      setIsLoading(true);

      const prekeys = [];
      for (let i = 0; i < count; i++) {
        const prekey = await e2ee.generatePreKeyPair();
        prekeys.push({
          public_key: Buffer.from(prekey.publicKey).toString('base64'),
          key_id: prekey.keyId,
        });
      }

      await api.post('/api/v1/e2ee/prekeys', { prekeys });
      logger.info('Refreshed one-time prekeys', { count });
      return true;
    } catch (error) {
      logger.error('Failed to refresh prekeys', { error });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Encrypt message for recipient
   */
  const encryptMessage = useCallback(
    async (recipientId: string, plaintext: string): Promise<EncryptedMessage | null> => {
      try {
        if (!state.isSetUp) {
          throw new Error('E2EE not set up');
        }

        // Fetch recipient's prekey bundle from server
        const response = await api.get<PrekeyBundleResponse>(
          `/api/v1/e2ee/bundle/${recipientId}`
        );

        const recipientBundle: ServerPrekeyBundle = {
          identity_key: response.data.identity_key,
          identity_key_id: response.data.identity_key_id,
          signed_prekey: response.data.signed_prekey,
          signed_prekey_signature: response.data.signed_prekey_signature,
          signed_prekey_id: response.data.signed_prekey_id,
          one_time_prekey: response.data.one_time_prekey,
          one_time_prekey_id: response.data.one_time_prekey_id,
        };

        const encrypted = await e2ee.encryptForRecipient(plaintext, recipientBundle);
        return encrypted;
      } catch (error) {
        logger.error('Failed to encrypt message', { error, recipientId });
        return null;
      }
    },
    [state.isSetUp]
  );

  /**
   * Decrypt message
   */
  const decryptMessage = useCallback(
    async (
      ciphertext: string,
      nonce: string,
      sharedSecret: Uint8Array
    ): Promise<string | null> => {
      try {
        const ciphertextBytes = Buffer.from(ciphertext, 'base64');
        const nonceBytes = Buffer.from(nonce, 'base64');

        const plaintext = await e2ee.decryptMessage(ciphertextBytes, nonceBytes, sharedSecret);
        return plaintext;
      } catch (error) {
        logger.error('Failed to decrypt message', { error });
        return null;
      }
    },
    []
  );

  /**
   * Generate safety number for key verification
   */
  const generateSafetyNumber = useCallback(
    async (theirIdentityKey: Uint8Array, theirUserId: string): Promise<string | null> => {
      try {
        if (!state.identityKey || !userId) {
          throw new Error('Identity key not available');
        }

        const safetyNumber = await e2ee.generateSafetyNumber(
          state.identityKey.publicKey,
          userId,
          theirIdentityKey,
          theirUserId
        );

        return safetyNumber;
      } catch (error) {
        logger.error('Failed to generate safety number', { error });
        return null;
      }
    },
    [state.identityKey, userId]
  );

  /**
   * Copy safety number to clipboard
   */
  const copySafetyNumber = useCallback(async (safetyNumber: string): Promise<void> => {
    try {
      await Clipboard.setStringAsync(safetyNumber);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      logger.info('Safety number copied to clipboard');
    } catch (error) {
      logger.error('Failed to copy safety number', { error });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, []);

  /**
   * Get fingerprint for a public key
   */
  const getFingerprint = useCallback(
    async (publicKey?: Uint8Array): Promise<string | null> => {
      try {
        const key = publicKey || state.identityKey?.publicKey;
        if (!key) {
          return null;
        }
        return await e2ee.fingerprint(key);
      } catch (error) {
        logger.error('Failed to generate fingerprint', { error });
        return null;
      }
    },
    [state.identityKey]
  );

  /**
   * Get session for recipient
   */
  const getSession = useCallback(async (recipientId: string): Promise<Session | null> => {
    try {
      return await e2ee.getSession(recipientId);
    } catch (error) {
      logger.error('Failed to get session', { error, recipientId });
      return null;
    }
  }, []);

  /**
   * Check if session exists for recipient
   */
  const hasSession = useCallback(async (recipientId: string): Promise<boolean> => {
    const session = await getSession(recipientId);
    return session !== null;
  }, [getSession]);

  /**
   * Clear session for recipient
   */
  const clearSession = useCallback(async (recipientId: string): Promise<void> => {
    try {
      const sessions = await e2ee.loadSessions();
      sessions.delete(recipientId);

      // Re-save remaining sessions
      for (const [id, session] of sessions) {
        await e2ee.saveSession(id, session);
      }

      logger.info('Cleared session', { recipientId });
    } catch (error) {
      logger.error('Failed to clear session', { error, recipientId });
    }
  }, []);

  return {
    // State
    isSetUp: state.isSetUp,
    isInitializing: state.isInitializing,
    isLoading,
    identityKey: state.identityKey,
    deviceId: state.deviceId,
    fingerprint: state.fingerprint,
    error: state.error,

    // Setup actions
    setupE2EE,
    resetE2EE,
    checkSetup,

    // Key operations
    generateNewKeys,
    registerKeysWithServer,
    refreshOneTimePreKeys,

    // Encryption/Decryption
    encryptMessage,
    decryptMessage,

    // Verification
    generateSafetyNumber,
    copySafetyNumber,
    getFingerprint,

    // Session management
    getSession,
    hasSession,
    clearSession,
  };
}

export default useE2EE;
