/**
 * End-to-End Encryption (E2EE) Implementation for Mobile
 *
 * Implements Signal Protocol-inspired encryption:
 * - X3DH (Extended Triple Diffie-Hellman) for key agreement using P-256 ECDH
 * - ECDSA P-256 / SHA-256 for identity key signatures
 * - AES-256-GCM for message encryption
 * - HKDF-SHA-256 for key derivation
 *
 * Phase 2 of crypto consolidation will migrate to @cgraph/crypto's full
 * protocol (PQXDH + Triple Ratchet) for post-quantum security and forward
 * secrecy. See packages/crypto/README.md for the consolidation plan.
 *
 * @module crypto/e2ee
 */

import * as SecureStore from 'expo-secure-store';
import { Buffer } from 'buffer';
import type { ServerPrekeyBundle } from '@cgraph/crypto/types-portable';
import type {
  ProtocolStore,
  ProtocolAddress,
  SessionRecord,
  IdentityKeyRecord,
  PreKeyRecord,
  SignedPreKeyRecord,
  KyberPreKeyRecord,
} from '@cgraph/crypto/stores';
import { createLogger } from '../logger';

const logger = createLogger('E2EE');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const global: Record<string, any>;

// TextEncoder/TextDecoder for React Native
const textEncoder = {
  encode: (str: string): Uint8Array => {
    const buf = Buffer.from(str, 'utf8');
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  },
};

const textDecoder = {
  decode: (bytes: Uint8Array): string => {
    return Buffer.from(bytes).toString('utf8');
  },
};

// Crypto primitives using native crypto API (React Native compatible)
// For production, use react-native-quick-crypto or expo-crypto

/**
 * Secure random bytes generator
 * Uses expo-crypto for cryptographically secure random bytes
 */
export function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  // In React Native, use expo-crypto or react-native-get-random-values
  if (typeof global.crypto !== 'undefined' && global.crypto.getRandomValues) {
    global.crypto.getRandomValues(bytes);
  } else {
    // CRITICAL: Crypto not available - this should never happen in production
    // Log error and throw to prevent insecure key generation
    logger.error('CRITICAL: Secure random not available');
    throw new Error(
      'Cryptographically secure random number generator not available. Please ensure react-native-get-random-values is installed.'
    );
  }
  return bytes;
}

/**
 * SHA-256 hash function
 */
export async function sha256(data: Uint8Array): Promise<Uint8Array> {
  // Use SubtleCrypto when available
  if (typeof global.crypto?.subtle?.digest === 'function') {
    const hashBuffer = await global.crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hashBuffer);
  }
  // Fallback implementation for React Native
  // In production, use react-native-quick-crypto
  throw new Error('SHA-256 not available - install react-native-quick-crypto');
}

/**
 * HKDF (HMAC-based Key Derivation Function)
 * Used to derive encryption keys from shared secrets
 */
export async function hkdf(
  sharedSecret: Uint8Array,
  salt: Uint8Array,
  info: Uint8Array,
  length: number
): Promise<Uint8Array> {
  // Use SubtleCrypto HKDF when available
  if (typeof global.crypto?.subtle?.importKey === 'function') {
    const keyMaterial = await global.crypto.subtle.importKey('raw', sharedSecret, 'HKDF', false, [
      'deriveBits',
    ]);

    const derivedBits = await global.crypto.subtle.deriveBits(
      {
        name: 'HKDF',
        salt,
        info,
        hash: 'SHA-256',
      },
      keyMaterial,
      length * 8
    );

    return new Uint8Array(derivedBits);
  }
  throw new Error('HKDF not available');
}

// =============================================================================
// KEY IMPORT HELPERS — P-256 keys can be imported for ECDH or ECDSA usage
// =============================================================================

/** Import a PKCS8 private key for ECDH key agreement */
async function importPrivateKeyForECDH(pkcs8: Uint8Array): Promise<CryptoKey> {
  return global.crypto.subtle.importKey(
    'pkcs8',
    pkcs8.buffer,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveBits']
  );
}

