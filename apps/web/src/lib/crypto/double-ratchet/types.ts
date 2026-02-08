/**
 * Double Ratchet Protocol - Type Definitions
 *
 * All type definitions and interfaces for the Double Ratchet implementation.
 *
 * @module lib/crypto/double-ratchet/types
 * @version 3.0.0
 * @since v0.7.35
 */

export interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
  rawPublicKey: Uint8Array;
}

export interface RatchetState {
  // DH Ratchet
  DHs: KeyPair | null; // Our current DH key pair
  DHr: Uint8Array | null; // Their current DH public key

  // Root chain
  RK: Uint8Array; // Root key (32 bytes)

  // Sending chain
  CKs: Uint8Array | null; // Sending chain key
  Ns: number; // Sending message number

  // Receiving chain
  CKr: Uint8Array | null; // Receiving chain key
  Nr: number; // Receiving message number

  // Previous sending chain
  PN: number; // Previous chain message count

  // Skipped message keys
  MKSKIPPED: Map<string, Uint8Array>;

  // Session metadata
  sessionId: string;
  createdAt: number;
  lastActivity: number;
  messageCount: number;

  // Security audit log
  ratchetSteps: number;
  dhRatchetCount: number;
}

export interface MessageHeader {
  dh: Uint8Array; // Sender's current DH public key
  pn: number; // Previous chain message count
  n: number; // Message number in current chain
  sessionId: string; // Session identifier
  timestamp: number; // Message timestamp
  version: number; // Protocol version
}

export interface EncryptedMessage {
  header: MessageHeader;
  ciphertext: Uint8Array;
  nonce: Uint8Array;
  mac: Uint8Array;
  associatedData?: Uint8Array;
}

export interface DecryptedMessage {
  plaintext: Uint8Array;
  header: MessageHeader;
  isOutOfOrder: boolean;
  wasSkipped: boolean;
}

export interface RatchetConfig {
  enablePostQuantum: boolean;
  maxSkippedMessages: number;
  messageKeyTTL: number; // TTL for skipped message keys in ms
  enableAuditLog: boolean;
  compressionLevel: number; // 0-9, 0 = no compression
}
