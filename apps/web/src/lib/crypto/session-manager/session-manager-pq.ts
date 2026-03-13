/**
 * Post-Quantum (PQXDH) session operations for the Session Manager.
 *
 * Handles creation, acceptance, encryption, and decryption using
 * the Triple Ratchet protocol backed by hybrid PQXDH key agreement.
 *
 * @module lib/crypto/session-manager/session-manager-pq
 */

import { loadIdentityKeyPair, arrayBufferToBase64, base64ToArrayBuffer } from '../e2ee';
import { e2eeLogger as logger } from '../../logger';
import {
  CryptoProtocol,
  CRYPTO_LIB_VERSION,
  createPQXDHSession,
  acceptPQXDHSession,
  serializePQMessage,
  deserializePQMessage,
  type PQPreKeyBundle,
  type PQSessionResult,
} from '../protocol';
import { TripleRatchetEngine } from '@cgraph/crypto/tripleRatchet';
import type { ECKeyPair } from '@cgraph/crypto/x3dh';
import { loadKEMPreKey, removeKEMPreKey, loadSignedPreKey } from '../e2ee-secure/key-storage';

import type { RatchetSession, SecureMessage } from './types';
import { saveSessionToStorage } from './storage';

// =============================================================================
// SESSION CREATION (Initiator / Alice — PQXDH)
// =============================================================================

/**
 * Create a PQXDH + Triple Ratchet session as the initiator (Alice).
 *
 * Returns the new session **and** the pending initial-message data that must
 * be included in the first outgoing ciphertext.
 */
export async function createPQSessionForRecipient(
  recipientId: string,
  identityKey: NonNullable<Awaited<ReturnType<typeof loadIdentityKeyPair>>>,
  recipientBundle: PQPreKeyBundle
): Promise<{ session: RatchetSession; pendingPQData: PQSessionResult['initialMessage'] }> {
  logger.log(`[PQXDH] Creating post-quantum session with ${recipientId}`);

  // Build an ECKeyPair from the Web Crypto IdentityKeyPair
  const { exportPublicKey } = await import('../e2ee');
  const rawPublicKey = new Uint8Array(await exportPublicKey(identityKey.keyPair.publicKey));
  const ourECKeyPair: ECKeyPair = {
    publicKey: identityKey.keyPair.publicKey,
    privateKey: identityKey.keyPair.privateKey,
    rawPublicKey,
  };

  const result = await createPQXDHSession(ourECKeyPair, recipientBundle);

  // Store PQ initial message for inclusion in first outgoing message
  const stats = result.engine.getStats();
  const session: RatchetSession = {
    recipientId,
    sessionId: stats.sessionId,
    engine: result.engine,
    isInitiator: true,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    messageCount: 0,
    protocol: { protocol: CryptoProtocol.PQXDH_V1, cryptoVersion: CRYPTO_LIB_VERSION },
  };

  await saveSessionToStorage(session);
  logger.log(`[PQXDH] Created Triple Ratchet session ${stats.sessionId} with ${recipientId}`);
  return { session, pendingPQData: result.initialMessage };
}

// =============================================================================
// SESSION ACCEPTANCE (Responder / Bob — PQXDH)
// =============================================================================

/**
 * Accept a PQXDH session as the responder (Bob).
 *
 * Derives the Triple Ratchet shared secret from the sender's PQ initial
 * message, then initializes a TripleRatchetEngine as Bob.
 *
 * NOTE: KEM secret key persistence is not yet implemented. Until KEM secret
 * keys are stored/loaded from the key store, Bob-side PQ session acceptance
 * will fail with a clear error. The feature flag (`useTripleRatchet`) must be
 * enabled first to generate and store KEM prekeys. See: docs/ROADMAP.md
 */