/** Import a PKCS8 private key for ECDSA signing */
async function importPrivateKeyForECDSA(pkcs8: Uint8Array): Promise<CryptoKey> {
  return global.crypto.subtle.importKey(
    'pkcs8',
    pkcs8.buffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
}

/** Import a raw public key for ECDH key agreement */
async function importPublicKeyForECDH(raw: Uint8Array): Promise<CryptoKey> {
  return global.crypto.subtle.importKey(
    'raw',
    raw.buffer,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    []
  );
}

/** Import a raw public key for ECDSA signature verification */
async function importPublicKeyForECDSA(raw: Uint8Array): Promise<CryptoKey> {
  return global.crypto.subtle.importKey(
    'raw',
    raw.buffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['verify']
  );
}

/** Perform ECDH key agreement using P-256, returns 32-byte shared secret */
async function ecdhDerive(privateKey: CryptoKey, publicKey: CryptoKey): Promise<Uint8Array> {
  const bits = await global.crypto.subtle.deriveBits(
    { name: 'ECDH', public: publicKey },
    privateKey,
    256
  );
  return new Uint8Array(bits);
}

/**
 * Key pair types
 *
 * @deprecated Phase 2 will replace with RawKeyPair from @cgraph/crypto/types-portable
 */
export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

/** @deprecated Phase 2 will replace with PortableIdentityKeyPair */
export interface IdentityKeyPair extends KeyPair {
  keyId: string;
}

/** @deprecated Phase 2 will replace with PortablePreKey */
export interface PreKey extends KeyPair {
  keyId: string;
}

/** @deprecated Phase 2 will replace with PortableSignedPreKey */
export interface SignedPreKey extends PreKey {
  signature: Uint8Array;
}

/** @deprecated Phase 2 will replace with PortableOneTimePreKey */
export type OneTimePreKey = PreKey;

/**
 * Complete key bundle for registration
 * @deprecated Phase 2 will replace with PortableKeyBundle
 */
export interface KeyBundle {
  deviceId: string;
  identityKey: IdentityKeyPair;
  signedPreKey: SignedPreKey;
  oneTimePreKeys: OneTimePreKey[];
}

/**
 * Prekey bundle received from server for establishing session.
 * Now imported from @cgraph/crypto/types-portable — re-exported for compatibility.
 */
export type { ServerPrekeyBundle };

/**
 * Encrypted message envelope
 */
export interface EncryptedMessage {
  ciphertext: string;
  ephemeralPublicKey: string;
  senderIdentityKey: string;
  recipientIdentityKeyId: string;
  oneTimePreKeyId?: string;
  nonce: string;
}

/**
 * Session state for ongoing encrypted conversation
 * @deprecated Phase 2 will replace with PortableSession from @cgraph/crypto/types-portable
 */
export interface Session {
  recipientId: string;
  recipientIdentityKey: Uint8Array;
  sharedSecret: Uint8Array;
  chainKey: Uint8Array;
  messageNumber: number;
  createdAt: number;
}

// Re-export store interfaces for future ProtocolStore implementation
export type {
  ProtocolStore,
  ProtocolAddress,
  SessionRecord,
  IdentityKeyRecord,
  PreKeyRecord,
  SignedPreKeyRecord,
  KyberPreKeyRecord,
};

// Storage keys
const IDENTITY_KEY_PRIVATE = 'e2ee_identity_private';
const IDENTITY_KEY_PUBLIC = 'e2ee_identity_public';
const IDENTITY_KEY_ID = 'e2ee_identity_key_id';
const DEVICE_ID = 'e2ee_device_id';
const SIGNED_PREKEY_PRIVATE = 'e2ee_signed_prekey_private';
const SESSIONS_KEY = 'e2ee_sessions';
const KEM_PREKEY_SECRET = 'e2ee_kem_prekey_secret';
const KEM_PREKEY_PUBLIC = 'e2ee_kem_prekey_public';
const KEM_PREKEY_ID = 'e2ee_kem_prekey_id';
const KEM_PREKEY_SIGNATURE = 'e2ee_kem_prekey_signature';

// =============================================================================
// Protocol Version Constants
// =============================================================================

/** Protocol versions for negotiation with web/backend */
export enum CryptoProtocol {
  /** Classical X3DH + AES-GCM (current mobile default) */
  CLASSICAL_V1 = 1,
  /** Classical X3DH + Double Ratchet (web default) */
  CLASSICAL_V2 = 2,
  /** PQXDH + Triple Ratchet (web PQ sessions — mobile Phase 2) */
  PQXDH_V1 = 3,
}

/** Check if a server prekey bundle includes KEM prekeys (PQ-capable peer) */
export function bundleSupportsPQ(bundle: ServerPrekeyBundle): boolean {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return !!(bundle && 'kyber_prekey' in bundle && (bundle as Record<string, unknown>).kyber_prekey);
}

// =============================================================================
// KEM Prekey Storage — scaffolding for Phase 2 PQ support
// =============================================================================

/** Store a KEM prekey pair in expo-secure-store */
export async function storeKEMPreKey(
  keyId: number,
  publicKey: Uint8Array,
  secretKey: Uint8Array,
  signature: Uint8Array
): Promise<void> {
  await SecureStore.setItemAsync(KEM_PREKEY_ID, String(keyId));
  await SecureStore.setItemAsync(KEM_PREKEY_PUBLIC, Buffer.from(publicKey).toString('base64'));
  await SecureStore.setItemAsync(KEM_PREKEY_SECRET, Buffer.from(secretKey).toString('base64'));
  await SecureStore.setItemAsync(KEM_PREKEY_SIGNATURE, Buffer.from(signature).toString('base64'));
}

/** Load stored KEM prekey data for server registration */
export async function loadKEMPreKey(): Promise<{
  keyId: number;
  publicKey: Uint8Array;
  secretKey: Uint8Array;
  signature: Uint8Array;
} | null> {
  const idStr = await SecureStore.getItemAsync(KEM_PREKEY_ID);
  const pubB64 = await SecureStore.getItemAsync(KEM_PREKEY_PUBLIC);
  const secB64 = await SecureStore.getItemAsync(KEM_PREKEY_SECRET);
  const sigB64 = await SecureStore.getItemAsync(KEM_PREKEY_SIGNATURE);

  if (!idStr || !pubB64 || !secB64 || !sigB64) return null;

  return {
    keyId: parseInt(idStr, 10),
    publicKey: new Uint8Array(Buffer.from(pubB64, 'base64')),
    secretKey: new Uint8Array(Buffer.from(secB64, 'base64')),
    signature: new Uint8Array(Buffer.from(sigB64, 'base64')),
  };
}

/** Clear stored KEM prekey data */
export async function clearKEMPreKey(): Promise<void> {
  await SecureStore.deleteItemAsync(KEM_PREKEY_ID);
  await SecureStore.deleteItemAsync(KEM_PREKEY_PUBLIC);
  await SecureStore.deleteItemAsync(KEM_PREKEY_SECRET);
  await SecureStore.deleteItemAsync(KEM_PREKEY_SIGNATURE);
}

// =============================================================================
// One-Time Prekey (OPK) Lifecycle Management
// =============================================================================

/** SecureStore key for persisted OPK private keys (JSON map of keyId → base64 PKCS8) */
const OPK_PRIVATE_KEYS = 'e2ee_opk_private_keys';
/** SecureStore key for remaining OPK count */
const OPK_COUNT = 'e2ee_opk_count';
/** Minimum OPK threshold before replenishment is recommended */
const OPK_REPLENISH_THRESHOLD = 10;

/**
 * Store one-time prekey private keys in SecureStore.
 * Called after generateKeyBundle() so OPK privates survive across sessions.
 */
export async function storeOneTimePreKeyPrivates(oneTimePreKeys: OneTimePreKey[]): Promise<void> {
  const existing = await loadOneTimePreKeyPrivates();
  for (const opk of oneTimePreKeys) {
    existing.set(opk.keyId, opk.privateKey);
  }
  const serialized: Record<string, string> = {};
  for (const [keyId, pkcs8] of existing) {
    serialized[keyId] = Buffer.from(pkcs8).toString('base64');
  }
  await SecureStore.setItemAsync(OPK_PRIVATE_KEYS, JSON.stringify(serialized));
  await SecureStore.setItemAsync(OPK_COUNT, String(existing.size));
}

/**
 * Load all stored OPK private keys.
 * Returns a Map of keyId → PKCS8 Uint8Array.
 */
export async function loadOneTimePreKeyPrivates(): Promise<Map<string, Uint8Array>> {
  const json = await SecureStore.getItemAsync(OPK_PRIVATE_KEYS);
  if (!json) return new Map();
  try {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const parsed = JSON.parse(json) as Record<string, string>;
    const map = new Map<string, Uint8Array>();
    for (const [keyId, b64] of Object.entries(parsed)) {
      map.set(keyId, new Uint8Array(Buffer.from(b64, 'base64')));
    }
    return map;
  } catch {
    return new Map();
  }
}

/**
 * Load a specific OPK private key by key ID.
 * Used by the responder to compute DH4.
 */
export async function loadOneTimePreKeyPrivate(keyId: string): Promise<Uint8Array | null> {
  const all = await loadOneTimePreKeyPrivates();
  return all.get(keyId) ?? null;
}

/**
 * Delete a consumed one-time prekey after it has been used in X3DH.
 * Per the Signal spec, OPKs MUST be deleted after a single use.
 */
export async function deleteConsumedOneTimePreKey(keyId: string): Promise<void> {
  const all = await loadOneTimePreKeyPrivates();
  all.delete(keyId);
  const serialized: Record<string, string> = {};
  for (const [id, pkcs8] of all) {
    serialized[id] = Buffer.from(pkcs8).toString('base64');
  }
  await SecureStore.setItemAsync(OPK_PRIVATE_KEYS, JSON.stringify(serialized));
  await SecureStore.setItemAsync(OPK_COUNT, String(all.size));
  logger.info(`Deleted consumed OPK ${keyId}, ${all.size} remaining`);
}

/**
 * Check whether OPK replenishment is needed.
 * Returns true when the count falls below the threshold (default 10).
 */
export async function needsOneTimePreKeyReplenishment(
  threshold: number = OPK_REPLENISH_THRESHOLD
): Promise<{ needed: boolean; remaining: number; threshold: number }> {
  const countStr = await SecureStore.getItemAsync(OPK_COUNT);
  const remaining = countStr ? parseInt(countStr, 10) : 0;
  return {
    needed: remaining < threshold,
    remaining,
    threshold,
  };
}

/** Clear all stored one-time prekey private keys */
export async function clearOneTimePreKeys(): Promise<void> {
  await SecureStore.deleteItemAsync(OPK_PRIVATE_KEYS);
  await SecureStore.deleteItemAsync(OPK_COUNT);
}

/**
 * Generate a random key ID (fingerprint)
 */
function generateKeyId(): string {
  const bytes = randomBytes(8);
  return Buffer.from(bytes).toString('hex');
}

/**
 * Generate P-256 ECDH identity key pair
 * Used for both key agreement (ECDH) and signing (ECDSA) — P-256 private keys
 * can be re-imported for either usage via SubtleCrypto.
 */
export async function generateIdentityKeyPair(): Promise<IdentityKeyPair> {
  // Generate key pair using SubtleCrypto
  if (typeof global.crypto?.subtle?.generateKey === 'function') {
    const keyPair = await global.crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256', // X25519 not widely supported, P-256 as fallback
      },
      true,
      ['deriveKey', 'deriveBits']
    );

    const publicKeyRaw = await global.crypto.subtle.exportKey('raw', keyPair.publicKey);
    const privateKeyRaw = await global.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    return {
      publicKey: new Uint8Array(publicKeyRaw),
      privateKey: new Uint8Array(privateKeyRaw),
      keyId: generateKeyId(),
    };
  }

  // Fallback: throw error - insecure key generation is not acceptable
  throw new Error(
    'SubtleCrypto not available. Please install react-native-quick-crypto for secure key generation.'
  );
}

