/**
 * Secure E2EE Key Storage
 *
 * Functions for storing and loading cryptographic keys from
 * encrypted IndexedDB via SecureStorage (AES-256-GCM, PBKDF2).
 *
 * @module lib/crypto/e2ee-secure/key-storage
 * @security CRITICAL
 */

import SecureStorage from '../secureStorage';
import { SECURE_KEYS } from './constants';

import type { KeyBundle, IdentityKeyPair } from '../e2ee';

/** Signed pre-key data loaded from secure storage */
export interface LoadedSignedPreKey {
  keyPair: { publicKey: CryptoKey; privateKey: CryptoKey };
  keyId: number;
  signature: ArrayBuffer;
}

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

  const { exportPublicKey, exportPrivateKey, arrayBufferToBase64 } = await import('../e2ee');

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
    } = await import('../e2ee');
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
export async function loadSignedPreKey(): Promise<LoadedSignedPreKey | null> {
  if (!SecureStorage.isReady()) {
    return null;
  }

  const stored = await SecureStorage.getItem(SECURE_KEYS.SIGNED_PREKEY);
  if (!stored) return null;

  try {
    const { importPublicKey, importPrivateKey, base64ToArrayBuffer } = await import('../e2ee');
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
