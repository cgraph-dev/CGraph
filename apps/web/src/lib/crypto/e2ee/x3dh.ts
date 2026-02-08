/**
 * E2EE X3DH Key Agreement & Message Encryption/Decryption
 *
 * Extended Triple Diffie-Hellman (X3DH) protocol for establishing
 * shared secrets, plus message-level encrypt/decrypt operations.
 *
 * @module lib/crypto/e2ee/x3dh
 */

import type { EncryptedMessage, IdentityKeyPair, ServerPrekeyBundle } from './types';
import { arrayBufferToBase64, base64ToArrayBuffer } from './utils';
import {
  generateECDHKeyPair,
  exportPublicKey,
  importPublicKey,
  importSigningPublicKey,
  verify,
} from './keys';
import { deriveSharedSecret, hkdf, encryptAES, decryptAES } from './crypto-ops';
import { loadIdentityKeyPair, loadSignedPreKey } from './key-bundle';

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

  // Verify signed prekey signature (CRITICAL for E2EE security)
  if (recipientBundle.signing_key) {
    const signingKey = await importSigningPublicKey(
      base64ToArrayBuffer(recipientBundle.signing_key)
    );
    const signedPreKeyData = base64ToArrayBuffer(recipientBundle.signed_prekey);
    const signature = base64ToArrayBuffer(recipientBundle.signed_prekey_signature);

    const isValid = await verify(signingKey, signature, signedPreKeyData);
    if (!isValid) {
      throw new Error('E2EE: Signed prekey signature verification failed - possible MITM attack');
    }
  }

  // Compute DH results
  // DH1 = DH(IK_A, SPK_B)
  const dh1 = await deriveSharedSecret(identityKeyPair.keyPair.privateKey, recipientSignedPreKey);

  // DH2 = DH(EK_A, IK_B)
  const dh2 = await deriveSharedSecret(ephemeralKeyPair.privateKey, recipientIdentityKey);

  // DH3 = DH(EK_A, SPK_B)
  const dh3 = await deriveSharedSecret(ephemeralKeyPair.privateKey, recipientSignedPreKey);

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
