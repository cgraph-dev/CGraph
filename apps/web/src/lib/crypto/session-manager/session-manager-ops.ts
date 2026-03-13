/**
 * Session Manager Operations — classical session creation / acceptance
 * and protocol-dispatched encrypt / decrypt helpers.
 *
 * These standalone functions are used by the SessionManager class to keep
 * the coordinator layer thin.
 *
 * @module lib/crypto/session-manager/session-manager-ops
 */

import { DoubleRatchetEngine, generateDHKeyPair } from '../doubleRatchet';
import {
  loadIdentityKeyPair,
  x3dhInitiate,
  base64ToArrayBuffer,
  type ServerPrekeyBundle,
} from '../e2ee';
import { e2eeLogger as logger } from '../../logger';
import { CryptoProtocol, CRYPTO_LIB_VERSION } from '../protocol';
import { TripleRatchetEngine } from '@cgraph/crypto/tripleRatchet';

import type { RatchetSession, SecureMessage } from './types';
import { saveSessionToStorage } from './storage';
import { computeResponderSharedSecret } from './session-x3dh';
import { buildSecureMessage, toRatchetMessage, generateMessageId } from './message-ops';
import { encryptWithTripleRatchet, decryptWithTripleRatchet } from './session-manager-pq';

// =============================================================================
// CLASSICAL SESSION CREATION (X3DH → Double Ratchet)
// =============================================================================

/** Data returned alongside a new classical session so the caller can attach it to the first message. */
export interface PendingX3DHData {
  sharedSecret: ArrayBuffer;
  ephemeralPublic: ArrayBuffer;
}

/**
 * Create a classical (X3DH → Double Ratchet) session as the initiator (Alice).
 *
 * Returns the new session **and** the pending X3DH data that must be included
 * in the first outgoing ciphertext as an `initialMessage`.
 */
export async function createClassicalSessionForRecipient(
  recipientId: string,
  identityKey: NonNullable<Awaited<ReturnType<typeof loadIdentityKeyPair>>>,
  recipientBundle: ServerPrekeyBundle
): Promise<{ session: RatchetSession; pendingX3DH: PendingX3DHData }> {
  const { sharedSecret, ephemeralPublic } = await x3dhInitiate(identityKey, recipientBundle);

  const engine = new DoubleRatchetEngine();
  const recipientDHKey = base64ToArrayBuffer(recipientBundle.signed_prekey);
  await engine.initializeAlice(new Uint8Array(sharedSecret), new Uint8Array(recipientDHKey));

  const session: RatchetSession = {
    recipientId,
    sessionId: engine.getStats().sessionId,
    engine,
    isInitiator: true,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    messageCount: 0,
    protocol: { protocol: CryptoProtocol.CLASSICAL_V1, cryptoVersion: CRYPTO_LIB_VERSION },
  };

  await saveSessionToStorage(session);
  logger.log(`[Classical] Created session ${session.sessionId} with ${recipientId}`);
  return { session, pendingX3DH: { sharedSecret, ephemeralPublic } };
}

// =============================================================================
// CLASSICAL SESSION ACCEPTANCE (X3DH Responder / Bob)
// =============================================================================

/**
 * Accept a classical session as the responder (Bob).
 * Called when receiving the first message from an initiator carrying X3DH data.
 */
export async function acceptClassicalSession(
  senderId: string,
  initialMessage: NonNullable<SecureMessage['initialMessage']>,
  senderIdentityKey: ArrayBuffer
): Promise<RatchetSession> {
  logger.log(`Accepting session from ${senderId}`);

  const sharedSecret = await computeResponderSharedSecret(initialMessage, senderIdentityKey);

  const engine = new DoubleRatchetEngine();
  const ourKeyPair = await generateDHKeyPair();
  await engine.initializeBob(new Uint8Array(sharedSecret), ourKeyPair);

  const session: RatchetSession = {
    recipientId: senderId,
    sessionId: engine.getStats().sessionId,
    engine,
    isInitiator: false,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    messageCount: 0,
    protocol: { protocol: CryptoProtocol.CLASSICAL_V1, cryptoVersion: CRYPTO_LIB_VERSION },
  };

  await saveSessionToStorage(session);
  logger.log(`Accepted session ${session.sessionId} from ${senderId}`);
  return session;
}

// =============================================================================
// PROTOCOL-DISPATCHED ENCRYPT / DECRYPT
// =============================================================================

/**
 * Encrypt plaintext bytes using the session's protocol and return a
 * wire-format SecureMessage (without initial-message attachments).
 *
 * The caller is responsible for attaching `initialMessage` / `pqInitialMessage`
 * when this is the first message in a session.
 */
export async function encryptWithProtocol(
  session: RatchetSession,
  plaintextBytes: Uint8Array,
  ourUserId: string,
  recipientId: string
): Promise<SecureMessage> {
  if (session.protocol.protocol === CryptoProtocol.PQXDH_V1) {
    if (!(session.engine instanceof TripleRatchetEngine))
      throw new Error('Expected TripleRatchetEngine');
    const pqResult = await encryptWithTripleRatchet(session.engine, plaintextBytes);
    return {
      senderId: ourUserId,
      recipientId,
      sessionId: session.sessionId,
      messageId: generateMessageId(),
      timestamp: Date.now(),
      protocolVersion: CryptoProtocol.PQXDH_V1,
      tripleRatchetVersion: pqResult.tripleRatchetVersion,
      ratchetMessage: pqResult.ratchetMessage,
      pqRatchetHeader: pqResult.pqRatchetHeader,
    };
  }

  // Classical Double Ratchet path
  if (!(session.engine instanceof DoubleRatchetEngine))
    throw new Error('Expected DoubleRatchetEngine');
  const drEngine = session.engine;
  const ratchetMessage = await drEngine.encryptMessage(plaintextBytes);
  return buildSecureMessage({
    ourUserId,
    recipientId,
    sessionId: session.sessionId,
    ratchetMessage,
  });
}

/**
 * Decrypt a message using the session's protocol and return plaintext bytes.
 *
 * @throws If a PQ session receives a message without a PQ ratchet header
 *         (possible protocol downgrade attack).
 */
export async function decryptWithProtocol(
  session: RatchetSession,
  message: SecureMessage
): Promise<Uint8Array> {
  if (session.protocol.protocol === CryptoProtocol.PQXDH_V1 && !message.pqRatchetHeader) {
    throw new Error(
      `PQ session with ${message.senderId} received message without PQ ratchet header — ` +
        'possible protocol downgrade attack or sender version mismatch'
    );
  }

  if (session.protocol.protocol === CryptoProtocol.PQXDH_V1 && message.pqRatchetHeader) {
    if (!(session.engine instanceof TripleRatchetEngine))
      throw new Error('Expected TripleRatchetEngine');
    return decryptWithTripleRatchet(session.engine, message);
  }

  // Classical Double Ratchet decryption
  if (!(session.engine instanceof DoubleRatchetEngine))
    throw new Error('Expected DoubleRatchetEngine');
  const drEngine = session.engine;
  const ratchetMessage = toRatchetMessage(message);
  const decrypted = await drEngine.decryptMessage(ratchetMessage);
  return decrypted.plaintext;
}
