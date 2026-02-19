/**
 * Session Manager Class — bridges X3DH key agreement with the Double Ratchet
 * for forward secrecy, break-in recovery, and out-of-order message handling.
 *
 * V2: Also supports PQXDH + Triple Ratchet sessions via @cgraph/crypto.
 * Protocol version is negotiated per-session based on recipient capabilities.
 *
 * @module lib/crypto/session-manager/session-manager-class
 */

import { DoubleRatchetEngine, generateDHKeyPair } from '../doubleRatchet';
import {
  loadIdentityKeyPair,
  x3dhInitiate,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  type ServerPrekeyBundle,
} from '../e2ee';
import { e2eeLogger as logger } from '../../logger';
import {
  CryptoProtocol,
  CRYPTO_LIB_VERSION,
  bundleSupportsPQ,
  createPQXDHSession,
  serializePQMessage,
  deserializePQMessage,
  type PQPreKeyBundle,
} from '../protocol';
import type { TripleRatchetEngine, TripleRatchetStats } from '@cgraph/crypto/tripleRatchet';
// acceptPQXDHSession will be used when KEM key persistence is implemented (see _acceptPQSession TODO)
// import { acceptPQXDHSession } from '../protocol';
import type { ECKeyPair } from '@cgraph/crypto/x3dh';

import type { RatchetSession, SecureMessage } from './types';
import { saveSessionToStorage, deleteSessionFromStorage, getAllSessions } from './storage';
import { computeResponderSharedSecret } from './session-x3dh';
import { buildSecureMessage, toRatchetMessage, generateMessageId } from './message-ops';

// =============================================================================
// SESSION MANAGER
// =============================================================================

/** Default protocol metadata for legacy sessions loaded from storage */
const LEGACY_PROTOCOL = { protocol: CryptoProtocol.CLASSICAL_V1, cryptoVersion: '0.0.0' };

class SessionManager {
  private sessions: Map<string, RatchetSession> = new Map();
  private pendingX3DH: Map<
    string,
    {
      sharedSecret: ArrayBuffer;
      ephemeralPublic: ArrayBuffer;
    }
  > = new Map();
  /** Pending PQXDH initial messages (before first encrypt) */
  private pendingPQXDH: Map<string, import('../protocol').PQSessionResult['initialMessage']> =
    new Map();

  /** Feature flag: when true, new sessions use PQXDH + Triple Ratchet if recipient supports it */
  private _useTripleRatchet = false;

  setUseTripleRatchet(enabled: boolean): void {
    this._useTripleRatchet = enabled;
    logger.log(`Triple Ratchet (PQXDH) ${enabled ? 'enabled' : 'disabled'} for new sessions`);
  }

  get useTripleRatchet(): boolean {
    return this._useTripleRatchet;
  }

  /**
   * Initialize session manager and load persisted sessions
   */
  async initialize(): Promise<void> {
    logger.log('Initializing session manager...');

    const storedSessions = await getAllSessions();
    for (const serialized of storedSessions) {
      try {
        const protocol = serialized.protocol ?? LEGACY_PROTOCOL;
        let engine: DoubleRatchetEngine | TripleRatchetEngine;

        if (protocol.protocol === CryptoProtocol.PQXDH_V1) {
          // PQ session — TripleRatchetEngine doesn't have a fromState/importState yet.
          // PQ sessions will be re-established on next message if state is unavailable.
          logger.warn(
            `PQ session for ${serialized.recipientId} cannot be restored (serialization not yet supported) — will re-establish`
          );
          continue;
        } else {
          // Classical session
          engine = new DoubleRatchetEngine();
          await engine.importState(serialized.engineState);
        }

        this.sessions.set(serialized.recipientId, {
          recipientId: serialized.recipientId,
          sessionId: serialized.sessionId,
          engine,
          isInitiator: serialized.isInitiator,
          createdAt: serialized.createdAt,
          lastActivity: serialized.lastActivity,
          messageCount: serialized.messageCount,
          protocol,
        });
      } catch (err) {
        logger.error(`Failed to load session for ${serialized.recipientId}:`, err);
      }
    }

    logger.log(`Loaded ${this.sessions.size} ratchet sessions`);
  }

