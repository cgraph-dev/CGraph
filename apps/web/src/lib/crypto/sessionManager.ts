/**
 * Session Manager with Double Ratchet Integration
 *
 * Thin re-export barrel — all implementation lives in ./session-manager/.
 *
 * @module lib/crypto/sessionManager
 * @version 1.0.0
 * @since v0.9.0
 */

export type { RatchetSession, SerializedSession, SecureMessage } from './session-manager';
export { sessionManager } from './session-manager';
export { default } from './session-manager';
