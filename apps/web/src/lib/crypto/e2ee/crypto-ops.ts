/**
 * E2EE Cryptographic Operations
 *
 * ECDH key agreement, HKDF key derivation, SHA-256 hashing,
 * and AES-256-GCM encryption/decryption.
 *
 * @module lib/crypto/e2ee/crypto-ops
 */

import { randomBytes } from './utils';

/**
 * Perform ECDH key agreement
 */
export async function deriveSharedSecret(
  privateKey: CryptoKey,
  publicKey: CryptoKey
): Promise<ArrayBuffer> {
  return await crypto.subtle.deriveBits(
    {
      name: 'ECDH',
      public: publicKey,
    },
    privateKey,
    256
  );
}

/**
 * HKDF key derivation
 */
export async function hkdf(
  sharedSecret: ArrayBuffer,
  salt: ArrayBuffer,
  info: ArrayBuffer,
  length: number
): Promise<ArrayBuffer> {
  const keyMaterial = await crypto.subtle.importKey('raw', sharedSecret, 'HKDF', false, [
    'deriveBits',
  ]);

  return await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      salt: salt,
      info: info,
      hash: 'SHA-256',
    },
    keyMaterial,
    length * 8
  );
}

/**
 * SHA-256 hash
 */
export async function sha256(data: ArrayBuffer): Promise<ArrayBuffer> {
  return await crypto.subtle.digest('SHA-256', data);
}

/**
 * Generate AES-GCM key from raw bytes
 */
async function importAESKey(rawKey: ArrayBuffer): Promise<CryptoKey> {
  return await crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

/**
 * Encrypt with AES-256-GCM
 */
export async function encryptAES(
  plaintext: string,
  key: ArrayBuffer
): Promise<{ ciphertext: ArrayBuffer; nonce: ArrayBuffer }> {
  const nonce = randomBytes(12);
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  const cryptoKey = await importAESKey(key);
  const ciphertext = await crypto.subtle.encrypt(
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    { name: 'AES-GCM', iv: new Uint8Array(nonce.buffer as ArrayBuffer) }, // safe downcast – structural boundary
    cryptoKey,
    data
  );

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return { ciphertext, nonce: nonce.buffer as ArrayBuffer }; // safe downcast – structural boundary
}

/**
 * Decrypt with AES-256-GCM
 */
export async function decryptAES(
  ciphertext: ArrayBuffer,
  nonce: ArrayBuffer,
  key: ArrayBuffer
): Promise<string> {
  const cryptoKey = await importAESKey(key);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: nonce },
    cryptoKey,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(plaintext);
}
