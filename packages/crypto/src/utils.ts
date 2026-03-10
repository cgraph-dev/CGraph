/**
 * Cryptographic Utilities
 *
 * Common utilities for key management and encoding.
 * Uses Web Crypto API for cross-platform compatibility.
 */

import type { KeyPair, HKDFOptions } from './types';

/**
 * Generate an ECDH key pair using P-256 curve
 */
export async function generateKeyPair(): Promise<KeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true, // extractable
    ['deriveBits', 'deriveKey']
  );

  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
  };
}

/**
 * Generate an ECDSA key pair for signatures
 */
export async function generateSigningKeyPair(): Promise<KeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['sign', 'verify']
  );

  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
  };
}

/**
 * Derive a shared secret using ECDH
 *
 * @param privateKey - Our private key
 * @param publicKey - Other party's public key
 * @returns Shared secret as ArrayBuffer
 */
export async function deriveSharedSecret(
  privateKey: CryptoKey,
  publicKey: CryptoKey
): Promise<ArrayBuffer> {
  return crypto.subtle.deriveBits(
    {
      name: 'ECDH',
      public: publicKey,
    },
    privateKey,
    256 // bits
  );
}

/**
 * HKDF key derivation function
 *
 * @param inputKey - Input key material
 * @param options - Derivation options (salt, info, keyLength)
 * @returns Derived key as ArrayBuffer
 */
export async function hkdf(inputKey: ArrayBuffer, options: HKDFOptions = {}): Promise<ArrayBuffer> {
  const { salt, info, keyLength = 32 } = options;

  // Import input key material
  const baseKey = await crypto.subtle.importKey('raw', inputKey, 'HKDF', false, ['deriveBits']);

  // Prepare info parameter
  let infoBuffer: ArrayBuffer;
  if (typeof info === 'string') {
    infoBuffer = new TextEncoder().encode(info).buffer;
  } else {
    infoBuffer = info || new ArrayBuffer(0);
  }

  // Derive key material
  return crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: salt || new ArrayBuffer(0),
      info: infoBuffer,
    },
    baseKey,
    keyLength * 8 // bits
  );
}

/**
 * Export public key to raw bytes
 */
export async function exportPublicKey(key: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.exportKey('raw', key);
}

/**
 * Import public key from raw bytes
 *
 * @param keyBytes - Raw public key bytes
 * @param usage - Key usage ('ECDH' or 'ECDSA')
 */
export async function importPublicKey(
  keyBytes: ArrayBuffer,
  usage: 'ECDH' | 'ECDSA' = 'ECDH'
): Promise<CryptoKey> {
  const algorithm =
    usage === 'ECDH'
      ? { name: 'ECDH', namedCurve: 'P-256' }
      : { name: 'ECDSA', namedCurve: 'P-256' };

  const keyUsages: KeyUsage[] = usage === 'ECDH' ? [] : ['verify'];

  return crypto.subtle.importKey('raw', keyBytes, algorithm, true, keyUsages);
}

/**
 * Convert ArrayBuffer or Uint8Array to base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generate a random ID string
 */
export function generateId(length: number = 16): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return arrayBufferToBase64(bytes.buffer)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
