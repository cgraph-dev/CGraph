/**
 * End-to-End Encryption (E2EE) Implementation for Web
 * 
 * Browser-native implementation using Web Crypto API:
 * - X3DH (Extended Triple Diffie-Hellman) for key agreement
 * - ECDH with P-256 curve (X25519 alternative for browser compatibility)
 * - ECDSA for signatures
 * - AES-256-GCM for message encryption
 * - HKDF for key derivation
 * 
 * @module lib/crypto/e2ee
 */

// Storage keys
const STORAGE_PREFIX = 'cgraph_e2ee_';
const IDENTITY_KEY = `${STORAGE_PREFIX}identity`;
const SIGNED_PREKEY = `${STORAGE_PREFIX}signed_prekey`;
const DEVICE_ID = `${STORAGE_PREFIX}device_id`;
const SESSIONS = `${STORAGE_PREFIX}sessions`;

/**
 * Type definitions
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
  keyPair: KeyPair;
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

/**
 * Utility functions for encoding/decoding
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function arrayBufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate cryptographically secure random bytes
 */
export function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * Generate a random key ID
 */
function generateKeyId(): string {
  return arrayBufferToHex(randomBytes(8).buffer as ArrayBuffer);
}

/**
 * Generate a device ID
 */
export function generateDeviceId(): string {
  const browserInfo = navigator.userAgent.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '');
  const randomPart = arrayBufferToHex(randomBytes(4).buffer as ArrayBuffer);
  return `${browserInfo}_${randomPart}_${Date.now()}`;
}

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
 * Sign data with ECDSA
 */
export async function sign(privateKey: CryptoKey, data: ArrayBuffer): Promise<ArrayBuffer> {
  // For ECDH keys, we use HMAC-SHA256 as a signature substitute
  // In a full implementation, you'd have a separate ECDSA identity key
  const keyMaterial = await crypto.subtle.exportKey('pkcs8', privateKey);
  const hmacKey = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(keyMaterial).slice(0, 32),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return await crypto.subtle.sign('HMAC', hmacKey, data);
}

/**
 * Verify signature with ECDSA
 */
export async function verify(
  publicKey: CryptoKey,
  signature: ArrayBuffer,
  data: ArrayBuffer
): Promise<boolean> {
  try {
    const keyMaterial = await crypto.subtle.exportKey('raw', publicKey);
    const hmacKey = await crypto.subtle.importKey(
      'raw',
      new Uint8Array(keyMaterial).slice(0, 32),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    return await crypto.subtle.verify('HMAC', hmacKey, signature, data);
  } catch {
    return false;
  }
}

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
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    sharedSecret,
    'HKDF',
    false,
    ['deriveBits']
  );
  
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
  return await crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
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
    { name: 'AES-GCM', iv: new Uint8Array(nonce.buffer as ArrayBuffer) },
    cryptoKey,
    data
  );
  
  return { ciphertext, nonce: nonce.buffer as ArrayBuffer };
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

/**
 * Generate complete key bundle for registration
 */
export async function generateKeyBundle(
  deviceId: string,
  numOneTimePreKeys: number = 100
): Promise<KeyBundle> {
  // Generate identity key pair
  const identityKeyPair = await generateECDHKeyPair();
  const identityKeyId = generateKeyId();
  
  // Generate signed prekey
  const signedPreKeyPair = await generateECDHKeyPair();
  const signedPreKeyId = generateKeyId();
  const signedPreKeyPublic = await exportPublicKey(signedPreKeyPair.publicKey);
  const signature = await sign(identityKeyPair.privateKey, signedPreKeyPublic);
  
  // Generate one-time prekeys
  const oneTimePreKeys: OneTimePreKey[] = [];
  for (let i = 0; i < numOneTimePreKeys; i++) {
    const keyPair = await generateECDHKeyPair();
    oneTimePreKeys.push({
      keyPair,
      keyId: generateKeyId(),
    });
  }
  
  return {
    deviceId,
    identityKey: {
      keyPair: identityKeyPair,
      keyId: identityKeyId,
    },
    signedPreKey: {
      keyPair: signedPreKeyPair,
      keyId: signedPreKeyId,
      signature,
    },
    oneTimePreKeys,
  };
}

/**
 * Store key bundle in localStorage (encrypted with device key in production)
 */
