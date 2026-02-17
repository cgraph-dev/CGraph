/**
 * Portable (cross-platform) Cryptographic Types
 *
 * These types use Uint8Array for key material instead of CryptoKey,
 * making them usable on both Web (crypto.subtle) and React Native
 * (expo-crypto / noble).
 *
 * This is the canonical type layer shared between web and mobile.
 * See types.ts for the Web Crypto-specific versions that wrap CryptoKey.
 *
 * @module @cgraph/crypto/types-portable
 */

// =============================================================================
// KEY TYPES (Uint8Array-based, cross-platform)
// =============================================================================

/**
 * Raw key pair — platform-agnostic.
 * publicKey: raw ECDH/ECDSA public key bytes (65 bytes uncompressed P-256)
 * privateKey: raw private key bytes (32 bytes for P-256)
 */
export interface RawKeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

/**
 * Identity key pair — long-term keys for a device.
 */
export interface PortableIdentityKeyPair {
  keyPair: RawKeyPair; // ECDH key pair for key exchange
  signingKeyPair: RawKeyPair; // ECDSA key pair for signatures
  keyId: string;
}

/**
 * Pre-key with ID
 */
export interface PortablePreKey extends RawKeyPair {
  keyId: string;
}

/**
 * Signed pre-key — medium-term, includes signature from identity key.
 */
export interface PortableSignedPreKey extends PortablePreKey {
  signature: Uint8Array;
}

/**
 * One-time pre-key — used once then discarded.
 */
export type PortableOneTimePreKey = PortablePreKey;

/**
 * Complete key bundle for establishing sessions.
 */
export interface PortableKeyBundle {
  deviceId: string;
  identityKey: PortableIdentityKeyPair;
  signedPreKey: PortableSignedPreKey;
  oneTimePreKeys: PortableOneTimePreKey[];
}

// =============================================================================
// MESSAGE TYPES (already cross-platform — base64 strings + metadata)
// =============================================================================

/**
 * Server-format prekey bundle (base64-encoded public keys).
 * Wire format sent to/from the server. Identical across platforms.
 */
export interface ServerPrekeyBundle {
  identity_key: string;
  identity_key_id: string;
  signing_key?: string;
  signed_prekey: string;
  signed_prekey_signature: string;
  signed_prekey_id: string;
  one_time_prekey?: string;
  one_time_prekey_id?: string;
}

/**
 * Encrypted message payload (base64-encoded).
 * Wire format. Identical across platforms.
 */
export interface PortableEncryptedMessage {
  ciphertext: string;
  ephemeralPublicKey: string;
  recipientIdentityKeyId: string;
  oneTimePreKeyId?: string;
  nonce: string;
}

/**
 * Active session state.
 */
export interface PortableSession {
  recipientId: string;
  recipientIdentityKey: Uint8Array;
  sharedSecret: Uint8Array;
  chainKey: Uint8Array;
  messageNumber: number;
  createdAt: number;
  lastUsedAt?: number;
}

// =============================================================================
// CRYPTO OPERATION TYPES
// =============================================================================

/**
 * Result of AES-256-GCM encryption.
 */
export interface PortableEncryptionResult {
  ciphertext: Uint8Array;
  nonce: Uint8Array;
  authTag?: Uint8Array;
}

/**
 * HKDF derivation options.
 */
export interface PortableHKDFOptions {
  salt?: Uint8Array;
  info?: Uint8Array | string;
  keyLength?: number;
}
