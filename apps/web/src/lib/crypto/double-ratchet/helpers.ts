/**
 * Double Ratchet Protocol - Binary Serialization Helpers
 *
 * Utility functions for header serialization, array operations,
 * and skipped key management used by the ratchet engine.
 *
 * @module lib/crypto/double-ratchet/helpers
 * @version 3.0.0
 * @since v0.7.35
 */

import type { MessageHeader } from './types';

/**
 * Serialize message header to bytes
 */
export function serializeHeader(header: MessageHeader): Uint8Array {
  const encoder = new TextEncoder();
  const sessionIdBytes = encoder.encode(header.sessionId);

  // Format: [version(1)][pn(4)][n(4)][timestamp(8)][sessionIdLen(1)][sessionId][dh]
  const buffer = new Uint8Array(1 + 4 + 4 + 8 + 1 + sessionIdBytes.length + header.dh.length);
  const view = new DataView(buffer.buffer);

  let offset = 0;
  buffer[offset++] = header.version;
  view.setUint32(offset, header.pn, false);
  offset += 4;
  view.setUint32(offset, header.n, false);
  offset += 4;
  view.setBigUint64(offset, BigInt(header.timestamp), false);
  offset += 8;
  buffer[offset++] = sessionIdBytes.length;
  buffer.set(sessionIdBytes, offset);
  offset += sessionIdBytes.length;
  buffer.set(header.dh, offset);

  return buffer;
}

/**
 * Concatenate multiple Uint8Arrays
 */
export function concatArrays(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

/**
 * Compare two Uint8Arrays in constant time
 */
export function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return result === 0;
}

/**
 * Create a unique key for the skipped message store
 */
export function makeSkipKey(dhPublicKey: Uint8Array, n: number): string {
  const dhHex = Array.from(dhPublicKey.slice(0, 8))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${dhHex}:${n}`;
}
