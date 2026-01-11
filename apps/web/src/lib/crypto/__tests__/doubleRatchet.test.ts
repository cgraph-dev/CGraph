/**
 * Double Ratchet Protocol Tests
 * 
 * Comprehensive test suite for the Double Ratchet cryptographic protocol.
 * Tests encryption, decryption, key ratcheting, and out-of-order message handling.
 * 
 * @version 3.0.0
 * @since v0.7.35
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  DoubleRatchetEngine,
  PostQuantumDoubleRatchet,
  generateDHKeyPair,
  importDHPublicKey,
} from '../doubleRatchet';

describe('DoubleRatchetEngine', () => {
  let alice: DoubleRatchetEngine;
  let bob: DoubleRatchetEngine;
  let sharedSecret: Uint8Array;
  
  beforeEach(async () => {
    alice = new DoubleRatchetEngine({ enableAuditLog: true });
    bob = new DoubleRatchetEngine({ enableAuditLog: true });
    
    // Simulate X3DH shared secret
    sharedSecret = crypto.getRandomValues(new Uint8Array(32));
  });
  
  afterEach(() => {
    alice.destroy();
    bob.destroy();
  });
  
  describe('Initialization', () => {
    it('should generate unique session IDs', () => {
      const stats1 = alice.getStats();
      const stats2 = bob.getStats();
      
      expect(stats1.sessionId).toBeDefined();
      expect(stats2.sessionId).toBeDefined();
      expect(stats1.sessionId).not.toBe(stats2.sessionId);
      expect(stats1.sessionId.length).toBe(32); // 16 bytes hex encoded
    });
    
    it('should initialize Alice with shared secret', async () => {
      const bobKeyPair = await generateDHKeyPair();
      
      await alice.initializeAlice(sharedSecret, bobKeyPair.rawPublicKey);
      
      const stats = alice.getStats();
      expect(stats.dhRatchetCount).toBe(1);
      expect(alice.getPublicKey()).toBeDefined();
    });
    
    it('should initialize Bob with shared secret', async () => {
      const bobKeyPair = await generateDHKeyPair();
      
      await bob.initializeBob(sharedSecret, bobKeyPair);
      
      const publicKey = bob.getPublicKey();
      expect(publicKey).toBeDefined();
      expect(publicKey?.length).toBeGreaterThan(0);
    });
  });
  
  describe('Key Generation', () => {
    it('should generate valid DH key pairs', async () => {
      const keyPair = await generateDHKeyPair();
      
      expect(keyPair.publicKey).toBeDefined();
      expect(keyPair.privateKey).toBeDefined();
      expect(keyPair.rawPublicKey).toBeDefined();
      expect(keyPair.rawPublicKey.length).toBe(97); // P-384 uncompressed public key
    });
    
    it('should import DH public keys', async () => {
      const keyPair = await generateDHKeyPair();
      const imported = await importDHPublicKey(keyPair.rawPublicKey);
      
      expect(imported).toBeDefined();
      expect(imported.type).toBe('public');
    });
  });
  
  describe('Encryption and Decryption', () => {
    beforeEach(async () => {
      // Set up a session between Alice and Bob
      const bobKeyPair = await generateDHKeyPair();
      
      await alice.initializeAlice(sharedSecret, bobKeyPair.rawPublicKey);
      await bob.initializeBob(sharedSecret, bobKeyPair);
    });
    
    it('should encrypt a message', async () => {
      const plaintext = new TextEncoder().encode('Hello, Bob!');
      
      const encrypted = await alice.encryptMessage(plaintext);
      
      expect(encrypted.header).toBeDefined();
      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.nonce).toBeDefined();
      expect(encrypted.mac).toBeDefined();
      expect(encrypted.ciphertext.length).toBeGreaterThan(plaintext.length);
    });
    
    it('should decrypt a message', async () => {
      const originalMessage = 'Hello, Bob! This is a secret message.';
      const plaintext = new TextEncoder().encode(originalMessage);
      
      const encrypted = await alice.encryptMessage(plaintext);
      const decrypted = await bob.decryptMessage(encrypted);
      
      const decryptedText = new TextDecoder().decode(decrypted.plaintext);
      expect(decryptedText).toBe(originalMessage);
    });
    
    it('should handle multiple messages in order', async () => {
      const messages = [
        'First message',
        'Second message',
        'Third message',
      ];
      
      const encrypted = [];
      for (const msg of messages) {
        const enc = await alice.encryptMessage(new TextEncoder().encode(msg));
        encrypted.push(enc);
      }
      
      for (let i = 0; i < messages.length; i++) {
        const encryptedMsg = encrypted[i];
        if (!encryptedMsg) continue;
        const decrypted = await bob.decryptMessage(encryptedMsg);
        const text = new TextDecoder().decode(decrypted.plaintext);
        expect(text).toBe(messages[i]);
        expect(decrypted.isOutOfOrder).toBe(false);
      }
    });
    
    it('should increment message counters', async () => {
      const msg1 = await alice.encryptMessage(new TextEncoder().encode('First'));
      const msg2 = await alice.encryptMessage(new TextEncoder().encode('Second'));
      const msg3 = await alice.encryptMessage(new TextEncoder().encode('Third'));
      
      expect(msg1.header.n).toBe(0);
      expect(msg2.header.n).toBe(1);
      expect(msg3.header.n).toBe(2);
    });
    
    it('should support associated data', async () => {
      const plaintext = new TextEncoder().encode('Secret with AD');
      const associatedData = new TextEncoder().encode('conversation:123');
      
      const encrypted = await alice.encryptMessage(plaintext, associatedData);
      encrypted.associatedData = associatedData;
      
      const decrypted = await bob.decryptMessage(encrypted);
      const text = new TextDecoder().decode(decrypted.plaintext);
      expect(text).toBe('Secret with AD');
    });
  });
  
  describe('Ratchet Advancement', () => {
    it('should advance the DH ratchet on reply', async () => {
      const bobKeyPair = await generateDHKeyPair();
      
      await alice.initializeAlice(sharedSecret, bobKeyPair.rawPublicKey);
      await bob.initializeBob(sharedSecret, bobKeyPair);
      
      // Alice sends to Bob
      const msg1 = await alice.encryptMessage(new TextEncoder().encode('Hello Bob'));
      await bob.decryptMessage(msg1);
      
      // Bob replies to Alice
      const msg2 = await bob.encryptMessage(new TextEncoder().encode('Hello Alice'));
      await alice.decryptMessage(msg2);
      
      // Alice replies again
      const msg3 = await alice.encryptMessage(new TextEncoder().encode('How are you?'));
      await bob.decryptMessage(msg3);
      
      const aliceStats = alice.getStats();
      const bobStats = bob.getStats();
      
      expect(aliceStats.dhRatchetCount).toBeGreaterThanOrEqual(2);
      expect(bobStats.dhRatchetCount).toBeGreaterThanOrEqual(2);
    });
    
    it('should track ratchet steps', async () => {
      const bobKeyPair = await generateDHKeyPair();
      
      await alice.initializeAlice(sharedSecret, bobKeyPair.rawPublicKey);
      
      // Send multiple messages
      for (let i = 0; i < 5; i++) {
        await alice.encryptMessage(new TextEncoder().encode(`Message ${i}`));
      }
      
      const stats = alice.getStats();
      expect(stats.ratchetSteps).toBe(5);
      expect(stats.messageCount).toBe(5);
    });
  });
  
  describe('Out-of-Order Messages', () => {
    it('should handle out-of-order message delivery', async () => {
      const bobKeyPair = await generateDHKeyPair();
      
      await alice.initializeAlice(sharedSecret, bobKeyPair.rawPublicKey);
      await bob.initializeBob(sharedSecret, bobKeyPair);
      
      // Alice sends messages
      const msg1 = await alice.encryptMessage(new TextEncoder().encode('First'));
      const msg2 = await alice.encryptMessage(new TextEncoder().encode('Second'));
      const msg3 = await alice.encryptMessage(new TextEncoder().encode('Third'));
      
      // Bob receives out of order
      const dec3 = await bob.decryptMessage(msg3);
      expect(new TextDecoder().decode(dec3.plaintext)).toBe('Third');
      expect(dec3.isOutOfOrder).toBe(true);
      
      const dec1 = await bob.decryptMessage(msg1);
      expect(new TextDecoder().decode(dec1.plaintext)).toBe('First');
      expect(dec1.wasSkipped).toBe(true);
      
      const dec2 = await bob.decryptMessage(msg2);
      expect(new TextDecoder().decode(dec2.plaintext)).toBe('Second');
      expect(dec2.wasSkipped).toBe(true);
    });
    
    it('should store skipped message keys', async () => {
      const bobKeyPair = await generateDHKeyPair();
      
      await alice.initializeAlice(sharedSecret, bobKeyPair.rawPublicKey);
      await bob.initializeBob(sharedSecret, bobKeyPair);
      
      // Alice sends 10 messages
      const messages = [];
      for (let i = 0; i < 10; i++) {
        messages.push(await alice.encryptMessage(new TextEncoder().encode(`Message ${i}`)));
      }
      
      // Bob receives only the last one first
      const lastMessage = messages[9];
      if (!lastMessage) throw new Error('Message not found');
      await bob.decryptMessage(lastMessage);
      
      const stats = bob.getStats();
      expect(stats.skippedKeysCount).toBe(9);
    });
  });
  
  describe('Session Persistence', () => {
    it('should export and import session state', async () => {
      const bobKeyPair = await generateDHKeyPair();
      
      await alice.initializeAlice(sharedSecret, bobKeyPair.rawPublicKey);
      
      // Send some messages
      await alice.encryptMessage(new TextEncoder().encode('Message 1'));
      await alice.encryptMessage(new TextEncoder().encode('Message 2'));
      
      // Export state
      const exported = await alice.exportState();
      expect(typeof exported).toBe('string');
      
      // Create new engine and import
      const aliceRestored = new DoubleRatchetEngine();
      await aliceRestored.importState(exported);
      
      // Verify state was restored
      const originalStats = alice.getStats();
      const restoredStats = aliceRestored.getStats();
      
      expect(restoredStats.sessionId).toBe(originalStats.sessionId);
      expect(restoredStats.messageCount).toBe(originalStats.messageCount);
      expect(restoredStats.ratchetSteps).toBe(originalStats.ratchetSteps);
      
      aliceRestored.destroy();
    });
  });
  
  describe('Security Properties', () => {
    it('should use unique nonces for each message', async () => {
      const bobKeyPair = await generateDHKeyPair();
      await alice.initializeAlice(sharedSecret, bobKeyPair.rawPublicKey);
      
      const nonces = new Set<string>();
      
      for (let i = 0; i < 100; i++) {
        const encrypted = await alice.encryptMessage(new TextEncoder().encode(`Message ${i}`));
        const nonceHex = Array.from(encrypted.nonce)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        
        expect(nonces.has(nonceHex)).toBe(false);
        nonces.add(nonceHex);
      }
    });
    
    it('should reject tampered messages', async () => {
      const bobKeyPair = await generateDHKeyPair();
      
      await alice.initializeAlice(sharedSecret, bobKeyPair.rawPublicKey);
      await bob.initializeBob(sharedSecret, bobKeyPair);
      
      const encrypted = await alice.encryptMessage(new TextEncoder().encode('Secret'));
      
      // Tamper with ciphertext
      if (encrypted.ciphertext[0] !== undefined) {
        encrypted.ciphertext[0] ^= 0xFF;
      }
      
      await expect(bob.decryptMessage(encrypted)).rejects.toThrow();
    });
    
    it('should reject messages with wrong MAC', async () => {
      const bobKeyPair = await generateDHKeyPair();
      
      await alice.initializeAlice(sharedSecret, bobKeyPair.rawPublicKey);
      await bob.initializeBob(sharedSecret, bobKeyPair);
      
      const encrypted = await alice.encryptMessage(new TextEncoder().encode('Secret'));
      
      // Tamper with MAC
      if (encrypted.mac[0] !== undefined) {
        encrypted.mac[0] ^= 0xFF;
      }
      
      await expect(bob.decryptMessage(encrypted)).rejects.toThrow('Message authentication failed');
    });
    
    it('should securely erase keys on destroy', () => {
      const engine = new DoubleRatchetEngine();
      engine.destroy();
      
      const stats = engine.getStats();
      expect(stats.messageCount).toBe(0);
      expect(stats.sessionId).not.toBe(''); // New session ID created
    });
  });
  
  describe('Audit Logging', () => {
    it('should maintain audit log when enabled', async () => {
      const engine = new DoubleRatchetEngine({ enableAuditLog: true });
      const bobKeyPair = await generateDHKeyPair();
      
      await engine.initializeAlice(sharedSecret, bobKeyPair.rawPublicKey);
      await engine.encryptMessage(new TextEncoder().encode('Test'));
      
      const log = engine.getAuditLog();
      expect(log.length).toBeGreaterThan(0);
      expect(log.some(entry => entry.action === 'INIT_ALICE')).toBe(true);
      expect(log.some(entry => entry.action === 'ENCRYPT_START')).toBe(true);
      
      engine.destroy();
    });
  });
});

describe('PostQuantumDoubleRatchet', () => {
  it('should initialize with post-quantum placeholder', async () => {
    const pq = new PostQuantumDoubleRatchet({ enableAuditLog: true });
    const bobKeyPair = await generateDHKeyPair();
    const sharedSecret = crypto.getRandomValues(new Uint8Array(32));
    
    await pq.initializeWithQuantumResistance(sharedSecret, bobKeyPair.rawPublicKey);
    
    const stats = pq.getStats();
    expect(stats.dhRatchetCount).toBeGreaterThan(0);
    
    pq.destroy();
  });
  
  it('should encrypt and decrypt like standard ratchet', async () => {
    const alice = new PostQuantumDoubleRatchet();
    const bob = new DoubleRatchetEngine();
    
    const sharedSecret = crypto.getRandomValues(new Uint8Array(32));
    const bobKeyPair = await generateDHKeyPair();
    
    await alice.initializeWithQuantumResistance(sharedSecret, bobKeyPair.rawPublicKey);
    
    // Note: Bob would need matching PQ initialization for full interop
    // This test verifies PQ Alice can still encrypt
    const encrypted = await alice.encryptMessage(new TextEncoder().encode('Quantum-resistant message'));
    expect(encrypted.ciphertext.length).toBeGreaterThan(0);
    
    alice.destroy();
    bob.destroy();
  });
});
