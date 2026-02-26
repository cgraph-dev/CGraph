/**
 * Secure E2EE Implementation - v2.0.0
 *
 * CRITICAL SECURITY UPDATE:
 * =========================
 * This is a drop-in replacement for the legacy e2ee.ts that uses
 * encrypted IndexedDB storage instead of plaintext localStorage.
 *
 * This file is a thin re-export barrel.
 * Implementation split into submodules under ./e2ee-secure/
 *
 * @module lib/crypto/e2ee.secure
 * @version 2.0.0
 // eslint-disable-next-line jsdoc/check-tag-names
 * @security CRITICAL
 */

// Re-export everything from the e2ee-secure barrel
export {
  // Constants
  SECURE_KEYS,
  // Key storage
  storeKeyBundle,
  loadIdentityKeyPair,
  loadSignedPreKey,
  getDeviceId,
  isE2EESetUp,
  // Messaging
  formatKeysForRegistration,
  encryptForRecipient,
  decryptFromSender,
  // Sessions
  loadSessions,
  saveSession,
  getSession,
  clearE2EEData,
  // Types from key-storage
  type LoadedSignedPreKey,
  // Re-exported e2ee utilities and types
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
} from './e2ee-secure';

// Import for default export
import {
  storeKeyBundle,
  loadIdentityKeyPair,
  loadSignedPreKey,
  getDeviceId,
  isE2EESetUp,
  formatKeysForRegistration,
  encryptForRecipient,
  decryptFromSender,
  loadSessions,
  saveSession,
  getSession,
  clearE2EEData,
} from './e2ee-secure';

export default {
  storeKeyBundle,
  loadIdentityKeyPair,
  loadSignedPreKey,
  getDeviceId,
  isE2EESetUp,
  formatKeysForRegistration,
  encryptForRecipient,
  decryptFromSender,
  loadSessions,
  saveSession,
  getSession,
  clearE2EEData,
};
