/**
 * Secure Storage - Cryptographic Operations
 *
 * Low-level crypto primitives: IndexedDB initialization, key derivation,
 * AES-256-GCM encryption/decryption, and device salt management.
 *
 * SECURITY MODEL:
 * 1. Master key derived from user password + device salt (PBKDF2, 600,000 iterations)
 * 2. All sensitive data encrypted with AES-256-GCM before storage
 * 3. Encryption keys never leave Web Crypto API (non-extractable)
 * 4. IndexedDB provides domain isolation (better than localStorage)
 *
 * @module lib/crypto/secure-storage/crypto-ops
 * @security CRITICAL - DO NOT MODIFY WITHOUT SECURITY REVIEW
 */

import { DB_NAME, DB_VERSION, STORE_NAME, SALT_STORE, PBKDF2_ITERATIONS } from './types';

/**
 * Initialize IndexedDB
 */
export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result; // safe downcast – DOM element

      // Create object stores
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('expiresAt', 'expiresAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(SALT_STORE)) {
        db.createObjectStore(SALT_STORE, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Generate cryptographically secure random bytes
 */
export function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * Get or create device salt
 * Salt is stored in IndexedDB and used for PBKDF2 key derivation
 */
export async function getDeviceSalt(): Promise<Uint8Array> {
  const db = await initDB();
  const transaction = db.transaction([SALT_STORE], 'readwrite');
  const store = transaction.objectStore(SALT_STORE);

  return new Promise((resolve, reject) => {
    const request = store.get('device_salt');

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      if (request.result) {
        resolve(new Uint8Array(request.result.salt));
      } else {
        // Generate new salt
        const salt = randomBytes(32);
        const putRequest = store.put({ id: 'device_salt', salt: salt.buffer });

        putRequest.onerror = () => reject(putRequest.error);
        putRequest.onsuccess = () => resolve(salt);
      }
    };
  });
}

/**
 * Derive encryption key from password using PBKDF2
 *
 * SECURITY NOTES:
 * - 600,000 iterations (OWASP 2024 recommendation)
 * - SHA-256 hash function
 * - Device-specific salt prevents rainbow table attacks
 * - Key is non-extractable (cannot be exported from Web Crypto)
 */
export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false, // Non-extractable - key cannot be exported
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data with AES-256-GCM
 */
export async function encryptData(
  plaintext: string,
  key: CryptoKey
): Promise<{ ciphertext: ArrayBuffer; iv: ArrayBuffer }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  const iv = randomBytes(12); // 96-bit IV for GCM

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    data
  );

  return { ciphertext, iv: iv.buffer as ArrayBuffer }; // safe downcast – structural boundary
}

/**
 * Decrypt data with AES-256-GCM
 */
export async function decryptData(
  ciphertext: ArrayBuffer,
  iv: ArrayBuffer,
  key: CryptoKey
): Promise<string> {
  const plaintext = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(iv),
    },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(plaintext);
}