  /**
   * Check if we have an active session with a recipient
   */
  hasSession(recipientId: string): boolean {
    return this.sessions.has(recipientId);
  }

  /**
   * Get session statistics
   */
  getSessionStats(
    recipientId: string
  ): ReturnType<DoubleRatchetEngine['getStats']> | TripleRatchetStats | null {
    const session = this.sessions.get(recipientId);
    if (!session) return null;
    return session.engine.getStats();
  }

  /**
   * Get the protocol version for an active session
   */
  getSessionProtocol(recipientId: string): CryptoProtocol | null {
    return this.sessions.get(recipientId)?.protocol.protocol ?? null;
  }

  /**
   * Create a new session as the initiator (Alice).
   *
   * Negotiates protocol version:
   * - If `useTripleRatchet` is enabled AND recipient advertises KEM prekeys
   *   → PQXDH + Triple Ratchet (post-quantum forward secrecy)
   * - Otherwise → classical X3DH + Double Ratchet
   */
  async createSession(
    _ourUserId: string,
    recipientId: string,
    recipientBundle: ServerPrekeyBundle
  ): Promise<RatchetSession> {
    logger.log(`Creating new ratchet session with ${recipientId}`);

    const identityKey = await loadIdentityKeyPair();
    if (!identityKey) {
      throw new Error('Identity key not found');
    }

    // Check if we should use PQXDH + Triple Ratchet
    const pqBundle = recipientBundle as PQPreKeyBundle;
    if (this._useTripleRatchet && bundleSupportsPQ(pqBundle)) {
      return this._createPQSession(recipientId, identityKey, pqBundle);
    }

    return this._createClassicalSession(recipientId, identityKey, recipientBundle);
  }

  // ---------------------------------------------------------------------------
  // Classical session (X3DH → Double Ratchet)
  // ---------------------------------------------------------------------------

  private async _createClassicalSession(
    recipientId: string,
    identityKey: Awaited<ReturnType<typeof loadIdentityKeyPair>>,
    recipientBundle: ServerPrekeyBundle
  ): Promise<RatchetSession> {
    const { sharedSecret, ephemeralPublic } = await x3dhInitiate(identityKey!, recipientBundle);
    this.pendingX3DH.set(recipientId, { sharedSecret, ephemeralPublic });

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

    this.sessions.set(recipientId, session);
    await saveSessionToStorage(session);
    logger.log(`[Classical] Created session ${session.sessionId} with ${recipientId}`);
    return session;
  }

  // ---------------------------------------------------------------------------
  // Post-Quantum session (PQXDH → Triple Ratchet)
  // ---------------------------------------------------------------------------

  private async _createPQSession(
    recipientId: string,
    identityKey: NonNullable<Awaited<ReturnType<typeof loadIdentityKeyPair>>>,
    recipientBundle: PQPreKeyBundle
  ): Promise<RatchetSession> {
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
    this.pendingPQXDH.set(recipientId, result.initialMessage);

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

    this.sessions.set(recipientId, session);
    await saveSessionToStorage(session);
    logger.log(`[PQXDH] Created Triple Ratchet session ${stats.sessionId} with ${recipientId}`);
    return session;
  }

  /**
   * Accept a session as the responder (Bob).
   * Called when receiving the first message from an initiator.
   */
  async acceptSession(
    senderId: string,
    initialMessage: NonNullable<SecureMessage['initialMessage']>,
    senderIdentityKey: ArrayBuffer
  ): Promise<RatchetSession> {
    logger.log(`Accepting session from ${senderId}`);

    // Derive shared secret via X3DH (responder side)
    const sharedSecret = await computeResponderSharedSecret(initialMessage, senderIdentityKey);

    // Initialize Double Ratchet as Bob (responder)
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

    this.sessions.set(senderId, session);
    await saveSessionToStorage(session);

    logger.log(`Accepted session ${session.sessionId} from ${senderId}`);

    return session;
  }

