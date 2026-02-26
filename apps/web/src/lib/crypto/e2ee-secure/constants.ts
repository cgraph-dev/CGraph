/**
 * Secure E2EE Constants
 *
 * Storage keys for encrypted IndexedDB (SecureStorage).
 * Kept separate from legacy keys to prevent conflicts.
 *
 * @module lib/crypto/e2ee-secure/constants
 // eslint-disable-next-line jsdoc/check-tag-names
 * @security CRITICAL
 */

// Secure storage keys (different from legacy to prevent conflicts)
export const SECURE_KEYS = {
  IDENTITY_KEY: 'e2ee_identity_key',
  SIGNED_PREKEY: 'e2ee_signed_prekey',
  DEVICE_ID: 'e2ee_device_id',
  SESSIONS: 'e2ee_sessions',
  /** KEM prekey secret keys, stored as JSON map: { [kyberPreKeyId]: base64SecretKey } */
  KEM_PREKEYS: 'e2ee_kem_prekeys',
  /** One-time prekey private keys, stored as JSON map: { [keyId]: base64PrivateKey } */
  OPK_PRIVATE_KEYS: 'e2ee_opk_private_keys',
} as const;
