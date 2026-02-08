/**
 * E2EE Session Management & Verification
 *
 * Session storage/retrieval, safety number generation,
 * and public key fingerprinting.
 *
 * @module lib/crypto/e2ee/session
 */

import type { Session } from './types';
import { arrayBufferToHex } from './utils';
import { sha256 } from './crypto-ops';

// Storage keys
const STORAGE_PREFIX = 'cgraph_e2ee_';
const SESSIONS = `${STORAGE_PREFIX}sessions`;

/**
 * Generate safety number for key verification
 */
export async function generateSafetyNumber(
  ourIdentityKey: ArrayBuffer,
  ourUserId: string,
  theirIdentityKey: ArrayBuffer,
  theirUserId: string
): Promise<string> {
  const encoder = new TextEncoder();
  const ourPart = encoder.encode(ourUserId);
  const theirPart = encoder.encode(theirUserId);

  let combined: Uint8Array;
  if (ourUserId < theirUserId) {
    combined = new Uint8Array(
      ourPart.length + ourIdentityKey.byteLength + theirPart.length + theirIdentityKey.byteLength
    );
    let offset = 0;
    combined.set(ourPart, offset);
    offset += ourPart.length;
    combined.set(new Uint8Array(ourIdentityKey), offset);
    offset += ourIdentityKey.byteLength;
    combined.set(theirPart, offset);
    offset += theirPart.length;
    combined.set(new Uint8Array(theirIdentityKey), offset);
  } else {
    combined = new Uint8Array(
      theirPart.length + theirIdentityKey.byteLength + ourPart.length + ourIdentityKey.byteLength
    );
    let offset = 0;
    combined.set(theirPart, offset);
    offset += theirPart.length;
    combined.set(new Uint8Array(theirIdentityKey), offset);
    offset += theirIdentityKey.byteLength;
    combined.set(ourPart, offset);
    offset += ourPart.length;
    combined.set(new Uint8Array(ourIdentityKey), offset);
  }

  const hash = await sha256(combined.buffer as ArrayBuffer);
  const hashBytes = new Uint8Array(hash);

  // Convert to 60-digit safety number (12 groups of 5 digits)
  const digits: string[] = [];
  for (let i = 0; i < 12; i++) {
    const byte1 = hashBytes[i * 2] ?? 0;
    const byte2 = hashBytes[i * 2 + 1] ?? 0;
    const value = (byte1 << 8) | byte2;
    digits.push(value.toString().padStart(5, '0'));
  }

  return digits.join(' ');
}

/**
 * Calculate fingerprint for a public key
 */
export async function fingerprint(publicKey: ArrayBuffer): Promise<string> {
  const hash = await sha256(publicKey);
  return arrayBufferToHex(hash);
}

/**
 * Session management
 */
export function loadSessions(): Map<string, Session> {
  const stored = localStorage.getItem(SESSIONS);
  if (!stored) return new Map();

  try {
    const parsed = JSON.parse(stored);
    return new Map(Object.entries(parsed));
  } catch {
    return new Map();
  }
}

export function saveSession(recipientId: string, session: Session): void {
  const sessions = loadSessions();
  sessions.set(recipientId, session);

  const obj: Record<string, Session> = {};
  for (const [id, s] of sessions) {
    obj[id] = s;
  }

  localStorage.setItem(SESSIONS, JSON.stringify(obj));
}

export function getSession(recipientId: string): Session | null {
  const sessions = loadSessions();
  return sessions.get(recipientId) || null;
}
