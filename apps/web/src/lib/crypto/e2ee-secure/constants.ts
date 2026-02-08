/**
 * Secure E2EE Constants
 *
 * Storage keys for encrypted IndexedDB (SecureStorage).
 * Kept separate from legacy keys to prevent conflicts.
 *
 * @module lib/crypto/e2ee-secure/constants
 * @security CRITICAL
 */

// Secure storage keys (different from legacy to prevent conflicts)
export const SECURE_KEYS = {
  IDENTITY_KEY: 'e2ee_identity_key',
  SIGNED_PREKEY: 'e2ee_signed_prekey',
  DEVICE_ID: 'e2ee_device_id',
  SESSIONS: 'e2ee_sessions',
} as const;
