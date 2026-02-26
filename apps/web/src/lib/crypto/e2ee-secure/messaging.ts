/**
 * Secure E2EE Messaging
 *
 * Functions for encrypting/decrypting messages and formatting
 * key bundles for server registration, using encrypted key storage.
 *
 * @module lib/crypto/e2ee-secure/messaging
 // eslint-disable-next-line jsdoc/check-tag-names
 * @security CRITICAL
 */

import { loadIdentityKeyPair, loadSignedPreKey } from './key-storage';

import type { KeyBundle, OneTimePreKey, ServerPrekeyBundle, EncryptedMessage } from '../e2ee';

/**
 * Format key bundle for server registration
 */
export async function formatKeysForRegistration(
  bundle: KeyBundle
): Promise<Record<string, unknown>> {
  const { exportPublicKey, arrayBufferToBase64 } = await import('../e2ee');

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

  const { x3dhInitiate, encryptAES, arrayBufferToBase64 } = await import('../e2ee');

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
    await import('../e2ee');

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
