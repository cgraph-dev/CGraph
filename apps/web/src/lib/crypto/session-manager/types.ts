/**
 * Session Manager Types
 *
 * Type definitions for the session manager module, covering
 * ratchet sessions, serialised session state, and the secure
 * message envelope used on the wire.
 *
 * @module lib/crypto/session-manager/types
 */

import type { DoubleRatchetEngine } from '../doubleRatchet';

// =============================================================================
// TYPES
// =============================================================================

export interface RatchetSession {
  recipientId: string;
  sessionId: string;
  engine: DoubleRatchetEngine;
  isInitiator: boolean;
  createdAt: number;
  lastActivity: number;
  messageCount: number;
}

export interface SerializedSession {
  recipientId: string;
  sessionId: string;
  isInitiator: boolean;
  createdAt: number;
  lastActivity: number;
  messageCount: number;
  engineState: string;
}

export interface SecureMessage {
  // Header for routing
  senderId: string;
  recipientId: string;
  sessionId: string;
  messageId: string;
  timestamp: number;

  // Ratchet message
  ratchetMessage: {
    header: {
      dh: string; // Base64 DH public key
      pn: number;
      n: number;
      sessionId: string;
      timestamp: number;
      version: number;
    };
    ciphertext: string; // Base64 ciphertext
    nonce: string; // Base64 nonce
    mac: string; // Base64 MAC
  };

  // For initial message (X3DH)
  initialMessage?: {
    ephemeralPublicKey: string;
    usedOneTimePreKey: boolean;
    oneTimePreKeyId?: string;
  };
}
