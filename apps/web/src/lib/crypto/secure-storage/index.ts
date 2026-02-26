/**
 * Secure Storage - Barrel Export
 *
 * Re-exports all public API from secure-storage submodules.
 *
 * @module lib/crypto/secure-storage
 // eslint-disable-next-line jsdoc/check-tag-names
 * @security CRITICAL - DO NOT MODIFY WITHOUT SECURITY REVIEW
 */

export type { EncryptedItem, EncryptionMetadata } from './types';
export { DB_NAME, DB_VERSION, STORE_NAME, SALT_STORE, PBKDF2_ITERATIONS } from './types';

export {
  initDB,
  randomBytes,
  getDeviceSalt,
  deriveKey,
  encryptData,
  decryptData,
} from './crypto-ops';

export { default } from './secure-storage-class';
