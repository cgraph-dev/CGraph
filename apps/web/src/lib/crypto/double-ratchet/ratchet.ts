/**
 * Double Ratchet Protocol - Core Ratchet Engine
 *
 * The DoubleRatchetEngine class implementing the Signal Protocol's
 * Double Ratchet algorithm with session management and diagnostics.
 *
 * @module lib/crypto/double-ratchet/ratchet
 * @version 3.0.0
 * @since v0.7.35
 */

import type {
  KeyPair,
  RatchetState,
  RatchetConfig,
  EncryptedMessage,
  DecryptedMessage,
} from './types';
import {
  exportSessionState,
  importSessionState,
  destroySessionState,
  getSessionStats,
  type SessionStats,
} from './sessionPersistence';
import { initializeAlice as initAlice, initializeBob as initBob } from './ratchetOps';
import { encryptRatchetMessage, decryptRatchetMessage } from './messageEncryption';

// =============================================================================
// CONSTANTS
// =============================================================================

const MAX_SKIP = 1000; // Maximum skipped messages to store

// =============================================================================
// DOUBLE RATCHET ENGINE
// =============================================================================

/**
 * Double Ratchet Engine class.
 */
export class DoubleRatchetEngine {
  private state: RatchetState;
  private config: RatchetConfig;
  private auditLog: Array<{ action: string; timestamp: number; details: string }> = [];

  constructor(config: Partial<RatchetConfig> = {}) {
    this.config = {
      enablePostQuantum: config.enablePostQuantum ?? true,
      maxSkippedMessages: config.maxSkippedMessages ?? MAX_SKIP,
      messageKeyTTL: config.messageKeyTTL ?? 7 * 24 * 60 * 60 * 1000, // 7 days
      enableAuditLog: config.enableAuditLog ?? true,
      compressionLevel: config.compressionLevel ?? 6,
    };

    // Initialize empty state
    this.state = this.createEmptyState();
  }

  private createEmptyState(): RatchetState {
    return {
      DHs: null,
      DHr: null,
      RK: new Uint8Array(32),
      CKs: null,
      CKr: null,
      Ns: 0,
      Nr: 0,
      PN: 0,
      MKSKIPPED: new Map(),
      sessionId: this.generateSessionId(),
      createdAt: Date.now(),
      lastActivity: Date.now(),
      messageCount: 0,
      ratchetSteps: 0,
      dhRatchetCount: 0,
    };
  }

  private generateSessionId(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private log(action: string, details: string): void {
    if (this.config.enableAuditLog) {
      this.auditLog.push({
        action,
        timestamp: Date.now(),
        details,
      });

      // Keep only last 1000 entries
      if (this.auditLog.length > 1000) {
        this.auditLog.shift();
      }
    }
  }

  /**
   * Initialize as Alice (initiator)
   * Called after X3DH key agreement is complete
   */
  async initializeAlice(sharedSecret: Uint8Array, bobPublicKey: Uint8Array): Promise<void> {
    await initAlice(this.state, sharedSecret, bobPublicKey, this.log.bind(this));
  }

  /**
   * Initialize as Bob (responder)
   * Called after X3DH key agreement is complete
   */
  async initializeBob(sharedSecret: Uint8Array, ourKeyPair: KeyPair): Promise<void> {
    await initBob(this.state, sharedSecret, ourKeyPair, this.log.bind(this));
  }

  /**
   * Encrypt a message
   */
  async encryptMessage(
    plaintext: Uint8Array,
    associatedData?: Uint8Array
  ): Promise<EncryptedMessage> {
    return encryptRatchetMessage(this.state, plaintext, associatedData, this.log.bind(this));
  }

  /**
   * Decrypt a message
   */
  async decryptMessage(message: EncryptedMessage): Promise<DecryptedMessage> {
    return decryptRatchetMessage(this.state, this.config, message, this.log.bind(this));
  }

  // ===========================================================================
  // SESSION MANAGEMENT (delegated to sessionPersistence module)
  // ===========================================================================

  /**
   * Get current session state (for persistence)
   */
  async exportState(): Promise<string> {
    return exportSessionState(this.state);
  }

  /**
   * Import session state (from persistence)
   */
  async importState(stateJson: string): Promise<void> {
    this.state = await importSessionState(stateJson);
    this.log('STATE_IMPORTED', `Session ${this.state.sessionId} restored`);
  }

  /**
   * Destroy session and securely erase all keys
   */
  destroy(): void {
    this.log('SESSION_DESTROY', `Destroying session ${this.state.sessionId}`);
    destroySessionState(this.state);
    this.state = this.createEmptyState();
  }

  // ===========================================================================
  // DIAGNOSTICS (delegated to sessionPersistence module)
  // ===========================================================================

  /**
   * Get session statistics
   */
  getStats(): SessionStats {
    return getSessionStats(this.state);
  }

  /**
   * Get security audit log
   */
  getAuditLog(): Array<{ action: string; timestamp: number; details: string }> {
    return [...this.auditLog];
  }

  /**
   * Get our current public key for the ratchet
   */
  getPublicKey(): Uint8Array | null {
    return this.state.DHs?.rawPublicKey ?? null;
  }
}
