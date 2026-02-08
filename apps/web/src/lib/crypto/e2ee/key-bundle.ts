/**
 * E2EE Key Bundle Management
 *
 * Generation, storage, loading, and server registration formatting
 * for E2EE key bundles.
 *
 * @module lib/crypto/e2ee/key-bundle
 */

import type { IdentityKeyPair, KeyBundle, KeyPair, OneTimePreKey, SignedPreKey } from './types';
import { arrayBufferToBase64, base64ToArrayBuffer, generateKeyId } from './utils';
import {
  exportPrivateKey,
  exportPublicKey,
  generateECDHKeyPair,
  generateECDSAKeyPair,
  importPrivateKey,
  importPublicKey,
  importSigningPrivateKey,
  importSigningPublicKey,
  sign,
} from './keys';

// Storage keys
const STORAGE_PREFIX = 'cgraph_e2ee_';
const IDENTITY_KEY = `${STORAGE_PREFIX}identity`;
const SIGNED_PREKEY = `${STORAGE_PREFIX}signed_prekey`;
const DEVICE_ID = `${STORAGE_PREFIX}device_id`;

/**
 * Generate complete key bundle for registration
 */
export async function generateKeyBundle(
  deviceId: string,
  numOneTimePreKeys: number = 100
): Promise<KeyBundle> {
  // Generate identity key pair (ECDH for key exchange)
  const identityKeyPair = await generateECDHKeyPair();
  // Generate ECDSA signing key pair for cryptographic signatures
  const signingKeyPair = await generateECDSAKeyPair();
  const identityKeyId = generateKeyId();

  // Generate signed prekey
  const signedPreKeyPair = await generateECDHKeyPair();
  const signedPreKeyId = generateKeyId();
  const signedPreKeyPublic = await exportPublicKey(signedPreKeyPair.publicKey);
  // Sign with ECDSA key (proper cryptographic signature)
  const signature = await sign(signingKeyPair.privateKey, signedPreKeyPublic);

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
      signingKeyPair: signingKeyPair,
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
  const signingPublic = await exportPublicKey(bundle.identityKey.signingKeyPair.publicKey);
  const signingPrivate = await exportPrivateKey(bundle.identityKey.signingKeyPair.privateKey);
  const signedPreKeyPublic = await exportPublicKey(bundle.signedPreKey.keyPair.publicKey);
  const signedPreKeyPrivate = await exportPrivateKey(bundle.signedPreKey.keyPair.privateKey);

  const storedIdentity = {
    publicKey: arrayBufferToBase64(identityPublic),
    privateKey: arrayBufferToBase64(identityPrivate),
    signingPublicKey: arrayBufferToBase64(signingPublic),
    signingPrivateKey: arrayBufferToBase64(signingPrivate),
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

    // Load signing key pair (ECDSA)
    let signingKeyPair: KeyPair;
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
      localStorage.setItem(IDENTITY_KEY, JSON.stringify(parsed));
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
  const signingPublic = await exportPublicKey(bundle.identityKey.signingKeyPair.publicKey);
  const signedPreKeyPublic = await exportPublicKey(bundle.signedPreKey.keyPair.publicKey);

  const oneTimePreKeysFormatted = await Promise.all(
    bundle.oneTimePreKeys.map(async (pk) => ({
      public_key: arrayBufferToBase64(await exportPublicKey(pk.keyPair.publicKey)),
      key_id: pk.keyId,
    }))
  );

  return {
    identity_key: arrayBufferToBase64(identityPublic),
    signing_key: arrayBufferToBase64(signingPublic),
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
 * Clear all E2EE data
 */
export function clearE2EEData(): void {
  const SESSIONS = `${STORAGE_PREFIX}sessions`;
  localStorage.removeItem(IDENTITY_KEY);
  localStorage.removeItem(SIGNED_PREKEY);
  localStorage.removeItem(DEVICE_ID);
  localStorage.removeItem(SESSIONS);
}
