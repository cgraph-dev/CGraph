/**
 * @cgraph/crypto
 *
 * End-to-end encryption implementation for CGraph platform.
 * Provides cross-platform cryptographic primitives:
 * - X3DH (Extended Triple Diffie-Hellman) key agreement
 * - Double Ratchet algorithm for forward secrecy
 * - AES-256-GCM symmetric encryption
 * - Key derivation functions (HKDF)
 *
 * Uses Web Crypto API which is available in both browser and Node.js.
 *
 * @module @cgraph/crypto
 */

// Core types
export type {
  KeyPair,
  ExportedKeyPair,
  IdentityKeyPair,
  SignedPreKey,
  OneTimePreKey,
  KeyBundle,
  EncryptedMessage,
  Session,
} from './types';

// AES encryption
export { encryptAES, decryptAES, generateAESKey } from './aes';

// Key utilities
export {
  generateKeyPair,
  deriveSharedSecret,
  hkdf,
  exportPublicKey,
  importPublicKey,
  arrayBufferToBase64,
  base64ToArrayBuffer,
} from './utils';

// Double Ratchet engine
export {
  DoubleRatchetEngine,
  PostQuantumDoubleRatchet,
  generateDHKeyPair,
  importDHPublicKey,
  type KeyPair as DHKeyPair,
  type RatchetState,
  type MessageHeader,
} from './doubleRatchet';
