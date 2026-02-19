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
  keyId: string;
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

// =============================================================================
// KEM PREKEY PERSISTENCE (ML-KEM-768 secret keys)
// =============================================================================

/**
 * Store a KEM (ML-KEM-768) prekey secret key in encrypted storage.
 *
 * The secret key (2400 bytes) is stored as base64 in a JSON map keyed
 * by kyberPreKeyId. This allows Bob to load the corresponding secret
 * key when receiving a PQXDH initial message.
 *
 * @security CRITICAL — KEM secret keys enable PQ session acceptance.
 */
export async function storeKEMPreKey(kyberPreKeyId: number, secretKey: Uint8Array): Promise<void> {
  if (!SecureStorage.isReady()) {
    throw new Error('SecureStorage not initialized');
  }

  const { arrayBufferToBase64 } = await import('../e2ee');

  // Load existing KEM prekeys map
  const existing = await SecureStorage.getItem(SECURE_KEYS.KEM_PREKEYS);
  const kemMap: Record<string, string> = existing ? JSON.parse(existing) : {};

  // Store the new secret key
  kemMap[String(kyberPreKeyId)] = arrayBufferToBase64(new Uint8Array(secretKey).buffer);

  await SecureStorage.setItem(SECURE_KEYS.KEM_PREKEYS, JSON.stringify(kemMap));
}

/**
 * Load a KEM secret key by its prekey ID.
 *
 * @returns The 2400-byte ML-KEM-768 secret key, or null if not found.
 */
export async function loadKEMPreKey(kyberPreKeyId: number): Promise<Uint8Array | null> {
  if (!SecureStorage.isReady()) {
    return null;
  }

  const stored = await SecureStorage.getItem(SECURE_KEYS.KEM_PREKEYS);
  if (!stored) return null;

  try {
    const { base64ToArrayBuffer } = await import('../e2ee');
    const kemMap: Record<string, string> = JSON.parse(stored);
    const secretKeyB64 = kemMap[String(kyberPreKeyId)];
    if (!secretKeyB64) return null;

    return new Uint8Array(base64ToArrayBuffer(secretKeyB64));
  } catch {
    return null;
  }
}

/**
 * Remove a consumed KEM prekey from storage.
 * Called after a PQ session is accepted (key used once).
 */
export async function removeKEMPreKey(kyberPreKeyId: number): Promise<void> {
  if (!SecureStorage.isReady()) return;

  const stored = await SecureStorage.getItem(SECURE_KEYS.KEM_PREKEYS);
  if (!stored) return;

  try {
    const kemMap: Record<string, string> = JSON.parse(stored);
    delete kemMap[String(kyberPreKeyId)];
    await SecureStorage.setItem(SECURE_KEYS.KEM_PREKEYS, JSON.stringify(kemMap));
  } catch {
    // Silently ignore — key may already be removed
  }
}

// =============================================================================
// ONE-TIME PREKEY PRIVATE KEY PERSISTENCE
// =============================================================================

/**
 * Store one-time prekey private keys in encrypted storage.
 *
 * OPK private keys must be persisted so the responder (Bob) can
 * derive the shared secret when the initiator used one of our OPKs.
 *
 * @param prekeys - Array of { keyId, privateKey } pairs
 * @security CRITICAL — OPK private keys enable enhanced forward secrecy.
 */
export async function storeOPKPrivateKeys(
  prekeys: Array<{ keyId: string; privateKey: CryptoKey }>
): Promise<void> {
  if (!SecureStorage.isReady()) {
    throw new Error('SecureStorage not initialized');
  }

  const { exportPrivateKey, arrayBufferToBase64 } = await import('../e2ee');

  // Load existing OPK map
  const existing = await SecureStorage.getItem(SECURE_KEYS.OPK_PRIVATE_KEYS);
  const opkMap: Record<string, string> = existing ? JSON.parse(existing) : {};

  // Store each private key
  for (const { keyId, privateKey } of prekeys) {
    const exported = await exportPrivateKey(privateKey);
    opkMap[keyId] = arrayBufferToBase64(exported);
  }

  await SecureStorage.setItem(SECURE_KEYS.OPK_PRIVATE_KEYS, JSON.stringify(opkMap));
}

/**
 * Load a one-time prekey private key by its key ID.
 *
 * @returns The CryptoKey private key, or null if not found.
 */
export async function loadOPKPrivateKey(keyId: string): Promise<CryptoKey | null> {
  if (!SecureStorage.isReady()) {
    return null;
  }

  const stored = await SecureStorage.getItem(SECURE_KEYS.OPK_PRIVATE_KEYS);
  if (!stored) return null;

  try {
    const { importPrivateKey, base64ToArrayBuffer } = await import('../e2ee');
    const opkMap: Record<string, string> = JSON.parse(stored);
    const privateKeyB64 = opkMap[keyId];
    if (!privateKeyB64) return null;

    return await importPrivateKey(base64ToArrayBuffer(privateKeyB64));
  } catch {
    return null;
  }
}

/**
 * Remove a consumed OPK private key from storage.
 * Called after the key has been used in a session.
 */
export async function removeOPKPrivateKey(keyId: string): Promise<void> {
  if (!SecureStorage.isReady()) return;

  const stored = await SecureStorage.getItem(SECURE_KEYS.OPK_PRIVATE_KEYS);
  if (!stored) return;

  try {
    const opkMap: Record<string, string> = JSON.parse(stored);
    delete opkMap[keyId];
    await SecureStorage.setItem(SECURE_KEYS.OPK_PRIVATE_KEYS, JSON.stringify(opkMap));
  } catch {
    // Silently ignore — key may already be removed
  }
}
