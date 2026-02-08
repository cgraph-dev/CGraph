/**
 * Double Ratchet Protocol - Barrel Export
 *
 * Re-exports all public types, classes, and functions from the
 * Double Ratchet submodules.
 *
 * @module lib/crypto/double-ratchet
 * @version 3.0.0
 * @since v0.7.35
 * @see https://signal.org/docs/specifications/doubleratchet/
 */

// Types
export type {
  KeyPair,
  RatchetState,
  MessageHeader,
  EncryptedMessage,
  DecryptedMessage,
  RatchetConfig,
} from './types';

// Key derivation primitives
export { generateDHKeyPair, importDHPublicKey } from './keyDerivation';

// Core ratchet engine
export { DoubleRatchetEngine } from './ratchet';

// Session persistence & diagnostics
export {
  exportSessionState,
  importSessionState,
  destroySessionState,
  getSessionStats,
  type SessionStats,
} from './sessionPersistence';

// Post-quantum hybrid mode
export { PostQuantumDoubleRatchet } from './messageOps';
