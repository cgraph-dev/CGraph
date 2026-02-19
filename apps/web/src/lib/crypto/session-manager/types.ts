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
import type { TripleRatchetEngine } from '@cgraph/crypto/tripleRatchet';
import { CryptoProtocol, type SessionProtocolMeta } from '../protocol';

// =============================================================================
// TYPES
// =============================================================================

export interface RatchetSession {
  recipientId: string;
  sessionId: string;
  /** Classical sessions use DoubleRatchetEngine; PQ sessions use TripleRatchetEngine */
  engine: DoubleRatchetEngine | TripleRatchetEngine;
  isInitiator: boolean;
  createdAt: number;
  lastActivity: number;
  messageCount: number;
  /** Protocol version for this session. Defaults to CLASSICAL_V1 for legacy sessions. */
  protocol: SessionProtocolMeta;
}

export interface SerializedSession {
  recipientId: string;
  sessionId: string;
  isInitiator: boolean;
  createdAt: number;
  lastActivity: number;
  messageCount: number;
  engineState: string;
  /** Protocol version. Absent = CLASSICAL_V1 (legacy). */
  protocol?: SessionProtocolMeta;
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

  // For PQXDH initial messages (when protocol >= PQXDH_V1)
  pqInitialMessage?: {
    identityKey: string;
    ephemeralKey: string;
    kemCipherText: string;
    signedPreKeyId: number;
    kyberPreKeyId: number;
    oneTimePreKeyId?: number;
    version: number;
  };

  /** Protocol version. Present in V2+ messages; absent = classical. */
  protocolVersion?: CryptoProtocol;

  /** PQ ratchet header — present only for PQXDH_V1+ messages */
  pqRatchetHeader?: {
    epoch: number;
    n: number;
    scka: {
      epoch: number;
      kemPublicKey?: string;
      kemCipherText?: string;
    };
  };
}
