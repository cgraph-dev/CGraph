/**
 * Session Manager with Double Ratchet Integration
 *
 * Barrel re-export for the session-manager submodules.
 *
 * @module lib/crypto/session-manager
 * @version 1.0.0
 * @since v0.9.0
 */

// Types
export type { RatchetSession, SerializedSession, SecureMessage } from './types';

// Storage (not re-exported — internal implementation detail)

// Session manager singleton + default export
export { sessionManager } from './session-manager-class';
export { default } from './session-manager-class';
