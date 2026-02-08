/**
 * End-to-End Encryption (E2EE) Implementation for Web
 *
 * Browser-native implementation using Web Crypto API:
 * - X3DH (Extended Triple Diffie-Hellman) for key agreement
 * - ECDH with P-256 curve (X25519 alternative for browser compatibility)
 * - ECDSA for signatures
 * - AES-256-GCM for message encryption
 * - HKDF for key derivation
 *
 * @module lib/crypto/e2ee
 */

// Types
export type {
  KeyPair,
  ExportedKeyPair,
  IdentityKeyPair,
  SignedPreKey,
  OneTimePreKey,
  KeyBundle,
  ServerPrekeyBundle,
  EncryptedMessage,
  Session,
} from './types';

// Utils
export {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  arrayBufferToHex,
  randomBytes,
  generateDeviceId,
} from './utils';

// Key operations
export {
  generateECDHKeyPair,
  generateECDSAKeyPair,
  exportPublicKey,
  exportPrivateKey,
  importPublicKey,
  importPrivateKey,
  importSigningPublicKey,
  importSigningPrivateKey,
  sign,
  verify,
} from './keys';

// Cryptographic operations
export { deriveSharedSecret, hkdf, sha256, encryptAES, decryptAES } from './crypto-ops';

// Key bundle management
export {
  generateKeyBundle,
  storeKeyBundle,
  loadIdentityKeyPair,
  loadSignedPreKey,
  getDeviceId,
  isE2EESetUp,
  formatKeysForRegistration,
  clearE2EEData,
} from './key-bundle';

// X3DH & message encryption
export { x3dhInitiate, encryptForRecipient, decryptFromSender } from './x3dh';

// Session management & verification
export {
  generateSafetyNumber,
  fingerprint,
  loadSessions,
  saveSession,
  getSession,
} from './session';

// Default export matching original module
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  arrayBufferToHex,
  randomBytes,
  generateDeviceId,
} from './utils';
import {
  generateKeyBundle,
  storeKeyBundle,
  loadIdentityKeyPair,
  loadSignedPreKey,
  formatKeysForRegistration,
  isE2EESetUp,
  clearE2EEData,
  getDeviceId,
} from './key-bundle';
import { encryptForRecipient, decryptFromSender } from './x3dh';
import {
  generateSafetyNumber,
  fingerprint,
  getSession,
  saveSession,
  loadSessions,
} from './session';

export default {
  generateKeyBundle,
  storeKeyBundle,
  loadIdentityKeyPair,
  loadSignedPreKey,
  formatKeysForRegistration,
  encryptForRecipient,
  decryptFromSender,
  generateSafetyNumber,
  fingerprint,
  isE2EESetUp,
  clearE2EEData,
  getDeviceId,
  generateDeviceId,
  getSession,
  saveSession,
  loadSessions,
  // Export utilities
  arrayBufferToBase64,
  base64ToArrayBuffer,
  arrayBufferToHex,
  randomBytes,
};