export async function acceptIncomingPQSession(
  message: SecureMessage,
  _senderIdentityKey: ArrayBuffer
): Promise<RatchetSession> {
  const pqInit = message.pqInitialMessage;
  if (!pqInit) {
    throw new Error('[PQXDH] Missing pqInitialMessage in PQ session acceptance');
  }
  logger.log(`[PQXDH] Accepting post-quantum session from ${message.senderId}`);

  // 1. Load our identity key pair
  const identityKey = await loadIdentityKeyPair();
  if (!identityKey) {
    throw new Error('[PQXDH] Identity key not found — cannot accept PQ session');
  }

  // 2. Load our signed prekey pair
  const signedPreKey = await loadSignedPreKey();
  if (!signedPreKey) {
    throw new Error('[PQXDH] Signed prekey not found — cannot accept PQ session');
  }

  // 3. Load the KEM secret key by kyberPreKeyId
  const kemSecretKey = await loadKEMPreKey(pqInit.kyberPreKeyId);
  if (!kemSecretKey) {
    throw new Error(
      `[PQXDH] KEM secret key not found for kyberPreKeyId: ${pqInit.kyberPreKeyId}. ` +
        'The KEM prekey may have been consumed or not generated. ' +
        'Ensure generateKEMPreKey() was called during E2EE setup.'
    );
  }

  // 4. Build ECKeyPair from Web Crypto keys
  const { exportPublicKey } = await import('../e2ee');
  const rawIdentityPublic = new Uint8Array(await exportPublicKey(identityKey.keyPair.publicKey));
  const ourIdentityKeyPair: ECKeyPair = {
    publicKey: identityKey.keyPair.publicKey,
    privateKey: identityKey.keyPair.privateKey,
    rawPublicKey: rawIdentityPublic,
  };

  const rawSignedPublic = new Uint8Array(await exportPublicKey(signedPreKey.keyPair.publicKey));
  const ourSignedPreKeyPair: ECKeyPair = {
    publicKey: signedPreKey.keyPair.publicKey,
    privateKey: signedPreKey.keyPair.privateKey,
    rawPublicKey: rawSignedPublic,
  };

  // 5. Decode sender data from base64
  const senderIdKey = new Uint8Array(base64ToArrayBuffer(pqInit.identityKey));
  const senderEphKey = new Uint8Array(base64ToArrayBuffer(pqInit.ephemeralKey));
  const kemCipherText = new Uint8Array(base64ToArrayBuffer(pqInit.kemCipherText));

  // 6. Call acceptPQXDHSession to derive shared secret + init TripleRatchet
  const result = await acceptPQXDHSession(
    ourIdentityKeyPair,
    ourSignedPreKeyPair,
    kemSecretKey,
    senderIdKey,
    senderEphKey,
    kemCipherText
    // oneTimePreKeyPair omitted — OPK handling is separate
  );

  // 7. Remove consumed KEM prekey (one-time use)
  await removeKEMPreKey(pqInit.kyberPreKeyId);

  // 8. Create the session
  const stats = result.engine.getStats();
  const session: RatchetSession = {
    recipientId: message.senderId,
    sessionId: stats.sessionId,
    engine: result.engine,
    isInitiator: false,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    messageCount: 0,
    protocol: { protocol: CryptoProtocol.PQXDH_V1, cryptoVersion: CRYPTO_LIB_VERSION },
  };

  await saveSessionToStorage(session);
  logger.log(`[PQXDH] Accepted Triple Ratchet session ${stats.sessionId} from ${message.senderId}`);
  return session;
}

// =============================================================================
// PQ ENCRYPTION HELPER
// =============================================================================

/** Result of encrypting with the Triple Ratchet (pre-assembled message parts). */
export interface PQEncryptResult {
  ratchetMessage: SecureMessage['ratchetMessage'];
  pqRatchetHeader: SecureMessage['pqRatchetHeader'];
  tripleRatchetVersion: number;
}

/**
 * Encrypt plaintext bytes using a Triple Ratchet engine and return
 * the serialised ratchet message parts ready for SecureMessage assembly.
 */
export async function encryptWithTripleRatchet(
  engine: TripleRatchetEngine,
  plaintextBytes: Uint8Array
): Promise<PQEncryptResult> {
  const trMessage = await engine.encrypt(plaintextBytes);
  const serialized = serializePQMessage(trMessage);

  return {
    ratchetMessage: {
      header: serialized.header.ec,
      ciphertext: serialized.ciphertext,
      nonce: serialized.nonce,
      mac: serialized.mac,
    },
    pqRatchetHeader: serialized.header.pq,
    tripleRatchetVersion: serialized.header.version,
  };
}

/**
 * Build the `pqInitialMessage` payload from pending PQXDH negotiation data.
 * This is attached to the first outgoing message so the responder can derive
 * the same shared secret.
 */
export function buildPQInitialMessagePayload(
  pendingData: PQSessionResult['initialMessage']
): NonNullable<SecureMessage['pqInitialMessage']> {
  return {
    identityKey: arrayBufferToBase64(new Uint8Array(pendingData.identityKey).buffer),
    ephemeralKey: arrayBufferToBase64(new Uint8Array(pendingData.ephemeralKey).buffer),
    kemCipherText: arrayBufferToBase64(new Uint8Array(pendingData.kemCipherText).buffer),
    signedPreKeyId: pendingData.signedPreKeyId,
    kyberPreKeyId: pendingData.kyberPreKeyId,
    ...(pendingData.oneTimePreKeyId !== undefined && {
      oneTimePreKeyId: pendingData.oneTimePreKeyId,
    }),
    version: pendingData.version,
  };
}

// =============================================================================
// PQ DECRYPTION HELPER
// =============================================================================

/**
 * Decrypt a PQ (Triple Ratchet) SecureMessage and return the plaintext bytes.
 */
export async function decryptWithTripleRatchet(
  engine: TripleRatchetEngine,
  message: SecureMessage
): Promise<Uint8Array> {
  const trMessage = deserializePQMessage({
    header: {
      ec: message.ratchetMessage.header,
      pq: message.pqRatchetHeader!,
      version: message.tripleRatchetVersion ?? 4,
    },
    ciphertext: message.ratchetMessage.ciphertext,
    nonce: message.ratchetMessage.nonce,
    mac: message.ratchetMessage.mac,
  });
  const decrypted = await engine.decrypt(trMessage);
  return decrypted.plaintext;
}
