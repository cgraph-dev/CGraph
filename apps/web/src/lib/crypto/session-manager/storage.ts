/**
 * Session Storage (IndexedDB)
 *
 * Persistence layer for ratchet sessions using IndexedDB.
 * Provides helpers for opening the database, saving / loading /
 * deleting individual sessions, and listing all stored sessions.
 *
 * @module lib/crypto/session-manager/storage
 */

import type { RatchetSession, SerializedSession } from './types';

// =============================================================================
// CONSTANTS
// =============================================================================

const DB_NAME = 'cgraph_e2ee_sessions';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';

// =============================================================================
// DATABASE HANDLE
// =============================================================================

let dbPromise: Promise<IDBDatabase> | null = null;

export async function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'recipientId' });
        store.createIndex('lastActivity', 'lastActivity', { unique: false });
      }
    };
  });

  return dbPromise;
}

// =============================================================================
// CRUD HELPERS
// =============================================================================

export async function saveSessionToStorage(session: RatchetSession): Promise<void> {
  const db = await openDatabase();
  const serialized: SerializedSession = {
    recipientId: session.recipientId,
    sessionId: session.sessionId,
    isInitiator: session.isInitiator,
    createdAt: session.createdAt,
    lastActivity: session.lastActivity,
    messageCount: session.messageCount,
    engineState: await session.engine.exportState(),
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(serialized);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function deleteSessionFromStorage(recipientId: string): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(recipientId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getAllSessions(): Promise<SerializedSession[]> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}
