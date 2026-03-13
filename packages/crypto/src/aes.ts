/**
 * AES-256-GCM Encryption
 *
 * Symmetric encryption using AES-256 in GCM mode.
 * GCM provides both confidentiality and integrity.
 */

import type { EncryptionResult } from './types';

const AES_KEY_LENGTH = 256;
const NONCE_LENGTH = 12; // 96 bits for GCM

/** Duck-type check for CryptoKey (not available as a runtime value in all environments) */
function isCryptoKey(key: unknown): key is CryptoKey {
  return typeof key === 'object' && key !== null && 'type' in key && 'algorithm' in key && 'extractable' in key;
}

/**
 * Generate a random AES-256 key
 */
export async function generateAESKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: AES_KEY_LENGTH,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Import raw key bytes as AES-GCM key
 */
export async function importAESKey(keyBytes: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, true, [
    'encrypt',
    'decrypt',
  ]);
}

/**
 * Encrypt plaintext with AES-256-GCM
 *
 * @param plaintext - String to encrypt
 * @param key - AES key (CryptoKey or raw bytes)
 * @returns Encryption result with ciphertext and nonce
 */
export async function encryptAES(
  plaintext: string,
  key: CryptoKey | ArrayBuffer
): Promise<EncryptionResult> {
  const cryptoKey = isCryptoKey(key) ? key : await importAESKey(key as ArrayBuffer);
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // Generate random nonce
  const nonce = crypto.getRandomValues(new Uint8Array(NONCE_LENGTH));

  // Encrypt
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: nonce,
    },
    cryptoKey,
    data
  );

  return {
    ciphertext,
    nonce: nonce.buffer,
  };
}

/**
 * Decrypt ciphertext with AES-256-GCM
 *
 * @param ciphertext - Encrypted data
 * @param nonce - Initialization vector used for encryption
 * @param key - AES key (CryptoKey or raw bytes)
 * @returns Decrypted plaintext string
 */
export async function decryptAES(
  ciphertext: ArrayBuffer,
  nonce: ArrayBuffer,
  key: CryptoKey | ArrayBuffer
): Promise<string> {
  const cryptoKey = isCryptoKey(key) ? key : await importAESKey(key as ArrayBuffer);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: nonce,
    },
    cryptoKey,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}
