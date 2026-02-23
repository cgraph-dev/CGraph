/**
 * Session Manager Class — bridges X3DH key agreement with the Double Ratchet
 * for forward secrecy, break-in recovery, and out-of-order message handling.
 * V2: Also supports PQXDH + Triple Ratchet sessions via @cgraph/crypto.
 * @module lib/crypto/session-manager/session-manager-class
 */

import { DoubleRatchetEngine } from '../doubleRatchet';
import {
  loadIdentityKeyPair,
  arrayBufferToBase64,
  type ServerPrekeyBundle,
} from '../e2ee';
import { e2eeLogger as logger } from '../../logger';
import {
  CryptoProtocol,
  bundleSupportsPQ,
  type PQPreKeyBundle,
  type PQSessionResult,
} from '../protocol';
import { TripleRatchetEngine, type TripleRatchetStats } from '@cgraph/crypto/tripleRatchet';

import type { RatchetSession, SecureMessage } from './types';
import { saveSessionToStorage, deleteSessionFromStorage, getAllSessions } from './storage';
import {
  createPQSessionForRecipient,
  acceptIncomingPQSession,
  buildPQInitialMessagePayload,
} from './session-manager-pq';
import {
  createClassicalSessionForRecipient,
  acceptClassicalSession,
  encryptWithProtocol,
  decryptWithProtocol,
  type PendingX3DHData,
} from './session-manager-ops';

/** Default protocol metadata for legacy sessions loaded from storage */
const LEGACY_PROTOCOL = { protocol: CryptoProtocol.CLASSICAL_V1, cryptoVersion: '0.0.0' };

class SessionManager {
  private sessions: Map<string, RatchetSession> = new Map();
  private pendingX3DH: Map<string, PendingX3DHData> = new Map();
  /** Pending PQXDH initial messages (before first encrypt) */
  private pendingPQXDH: Map<string, PQSessionResult['initialMessage']> = new Map();

  /** Feature flag: when true, new sessions use PQXDH + Triple Ratchet if recipient supports it */
  private _useTripleRatchet = false;

  setUseTripleRatchet(enabled: boolean): void {
    this._useTripleRatchet = enabled;
    logger.log(`Triple Ratchet (PQXDH) ${enabled ? 'enabled' : 'disabled'} for new sessions`);
  }

  get useTripleRatchet(): boolean {
    return this._useTripleRatchet;
  }

  /** Initialize session manager and load persisted sessions. */
  async initialize(): Promise<void> {
    logger.log('Initializing session manager...');

    const storedSessions = await getAllSessions();
    for (const serialized of storedSessions) {
      try {
        const protocol = serialized.protocol ?? LEGACY_PROTOCOL;
        let engine: DoubleRatchetEngine | TripleRatchetEngine;

        if (protocol.protocol === CryptoProtocol.PQXDH_V1) {
          if (!serialized.engineState) {
            logger.warn(
              `PQ session for ${serialized.recipientId} has no engine state — will re-establish`
            );
            continue;
          }
          engine = await TripleRatchetEngine.importState(serialized.engineState);
        } else {
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

  /** Check if we have an active session with a recipient. */
  hasSession(recipientId: string): boolean {
    return this.sessions.has(recipientId);
  }

  /** Get session statistics. */
  getSessionStats(
    recipientId: string
  ): ReturnType<DoubleRatchetEngine['getStats']> | TripleRatchetStats | null {
    const session = this.sessions.get(recipientId);
    if (!session) return null;
    return session.engine.getStats();
  }

  /** Get the protocol version for an active session. */
  getSessionProtocol(recipientId: string): CryptoProtocol | null {
    return this.sessions.get(recipientId)?.protocol.protocol ?? null;
  }

  /** Create a new session as the initiator (Alice). Negotiates protocol version. */
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
      const { session, pendingPQData } = await createPQSessionForRecipient(
        recipientId,
        identityKey,
        pqBundle
      );
      this.pendingPQXDH.set(recipientId, pendingPQData);
      this.sessions.set(recipientId, session);
      return session;
    }

    // Classical X3DH → Double Ratchet
    const { session, pendingX3DH } = await createClassicalSessionForRecipient(
      recipientId,
      identityKey,
      recipientBundle
    );
    this.pendingX3DH.set(recipientId, pendingX3DH);
    this.sessions.set(recipientId, session);
    return session;
  }

  /** Accept a session as the responder (Bob). */
  async acceptSession(
    senderId: string,
    initialMessage: NonNullable<SecureMessage['initialMessage']>,
    senderIdentityKey: ArrayBuffer
  ): Promise<RatchetSession> {
    const session = await acceptClassicalSession(senderId, initialMessage, senderIdentityKey);
    this.sessions.set(senderId, session);
    return session;
  }

  /** Encrypt a message for a recipient using the session's protocol. */
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

    const plaintextBytes = new TextEncoder().encode(plaintext);
    const message = await encryptWithProtocol(session, plaintextBytes, ourUserId, recipientId);

    // Attach initial-message payload for the first message in a new session
    if (isInitialMessage) {
      if (session.protocol.protocol === CryptoProtocol.PQXDH_V1) {
        const pqData = this.pendingPQXDH.get(recipientId);
        if (pqData) {
          message.pqInitialMessage = buildPQInitialMessagePayload(pqData);
          this.pendingPQXDH.delete(recipientId);
        }
      } else {
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

  /** Decrypt a received message. Protocol detected from `protocolVersion` field. */
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
      session = await acceptIncomingPQSession(message, senderIdentityKey);
      this.sessions.set(message.senderId, session);
    }

    if (!session) {
      throw new Error(`No session found for ${message.senderId}`);
    }

    const plaintext = await decryptWithProtocol(session, message);

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
