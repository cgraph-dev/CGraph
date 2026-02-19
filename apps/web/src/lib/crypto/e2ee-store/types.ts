/**
 * E2EE Store Types
 *
 * Type definitions for the E2EE Zustand store.
 *
 * @module lib/crypto/e2ee-store/types
 */

import type { EncryptedMessage, ServerPrekeyBundle } from '../e2ee';
import type { SecureMessage } from '../sessionManager';
import type { sessionManager } from '../sessionManager';
import type { CryptoProtocol } from '../protocol';

/**
 * Cache entry for a recipient's prekey bundle.
 */
export interface BundleCacheEntry {
  bundle: ServerPrekeyBundle;
  expiresAt: number;
}

/**
 * Full E2EE store state & actions.
 */
export interface E2EEState {
  // State
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  deviceId: string | null;
  fingerprint: string | null;
  prekeyCount: number;
  useDoubleRatchet: boolean;
  /** When true, new sessions use PQXDH + Triple Ratchet (@cgraph/crypto) if recipient supports it */
  useTripleRatchet: boolean;

  // Prekey bundle cache
  bundleCache: Map<string, BundleCacheEntry>;

  // Actions
  initialize: () => Promise<void>;
  setupE2EE: () => Promise<void>;
  resetE2EE: () => Promise<void>;

  // Legacy encryption (X3DH only, for compatibility)
  encryptMessage: (recipientId: string, plaintext: string) => Promise<EncryptedMessage>;
  decryptMessage: (
    senderId: string,
    senderIdentityKey: string,
    encryptedMessage: EncryptedMessage
  ) => Promise<string>;

  // Double Ratchet encryption (v0.9.0+)
  encryptWithRatchet: (recipientId: string, plaintext: string) => Promise<SecureMessage>;
  decryptWithRatchet: (message: SecureMessage, senderIdentityKey?: string) => Promise<string>;
  hasRatchetSession: (recipientId: string) => boolean;
  destroyRatchetSession: (recipientId: string) => Promise<void>;
  getRatchetSessionStats: (
    recipientId: string
  ) => ReturnType<typeof sessionManager.getSessionStats>;

  /** Get the protocol version for a specific session */
  getSessionProtocol: (recipientId: string) => CryptoProtocol | null;

  // Key management
  uploadMorePrekeys: (count?: number) => Promise<number>;
  getPrekeyCount: () => Promise<number>;
  getRecipientBundle: (recipientId: string) => Promise<ServerPrekeyBundle>;
  getSafetyNumber: (userId: string) => Promise<string>;
  getDevices: () => Promise<Array<{ device_id: string; created_at: string }>>;
  revokeDevice: (deviceId: string) => Promise<void>;
  handleKeyRevoked: (userId: string, keyId: string) => void;

  // Settings
  setUseDoubleRatchet: (enabled: boolean) => void;
  /** Toggle PQXDH + Triple Ratchet for new sessions. Requires recipient KEM prekey support. */
  setUseTripleRatchet: (enabled: boolean) => void;
  clearError: () => void;
}

/** TTL for cached prekey bundles (5 minutes). */
export const BUNDLE_CACHE_TTL = 5 * 60 * 1000;

export type { EncryptedMessage, ServerPrekeyBundle, SecureMessage };
