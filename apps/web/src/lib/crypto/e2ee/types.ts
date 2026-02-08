/**
 * E2EE Type Definitions
 *
 * Shared types for the End-to-End Encryption module.
 *
 * @module lib/crypto/e2ee/types
 */

export interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

export interface ExportedKeyPair {
  publicKey: ArrayBuffer;
  privateKey: ArrayBuffer;
}

export interface IdentityKeyPair {
  keyPair: KeyPair; // ECDH key pair for key exchange
  signingKeyPair: KeyPair; // ECDSA key pair for signatures
  keyId: string;
}

export interface SignedPreKey {
  keyPair: KeyPair;
  keyId: string;
  signature: ArrayBuffer;
}

export interface OneTimePreKey {
  keyPair: KeyPair;
  keyId: string;
}

export interface KeyBundle {
  deviceId: string;
  identityKey: IdentityKeyPair;
  signedPreKey: SignedPreKey;
  oneTimePreKeys: OneTimePreKey[];
}

export interface ServerPrekeyBundle {
  identity_key: string;
  identity_key_id: string;
  signing_key?: string; // ECDSA public key for signature verification
  signed_prekey: string;
  signed_prekey_signature: string;
  signed_prekey_id: string;
  one_time_prekey?: string;
  one_time_prekey_id?: string;
}

export interface EncryptedMessage {
  ciphertext: string;
  ephemeralPublicKey: string;
  recipientIdentityKeyId: string;
  oneTimePreKeyId?: string;
  nonce: string;
}

export interface Session {
  recipientId: string;
  recipientIdentityKey: string;
  sharedSecret: string;
  chainKey: string;
  messageNumber: number;
  createdAt: number;
}
