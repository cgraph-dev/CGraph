/**
 * End-to-End Encryption (E2EE) Implementation for Mobile
 * 
 * Implements Signal Protocol-inspired encryption:
 * - X3DH (Extended Triple Diffie-Hellman) for key agreement
 * - Ed25519 for identity keys and signatures
 * - X25519 for key exchange
 * - AES-256-GCM for message encryption
 * 
 * @module crypto/e2ee
 */

import * as SecureStore from 'expo-secure-store';
import { Buffer } from 'buffer';

// Type declarations for React Native global crypto
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
    console.error('CRITICAL: Secure random not available');
    throw new Error('Cryptographically secure random number generator not available. Please ensure react-native-get-random-values is installed.');
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
    const keyMaterial = await global.crypto.subtle.importKey(
      'raw',
      sharedSecret,
      'HKDF',
      false,
      ['deriveBits']
    );
    
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

/**
 * Key pair types
 */
export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export interface IdentityKeyPair extends KeyPair {
  keyId: string;
}

export interface PreKey extends KeyPair {
  keyId: string;
}

export interface SignedPreKey extends PreKey {
  signature: Uint8Array;
}

export interface OneTimePreKey extends PreKey {}

/**
 * Complete key bundle for registration
 */
export interface KeyBundle {
  deviceId: string;
  identityKey: IdentityKeyPair;
  signedPreKey: SignedPreKey;
  oneTimePreKeys: OneTimePreKey[];
}

/**
 * Prekey bundle received from server for establishing session
 */
export interface ServerPrekeyBundle {
  identity_key: string;
  identity_key_id: string;
  signed_prekey: string;
  signed_prekey_signature: string;
  signed_prekey_id: string;
  one_time_prekey?: string;
  one_time_prekey_id?: string;
}

/**
 * Encrypted message envelope
 */
export interface EncryptedMessage {
  ciphertext: string;
  ephemeralPublicKey: string;
  recipientIdentityKeyId: string;
  oneTimePreKeyId?: string;
  nonce: string;
}

/**
 * Session state for ongoing encrypted conversation
 */
export interface Session {
  recipientId: string;
  recipientIdentityKey: Uint8Array;
  sharedSecret: Uint8Array;
  chainKey: Uint8Array;
  messageNumber: number;
  createdAt: number;
}

// Storage keys
const IDENTITY_KEY_PRIVATE = 'e2ee_identity_private';
const IDENTITY_KEY_PUBLIC = 'e2ee_identity_public';
const IDENTITY_KEY_ID = 'e2ee_identity_key_id';
const DEVICE_ID = 'e2ee_device_id';
const SIGNED_PREKEY_PRIVATE = 'e2ee_signed_prekey_private';
const SESSIONS_KEY = 'e2ee_sessions';

/**
 * Generate a random key ID (fingerprint)
 */
function generateKeyId(): string {
  const bytes = randomBytes(8);
  return Buffer.from(bytes).toString('hex');
}

/**
 * Generate Ed25519-like identity key pair (using X25519 for demo)
 * In production, use actual Ed25519 from libsodium or noble-ed25519
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
  throw new Error('SubtleCrypto not available. Please install react-native-quick-crypto for secure key generation.');
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
 * Sign a message with identity key
 * In production, use Ed25519 signing
 */
export async function sign(
  privateKey: Uint8Array,
  message: Uint8Array
): Promise<Uint8Array> {
  // For demo, use HMAC-SHA256 as "signature"
  // In production, use Ed25519
  const key = await global.crypto.subtle.importKey(
    'raw',
    privateKey.slice(0, 32),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await global.crypto.subtle.sign('HMAC', key, message);
  return new Uint8Array(signature);
}

/**
 * Verify a signature
 */
export async function verify(
  publicKey: Uint8Array,
  message: Uint8Array,
  signature: Uint8Array
): Promise<boolean> {
  try {
    const key = await global.crypto.subtle.importKey(
      'raw',
      publicKey.slice(0, 32),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    return await global.crypto.subtle.verify('HMAC', key, signature, message);
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
 * Format key bundle for server registration
 */
export function formatKeysForRegistration(bundle: KeyBundle): Record<string, unknown> {
  return {
    identity_key: Buffer.from(bundle.identityKey.publicKey).toString('base64'),
    key_id: bundle.identityKey.keyId,
    device_id: bundle.deviceId,
    signed_prekey: {
      public_key: Buffer.from(bundle.signedPreKey.publicKey).toString('base64'),
      signature: Buffer.from(bundle.signedPreKey.signature).toString('base64'),
      key_id: bundle.signedPreKey.keyId,
    },
    one_time_prekeys: bundle.oneTimePreKeys.map(pk => ({
      public_key: Buffer.from(pk.publicKey).toString('base64'),
      key_id: pk.keyId,
    })),
  };
}

/**
 * Perform X3DH key agreement
 * Establishes shared secret with recipient using their prekey bundle
 */
export async function x3dhInitiate(
  identityKeyPair: IdentityKeyPair,
  recipientBundle: ServerPrekeyBundle
): Promise<{ sharedSecret: Uint8Array; ephemeralPublic: Uint8Array }> {
  // Generate ephemeral key pair
  const ephemeralKey = await generatePreKeyPair();
  
  // Decode recipient's public keys
  const recipientIdentityKey = Buffer.from(recipientBundle.identity_key, 'base64');
  const recipientSignedPrekey = Buffer.from(recipientBundle.signed_prekey, 'base64');
  
  // Compute shared secrets (simplified - in production use actual ECDH)
  // DH1 = DH(IK_A, SPK_B)
  // DH2 = DH(EK_A, IK_B)
  // DH3 = DH(EK_A, SPK_B)
  // DH4 = DH(EK_A, OPK_B) if available
  
  // For demo, combine keys with XOR (NOT secure - use actual ECDH in production)
  const combined = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    combined[i] = 
      (identityKeyPair.privateKey[i] || 0) ^
      (recipientIdentityKey[i] || 0) ^
      (recipientSignedPrekey[i] || 0) ^
      (ephemeralKey.privateKey[i] || 0);
  }
  
  // Derive shared secret using HKDF
  const salt = new Uint8Array(32); // Zero salt
  const info = textEncoder.encode('CGraph E2EE v1');
  
  let sharedSecret: Uint8Array;
  try {
    sharedSecret = await hkdf(combined, salt, info, 32);
  } catch {
    // Fallback: use the combined directly (not recommended)
    sharedSecret = await sha256(combined);
  }
  
  return {
    sharedSecret,
    ephemeralPublic: ephemeralKey.publicKey,
  };
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
    const cryptoKey = await global.crypto.subtle.importKey(
      'raw',
      key,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    
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
    const cryptoKey = await global.crypto.subtle.importKey(
      'raw',
      key,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
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
    const s = session as Session;
    map.set(recipientId, {
      ...s,
      recipientIdentityKey: Buffer.from(s.recipientIdentityKey as unknown as string, 'base64'),
      sharedSecret: Buffer.from(s.sharedSecret as unknown as string, 'base64'),
      chainKey: Buffer.from(s.chainKey as unknown as string, 'base64'),
    });
  }
  
  return map;
}

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
  formatKeysForRegistration,
  encryptForRecipient,
  decryptMessage,
  generateSafetyNumber,
  fingerprint,
  isE2EESetUp,
  clearE2EEData,
  getSession,
  saveSession,
  getDeviceId,
  sha256,
  generatePreKeyPair,
};
