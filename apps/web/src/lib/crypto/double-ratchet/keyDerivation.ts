/**
 * Double Ratchet Protocol - Key Derivation & Cryptographic Primitives
 *
 * ECDH key generation, HKDF key derivation, KDF chain operations,
 * AES-256-GCM encryption/decryption, and HMAC-SHA256 MAC.
 *
 * @module lib/crypto/double-ratchet/keyDerivation
 * @version 3.0.0
 * @since v0.7.35
 */

import type { KeyPair } from './types';

// =============================================================================
// CONSTANTS
// =============================================================================

const ROOT_KEY_SEED_INFO = new TextEncoder().encode('DoubleRatchetRootKeys');

// =============================================================================
// UTILITIES
// =============================================================================

/** Ensure ArrayBuffer compatibility for Web Crypto API */
export function toArrayBuffer(data: Uint8Array): ArrayBuffer {
  // Create a proper ArrayBuffer copy to avoid SharedArrayBuffer issues
  const buffer = new ArrayBuffer(data.byteLength);
  new Uint8Array(buffer).set(data);
  return buffer;
}

// =============================================================================
// ECDH OPERATIONS
// =============================================================================

/**
 * Generate a new ECDH key pair for the DH ratchet
 */
export async function generateDHKeyPair(): Promise<KeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, // P-256 for cross-platform compatibility
    true,
    ['deriveBits']
  );

  const rawPublicKey = await crypto.subtle.exportKey('raw', keyPair.publicKey);

  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
    rawPublicKey: new Uint8Array(rawPublicKey),
  };
}

/**
 * Import a raw public key for ECDH
 */
export async function importDHPublicKey(rawKey: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    toArrayBuffer(rawKey),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );
}

/**
 * Perform ECDH key agreement
 */
export async function performDH(privateKey: CryptoKey, publicKey: CryptoKey): Promise<Uint8Array> {
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: publicKey },
    privateKey,
    256 // P-256 produces 256 bits
  );

  return new Uint8Array(sharedSecret);
}

// =============================================================================
// KEY DERIVATION
// =============================================================================

/**
 * HKDF key derivation with domain separation
 */
export async function hkdfDerive(
  inputKey: Uint8Array,
  salt: Uint8Array,
  info: Uint8Array,
  length: number
): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey('raw', toArrayBuffer(inputKey), 'HKDF', false, [
    'deriveBits',
  ]);

  const derived = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: toArrayBuffer(salt),
      info: toArrayBuffer(info),
    },
    keyMaterial,
    length * 8
  );

  return new Uint8Array(derived);
}

/**
 * KDF for root key ratchet
 * Returns (new root key, chain key)
 */
export async function kdfRK(rk: Uint8Array, dhOut: Uint8Array): Promise<[Uint8Array, Uint8Array]> {
  const output = await hkdfDerive(dhOut, rk, ROOT_KEY_SEED_INFO, 64);
  return [output.slice(0, 32), output.slice(32, 64)];
}

/**
 * KDF for chain key ratchet
 * Returns (new chain key, message key)
 */
export async function kdfCK(ck: Uint8Array): Promise<[Uint8Array, Uint8Array]> {
  // Use HMAC for chain key derivation
  const key = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(ck),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Chain key = HMAC(ck, 0x02)
  const chainKeyInput = new Uint8Array([0x02]);
  const chainKeySig = await crypto.subtle.sign('HMAC', key, chainKeyInput);

  // Message key = HMAC(ck, 0x01)
  const messageKeyInput = new Uint8Array([0x01]);
  const messageKeySig = await crypto.subtle.sign('HMAC', key, messageKeyInput);

  return [new Uint8Array(chainKeySig), new Uint8Array(messageKeySig)];
}

// =============================================================================
// SYMMETRIC ENCRYPTION
// =============================================================================

/**
 * AES-256-GCM encryption with associated data
 */
export async function encrypt(
  plaintext: Uint8Array,
  key: Uint8Array,
  associatedData: Uint8Array
): Promise<{ ciphertext: Uint8Array; nonce: Uint8Array }> {
  const nonce = crypto.getRandomValues(new Uint8Array(12));

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(key.slice(0, 32)), // Use first 32 bytes for AES-256
    'AES-GCM',
    false,
    ['encrypt']
  );

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce, additionalData: toArrayBuffer(associatedData) },
    cryptoKey,
    toArrayBuffer(plaintext)
  );

  return {
    ciphertext: new Uint8Array(ciphertext),
    nonce,
  };
}

/**
 * AES-256-GCM decryption with associated data
 */
export async function decrypt(
  ciphertext: Uint8Array,
  key: Uint8Array,
  nonce: Uint8Array,
  associatedData: Uint8Array
): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(key.slice(0, 32)),
    'AES-GCM',
    false,
    ['decrypt']
  );

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(nonce), additionalData: toArrayBuffer(associatedData) },
    cryptoKey,
    toArrayBuffer(ciphertext)
  );

  return new Uint8Array(plaintext);
}

/**
 * Compute HMAC-SHA256 for message authentication
 */
export async function computeMAC(data: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, toArrayBuffer(data));
  return new Uint8Array(signature);
}
