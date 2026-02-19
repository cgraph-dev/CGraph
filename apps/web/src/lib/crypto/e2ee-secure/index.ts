/**
 * Secure E2EE Implementation - v2.0.0
 *
 * Barrel re-export for all e2ee-secure submodules.
 *
 * @module lib/crypto/e2ee-secure
 * @version 2.0.0
 * @security CRITICAL
 */

// Re-export constants
export { SECURE_KEYS } from './constants';

// Re-export key storage functions and types
export {
  storeKeyBundle,
  loadIdentityKeyPair,
  loadSignedPreKey,
  getDeviceId,
  isE2EESetUp,
  storeKEMPreKey,
  loadKEMPreKey,
  removeKEMPreKey,
  storeOPKPrivateKeys,
  loadOPKPrivateKey,
  removeOPKPrivateKey,
} from './key-storage';
export type { LoadedSignedPreKey } from './key-storage';

// Re-export messaging functions
export { formatKeysForRegistration, encryptForRecipient, decryptFromSender } from './messaging';

// Re-export session management functions
export { loadSessions, saveSession, getSession, clearE2EEData } from './sessions';

// Re-export all utility functions and types from original e2ee implementation
export {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  arrayBufferToHex,
  randomBytes,
  generateDeviceId,
  generateECDHKeyPair,
  generateECDSAKeyPair,
  exportPublicKey,
  exportPrivateKey,
  importPublicKey,
  importPrivateKey,
  sign,
  verify,
  deriveSharedSecret,
  hkdf,
  sha256,
  encryptAES,
  decryptAES,
  generateKeyBundle,
  fingerprint,
  generateSafetyNumber,
  x3dhInitiate,
  type KeyPair,
  type ExportedKeyPair,
  type IdentityKeyPair,
  type SignedPreKey,
  type OneTimePreKey,
  type KeyBundle,
  type ServerPrekeyBundle,
  type EncryptedMessage,
  type Session,
} from '../e2ee';
