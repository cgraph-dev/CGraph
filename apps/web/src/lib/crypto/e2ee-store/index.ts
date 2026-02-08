/**
 * E2EE Store — Barrel Export
 *
 * Re-exports everything from the e2ee-store submodules.
 *
 * @module lib/crypto/e2ee-store/index
 */

export { useE2EEStore } from './store';
export { usePreKeyReplenishment } from './hooks';
export type {
  E2EEState,
  BundleCacheEntry,
  EncryptedMessage,
  ServerPrekeyBundle,
  SecureMessage,
} from './types';
export { BUNDLE_CACHE_TTL } from './types';

// Default export for backwards compatibility
export { useE2EEStore as default } from './store';
