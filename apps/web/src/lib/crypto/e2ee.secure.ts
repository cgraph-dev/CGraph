/**
 * Secure E2EE Implementation - v2.0.0
 *
 * CRITICAL SECURITY UPDATE:
 * =========================
 * This is a drop-in replacement for the legacy e2ee.ts that uses
 * encrypted IndexedDB storage instead of plaintext localStorage.
 *
 * KEY CHANGES FROM v1.0:
 * - Private keys stored in encrypted IndexedDB (AES-256-GCM)
 * - Password-derived encryption (PBKDF2, 600,000 iterations)
 * - Protection against XSS key theft
 * - Backward compatible API
 *
 * MIGRATION PATH:
 * 1. Import both modules
 * 2. Call migrateToSecureStorage() on first login
 * 3. Replace all imports with this module
 * 4. Remove legacy e2ee.ts
 *
 * @module lib/crypto/e2ee.secure
 * @version 2.0.0
 * @security CRITICAL
 */

import SecureStorage from './secureStorage';

// Import types for local use
import type {
  KeyBundle,
  IdentityKeyPair,
  OneTimePreKey,
  ServerPrekeyBundle,
  EncryptedMessage,
  Session,
} from './e2ee';

// Re-export all utility functions and types from original implementation
export {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  arrayBufferToHex,
  randomBytes,
  generateDeviceId,
  generateECDHKeyPair,
  generateECDSAKeyPair,
  exportPublicKey,
  exportPrivateKey,
  importPublicKey,
  importPrivateKey,
  sign,
  verify,
  deriveSharedSecret,
  hkdf,
  sha256,
  encryptAES,
  decryptAES,
  generateKeyBundle,
  fingerprint,
  generateSafetyNumber,
  x3dhInitiate,
  type KeyPair,
  type ExportedKeyPair,
  type IdentityKeyPair,
  type SignedPreKey,
  type OneTimePreKey,
  type KeyBundle,
  type ServerPrekeyBundle,
  type EncryptedMessage,
  type Session,
} from './e2ee';

// Secure storage keys (different from legacy to prevent conflicts)
const SECURE_KEYS = {
  IDENTITY_KEY: 'e2ee_identity_key',
  SIGNED_PREKEY: 'e2ee_signed_prekey',
  DEVICE_ID: 'e2ee_device_id',
  SESSIONS: 'e2ee_sessions',
};

/**
 * Store key bundle in ENCRYPTED IndexedDB
 *
 * SECURITY: Replaces localStorage with SecureStorage
 * - Keys encrypted with AES-256-GCM
 * - Encryption key derived from user password
 * - Protection against XSS attacks
 */
export async function storeKeyBundle(bundle: KeyBundle): Promise<void> {
  if (!SecureStorage.isReady()) {
    throw new Error(
      'SecureStorage not initialized. Call SecureStorage.initialize(password) first.'
    );
  }

  const { exportPublicKey, exportPrivateKey, arrayBufferToBase64 } = await import('./e2ee');

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

  // Store in ENCRYPTED IndexedDB (not plaintext localStorage)
  await SecureStorage.setItem(SECURE_KEYS.IDENTITY_KEY, JSON.stringify(storedIdentity));
  await SecureStorage.setItem(SECURE_KEYS.SIGNED_PREKEY, JSON.stringify(storedSignedPreKey));
  await SecureStorage.setItem(SECURE_KEYS.DEVICE_ID, bundle.deviceId);
}

/**
 * Load identity key pair from ENCRYPTED storage
 */
export async function loadIdentityKeyPair(): Promise<IdentityKeyPair | null> {
  if (!SecureStorage.isReady()) {
    return null;
  }

  const stored = await SecureStorage.getItem(SECURE_KEYS.IDENTITY_KEY);
  if (!stored) return null;

  try {
    const {
      importPublicKey,
      importPrivateKey,
      importSigningPublicKey,
      importSigningPrivateKey,
      generateECDSAKeyPair,
      exportPublicKey,
      exportPrivateKey,
      arrayBufferToBase64,
      base64ToArrayBuffer,
    } = await import('./e2ee');
    const parsed = JSON.parse(stored);
    const publicKey = await importPublicKey(base64ToArrayBuffer(parsed.publicKey));
    const privateKey = await importPrivateKey(base64ToArrayBuffer(parsed.privateKey));

    // Load or generate signing key pair (ECDSA)
    let signingKeyPair: { publicKey: CryptoKey; privateKey: CryptoKey };
    if (parsed.signingPublicKey && parsed.signingPrivateKey) {
      const signingPublicKey = await importSigningPublicKey(
        base64ToArrayBuffer(parsed.signingPublicKey)
      );
      const signingPrivateKey = await importSigningPrivateKey(
        base64ToArrayBuffer(parsed.signingPrivateKey)
      );
      signingKeyPair = { publicKey: signingPublicKey, privateKey: signingPrivateKey };
    } else {
      // Migration: generate new signing key pair for existing installations
      signingKeyPair = await generateECDSAKeyPair();
      // Update storage with new signing keys
      const signingPublic = await exportPublicKey(signingKeyPair.publicKey);
      const signingPrivate = await exportPrivateKey(signingKeyPair.privateKey);
      parsed.signingPublicKey = arrayBufferToBase64(signingPublic);
      parsed.signingPrivateKey = arrayBufferToBase64(signingPrivate);
      await SecureStorage.setItem(SECURE_KEYS.IDENTITY_KEY, JSON.stringify(parsed));
    }

    return {
      keyPair: { publicKey, privateKey },
      signingKeyPair,
      keyId: parsed.keyId,
    };
  } catch {
    return null;
  }
}

