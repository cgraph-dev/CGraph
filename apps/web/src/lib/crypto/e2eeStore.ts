/**
 * E2EE Store for Web Application
 *
 * Thin re-export barrel — all implementation lives in ./e2ee-store/.
 *
 * @module lib/crypto/e2eeStore
 */

export { useE2EEStore, usePreKeyReplenishment, BUNDLE_CACHE_TTL } from './e2ee-store';

export type {
  E2EEState,
  BundleCacheEntry,
  EncryptedMessage,
  ServerPrekeyBundle,
  SecureMessage,
} from './e2ee-store';

export { default } from './e2ee-store';