/**
 * Generate X25519 prekey pair for key exchange
 */
export async function generatePreKeyPair(): Promise<PreKey> {
  const keyPair = await generateIdentityKeyPair();
  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
    keyId: generateKeyId(),
  };
}

/**
 * Sign a message with ECDSA P-256 / SHA-256
 * Uses the identity key's PKCS8 private key for proper digital signatures.
 */
export async function sign(privateKeyPkcs8: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const key = await importPrivateKeyForECDSA(privateKeyPkcs8);
  const signature = await global.crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    message
  );
  return new Uint8Array(signature);
}

/**
 * Verify an ECDSA P-256 / SHA-256 signature
 */
export async function verify(
  publicKeyRaw: Uint8Array,
  message: Uint8Array,
  signature: Uint8Array
): Promise<boolean> {
  try {
    const key = await importPublicKeyForECDSA(publicKeyRaw);
    return await global.crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      key,
      signature,
      message
    );
  } catch {
    return false;
  }
}

/**
 * Generate complete key bundle for registration
 * @param deviceId Unique device identifier
 * @param numOneTimePreKeys Number of one-time prekeys to generate
 */
export async function generateKeyBundle(
  deviceId: string,
  numOneTimePreKeys: number = 100
): Promise<KeyBundle> {
  // Generate identity key
  const identityKey = await generateIdentityKeyPair();

  // Generate signed prekey
  const preKey = await generatePreKeyPair();
  const signature = await sign(identityKey.privateKey, preKey.publicKey);
  const signedPreKey: SignedPreKey = {
    ...preKey,
    signature,
  };

  // Generate one-time prekeys
  const oneTimePreKeys: OneTimePreKey[] = [];
  for (let i = 0; i < numOneTimePreKeys; i++) {
    oneTimePreKeys.push(await generatePreKeyPair());
  }

  return {
    deviceId,
    identityKey,
    signedPreKey,
    oneTimePreKeys,
  };
}

