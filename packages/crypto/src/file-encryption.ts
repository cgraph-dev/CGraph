/**
 * File-level AES-256-GCM encryption for E2EE file attachments (E2EE-05).
 *
 * Unlike aes.ts which handles string data, this module operates on raw
 * ArrayBuffer data for encrypting binary files (images, documents, audio).
 *
 * Flow:
 * 1. Generate random AES-256-GCM key per file
 * 2. Encrypt file data with that key
 * 3. Return ciphertext + IV + raw key bytes (caller wraps key with session ratchet key)
 *
 * @module @cgraph/crypto/file-encryption
 */

import { generateAESKey, importAESKey } from './aes';

/**
 * Result of encrypting a file.
 */
export interface EncryptedFile {
  /** Encrypted file data */
  ciphertext: ArrayBuffer;
  /** 12-byte initialization vector used for encryption */
  iv: Uint8Array;
  /** Raw AES-256 key bytes — caller must wrap with session ratchet key */
  fileKey: ArrayBuffer;
}

/**
 * Result of decrypting a file.
 */
export interface DecryptedFile {
  /** Decrypted plaintext file data */
  plaintext: ArrayBuffer;
}

/**
 * Encrypt a file with a random AES-256-GCM key.
 *
 * Generates a fresh per-file key and IV. The caller is responsible for
 * wrapping the returned fileKey with the session ratchet key before
 * sending encryption metadata to the server.
 *
 * @param data - Raw file bytes to encrypt
 * @returns Encrypted file data with IV and raw key
 */
export async function encryptFile(data: ArrayBuffer): Promise<EncryptedFile> {
  const fileKey = await generateAESKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const rawKey = await crypto.subtle.exportKey('raw', fileKey);

  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, fileKey, data);

  return { ciphertext, iv, fileKey: rawKey };
}

/**
 * Decrypt a file given the raw AES key and IV.
 *
 * @param ciphertext - Encrypted file data
 * @param rawKey - Raw AES-256 key bytes (unwrapped by caller from ratchet key)
 * @param iv - 12-byte initialization vector
 * @returns Decrypted plaintext file data
 */
export async function decryptFile(
  ciphertext: ArrayBuffer,
  rawKey: ArrayBuffer,
  iv: Uint8Array
): Promise<DecryptedFile> {
  const key = await importAESKey(rawKey);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return { plaintext };
}

/**
 * Encrypt a file and return base64-encoded metadata for transport.
 *
 * Convenience wrapper that produces metadata strings suitable for
 * inclusion in API payloads.
 *
 * @param data - Raw file bytes
 * @returns Encrypted data and base64-encoded metadata
 */
export async function encryptFileWithMetadata(data: ArrayBuffer): Promise<{
  encryptedData: ArrayBuffer;
  metadata: {
    iv: string;
    rawKeyBase64: string;
    algorithm: string;
  };
}> {
  const { ciphertext, iv, fileKey } = await encryptFile(data);

  return {
    encryptedData: ciphertext,
    metadata: {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Uint8Array.buffer is ArrayBuffer in practice
      iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
      rawKeyBase64: arrayBufferToBase64(fileKey),
      algorithm: 'aes-256-gcm',
    },
  };
}

/**
 * Helper: ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}