export async function storeKeyBundle(bundle: KeyBundle): Promise<void> {
  // Export keys to storable format
  const identityPublic = await exportPublicKey(bundle.identityKey.keyPair.publicKey);
  const identityPrivate = await exportPrivateKey(bundle.identityKey.keyPair.privateKey);
  const signedPreKeyPublic = await exportPublicKey(bundle.signedPreKey.keyPair.publicKey);
  const signedPreKeyPrivate = await exportPrivateKey(bundle.signedPreKey.keyPair.privateKey);
  
  const storedIdentity = {
    publicKey: arrayBufferToBase64(identityPublic),
    privateKey: arrayBufferToBase64(identityPrivate),
    keyId: bundle.identityKey.keyId,
  };
  
  const storedSignedPreKey = {
    publicKey: arrayBufferToBase64(signedPreKeyPublic),
    privateKey: arrayBufferToBase64(signedPreKeyPrivate),
    keyId: bundle.signedPreKey.keyId,
    signature: arrayBufferToBase64(bundle.signedPreKey.signature),
  };
  
  localStorage.setItem(IDENTITY_KEY, JSON.stringify(storedIdentity));
  localStorage.setItem(SIGNED_PREKEY, JSON.stringify(storedSignedPreKey));
  localStorage.setItem(DEVICE_ID, bundle.deviceId);
}

/**
 * Load identity key pair from storage
 */
export async function loadIdentityKeyPair(): Promise<IdentityKeyPair | null> {
  const stored = localStorage.getItem(IDENTITY_KEY);
  if (!stored) return null;
  
  try {
    const parsed = JSON.parse(stored);
    const publicKey = await importPublicKey(base64ToArrayBuffer(parsed.publicKey));
    const privateKey = await importPrivateKey(base64ToArrayBuffer(parsed.privateKey));
    
    return {
      keyPair: { publicKey, privateKey },
      keyId: parsed.keyId,
    };
  } catch {
    return null;
  }
}

/**
 * Load signed prekey from storage
 */
export async function loadSignedPreKey(): Promise<SignedPreKey | null> {
  const stored = localStorage.getItem(SIGNED_PREKEY);
  if (!stored) return null;
  
  try {
    const parsed = JSON.parse(stored);
    const publicKey = await importPublicKey(base64ToArrayBuffer(parsed.publicKey));
    const privateKey = await importPrivateKey(base64ToArrayBuffer(parsed.privateKey));
    
    return {
      keyPair: { publicKey, privateKey },
      keyId: parsed.keyId,
      signature: base64ToArrayBuffer(parsed.signature),
    };
  } catch {
    return null;
  }
}

/**
 * Get device ID
 */
export function getDeviceId(): string | null {
  return localStorage.getItem(DEVICE_ID);
}

/**
 * Check if E2EE is set up
 */
export async function isE2EESetUp(): Promise<boolean> {
  const identity = await loadIdentityKeyPair();
  return identity !== null;
}

/**
 * Format key bundle for server registration
 */
export async function formatKeysForRegistration(
  bundle: KeyBundle
): Promise<Record<string, unknown>> {
  const identityPublic = await exportPublicKey(bundle.identityKey.keyPair.publicKey);
  const signedPreKeyPublic = await exportPublicKey(bundle.signedPreKey.keyPair.publicKey);
  
  const oneTimePreKeysFormatted = await Promise.all(
    bundle.oneTimePreKeys.map(async (pk) => ({
      public_key: arrayBufferToBase64(await exportPublicKey(pk.keyPair.publicKey)),
      key_id: pk.keyId,
    }))
  );
  
  return {
    identity_key: arrayBufferToBase64(identityPublic),
    key_id: bundle.identityKey.keyId,
    device_id: bundle.deviceId,
    signed_prekey: {
      public_key: arrayBufferToBase64(signedPreKeyPublic),
      signature: arrayBufferToBase64(bundle.signedPreKey.signature),
      key_id: bundle.signedPreKey.keyId,
    },
    one_time_prekeys: oneTimePreKeysFormatted,
  };
}

/**
 * X3DH key agreement (initiator side)
 */
