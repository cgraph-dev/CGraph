/**
 * Secret Chat Module
 *
 * End-to-end encrypted secret chat with:
 * - Ghost mode (hide read receipts, typing indicators)
 * - Session timers with auto-expiry
 * - Panic wipe (destroy all session data)
 * - Secret identity (ephemeral alias + deterministic avatar)
 * - 12 secret chat themes
 * - Triple Ratchet E2E encryption (Post-Quantum capable)
 *
 * @module modules/secret-chat
 */

export * from './components';
export * from './hooks';
export * from './store';
