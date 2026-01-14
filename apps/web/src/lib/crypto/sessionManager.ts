/**
 * Session Manager with Double Ratchet Integration
 * 
 * Bridges the X3DH key agreement with Double Ratchet for forward secrecy.
 * Each conversation has its own ratchet session that provides:
 * - Forward secrecy: Past messages remain secure if keys are compromised
 * - Break-in recovery: Future messages become secure after compromise
 * - Out-of-order message handling
 * 
 * @module lib/crypto/sessionManager
 * @version 1.0.0
 * @since v0.9.0
 */

import { 
  DoubleRatchetEngine, 
  generateDHKeyPair,
  type EncryptedMessage as RatchetEncryptedMessage,
} from './doubleRatchet';
import {
  loadIdentityKeyPair,
  loadSignedPreKey,
  x3dhInitiate,
  importPublicKey,
  deriveSharedSecret,
  hkdf,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  arrayBufferToHex,
  type ServerPrekeyBundle,
} from './e2ee';
import { e2eeLogger as logger } from '../logger';

// =============================================================================
// TYPES
// =============================================================================


export interface RatchetSession {
  recipientId: string;
  sessionId: string;
  engine: DoubleRatchetEngine;
  isInitiator: boolean;
  createdAt: number;
  lastActivity: number;
  messageCount: number;
}

export interface SerializedSession {
  recipientId: string;
  sessionId: string;
  isInitiator: boolean;
  createdAt: number;
  lastActivity: number;
  messageCount: number;
  engineState: string;
}

export interface SecureMessage {
  // Header for routing
  senderId: string;
  recipientId: string;
  sessionId: string;
  messageId: string;
  timestamp: number;
  
  // Ratchet message
  ratchetMessage: {
    header: {
      dh: string;           // Base64 DH public key
      pn: number;
      n: number;
      sessionId: string;
      timestamp: number;
      version: number;
    };
    ciphertext: string;     // Base64 ciphertext
    nonce: string;          // Base64 nonce
    mac: string;            // Base64 MAC
  };
  
  // For initial message (X3DH)
  initialMessage?: {
    ephemeralPublicKey: string;
    usedOneTimePreKey: boolean;
    oneTimePreKeyId?: string;
  };
}

// =============================================================================
// STORAGE (IndexedDB for large session state)
// =============================================================================

const DB_NAME = 'cgraph_e2ee_sessions';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';

let dbPromise: Promise<IDBDatabase> | null = null;

async function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'recipientId' });
        store.createIndex('lastActivity', 'lastActivity', { unique: false });
      }
    };
  });
  
  return dbPromise;
}

async function saveSessionToStorage(session: RatchetSession): Promise<void> {
  const db = await openDatabase();
  const serialized: SerializedSession = {
    recipientId: session.recipientId,
    sessionId: session.sessionId,
    isInitiator: session.isInitiator,
    createdAt: session.createdAt,
    lastActivity: session.lastActivity,
    messageCount: session.messageCount,
    engineState: await session.engine.exportState(),
  };
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(serialized);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function deleteSessionFromStorage(recipientId: string): Promise<void> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(recipientId);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function getAllSessions(): Promise<SerializedSession[]> {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

// =============================================================================
// SESSION MANAGER
// =============================================================================

class SessionManager {
  private sessions: Map<string, RatchetSession> = new Map();
  private pendingX3DH: Map<string, { 
    sharedSecret: ArrayBuffer; 
    ephemeralPublic: ArrayBuffer;
  }> = new Map();
  
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
    
    await engine.initializeAlice(
      new Uint8Array(sharedSecret),
      new Uint8Array(recipientDHKey)
    );
    
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
    
    const identityKey = await loadIdentityKeyPair();
    const signedPreKey = await loadSignedPreKey();
    
    if (!identityKey || !signedPreKey) {
      throw new Error('Keys not found');
    }
    
    // Recreate X3DH shared secret (receiver side)
    const ephemeralKey = await importPublicKey(
      base64ToArrayBuffer(initialMessage.ephemeralPublicKey)
    );
    const senderIdentity = await importPublicKey(senderIdentityKey);
    
    // Compute DH results
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
    const sharedSecret = await hkdf(combined.buffer, salt.buffer, info.buffer, 32);
    
    // Initialize Double Ratchet as Bob (responder)
    const engine = new DoubleRatchetEngine();
    
    // Generate our DH key pair for the ratchet
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
    
    // Helper to convert Uint8Array to proper ArrayBuffer
    const toArrayBuffer = (arr: Uint8Array): ArrayBuffer => {
      const buf = new ArrayBuffer(arr.byteLength);
      new Uint8Array(buf).set(arr);
      return buf;
    };
    
    // Build secure message
    const message: SecureMessage = {
      senderId: ourUserId,
      recipientId,
      sessionId: session.sessionId,
      messageId: this.generateMessageId(),
      timestamp: Date.now(),
      ratchetMessage: {
        header: {
          dh: arrayBufferToBase64(toArrayBuffer(ratchetMessage.header.dh)),
          pn: ratchetMessage.header.pn,
          n: ratchetMessage.header.n,
          sessionId: ratchetMessage.header.sessionId,
          timestamp: ratchetMessage.header.timestamp,
          version: ratchetMessage.header.version,
        },
        ciphertext: arrayBufferToBase64(toArrayBuffer(ratchetMessage.ciphertext)),
        nonce: arrayBufferToBase64(toArrayBuffer(ratchetMessage.nonce)),
        mac: arrayBufferToBase64(toArrayBuffer(ratchetMessage.mac)),
      },
    };
    
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
  async decryptMessage(
    message: SecureMessage,
    senderIdentityKey?: ArrayBuffer
  ): Promise<string> {
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
    
    // Reconstruct ratchet message
    const ratchetMessage: RatchetEncryptedMessage = {
      header: {
        dh: new Uint8Array(base64ToArrayBuffer(message.ratchetMessage.header.dh)),
        pn: message.ratchetMessage.header.pn,
        n: message.ratchetMessage.header.n,
        sessionId: message.ratchetMessage.header.sessionId,
        timestamp: message.ratchetMessage.header.timestamp,
        version: message.ratchetMessage.header.version,
      },
      ciphertext: new Uint8Array(base64ToArrayBuffer(message.ratchetMessage.ciphertext)),
      nonce: new Uint8Array(base64ToArrayBuffer(message.ratchetMessage.nonce)),
      mac: new Uint8Array(base64ToArrayBuffer(message.ratchetMessage.mac)),
    };
    
    // Decrypt with Double Ratchet
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
    for (const [recipientId, session] of this.sessions) {
      session.engine.destroy();
      await deleteSessionFromStorage(recipientId);
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
  
  /**
   * Generate a unique message ID
   */
  private generateMessageId(): string {
    const timestamp = Date.now().toString(36);
    const random = arrayBufferToHex(crypto.getRandomValues(new Uint8Array(8)).buffer as ArrayBuffer);
    return `${timestamp}-${random}`;
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const sessionManager = new SessionManager();

export default sessionManager;
