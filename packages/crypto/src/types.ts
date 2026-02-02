/**
 * Cryptographic type definitions
 *
 * Platform-agnostic types for E2EE implementation.
 */

/**
 * Key pair for ECDH or ECDSA
 */
export interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

/**
 * Exported key pair as raw bytes
 */
export interface ExportedKeyPair {
  publicKey: ArrayBuffer;
  privateKey: ArrayBuffer;
}

/**
 * Identity key pair (long-term keys)
 */
export interface IdentityKeyPair {
  keyPair: KeyPair; // ECDH key pair for key exchange
  signingKeyPair: KeyPair; // ECDSA key pair for signatures
  keyId: string;
}

/**
 * Signed pre-key (medium-term key, rotated periodically)
 */
export interface SignedPreKey {
  keyPair: KeyPair;
  keyId: string;
  signature: ArrayBuffer;
}

/**
 * One-time pre-key (used once then discarded)
 */
export interface OneTimePreKey {
  keyPair: KeyPair;
  keyId: string;
}

/**
 * Complete key bundle for establishing sessions
 */
export interface KeyBundle {
  deviceId: string;
  identityKey: IdentityKeyPair;
  signedPreKey: SignedPreKey;
  oneTimePreKeys: OneTimePreKey[];
}

/**
 * Server-format prekey bundle (base64 encoded)
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
 * Encrypted message payload
 */
export interface EncryptedMessage {
  ciphertext: string;
  ephemeralPublicKey: string;
  recipientIdentityKeyId: string;
  oneTimePreKeyId?: string;
  nonce: string;
}

/**
 * Active encryption session
 */
export interface Session {
  recipientId: string;
  recipientIdentityKey: string;
  sharedSecret: string;
  messageCount: number;
  createdAt: number;
  lastUsedAt: number;
}

/**
 * Encryption result with metadata
 */
export interface EncryptionResult {
  ciphertext: ArrayBuffer;
  nonce: ArrayBuffer;
  authTag?: ArrayBuffer;
}

/**
 * Key derivation options
 */
export interface HKDFOptions {
  salt?: ArrayBuffer;
  info?: ArrayBuffer | string;
  keyLength?: number;
}