/**
 * Store key bundle securely
 */
export async function storeKeyBundle(bundle: KeyBundle): Promise<void> {
  await SecureStore.setItemAsync(
    IDENTITY_KEY_PRIVATE,
    Buffer.from(bundle.identityKey.privateKey).toString('base64')
  );
  await SecureStore.setItemAsync(
    IDENTITY_KEY_PUBLIC,
    Buffer.from(bundle.identityKey.publicKey).toString('base64')
  );
  await SecureStore.setItemAsync(IDENTITY_KEY_ID, bundle.identityKey.keyId);
  await SecureStore.setItemAsync(DEVICE_ID, bundle.deviceId);
  await SecureStore.setItemAsync(
    SIGNED_PREKEY_PRIVATE,
    Buffer.from(bundle.signedPreKey.privateKey).toString('base64')
  );
}

/**
 * Load identity key pair from secure storage
 */
export async function loadIdentityKeyPair(): Promise<IdentityKeyPair | null> {
  const privateKeyB64 = await SecureStore.getItemAsync(IDENTITY_KEY_PRIVATE);
  const publicKeyB64 = await SecureStore.getItemAsync(IDENTITY_KEY_PUBLIC);
  const keyId = await SecureStore.getItemAsync(IDENTITY_KEY_ID);

  if (!privateKeyB64 || !publicKeyB64 || !keyId) {
    return null;
  }

  return {
    privateKey: Buffer.from(privateKeyB64, 'base64'),
    publicKey: Buffer.from(publicKeyB64, 'base64'),
    keyId,
  };
}

