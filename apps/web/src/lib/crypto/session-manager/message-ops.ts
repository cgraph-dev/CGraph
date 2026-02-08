/**
 * Message Operations
 *
 * Helpers for building outgoing SecureMessage envelopes from
 * Double Ratchet output and reconstructing incoming ratchet
 * messages from a SecureMessage.
 *
 * @module lib/crypto/session-manager/message-ops
 */

import type { EncryptedMessage as RatchetEncryptedMessage } from '../doubleRatchet';
import { arrayBufferToBase64, base64ToArrayBuffer, arrayBufferToHex } from '../e2ee';
import type { SecureMessage } from './types';

// =============================================================================
// HELPERS
// =============================================================================

/** Convert a Uint8Array to a fresh ArrayBuffer (avoids shared-buffer issues). */
function toArrayBuffer(arr: Uint8Array): ArrayBuffer {
  const buf = new ArrayBuffer(arr.byteLength);
  new Uint8Array(buf).set(arr);
  return buf;
}

/** Generate a unique, collision-resistant message ID. */
export function generateMessageId(): string {
  const timestamp = Date.now().toString(36);
  const random = arrayBufferToHex(crypto.getRandomValues(new Uint8Array(8)).buffer as ArrayBuffer);
  return `${timestamp}-${random}`;
}

// =============================================================================
// BUILD OUTGOING MESSAGE
// =============================================================================

export interface BuildMessageParams {
  ourUserId: string;
  recipientId: string;
  sessionId: string;
  ratchetMessage: RatchetEncryptedMessage;
}

/**
 * Serialise a Double Ratchet encrypted message into a wire-format
 * SecureMessage (all binary fields are base64-encoded).
 */
export function buildSecureMessage(params: BuildMessageParams): SecureMessage {
  const { ourUserId, recipientId, sessionId, ratchetMessage } = params;

  return {
    senderId: ourUserId,
    recipientId,
    sessionId,
    messageId: generateMessageId(),
    timestamp: Date.now(),
    ratchetMessage: {
      header: {
        dh: arrayBufferToBase64(toArrayBuffer(ratchetMessage.header.dh)),
        pn: ratchetMessage.header.pn,
        n: ratchetMessage.header.n,
        sessionId: ratchetMessage.header.sessionId,
        timestamp: ratchetMessage.header.timestamp,
        version: ratchetMessage.header.version,
      },
      ciphertext: arrayBufferToBase64(toArrayBuffer(ratchetMessage.ciphertext)),
      nonce: arrayBufferToBase64(toArrayBuffer(ratchetMessage.nonce)),
      mac: arrayBufferToBase64(toArrayBuffer(ratchetMessage.mac)),
    },
  };
}

// =============================================================================
// RECONSTRUCT INCOMING MESSAGE
// =============================================================================

/**
 * Deserialise a wire-format SecureMessage back into the binary
 * RatchetEncryptedMessage expected by DoubleRatchetEngine.decryptMessage.
 */
export function toRatchetMessage(message: SecureMessage): RatchetEncryptedMessage {
  return {
    header: {
      dh: new Uint8Array(base64ToArrayBuffer(message.ratchetMessage.header.dh)),
      pn: message.ratchetMessage.header.pn,
      n: message.ratchetMessage.header.n,
      sessionId: message.ratchetMessage.header.sessionId,
      timestamp: message.ratchetMessage.header.timestamp,
      version: message.ratchetMessage.header.version,
    },
    ciphertext: new Uint8Array(base64ToArrayBuffer(message.ratchetMessage.ciphertext)),
    nonce: new Uint8Array(base64ToArrayBuffer(message.ratchetMessage.nonce)),
    mac: new Uint8Array(base64ToArrayBuffer(message.ratchetMessage.mac)),
  };
}