  // ---------------------------------------------------------------------------
  // Post-Quantum session acceptance (Bob / Responder — PQXDH)
  // ---------------------------------------------------------------------------

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
  private async _acceptPQSession(
    _message: SecureMessage,
    _senderIdentityKey: ArrayBuffer
  ): Promise<RatchetSession> {
    const pqInit = _message.pqInitialMessage;
    logger.log(`[PQXDH] Accepting post-quantum session from ${_message.senderId}`);

    // TODO(pq-keys): Implement KEM secret key persistence.
    // Currently, KEM secret keys are generated at bundle creation time
    // but are not persisted — Bob cannot accept PQ sessions until this
    // is implemented. For now, throw an actionable error.
    //
    // When KEM key persistence is ready, this method will:
    // 1. Load our identity key pair + signed prekey pair
    // 2. Load the KEM secret key by kyberPreKeyId
    // 3. Call acceptPQXDHSession() from ../protocol
    // 4. Create a RatchetSession with CryptoProtocol.PQXDH_V1
    //
    // The feature flag (useTripleRatchet) must be enabled to generate
    // and store KEM prekeys. See: packages/crypto and docs/ROADMAP.md
    throw new Error(
      `[PQXDH] KEM secret key persistence not yet implemented (kyberPreKeyId: ${pqInit?.kyberPreKeyId}). ` +
        'Cannot accept PQ session — the sender should fall back to classical protocol. ' +
        'See: packages/crypto and docs/ROADMAP.md for KEM key storage roadmap.'
    );
  }

  /**
   * Encrypt a message for a recipient.
   *
   * Automatically uses the correct protocol based on the session type:
   * - Classical sessions → DoubleRatchetEngine.encryptMessage
   * - PQ sessions → TripleRatchetEngine.encrypt
   */
  async encryptMessage(
    ourUserId: string,
    recipientId: string,
    plaintext: string,
    recipientBundle?: ServerPrekeyBundle
  ): Promise<SecureMessage> {
    let session = this.sessions.get(recipientId);
    let isInitialMessage = false;

    if (!session) {
      if (!recipientBundle) {
        throw new Error('No session exists and no recipient bundle provided');
      }
      session = await this.createSession(ourUserId, recipientId, recipientBundle);
      isInitialMessage = true;
    }

    const encoder = new TextEncoder();
    const plaintextBytes = encoder.encode(plaintext);
    let message: SecureMessage;

    if (session.protocol.protocol === CryptoProtocol.PQXDH_V1) {
      // Post-quantum Triple Ratchet path
      const trEngine = session.engine as TripleRatchetEngine;
      const trMessage = await trEngine.encrypt(plaintextBytes);
      const serialized = serializePQMessage(trMessage);

      message = {
        senderId: ourUserId,
        recipientId,
        sessionId: session.sessionId,
        messageId: generateMessageId(),
        timestamp: Date.now(),
        protocolVersion: CryptoProtocol.PQXDH_V1,
        tripleRatchetVersion: serialized.header.version,
        ratchetMessage: {
          header: serialized.header.ec,
          ciphertext: serialized.ciphertext,
          nonce: serialized.nonce,
          mac: serialized.mac,
        },
        pqRatchetHeader: serialized.header.pq,
      };

      if (isInitialMessage) {
        const pqData = this.pendingPQXDH.get(recipientId);
        if (pqData) {
          message.pqInitialMessage = {
            identityKey: arrayBufferToBase64(new Uint8Array(pqData.identityKey).buffer),
            ephemeralKey: arrayBufferToBase64(new Uint8Array(pqData.ephemeralKey).buffer),
            kemCipherText: arrayBufferToBase64(new Uint8Array(pqData.kemCipherText).buffer),
            signedPreKeyId: pqData.signedPreKeyId,
            kyberPreKeyId: pqData.kyberPreKeyId,
            ...(pqData.oneTimePreKeyId !== undefined && {
              oneTimePreKeyId: pqData.oneTimePreKeyId,
            }),
            version: pqData.version,
          };
          this.pendingPQXDH.delete(recipientId);
        }
      }
    } else {
      // Classical Double Ratchet path
      const drEngine = session.engine as DoubleRatchetEngine;
      const ratchetMessage = await drEngine.encryptMessage(plaintextBytes);

      message = buildSecureMessage({
        ourUserId,
        recipientId,
        sessionId: session.sessionId,
        ratchetMessage,
      });

      if (isInitialMessage) {
        const x3dhData = this.pendingX3DH.get(recipientId);
        if (x3dhData) {
          message.initialMessage = {
            ephemeralPublicKey: arrayBufferToBase64(x3dhData.ephemeralPublic),
            usedOneTimePreKey: !!recipientBundle?.one_time_prekey,
            oneTimePreKeyId: recipientBundle?.one_time_prekey_id,
          };
          this.pendingX3DH.delete(recipientId);
        }
      }
    }

    session.messageCount++;
    session.lastActivity = Date.now();
    await saveSessionToStorage(session);

    return message;
  }