/**
 * Get device ID
 */
export async function getDeviceId(): Promise<string | null> {
  return await SecureStore.getItemAsync(DEVICE_ID);
}

/**
 * Format key bundle for server registration.
 * Includes KEM prekey fields if available (PQ-ready registration).
 */
export function formatKeysForRegistration(
  bundle: KeyBundle,
  kemPreKey?: { keyId: number; publicKey: Uint8Array; signature: Uint8Array }
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    identity_key: Buffer.from(bundle.identityKey.publicKey).toString('base64'),
    key_id: bundle.identityKey.keyId,
    device_id: bundle.deviceId,
    signed_prekey: {
      public_key: Buffer.from(bundle.signedPreKey.publicKey).toString('base64'),
      signature: Buffer.from(bundle.signedPreKey.signature).toString('base64'),
      key_id: bundle.signedPreKey.keyId,
    },
    one_time_prekeys: bundle.oneTimePreKeys.map((pk) => ({
      public_key: Buffer.from(pk.publicKey).toString('base64'),
      key_id: pk.keyId,
    })),
  };

  // Include KEM prekey if available (PQ support)
  if (kemPreKey) {
    payload.kyber_prekey = Buffer.from(kemPreKey.publicKey).toString('base64');
    payload.kyber_prekey_id = kemPreKey.keyId;
    payload.kyber_prekey_signature = Buffer.from(kemPreKey.signature).toString('base64');
  }

  return payload;
}

/**
 * Perform X3DH key agreement (initiator / sender side)
 *
 * Computes:
 *   DH1 = ECDH(IK_A, SPK_B)
 *   DH2 = ECDH(EK_A, IK_B)
 *   DH3 = ECDH(EK_A, SPK_B)
 *   SK  = HKDF(DH1 || DH2 || DH3)
 *
 * Also verifies the recipient's signed prekey signature to prevent MITM.
 */
