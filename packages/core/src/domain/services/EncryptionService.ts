/**
 * Encryption Service
 * 
 * Domain service for E2EE encryption utilities.
 * Platform-agnostic interface - implementations provided by platform-specific code.
 */

export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export interface EncryptedMessage {
  ciphertext: Uint8Array;
  nonce: Uint8Array;
  header: MessageHeader;
}

export interface MessageHeader {
  publicKey: Uint8Array;
  previousChainLength: number;
  messageNumber: number;
}

export interface PreKeyBundle {
  identityKey: Uint8Array;
  signedPreKey: Uint8Array;
  signedPreKeySignature: Uint8Array;
  preKey?: Uint8Array;
  registrationId: number;
}

/**
 * Encryption Service interface
 * Implementations: Web (Web Crypto API), Mobile (TweetNaCl/X25519)
 */
export interface IEncryptionService {
  /**
   * Generate a new identity key pair
   */
  generateIdentityKeyPair(): Promise<KeyPair>;
  
  /**
   * Generate a signed pre-key
   */
  generateSignedPreKey(identityKey: KeyPair): Promise<{
    keyPair: KeyPair;
    signature: Uint8Array;
  }>;
  
  /**
   * Generate one-time pre-keys
   */
  generatePreKeys(count: number): Promise<KeyPair[]>;
  
  /**
   * Initialize a session with another user
   */
  initializeSession(
    ourIdentityKey: KeyPair,
    theirPreKeyBundle: PreKeyBundle
  ): Promise<SessionState>;
  
  /**
   * Encrypt a message
   */
  encryptMessage(
    session: SessionState,
    plaintext: string
  ): Promise<{ encrypted: EncryptedMessage; newSession: SessionState }>;
  
  /**
   * Decrypt a message
   */
  decryptMessage(
    session: SessionState,
    encrypted: EncryptedMessage
  ): Promise<{ plaintext: string; newSession: SessionState }>;
}

export interface SessionState {
  rootKey: Uint8Array;
  sendingChainKey: Uint8Array;
  receivingChainKey: Uint8Array;
  sendingRatchetKey: KeyPair;
  receivingRatchetKey: Uint8Array;
  previousSendingChainLength: number;
  messageNumber: number;
  receivedMessageNumbers: Set<number>;
}

/**
 * Encryption utilities (platform-agnostic)
 */
export class EncryptionUtils {
  /**
   * Encode bytes to base64
   */
  static bytesToBase64(bytes: Uint8Array): string {
    if (typeof btoa !== 'undefined') {
      // Browser
      return btoa(String.fromCharCode(...bytes));
    } else {
      // Node.js - use global Buffer
      const NodeBuffer = (globalThis as { Buffer?: { from: (data: Uint8Array) => { toString: (enc: string) => string } } }).Buffer;
      return NodeBuffer?.from(bytes).toString('base64') ?? '';
    }
  }
  
  /**
   * Decode base64 to bytes
   */
  static base64ToBytes(base64: string): Uint8Array {
    if (typeof atob !== 'undefined') {
      // Browser
      return new Uint8Array([...atob(base64)].map(c => c.charCodeAt(0)));
    } else {
      // Node.js - use global Buffer
      const NodeBuffer = (globalThis as { Buffer?: { from: (data: string, encoding: string) => Uint8Array } }).Buffer;
      const buf = NodeBuffer?.from(base64, 'base64');
      return buf ? new Uint8Array(buf) : new Uint8Array();
    }
  }
  
  /**
   * Generate a random nonce
   */
  static generateNonce(length: number = 24): Uint8Array {
    const nonce = new Uint8Array(length);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(nonce);
    } else {
      // Fallback for non-browser environments
      for (let i = 0; i < length; i++) {
        nonce[i] = Math.floor(Math.random() * 256);
      }
    }
    return nonce;
  }
  
  /**
   * Compare two byte arrays in constant time
   */
  static constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= (a[i] ?? 0) ^ (b[i] ?? 0);
    }
    return result === 0;
  }
  
  /**
   * Hash a message for signing
   */
  static async hashMessage(message: string): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      return new Uint8Array(hashBuffer);
    }
    
    throw new Error('SHA-256 not available');
  }
}