  /**
   * Decrypt a received message.
   *
   * Protocol is detected from the message's `protocolVersion` field:
   * - Absent or CLASSICAL_V1 → DoubleRatchetEngine
   * - PQXDH_V1 → TripleRatchetEngine
   */
  async decryptMessage(message: SecureMessage, senderIdentityKey?: ArrayBuffer): Promise<string> {
    let session = this.sessions.get(message.senderId);

    // Accept classical (X3DH) initial message
    if (!session && message.initialMessage) {
      if (!senderIdentityKey) {
        throw new Error('Sender identity key required for initial message');
      }
      session = await this.acceptSession(
        message.senderId,
        message.initialMessage,
        senderIdentityKey
      );
    }

    // Accept post-quantum (PQXDH) initial message
    if (!session && message.pqInitialMessage) {
      if (!senderIdentityKey) {
        throw new Error('Sender identity key required for PQ initial message');
      }
      session = await this._acceptPQSession(message, senderIdentityKey);
    }

    if (!session) {
      throw new Error(`No session found for ${message.senderId}`);
    }

    let plaintext: Uint8Array;

    if (session.protocol.protocol === CryptoProtocol.PQXDH_V1 && !message.pqRatchetHeader) {
      throw new Error(
        `PQ session with ${message.senderId} received message without PQ ratchet header — ` +
          'possible protocol downgrade attack or sender version mismatch'
      );
    }

    if (session.protocol.protocol === CryptoProtocol.PQXDH_V1 && message.pqRatchetHeader) {
      // PQ Triple Ratchet decryption
      const trEngine = session.engine as TripleRatchetEngine;
      const trMessage = deserializePQMessage({
        header: {
          ec: message.ratchetMessage.header,
          pq: message.pqRatchetHeader,
          version: message.tripleRatchetVersion ?? 4,
        },
        ciphertext: message.ratchetMessage.ciphertext,
        nonce: message.ratchetMessage.nonce,
        mac: message.ratchetMessage.mac,
      });
      const decrypted = await trEngine.decrypt(trMessage);
      plaintext = decrypted.plaintext;
    } else {
      // Classical Double Ratchet decryption
      const drEngine = session.engine as DoubleRatchetEngine;
      const ratchetMessage = toRatchetMessage(message);
      const decrypted = await drEngine.decryptMessage(ratchetMessage);
      plaintext = decrypted.plaintext;
    }

    session.messageCount++;
    session.lastActivity = Date.now();
    await saveSessionToStorage(session);

    return new TextDecoder().decode(plaintext);
  }

  async destroySession(recipientId: string): Promise<void> {
    const session = this.sessions.get(recipientId);
    if (session) {
      session.engine.destroy();
      this.sessions.delete(recipientId);
      await deleteSessionFromStorage(recipientId);
      logger.log(`Destroyed session with ${recipientId}`);
    }
  }

  async destroyAllSessions(): Promise<void> {
    for (const [, session] of this.sessions) {
      session.engine.destroy();
      await deleteSessionFromStorage(session.recipientId);
    }
    this.sessions.clear();
    this.pendingX3DH.clear();
    this.pendingPQXDH.clear();
    logger.log('Destroyed all ratchet sessions');
  }

  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }
}

// Singleton
export const sessionManager = new SessionManager();
export default sessionManager;