export async function x3dhInitiate(
  identityKeyPair: IdentityKeyPair,
  recipientBundle: ServerPrekeyBundle
): Promise<{
  sharedSecret: Uint8Array;
  ephemeralPublic: Uint8Array;
  usedOneTimePrekey: boolean;
  oneTimePreKeyId?: string;
}> {
  // Generate ephemeral ECDH key pair
  const ephemeralKey = await generatePreKeyPair();

  // Decode recipient's public keys from base64 wire format
  const recipientIdentityKey = new Uint8Array(Buffer.from(recipientBundle.identity_key, 'base64'));
  const recipientSignedPrekey = new Uint8Array(
    Buffer.from(recipientBundle.signed_prekey, 'base64')
  );

  // Verify signed prekey signature (critical for preventing MITM attacks)
  if (recipientBundle.signed_prekey_signature) {
    const sigBytes = new Uint8Array(Buffer.from(recipientBundle.signed_prekey_signature, 'base64'));
    // Use signing_key if available, otherwise verify with identity key
    const verifyKeyRaw = recipientBundle.signing_key
      ? new Uint8Array(Buffer.from(recipientBundle.signing_key, 'base64'))
      : recipientIdentityKey;
    const isValid = await verify(verifyKeyRaw, recipientSignedPrekey, sigBytes);
    if (!isValid) {
      throw new Error('Signed prekey signature verification failed — possible MITM attack');
    }
  }

  // Import keys as ECDH CryptoKeys for deriveBits
  const ourIdentityPrivate = await importPrivateKeyForECDH(identityKeyPair.privateKey);
  const ephemeralPrivate = await importPrivateKeyForECDH(ephemeralKey.privateKey);
  const bobIdentityPub = await importPublicKeyForECDH(recipientIdentityKey);
  const bobSignedPreKeyPub = await importPublicKeyForECDH(recipientSignedPrekey);

  // X3DH: compute three ECDH shared secrets
  const dh1 = await ecdhDerive(ourIdentityPrivate, bobSignedPreKeyPub); // DH(IK_A, SPK_B)
  const dh2 = await ecdhDerive(ephemeralPrivate, bobIdentityPub); // DH(EK_A, IK_B)
  const dh3 = await ecdhDerive(ephemeralPrivate, bobSignedPreKeyPub); // DH(EK_A, SPK_B)

  // DH4 = ECDH(EK_A, OPK_B) — optional, only when bundle includes a one-time prekey
  let dh4: Uint8Array | null = null;
  let usedOneTimePrekey = false;
  if (recipientBundle.one_time_prekey) {
    const recipientOneTimePrekey = new Uint8Array(
      Buffer.from(recipientBundle.one_time_prekey, 'base64')
    );
    const bobOneTimePrekeyPub = await importPublicKeyForECDH(recipientOneTimePrekey);
    dh4 = await ecdhDerive(ephemeralPrivate, bobOneTimePrekeyPub); // DH(EK_A, OPK_B)
    usedOneTimePrekey = true;
  }

  // Concatenate DH results (3-DH or 4-DH depending on OPK availability)
  const totalLength = dh1.length + dh2.length + dh3.length + (dh4 ? dh4.length : 0);
  const dhConcat = new Uint8Array(totalLength);
  dhConcat.set(dh1, 0);
  dhConcat.set(dh2, dh1.length);
  dhConcat.set(dh3, dh1.length + dh2.length);
  if (dh4) {
    dhConcat.set(dh4, dh1.length + dh2.length + dh3.length);
  }

  // KDF — zero salt per X3DH spec
  const salt = new Uint8Array(32);
  const info = textEncoder.encode('CGraph E2EE v1');
  const sharedSecret = await hkdf(dhConcat, salt, info, 32);

  return {
    sharedSecret,
    ephemeralPublic: ephemeralKey.publicKey,
    usedOneTimePrekey,
    oneTimePreKeyId: usedOneTimePrekey ? recipientBundle.one_time_prekey_id : undefined,
  };
}

/**
 * Perform X3DH key agreement (responder / receiver side)
 *
 * Mirrors the initiator's DH computations:
 *   DH1 = ECDH(SPK_B, IK_A)
 *   DH2 = ECDH(IK_B, EK_A)
 *   DH3 = ECDH(SPK_B, EK_A)
 *   DH4 = ECDH(OPK_B, EK_A)  (optional, when one-time prekey was used)
 *   SK  = HKDF(DH1 || DH2 || DH3 [|| DH4])
 *
 * @param identityKeyPair       - Bob's identity key pair (from SecureStore)
 * @param signedPreKeyPkcs8     - Bob's signed prekey private (PKCS8, from SecureStore)
 * @param senderIdentityKeyRaw  - Alice's identity public key (raw, from message envelope)
 * @param senderEphemeralKeyRaw - Alice's ephemeral public key (raw, from message envelope)
 * @param oneTimePreKeyPkcs8    - Bob's one-time prekey private (PKCS8, optional — only if initiator used OPK)
 */
