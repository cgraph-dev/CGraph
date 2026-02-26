/**
 * Secure E2EE Session Management
 *
 * Functions for loading, saving, and clearing encrypted
 * E2EE sessions in SecureStorage (IndexedDB).
 *
 * @module lib/crypto/e2ee-secure/sessions
 // eslint-disable-next-line jsdoc/check-tag-names
 * @security CRITICAL
 */

import SecureStorage from '../secureStorage';
import { SECURE_KEYS } from './constants';

import type { Session } from '../e2ee';

/**
 * Session management (ENCRYPTED storage)
 */
export async function loadSessions(): Promise<Map<string, Session>> {
  if (!SecureStorage.isReady()) {
    return new Map();
  }

  const stored = await SecureStorage.getItem(SECURE_KEYS.SESSIONS);
  if (!stored) return new Map();

  try {
    const parsed = JSON.parse(stored);
    return new Map(Object.entries(parsed));
  } catch {
    return new Map();
  }
}

/**
 * unknown for the crypto module.
 */
/**
 * Persists session.
 *
 * @param recipientId - The recipient id.
 * @param session - The session.
 * @returns The result.
 */
export async function saveSession(recipientId: string, session: Session): Promise<void> {
  if (!SecureStorage.isReady()) {
    throw new Error('SecureStorage not initialized');
  }

  const sessions = await loadSessions();
  sessions.set(recipientId, session);

  const obj: Record<string, Session> = {};
  for (const [id, s] of sessions) {
    obj[id] = s;
  }

  await SecureStorage.setItem(SECURE_KEYS.SESSIONS, JSON.stringify(obj));
}

/**
 * unknown for the crypto module.
 */
/**
 * Retrieves session.
 *
 * @param recipientId - The recipient id.
 * @returns The session.
 */
export async function getSession(recipientId: string): Promise<Session | null> {
  const sessions = await loadSessions();
  return sessions.get(recipientId) || null;
}

/**
 * Clear all E2EE data (ENCRYPTED storage)
 */
export async function clearE2EEData(): Promise<void> {
  if (!SecureStorage.isReady()) {
    return;
  }

  await SecureStorage.removeItem(SECURE_KEYS.IDENTITY_KEY);
  await SecureStorage.removeItem(SECURE_KEYS.SIGNED_PREKEY);
  await SecureStorage.removeItem(SECURE_KEYS.DEVICE_ID);
  await SecureStorage.removeItem(SECURE_KEYS.SESSIONS);
}
