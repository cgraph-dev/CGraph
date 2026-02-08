/**
 * Session Manager Class — bridges X3DH key agreement with the Double Ratchet
 * for forward secrecy, break-in recovery, and out-of-order message handling.
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

import type { RatchetSession, SecureMessage } from './types';
import { saveSessionToStorage, deleteSessionFromStorage, getAllSessions } from './storage';
import { computeResponderSharedSecret } from './session-x3dh';
import { buildSecureMessage, toRatchetMessage } from './message-ops';

// =============================================================================
// SESSION MANAGER
// =============================================================================

class SessionManager {
  private sessions: Map<string, RatchetSession> = new Map();
  private pendingX3DH: Map<
    string,
    {
      sharedSecret: ArrayBuffer;
      ephemeralPublic: ArrayBuffer;
    }
  > = new Map();

  /**
   * Initialize session manager and load persisted sessions
   */
  async initialize(): Promise<void> {
    logger.log('Initializing session manager...');

    const storedSessions = await getAllSessions();
    for (const serialized of storedSessions) {
      try {
        const engine = new DoubleRatchetEngine();
        await engine.importState(serialized.engineState);

        this.sessions.set(serialized.recipientId, {
          recipientId: serialized.recipientId,
          sessionId: serialized.sessionId,
          engine,
          isInitiator: serialized.isInitiator,
          createdAt: serialized.createdAt,
          lastActivity: serialized.lastActivity,
          messageCount: serialized.messageCount,
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
  getSessionStats(recipientId: string): ReturnType<DoubleRatchetEngine['getStats']> | null {
    const session = this.sessions.get(recipientId);
    return session?.engine.getStats() ?? null;
  }

  /**
   * Create a new session as the initiator (Alice)
   * Uses X3DH to establish initial shared secret, then initializes Double Ratchet
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

    // Perform X3DH key agreement
    const { sharedSecret, ephemeralPublic } = await x3dhInitiate(identityKey, recipientBundle);

    // Store X3DH result for initial message
    this.pendingX3DH.set(recipientId, { sharedSecret, ephemeralPublic });

    // Initialize Double Ratchet as Alice (initiator)
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
    };

    this.sessions.set(recipientId, session);
    await saveSessionToStorage(session);

    logger.log(`Created session ${session.sessionId} with ${recipientId}`);

    return session;
  }

  /**
   * Accept a session as the responder (Bob)
   * Called when receiving the first message from an initiator
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
    };

    this.sessions.set(senderId, session);
    await saveSessionToStorage(session);

    logger.log(`Accepted session ${session.sessionId} from ${senderId}`);

    return session;
  }

  /**
   * Encrypt a message for a recipient
   */
  async encryptMessage(
    ourUserId: string,
    recipientId: string,
    plaintext: string,
    recipientBundle?: ServerPrekeyBundle
  ): Promise<SecureMessage> {
    // Get or create session
    let session = this.sessions.get(recipientId);
    let isInitialMessage = false;

    if (!session) {
      if (!recipientBundle) {
        throw new Error('No session exists and no recipient bundle provided');
      }
      session = await this.createSession(ourUserId, recipientId, recipientBundle);
      isInitialMessage = true;
    }

    // Encrypt with Double Ratchet
    const encoder = new TextEncoder();
    const plaintextBytes = encoder.encode(plaintext);

    const ratchetMessage = await session.engine.encryptMessage(plaintextBytes);

    // Update session state
    session.messageCount++;
    session.lastActivity = Date.now();
    await saveSessionToStorage(session);

    // Build secure message via helper
    const message = buildSecureMessage({
      ourUserId,
      recipientId,
      sessionId: session.sessionId,
      ratchetMessage,
    });

    // Include X3DH data for initial message
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

    return message;
  }

  /**
   * Decrypt a received message
   */
  async decryptMessage(message: SecureMessage, senderIdentityKey?: ArrayBuffer): Promise<string> {
    let session = this.sessions.get(message.senderId);

    // If this is an initial message, establish the session
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

    if (!session) {
      throw new Error(`No session found for ${message.senderId}`);
    }

    // Reconstruct ratchet message and decrypt
    const ratchetMessage = toRatchetMessage(message);
    const decrypted = await session.engine.decryptMessage(ratchetMessage);

    // Update session state
    session.messageCount++;
    session.lastActivity = Date.now();
    await saveSessionToStorage(session);

    // Decode plaintext
    const decoder = new TextDecoder();
    return decoder.decode(decrypted.plaintext);
  }

  /**
   * Destroy a session (e.g., when conversation is deleted)
   */
  async destroySession(recipientId: string): Promise<void> {
    const session = this.sessions.get(recipientId);
    if (session) {
      session.engine.destroy();
      this.sessions.delete(recipientId);
      await deleteSessionFromStorage(recipientId);
      logger.log(`Destroyed session with ${recipientId}`);
    }
  }

  /**
   * Destroy all sessions (e.g., on logout)
   */
  async destroyAllSessions(): Promise<void> {
    for (const [, session] of this.sessions) {
      session.engine.destroy();
      await deleteSessionFromStorage(session.recipientId);
    }
    this.sessions.clear();
    this.pendingX3DH.clear();
    logger.log('Destroyed all ratchet sessions');
  }

  /**
   * Get all active session IDs
   */
  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }
}

// Singleton
export const sessionManager = new SessionManager();
export default sessionManager;
