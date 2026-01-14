/**
 * Crypto module barrel export for Web
 * 
 * v0.9.0: Added Double Ratchet support for forward secrecy
 */
export { default as e2ee } from './e2ee';
export * from './e2ee';
export { useE2EEStore, usePreKeyReplenishment } from './e2eeStore';

// Double Ratchet (v0.9.0+)
export { DoubleRatchetEngine, PostQuantumDoubleRatchet } from './doubleRatchet';
export type { 
  RatchetState, 
  RatchetConfig, 
  MessageHeader,
  EncryptedMessage as RatchetEncryptedMessage,
  DecryptedMessage as RatchetDecryptedMessage,
} from './doubleRatchet';

// Session Manager (v0.9.0+)
export { sessionManager } from './sessionManager';
export type { RatchetSession, SecureMessage, SerializedSession } from './sessionManager';
