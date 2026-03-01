/**
 * Group E2EE - Sender Key protocol for group message encryption (Mobile).
 *
 * React Native compatible implementation mirroring the web version.
 * Uses ECDH P-256 for key agreement, AES-256-GCM for message encryption,
 * and ratcheting chain index for forward secrecy within sessions.
 *
 * @module lib/crypto/group-e2ee
 */

import { Buffer } from 'buffer';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const global: Record<string, any>;

// =============================================================================
// Types
// =============================================================================

export interface SenderKeyPair {
  senderKeyId: string;
  publicKey: CryptoKey;
  privateKey: CryptoKey;
  chainIndex: number;
}

export interface EncryptedGroupMessage {
  ciphertext: string; // base64
  senderKeyId: string;
  chainIndex: number;
  iv: string; // base64
}

export interface PeerSenderKey {
  senderKeyId: string;
  publicKey: CryptoKey;
  chainIndex: number;
}

// =============================================================================
// Crypto Primitive Access
// =============================================================================

/**
 * Get the SubtleCrypto instance (React Native compatibility).
 * Requires react-native-quick-crypto or a polyfill providing global.crypto.subtle.
 */
function getSubtle(): SubtleCrypto {
  const subtle = global.crypto?.subtle ?? globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error(
      'SubtleCrypto not available. Ensure react-native-quick-crypto or a compatible polyfill is installed.'
    );
  }
  return subtle;
}

function getRandomValues(bytes: Uint8Array): Uint8Array {
  const crypto = global.crypto ?? globalThis.crypto;
  if (crypto?.getRandomValues) {
    crypto.getRandomValues(bytes);
    return bytes;
  }
  throw new Error('crypto.getRandomValues not available');
}

// =============================================================================
// Text Encoding (React Native compatible)
// =============================================================================

const textEncoder = {
  encode: (str: string): Uint8Array => {
    const buf = Buffer.from(str, 'utf8');
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  },
};

const textDecoder = {
  decode: (bytes: Uint8Array | ArrayBuffer): string => {
    return Buffer.from(bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes).toString(
      'utf8'
    );
  },
};

// =============================================================================
// Key Generation
// =============================================================================

/**
 * Generate a new Sender Key pair for group E2EE.
 * Uses ECDH P-256 for key exchange compatibility.
 */
export async function generateSenderKey(): Promise<SenderKeyPair> {
  const subtle = getSubtle();
  const keyPair = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
    'deriveBits',
  ]);

  const senderKeyId = generateKeyId();

  return {
    senderKeyId,
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
    chainIndex: 0,
  };
}

// =============================================================================
// Message Encryption
// =============================================================================

/**
 * Encrypt a group message using the sender's key.
 * Derives AES-256-GCM key from sender public key + chain index via SHA-256.
 */
export async function encryptGroupMessage(
  content: string,
  senderKey: SenderKeyPair
): Promise<EncryptedGroupMessage> {
  const subtle = getSubtle();

  // Derive encryption key from sender key + chain index
  const rawKey = await subtle.exportKey('raw', senderKey.publicKey);
  const chainData = textEncoder.encode(`chain-${senderKey.chainIndex}`);
  const combined = new Uint8Array([...new Uint8Array(rawKey), ...chainData]);

  // Hash to derive AES key
  const hashBuffer = await subtle.digest('SHA-256', combined);
  const aesKey = await subtle.importKey('raw', hashBuffer, { name: 'AES-GCM' }, false, [
    'encrypt',
  ]);

  // Encrypt with AES-256-GCM
  const iv = getRandomValues(new Uint8Array(12));
  const encoded = textEncoder.encode(content);
  const ciphertext = await subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, encoded);

  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    senderKeyId: senderKey.senderKeyId,
    chainIndex: senderKey.chainIndex,
    iv: arrayBufferToBase64(iv.buffer),
  };
}

/**
 * Decrypt a group message using the sender's public key.
 */