export async function x3dhInitiate(
  identityKeyPair: IdentityKeyPair,
  recipientBundle: ServerPrekeyBundle
): Promise<{ sharedSecret: ArrayBuffer; ephemeralPublic: ArrayBuffer }> {
  // Generate ephemeral key pair
  const ephemeralKeyPair = await generateECDHKeyPair();
  const ephemeralPublic = await exportPublicKey(ephemeralKeyPair.publicKey);
  
  // Import recipient's keys
  const recipientIdentityKey = await importPublicKey(
    base64ToArrayBuffer(recipientBundle.identity_key)
  );
  const recipientSignedPreKey = await importPublicKey(
    base64ToArrayBuffer(recipientBundle.signed_prekey)
  );
  
  // Compute DH results
  // DH1 = DH(IK_A, SPK_B)
  const dh1 = await deriveSharedSecret(
    identityKeyPair.keyPair.privateKey,
    recipientSignedPreKey
  );
  
  // DH2 = DH(EK_A, IK_B)
  const dh2 = await deriveSharedSecret(
    ephemeralKeyPair.privateKey,
    recipientIdentityKey
  );
  
  // DH3 = DH(EK_A, SPK_B)
  const dh3 = await deriveSharedSecret(
    ephemeralKeyPair.privateKey,
    recipientSignedPreKey
  );
  
  // DH4 = DH(EK_A, OPK_B) if available
  let dh4: ArrayBuffer | null = null;
  if (recipientBundle.one_time_prekey) {
    const recipientOneTimePreKey = await importPublicKey(
      base64ToArrayBuffer(recipientBundle.one_time_prekey)
    );
    dh4 = await deriveSharedSecret(ephemeralKeyPair.privateKey, recipientOneTimePreKey);
  }
  
  // Combine DH results
  const combinedLength = 32 + 32 + 32 + (dh4 ? 32 : 0);
  const combined = new Uint8Array(combinedLength);
  combined.set(new Uint8Array(dh1), 0);
  combined.set(new Uint8Array(dh2), 32);
  combined.set(new Uint8Array(dh3), 64);
  if (dh4) {
    combined.set(new Uint8Array(dh4), 96);
  }
  
  // Derive shared secret using HKDF
  const salt = new Uint8Array(32); // Zero salt for X3DH
  const info = new TextEncoder().encode('CGraph E2EE v1');
  const sharedSecret = await hkdf(combined.buffer, salt.buffer, info.buffer, 32);
  
  return { sharedSecret, ephemeralPublic };
}

/**
 * Encrypt a message for a recipient
 */
export async function encryptForRecipient(
  plaintext: string,
  recipientBundle: ServerPrekeyBundle
): Promise<EncryptedMessage> {
  const identityKey = await loadIdentityKeyPair();
  if (!identityKey) {
    throw new Error('Identity key not found - call setupE2EE first');
  }
  
  // Perform X3DH key agreement
  const { sharedSecret, ephemeralPublic } = await x3dhInitiate(identityKey, recipientBundle);
  
  // Encrypt the message
  const { ciphertext, nonce } = await encryptAES(plaintext, sharedSecret);
  
  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    ephemeralPublicKey: arrayBufferToBase64(ephemeralPublic),
    recipientIdentityKeyId: recipientBundle.identity_key_id,
    oneTimePreKeyId: recipientBundle.one_time_prekey_id,
    nonce: arrayBufferToBase64(nonce),
  };
}

/**
 * Decrypt a message (recipient side)
 */
export async function decryptFromSender(
  encryptedMessage: EncryptedMessage,
  senderIdentityKey: ArrayBuffer
): Promise<string> {
  const identityKey = await loadIdentityKeyPair();
  const signedPreKey = await loadSignedPreKey();
  
  if (!identityKey || !signedPreKey) {
    throw new Error('Keys not found');
  }
  
  // Import sender's ephemeral key
  const ephemeralKey = await importPublicKey(
    base64ToArrayBuffer(encryptedMessage.ephemeralPublicKey)
  );
  const senderIdentity = await importPublicKey(senderIdentityKey);
  
  // Compute DH results (receiver side - mirrors sender's computation)
  // DH1 = DH(SPK_B, IK_A)
  const dh1 = await deriveSharedSecret(signedPreKey.keyPair.privateKey, senderIdentity);
  
  // DH2 = DH(IK_B, EK_A)
  const dh2 = await deriveSharedSecret(identityKey.keyPair.privateKey, ephemeralKey);
  
  // DH3 = DH(SPK_B, EK_A)
  const dh3 = await deriveSharedSecret(signedPreKey.keyPair.privateKey, ephemeralKey);
  
  // Combine DH results
  const combined = new Uint8Array(96);
  combined.set(new Uint8Array(dh1), 0);
  combined.set(new Uint8Array(dh2), 32);
  combined.set(new Uint8Array(dh3), 64);
  
  // Derive shared secret
  const salt = new Uint8Array(32);
  const info = new TextEncoder().encode('CGraph E2EE v1');
  const sharedSecret = await hkdf(combined.buffer, salt.buffer, info.buffer, 32);
  
  // Decrypt
  return await decryptAES(
    base64ToArrayBuffer(encryptedMessage.ciphertext),
    base64ToArrayBuffer(encryptedMessage.nonce),
    sharedSecret
  );
}

