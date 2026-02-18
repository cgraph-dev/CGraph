/**
 * Tests for double-ratchet/ratchet.ts
 *
 * DoubleRatchetEngine class: init Alice/Bob, encrypt/decrypt,
 * session export/import/destroy, diagnostics, audit log.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DoubleRatchetEngine } from '../ratchet';
import { generateDHKeyPair } from '../keyDerivation';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('DoubleRatchetEngine', () => {
  let engine: DoubleRatchetEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new DoubleRatchetEngine({ enableAuditLog: true });
  });

  // ── Constructor & defaults ──────────────────────────────────────────
  describe('constructor', () => {
    it('creates engine with default config', () => {
      const e = new DoubleRatchetEngine();
      const stats = e.getStats();
      expect(stats.sessionId).toMatch(/^[0-9a-f]{32}$/);
      expect(stats.messageCount).toBe(0);
      expect(stats.dhRatchetCount).toBe(0);
    });

    it('accepts partial config overrides', () => {
      const e = new DoubleRatchetEngine({ maxSkippedMessages: 42 });
      expect(e.getStats().sessionId).toBeTruthy();
    });
  });

  // ── Initialization ──────────────────────────────────────────────────
  describe('initializeAlice', () => {
    it('sets up sending chain for Alice', async () => {
      const sharedSecret = new Uint8Array(32).fill(0xaa);
      const bobKP = await generateDHKeyPair();
      await engine.initializeAlice(sharedSecret, bobKP.rawPublicKey);

      expect(engine.getPublicKey()).not.toBeNull();
      expect(engine.getPublicKey()!.byteLength).toBe(65);
      expect(engine.getStats().dhRatchetCount).toBe(1);
    });
  });

  describe('initializeBob', () => {
    it('sets up receiving state for Bob', async () => {
      const sharedSecret = new Uint8Array(32).fill(0xbb);
      const ourKP = await generateDHKeyPair();
      await engine.initializeBob(sharedSecret, ourKP);

      expect(engine.getPublicKey()).toEqual(ourKP.rawPublicKey);
    });
  });

  // ── Encrypt / Decrypt roundtrip ─────────────────────────────────────
  describe('encrypt & decrypt', () => {
    it('roundtrips a single message Alice→Bob', async () => {
      const sharedSecret = new Uint8Array(32).fill(0xcc);
      const bobKP = await generateDHKeyPair();

      const alice = new DoubleRatchetEngine({ enableAuditLog: false });
      await alice.initializeAlice(sharedSecret, bobKP.rawPublicKey);

      const bob = new DoubleRatchetEngine({ enableAuditLog: false });
      await bob.initializeBob(sharedSecret, bobKP);

      const plaintext = new TextEncoder().encode('hello from alice');
      const encrypted = await alice.encryptMessage(plaintext);
      const decrypted = await bob.decryptMessage(encrypted);

      expect(Array.from(decrypted.plaintext)).toEqual(Array.from(plaintext));
    });

    it('roundtrips multiple messages', async () => {
      const sharedSecret = new Uint8Array(32).fill(0xdd);
      const bobKP = await generateDHKeyPair();

      const alice = new DoubleRatchetEngine({ enableAuditLog: false });
      await alice.initializeAlice(sharedSecret, bobKP.rawPublicKey);

      const bob = new DoubleRatchetEngine({ enableAuditLog: false });
      await bob.initializeBob(sharedSecret, bobKP);

      for (let i = 0; i < 3; i++) {
        const pt = new TextEncoder().encode(`msg-${i}`);
        const enc = await alice.encryptMessage(pt);
        const dec = await bob.decryptMessage(enc);
        expect(Array.from(dec.plaintext)).toEqual(Array.from(pt));
      }

      expect(alice.getStats().messageCount).toBe(3);
    });

    it('throws when encrypting without initialization', async () => {
      const pt = new TextEncoder().encode('test');
      await expect(engine.encryptMessage(pt)).rejects.toThrow('Session not initialized');
    });
  });

  // ── Session management ──────────────────────────────────────────────
  describe('exportState / importState', () => {
    it('roundtrips session state through JSON', async () => {
      const sharedSecret = new Uint8Array(32).fill(0xee);
      const bobKP = await generateDHKeyPair();

      await engine.initializeAlice(sharedSecret, bobKP.rawPublicKey);
      const pt = new TextEncoder().encode('before export');
      await engine.encryptMessage(pt);

      const exported = await engine.exportState();
      expect(typeof exported).toBe('string');

      const engine2 = new DoubleRatchetEngine();
      await engine2.importState(exported);

      expect(engine2.getStats().messageCount).toBe(1);
      expect(engine2.getStats().sessionId).toBe(engine.getStats().sessionId);
    });
  });

  describe('destroy', () => {
    it('resets engine to empty state', async () => {
      const sharedSecret = new Uint8Array(32).fill(0xff);
      const bobKP = await generateDHKeyPair();
      await engine.initializeAlice(sharedSecret, bobKP.rawPublicKey);

      expect(engine.getPublicKey()).not.toBeNull();
      engine.destroy();

      expect(engine.getPublicKey()).toBeNull();
      expect(engine.getStats().messageCount).toBe(0);
    });
  });

  // ── Diagnostics ─────────────────────────────────────────────────────
  describe('diagnostics', () => {
    it('getStats returns session statistics', () => {
      const stats = engine.getStats();
      expect(stats).toHaveProperty('sessionId');
      expect(stats).toHaveProperty('messageCount');
      expect(stats).toHaveProperty('ratchetSteps');
      expect(stats).toHaveProperty('dhRatchetCount');
      expect(stats).toHaveProperty('skippedKeysCount');
      expect(stats).toHaveProperty('sessionAge');
    });

    it('getAuditLog returns copy of audit entries', async () => {
      const sharedSecret = new Uint8Array(32).fill(0x11);
      const bobKP = await generateDHKeyPair();
      await engine.initializeAlice(sharedSecret, bobKP.rawPublicKey);

      const log = engine.getAuditLog();
      expect(log.length).toBeGreaterThan(0);
      expect(log[0]).toHaveProperty('action');
      expect(log[0]).toHaveProperty('timestamp');
      expect(log[0]).toHaveProperty('details');
    });

    it('getAuditLog returns a copy (not mutable reference)', async () => {
      const log1 = engine.getAuditLog();
      log1.push({ action: 'INJECTED', timestamp: 0, details: '' });
      const log2 = engine.getAuditLog();
      expect(log2.length).toBe(log1.length - 1);
    });
  });

  // ── getPublicKey ────────────────────────────────────────────────────
  describe('getPublicKey', () => {
    it('returns null before initialization', () => {
      expect(engine.getPublicKey()).toBeNull();
    });
  });
});