export async function x3dhRespond(
  identityKeyPair: IdentityKeyPair,
  signedPreKeyPkcs8: Uint8Array,
  senderIdentityKeyRaw: Uint8Array,
  senderEphemeralKeyRaw: Uint8Array,
  oneTimePreKeyPkcs8?: Uint8Array
): Promise<{ sharedSecret: Uint8Array }> {
  // Import keys for ECDH
  const ourIdentityPrivate = await importPrivateKeyForECDH(identityKeyPair.privateKey);
  const ourSignedPreKeyPrivate = await importPrivateKeyForECDH(signedPreKeyPkcs8);
  const aliceIdentityPub = await importPublicKeyForECDH(senderIdentityKeyRaw);
  const aliceEphemeralPub = await importPublicKeyForECDH(senderEphemeralKeyRaw);

  // X3DH responder mirrors: DH1 = DH(SPK_B, IK_A), DH2 = DH(IK_B, EK_A), DH3 = DH(SPK_B, EK_A)
  const dh1 = await ecdhDerive(ourSignedPreKeyPrivate, aliceIdentityPub);
  const dh2 = await ecdhDerive(ourIdentityPrivate, aliceEphemeralPub);
  const dh3 = await ecdhDerive(ourSignedPreKeyPrivate, aliceEphemeralPub);

  // DH4 = ECDH(OPK_B, EK_A) — only when one-time prekey was used by initiator
  let dh4: Uint8Array | null = null;
  if (oneTimePreKeyPkcs8) {
    const ourOneTimePreKeyPrivate = await importPrivateKeyForECDH(oneTimePreKeyPkcs8);
    dh4 = await ecdhDerive(ourOneTimePreKeyPrivate, aliceEphemeralPub);
  }

  // Same concatenation and HKDF as initiator
  const totalLength = dh1.length + dh2.length + dh3.length + (dh4 ? dh4.length : 0);
  const dhConcat = new Uint8Array(totalLength);
  dhConcat.set(dh1, 0);
  dhConcat.set(dh2, dh1.length);
  dhConcat.set(dh3, dh1.length + dh2.length);
  if (dh4) {
    dhConcat.set(dh4, dh1.length + dh2.length + dh3.length);
  }

  const salt = new Uint8Array(32);
  const info = textEncoder.encode('CGraph E2EE v1');
  const sharedSecret = await hkdf(dhConcat, salt, info, 32);

  return { sharedSecret };
}

/**
 * Load signed prekey private key from secure storage
 */
export async function loadSignedPreKeyPrivate(): Promise<Uint8Array | null> {
  const pkcs8B64 = await SecureStore.getItemAsync(SIGNED_PREKEY_PRIVATE);
  if (!pkcs8B64) return null;
  return new Uint8Array(Buffer.from(pkcs8B64, 'base64'));
}

/**
 * Encrypt a message using AES-256-GCM
 */
export async function encryptMessage(
  plaintext: string,
  key: Uint8Array
): Promise<{ ciphertext: Uint8Array; nonce: Uint8Array }> {
  const nonce = randomBytes(12); // GCM nonce is 12 bytes
  const plaintextBytes = textEncoder.encode(plaintext);

  if (typeof global.crypto?.subtle?.encrypt === 'function') {
    const cryptoKey = await global.crypto.subtle.importKey('raw', key, { name: 'AES-GCM' }, false, [
      'encrypt',
    ]);

    const ciphertextBuffer = await global.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce },
      cryptoKey,
      plaintextBytes
    );

    return {
      ciphertext: new Uint8Array(ciphertextBuffer),
      nonce,
    };
  }

  throw new Error('AES-GCM encryption not available');
}

/**
 * Decrypt a message using AES-256-GCM
 */
export async function decryptMessage(
  ciphertext: Uint8Array,
  nonce: Uint8Array,
  key: Uint8Array
): Promise<string> {
  if (typeof global.crypto?.subtle?.decrypt === 'function') {
    const cryptoKey = await global.crypto.subtle.importKey('raw', key, { name: 'AES-GCM' }, false, [
      'decrypt',
    ]);

    const plaintextBuffer = await global.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: nonce },
      cryptoKey,
      ciphertext
    );

    return textDecoder.decode(new Uint8Array(plaintextBuffer));
  }

  throw new Error('AES-GCM decryption not available');
}

/**
 * Encrypt a message for a recipient
 * Complete E2EE message encryption flow
 */
export async function encryptForRecipient(
  plaintext: string,
  recipientBundle: ServerPrekeyBundle
): Promise<EncryptedMessage> {
  // Load our identity key
  const identityKey = await loadIdentityKeyPair();
  if (!identityKey) {
    throw new Error('Identity key not found - call setupE2EE first');
  }

  // Perform X3DH key agreement
  const { sharedSecret, ephemeralPublic } = await x3dhInitiate(identityKey, recipientBundle);

  // Encrypt the message
  const { ciphertext, nonce } = await encryptMessage(plaintext, sharedSecret);

  return {
    ciphertext: Buffer.from(ciphertext).toString('base64'),
    ephemeralPublicKey: Buffer.from(ephemeralPublic).toString('base64'),
    senderIdentityKey: Buffer.from(identityKey.publicKey).toString('base64'),
    recipientIdentityKeyId: recipientBundle.identity_key_id,
    oneTimePreKeyId: recipientBundle.one_time_prekey_id,
    nonce: Buffer.from(nonce).toString('base64'),
  };
}

/**
 * Generate safety number for key verification
 * Returns a 60-digit number that both parties can compare
 */