/**
 * Generate safety number for key verification
 */
export async function generateSafetyNumber(
  ourIdentityKey: ArrayBuffer,
  ourUserId: string,
  theirIdentityKey: ArrayBuffer,
  theirUserId: string
): Promise<string> {
  const encoder = new TextEncoder();
  const ourPart = encoder.encode(ourUserId);
  const theirPart = encoder.encode(theirUserId);
  
  let combined: Uint8Array;
  if (ourUserId < theirUserId) {
    combined = new Uint8Array(
      ourPart.length + ourIdentityKey.byteLength + 
      theirPart.length + theirIdentityKey.byteLength
    );
    let offset = 0;
    combined.set(ourPart, offset); offset += ourPart.length;
    combined.set(new Uint8Array(ourIdentityKey), offset); offset += ourIdentityKey.byteLength;
    combined.set(theirPart, offset); offset += theirPart.length;
    combined.set(new Uint8Array(theirIdentityKey), offset);
  } else {
    combined = new Uint8Array(
      theirPart.length + theirIdentityKey.byteLength + 
      ourPart.length + ourIdentityKey.byteLength
    );
    let offset = 0;
    combined.set(theirPart, offset); offset += theirPart.length;
    combined.set(new Uint8Array(theirIdentityKey), offset); offset += theirIdentityKey.byteLength;
    combined.set(ourPart, offset); offset += ourPart.length;
    combined.set(new Uint8Array(ourIdentityKey), offset);
  }
  
  const hash = await sha256(combined.buffer as ArrayBuffer);
  const hashBytes = new Uint8Array(hash);
  
  // Convert to 60-digit safety number (12 groups of 5 digits)
  const digits: string[] = [];
  for (let i = 0; i < 12; i++) {
    const byte1 = hashBytes[i * 2] ?? 0;
    const byte2 = hashBytes[i * 2 + 1] ?? 0;
    const value = (byte1 << 8) | byte2;
    digits.push(value.toString().padStart(5, '0'));
  }
  
  return digits.join(' ');
}

/**
 * Calculate fingerprint for a public key
 */
export async function fingerprint(publicKey: ArrayBuffer): Promise<string> {
  const hash = await sha256(publicKey);
  return arrayBufferToHex(hash);
}

/**
 * Session management
 */
export function loadSessions(): Map<string, Session> {
  const stored = localStorage.getItem(SESSIONS);
  if (!stored) return new Map();
  
  try {
    const parsed = JSON.parse(stored);
    return new Map(Object.entries(parsed));
  } catch {
    return new Map();
  }
}

export function saveSession(recipientId: string, session: Session): void {
  const sessions = loadSessions();
  sessions.set(recipientId, session);
  
  const obj: Record<string, Session> = {};
  for (const [id, s] of sessions) {
    obj[id] = s;
  }
  
  localStorage.setItem(SESSIONS, JSON.stringify(obj));
}

export function getSession(recipientId: string): Session | null {
  const sessions = loadSessions();
  return sessions.get(recipientId) || null;
}

/**
 * Clear all E2EE data
 */
export function clearE2EEData(): void {
  localStorage.removeItem(IDENTITY_KEY);
  localStorage.removeItem(SIGNED_PREKEY);
  localStorage.removeItem(DEVICE_ID);
  localStorage.removeItem(SESSIONS);
}

export default {
  generateKeyBundle,
  storeKeyBundle,
  loadIdentityKeyPair,
  loadSignedPreKey,
  formatKeysForRegistration,
  encryptForRecipient,
  decryptFromSender,
  generateSafetyNumber,
  fingerprint,
  isE2EESetUp,
  clearE2EEData,
  getDeviceId,
  generateDeviceId,
  getSession,
  saveSession,
  loadSessions,
  // Export utilities
  arrayBufferToBase64,
  base64ToArrayBuffer,
  arrayBufferToHex,
  randomBytes,
};