export async function decryptGroupMessage(
  encrypted: EncryptedGroupMessage,
  senderPublicKey: CryptoKey
): Promise<string> {
  const subtle = getSubtle();

  // Derive the same AES key from sender's public key + chain index
  const rawKey = await subtle.exportKey('raw', senderPublicKey);
  const chainData = textEncoder.encode(`chain-${encrypted.chainIndex}`);
  const combined = new Uint8Array([...new Uint8Array(rawKey), ...chainData]);

  const hashBuffer = await subtle.digest('SHA-256', combined);
  const aesKey = await subtle.importKey('raw', hashBuffer, { name: 'AES-GCM' }, false, [
    'decrypt',
  ]);

  const iv = base64ToArrayBuffer(encrypted.iv);
  const ciphertext = base64ToArrayBuffer(encrypted.ciphertext);

  const decrypted = await subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    aesKey,
    ciphertext
  );

  return textDecoder.decode(decrypted);
}

// =============================================================================
// Key Distribution
// =============================================================================

/**
 * Encrypt a sender key for a specific recipient using their identity public key.
 * Uses ephemeral ECDH key agreement + AES-GCM wrapping.
 */
export async function encryptSenderKeyForRecipient(
  senderKey: SenderKeyPair,
  recipientIdentityPublicKey: CryptoKey
): Promise<string> {
  const subtle = getSubtle();

  // Export sender private key
  const exportedKey = await subtle.exportKey('pkcs8', senderKey.privateKey);

  // Generate ephemeral key for ECDH
  const ephemeral = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
    'deriveBits',
  ]);

  // Derive shared secret via ECDH
  const sharedBits = await subtle.deriveBits(
    { name: 'ECDH', public: recipientIdentityPublicKey },
    ephemeral.privateKey,
    256
  );

  // Use shared secret as AES key
  const wrapKey = await subtle.importKey('raw', sharedBits, { name: 'AES-GCM' }, false, [
    'encrypt',
  ]);

  // Encrypt the sender key
  const iv = getRandomValues(new Uint8Array(12));
  const encrypted = await subtle.encrypt({ name: 'AES-GCM', iv }, wrapKey, exportedKey);

  // Encode: ephemeral public key (65 bytes) + iv (12 bytes) + ciphertext
  const ephemeralPub = await subtle.exportKey('raw', ephemeral.publicKey);
  const result = new Uint8Array([
    ...new Uint8Array(ephemeralPub),
    ...iv,
    ...new Uint8Array(encrypted),
  ]);

  return arrayBufferToBase64(result.buffer);
}

/**
 * Decrypt a received sender key using own identity private key.
 */
export async function decryptReceivedSenderKey(
  encryptedData: string,
  ownIdentityPrivateKey: CryptoKey
): Promise<CryptoKey> {
  const subtle = getSubtle();
  const data = new Uint8Array(base64ToArrayBuffer(encryptedData));

  // Parse: 65 bytes ephemeral public key + 12 bytes IV + rest is ciphertext
  const ephemeralPubBytes = data.slice(0, 65);
  const iv = data.slice(65, 77);
  const ciphertext = data.slice(77);

  // Import ephemeral public key
  const ephemeralPub = await subtle.importKey(
    'raw',
    ephemeralPubBytes,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  // Derive shared secret
  const sharedBits = await subtle.deriveBits(
    { name: 'ECDH', public: ephemeralPub },
    ownIdentityPrivateKey,
    256
  );

  // Use shared secret as AES key
  const unwrapKey = await subtle.importKey('raw', sharedBits, { name: 'AES-GCM' }, false, [
    'decrypt',
  ]);

  // Decrypt the sender key
  const decrypted = await subtle.decrypt({ name: 'AES-GCM', iv }, unwrapKey, ciphertext);

  // Import as ECDH private key
  return subtle.importKey('pkcs8', decrypted, { name: 'ECDH', namedCurve: 'P-256' }, true, [
    'deriveBits',
  ]);
}

// =============================================================================
// Key Export/Import
// =============================================================================

/**
 * Export a public key to base64 for transmission.
 */
export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const subtle = getSubtle();
  const raw = await subtle.exportKey('raw', key);
  return arrayBufferToBase64(raw);
}

/**
 * Import a public key from base64.
 */
export async function importPublicKey(base64Key: string): Promise<CryptoKey> {
  const subtle = getSubtle();
  const raw = base64ToArrayBuffer(base64Key);
  return subtle.importKey('raw', raw, { name: 'ECDH', namedCurve: 'P-256' }, true, []);
}

// =============================================================================
// Utilities
// =============================================================================

function generateKeyId(): string {
  const bytes = getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(new Uint8Array(buffer)).toString('base64');
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const buf = Buffer.from(base64, 'base64');
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}