/**
 * Load signed prekey from ENCRYPTED storage
 */
export async function loadSignedPreKey(): Promise<any | null> {
  if (!SecureStorage.isReady()) {
    return null;
  }

  const stored = await SecureStorage.getItem(SECURE_KEYS.SIGNED_PREKEY);
  if (!stored) return null;

  try {
    const { importPublicKey, importPrivateKey, base64ToArrayBuffer } = await import('./e2ee');
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
 * Get device ID from ENCRYPTED storage
 */
export async function getDeviceId(): Promise<string | null> {
  if (!SecureStorage.isReady()) {
    return null;
  }

  return await SecureStorage.getItem(SECURE_KEYS.DEVICE_ID);
}

/**
 * Check if E2EE is set up (in ENCRYPTED storage)
 */
export async function isE2EESetUp(): Promise<boolean> {
  if (!SecureStorage.isReady()) {
    return false;
  }

  const identity = await loadIdentityKeyPair();
  return identity !== null;
}

/**
 * Format key bundle for server registration
 */
export async function formatKeysForRegistration(
  bundle: KeyBundle
): Promise<Record<string, unknown>> {
  const { exportPublicKey, arrayBufferToBase64 } = await import('./e2ee');

  const identityPublic = await exportPublicKey(bundle.identityKey.keyPair.publicKey);
  const signedPreKeyPublic = await exportPublicKey(bundle.signedPreKey.keyPair.publicKey);

  const oneTimePreKeysFormatted = await Promise.all(
    bundle.oneTimePreKeys.map(async (pk: OneTimePreKey) => ({
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
 * Encrypt a message for a recipient (uses encrypted key storage)
 */
export async function encryptForRecipient(
  plaintext: string,
  recipientBundle: ServerPrekeyBundle
): Promise<EncryptedMessage> {
  const identityKey = await loadIdentityKeyPair();
  if (!identityKey) {
    throw new Error('Identity key not found - call setupE2EE first');
  }

  const { x3dhInitiate, encryptAES, arrayBufferToBase64 } = await import('./e2ee');

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
 * Decrypt a message (uses encrypted key storage)
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

  const { importPublicKey, base64ToArrayBuffer, deriveSharedSecret, hkdf, decryptAES } =
    await import('./e2ee');

  // Import sender's ephemeral key
  const ephemeralKey = await importPublicKey(
    base64ToArrayBuffer(encryptedMessage.ephemeralPublicKey)
  );
  const senderIdentity = await importPublicKey(senderIdentityKey);

  // Compute DH results (receiver side - mirrors sender's computation)
  const dh1 = await deriveSharedSecret(signedPreKey.keyPair.privateKey, senderIdentity);
  const dh2 = await deriveSharedSecret(identityKey.keyPair.privateKey, ephemeralKey);
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
 * Session management (ENCRYPTED storage)
 */
export async function loadSessions(): Promise<Map<string, Session>> {
  if (!SecureStorage.isReady()) {
    return new Map();
  }

  const stored = await SecureStorage.getItem(SECURE_KEYS.SESSIONS);
  if (!stored) return new Map();

  try {
    const parsed = JSON.parse(stored);
    return new Map(Object.entries(parsed));
  } catch {
    return new Map();
  }
}

export async function saveSession(recipientId: string, session: Session): Promise<void> {
  if (!SecureStorage.isReady()) {
    throw new Error('SecureStorage not initialized');
  }

  const sessions = await loadSessions();
  sessions.set(recipientId, session);

  const obj: Record<string, Session> = {};
  for (const [id, s] of sessions) {
    obj[id] = s;
  }

  await SecureStorage.setItem(SECURE_KEYS.SESSIONS, JSON.stringify(obj));
}

export async function getSession(recipientId: string): Promise<Session | null> {
  const sessions = await loadSessions();
  return sessions.get(recipientId) || null;
}

/**
 * Clear all E2EE data (ENCRYPTED storage)
 */
export async function clearE2EEData(): Promise<void> {
  if (!SecureStorage.isReady()) {
    return;
  }

  await SecureStorage.removeItem(SECURE_KEYS.IDENTITY_KEY);
  await SecureStorage.removeItem(SECURE_KEYS.SIGNED_PREKEY);
  await SecureStorage.removeItem(SECURE_KEYS.DEVICE_ID);
  await SecureStorage.removeItem(SECURE_KEYS.SESSIONS);
}

export default {
  storeKeyBundle,
  loadIdentityKeyPair,
  loadSignedPreKey,
  getDeviceId,
  isE2EESetUp,
  formatKeysForRegistration,
  encryptForRecipient,
  decryptFromSender,
  loadSessions,
  saveSession,
  getSession,
  clearE2EEData,
};
