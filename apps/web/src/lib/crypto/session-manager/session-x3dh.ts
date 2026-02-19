/**
 * X3DH Responder Computation
 *
 * Performs the receiver-side X3DH key agreement when accepting an
 * incoming initial message, producing the shared secret used to
 * bootstrap a Double Ratchet session.
 *
 * @module lib/crypto/session-manager/session-x3dh
 */

import {
  loadIdentityKeyPair,
  loadSignedPreKey,
  importPublicKey,
  deriveSharedSecret,
  hkdf,
  base64ToArrayBuffer,
} from '../e2ee';
import type { SecureMessage } from './types';

/**
 * Derive the shared secret on the responder (Bob) side of an X3DH
 * handshake.  This mirrors the initiator computation performed by
 * `x3dhInitiate` but uses the receiver's identity & signed pre-key.
 */
export async function computeResponderSharedSecret(
  initialMessage: NonNullable<SecureMessage['initialMessage']>,
  senderIdentityKey: ArrayBuffer
): Promise<ArrayBuffer> {
  const identityKey = await loadIdentityKeyPair();
  const signedPreKey = await loadSignedPreKey();

  if (!identityKey || !signedPreKey) {
    throw new Error('Keys not found');
  }

  // If the initiator used a one-time prekey (DH4), we need the OPK private key
  // to compute the matching shared secret. OPK private keys are not yet persisted
  // by the client — fail fast with a clear error rather than silently computing
  // the wrong secret (96 bytes ≠ 128 bytes → HKDF output diverges).
  if (initialMessage.usedOneTimePreKey) {
    throw new Error(
      'X3DH one-time prekey was used by initiator but OPK private keys are not persisted. ' +
        'Session establishment cannot proceed — shared secrets would diverge. ' +
        'See: docs/ROADMAP.md for OPK private key persistence roadmap.'
    );
  }

  // Recreate X3DH shared secret (receiver side)
  const ephemeralKey = await importPublicKey(
    base64ToArrayBuffer(initialMessage.ephemeralPublicKey)
  );
  const senderIdentity = await importPublicKey(senderIdentityKey);

  // Compute DH results (3-DH variant, no one-time prekey)
  const dh1 = await deriveSharedSecret(signedPreKey.keyPair.privateKey, senderIdentity);
  const dh2 = await deriveSharedSecret(identityKey.keyPair.privateKey, ephemeralKey);
  const dh3 = await deriveSharedSecret(signedPreKey.keyPair.privateKey, ephemeralKey);

  // Combine and derive shared secret
  const combined = new Uint8Array(96);
  combined.set(new Uint8Array(dh1), 0);
  combined.set(new Uint8Array(dh2), 32);
  combined.set(new Uint8Array(dh3), 64);

  const salt = new Uint8Array(32);
  const info = new TextEncoder().encode('CGraph E2EE v1');

  return hkdf(combined.buffer, salt.buffer, info.buffer, 32);
}