export async function generateSafetyNumber(
  ourIdentityKey: Uint8Array,
  ourUserId: string,
  theirIdentityKey: Uint8Array,
  theirUserId: string
): Promise<string> {
  // Combine identities in deterministic order
  const ourPart = textEncoder.encode(ourUserId);
  const theirPart = textEncoder.encode(theirUserId);

  let combined: Uint8Array;
  if (ourUserId < theirUserId) {
    combined = new Uint8Array([...ourPart, ...ourIdentityKey, ...theirPart, ...theirIdentityKey]);
  } else {
    combined = new Uint8Array([...theirPart, ...theirIdentityKey, ...ourPart, ...ourIdentityKey]);
  }

  // Hash the combined data
  const hash = await sha256(combined);

  // Convert to numeric representation (5 digits per 2 bytes)
  const digits: string[] = [];
  for (let i = 0; i < 12; i++) {
    const highByte = hash[i * 2] ?? 0;
    const lowByte = hash[i * 2 + 1] ?? 0;
    const value = (highByte << 8) | lowByte;
    digits.push(value.toString().padStart(5, '0'));
  }

  return digits.join(' ');
}

/**
 * Calculate fingerprint for a public key
 */
export async function fingerprint(publicKey: Uint8Array): Promise<string> {
  const hash = await sha256(publicKey);
  return Buffer.from(hash).toString('hex');
}

/**
 * Session management
 */
export async function loadSessions(): Promise<Map<string, Session>> {
  const sessionsJson = await SecureStore.getItemAsync(SESSIONS_KEY);
  if (!sessionsJson) {
    return new Map();
  }

  const sessions = JSON.parse(sessionsJson);
  const map = new Map<string, Session>();

  for (const [recipientId, session] of Object.entries(sessions)) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const s = session as Session;
    map.set(recipientId, {
      ...s,

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      recipientIdentityKey: Buffer.from(s.recipientIdentityKey as unknown as string, 'base64'),

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      sharedSecret: Buffer.from(s.sharedSecret as unknown as string, 'base64'),

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      chainKey: Buffer.from(s.chainKey as unknown as string, 'base64'),
    });
  }

  return map;
}

/**
 * Saves session.
 *
 */
export async function saveSession(recipientId: string, session: Session): Promise<void> {
  const sessions = await loadSessions();
  sessions.set(recipientId, session);

  const serialized: Record<string, unknown> = {};
  for (const [id, s] of sessions) {
    serialized[id] = {
      ...s,
      recipientIdentityKey: Buffer.from(s.recipientIdentityKey).toString('base64'),
      sharedSecret: Buffer.from(s.sharedSecret).toString('base64'),
      chainKey: Buffer.from(s.chainKey).toString('base64'),
    };
  }

  await SecureStore.setItemAsync(SESSIONS_KEY, JSON.stringify(serialized));
}

/**
 * Gets session.
 *
 */
export async function getSession(recipientId: string): Promise<Session | null> {
  const sessions = await loadSessions();
  return sessions.get(recipientId) || null;
}

/**
 * Clear all E2EE data (for logout or key reset)
 */
export async function clearE2EEData(): Promise<void> {
  await SecureStore.deleteItemAsync(IDENTITY_KEY_PRIVATE);
  await SecureStore.deleteItemAsync(IDENTITY_KEY_PUBLIC);
  await SecureStore.deleteItemAsync(IDENTITY_KEY_ID);
  await SecureStore.deleteItemAsync(DEVICE_ID);
  await SecureStore.deleteItemAsync(SIGNED_PREKEY_PRIVATE);
  await SecureStore.deleteItemAsync(SESSIONS_KEY);
  // Clear PQ KEM prekey data
  await clearKEMPreKey();
  // Clear one-time prekey private keys
  await clearOneTimePreKeys();
}

/**
 * Check if E2EE is set up for this device
 */
export async function isE2EESetUp(): Promise<boolean> {
  const identityKey = await loadIdentityKeyPair();
  return identityKey !== null;
}

export default {
  generateKeyBundle,
  storeKeyBundle,
  loadIdentityKeyPair,
  loadSignedPreKeyPrivate,
  formatKeysForRegistration,
  encryptForRecipient,
  decryptMessage,
  x3dhRespond,
  generateSafetyNumber,
  fingerprint,
  isE2EESetUp,
  clearE2EEData,
  getSession,
  saveSession,
  getDeviceId,
  sha256,
  generatePreKeyPair,
  // PQ scaffolding
  storeKEMPreKey,
  loadKEMPreKey,
  clearKEMPreKey,
  bundleSupportsPQ,
  CryptoProtocol,
  // OPK lifecycle
  storeOneTimePreKeyPrivates,
  loadOneTimePreKeyPrivate,
  deleteConsumedOneTimePreKey,
  needsOneTimePreKeyReplenishment,
  clearOneTimePreKeys,
};
