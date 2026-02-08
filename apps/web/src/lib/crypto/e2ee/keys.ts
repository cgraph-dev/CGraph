/**
 * E2EE Key Operations
 *
 * Key generation, import/export, signing, and verification
 * using Web Crypto API with ECDH (P-256) and ECDSA.
 *
 * @module lib/crypto/e2ee/keys
 */

import type { KeyPair } from './types';

/**
 * Generate ECDH key pair for key exchange
 */
export async function generateECDHKeyPair(): Promise<KeyPair> {
  return await crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    ['deriveKey', 'deriveBits']
  );
}

/**
 * Generate ECDSA key pair for signing
 */
export async function generateECDSAKeyPair(): Promise<KeyPair> {
  return await crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['sign', 'verify']
  );
}

/**
 * Export a public key to raw format
 */
export async function exportPublicKey(key: CryptoKey): Promise<ArrayBuffer> {
  return await crypto.subtle.exportKey('raw', key);
}

/**
 * Export a private key to PKCS8 format
 */
export async function exportPrivateKey(key: CryptoKey): Promise<ArrayBuffer> {
  return await crypto.subtle.exportKey('pkcs8', key);
}

/**
 * Import a public key from raw format (ECDH)
 */
export async function importPublicKey(rawKey: ArrayBuffer): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'raw',
    rawKey,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    []
  );
}

/**
 * Import a private key from PKCS8 format (ECDH)
 */
export async function importPrivateKey(pkcs8Key: ArrayBuffer): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'pkcs8',
    pkcs8Key,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    ['deriveKey', 'deriveBits']
  );
}

/**
 * Import a public key from raw format (ECDSA for signatures)
 */
export async function importSigningPublicKey(rawKey: ArrayBuffer): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'raw',
    rawKey,
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['verify']
  );
}

/**
 * Import a private key from PKCS8 format (ECDSA for signatures)
 */
export async function importSigningPrivateKey(pkcs8Key: ArrayBuffer): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'pkcs8',
    pkcs8Key,
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['sign']
  );
}

/**
 * Sign data with ECDSA
 * Uses proper ECDSA P-256 signatures for cryptographic authenticity
 */
export async function sign(privateKey: CryptoKey, data: ArrayBuffer): Promise<ArrayBuffer> {
  return await crypto.subtle.sign({ name: 'ECDSA', hash: { name: 'SHA-256' } }, privateKey, data);
}

/**
 * Verify signature with ECDSA
 * Validates cryptographic signatures for authenticity
 */
export async function verify(
  publicKey: CryptoKey,
  signature: ArrayBuffer,
  data: ArrayBuffer
): Promise<boolean> {
  try {
    return await crypto.subtle.verify(
      { name: 'ECDSA', hash: { name: 'SHA-256' } },
      publicKey,
      signature,
      data
    );
  } catch {
    return false;
  }
}
