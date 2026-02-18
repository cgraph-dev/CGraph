/**
 * Tests for double-ratchet/messageEncryption.ts
 *
 * Encrypt and decrypt using a real Double Ratchet chain state
 * with real Web Crypto primitives.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { encryptRatchetMessage, decryptRatchetMessage } from '../messageEncryption';
import { generateDHKeyPair, kdfRK } from '../keyDerivation';
import { initializeAlice, initializeBob } from '../ratchetOps';
import type { RatchetState, RatchetConfig } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const noopLog = vi.fn();

function makeConfig(overrides?: Partial<RatchetConfig>): RatchetConfig {
  return {
    enablePostQuantum: false,
    maxSkippedMessages: 100,
    messageKeyTTL: 3600000,
    enableAuditLog: false,
    compressionLevel: 0,
    ...overrides,
  };
}

function makeState(overrides?: Partial<RatchetState>): RatchetState {
  return {
    DHs: null,
    DHr: null,
    RK: new Uint8Array(32),
    CKs: null,
    CKr: null,
    Ns: 0,
    Nr: 0,
    PN: 0,
    MKSKIPPED: new Map(),
    sessionId: 'test-session',
    createdAt: Date.now(),
    lastActivity: Date.now(),
    messageCount: 0,
    ratchetSteps: 0,
    dhRatchetCount: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('encryptRatchetMessage', () => {
  it('throws when session not initialized (no DHs)', async () => {
    const state = makeState();
    const plaintext = new TextEncoder().encode('hello');
    await expect(encryptRatchetMessage(state, plaintext, undefined, noopLog)).rejects.toThrow(
      'Session not initialized'
    );
  });

  it('throws when no sending chain (no CKs)', async () => {
    const kp = await generateDHKeyPair();
    const state = makeState({ DHs: kp, CKs: null });
    const plaintext = new TextEncoder().encode('hello');
    await expect(encryptRatchetMessage(state, plaintext, undefined, noopLog)).rejects.toThrow(
      'No sending chain established'
    );
  });

  it('encrypts a message and advances chain state', async () => {
    // Set up Alice with a sending chain
    const sharedSecret = new Uint8Array(32).fill(0xaa);
    const bobKP = await generateDHKeyPair();
    const aliceState = makeState();
    await initializeAlice(aliceState, sharedSecret, bobKP.rawPublicKey, noopLog);

    const plaintext = new TextEncoder().encode('hello world');
    const encrypted = await encryptRatchetMessage(aliceState, plaintext, undefined, noopLog);

    expect(encrypted.header).toBeDefined();
    expect(encrypted.header.n).toBe(0);
    expect(encrypted.header.version).toBe(3);
    expect(encrypted.ciphertext).toBeInstanceOf(Uint8Array);
    expect(encrypted.nonce).toBeInstanceOf(Uint8Array);
    expect(encrypted.mac).toBeInstanceOf(Uint8Array);
    expect(encrypted.nonce.byteLength).toBe(12);

    // State should have advanced
    expect(aliceState.Ns).toBe(1);
    expect(aliceState.messageCount).toBe(1);
  });

  it('increments message number with each encryption', async () => {
    const sharedSecret = new Uint8Array(32).fill(0xbb);
    const bobKP = await generateDHKeyPair();
    const state = makeState();
    await initializeAlice(state, sharedSecret, bobKP.rawPublicKey, noopLog);

    const pt = new TextEncoder().encode('msg');
    const e1 = await encryptRatchetMessage(state, pt, undefined, noopLog);
    const e2 = await encryptRatchetMessage(state, pt, undefined, noopLog);
    const e3 = await encryptRatchetMessage(state, pt, undefined, noopLog);

    expect(e1.header.n).toBe(0);
    expect(e2.header.n).toBe(1);
    expect(e3.header.n).toBe(2);
    expect(state.Ns).toBe(3);
    expect(state.messageCount).toBe(3);
  });

  it('includes associated data when provided', async () => {
    const sharedSecret = new Uint8Array(32).fill(0xcc);
    const bobKP = await generateDHKeyPair();
    const state = makeState();
    await initializeAlice(state, sharedSecret, bobKP.rawPublicKey, noopLog);

    const pt = new TextEncoder().encode('msg');
    const ad = new TextEncoder().encode('additional-context');
    const encrypted = await encryptRatchetMessage(state, pt, ad, noopLog);
    expect(encrypted.associatedData).toEqual(ad);
  });
});

describe('encrypt + decrypt roundtrip', () => {
  it('Alice encrypts, Bob decrypts successfully', async () => {
    const sharedSecret = new Uint8Array(32).fill(0xdd);
    const bobKP = await generateDHKeyPair();
    const config = makeConfig();

    // Alice initializes and sends
    const aliceState = makeState({ sessionId: 'sess-alice' });
    await initializeAlice(aliceState, sharedSecret, bobKP.rawPublicKey, noopLog);

    const plaintext = new TextEncoder().encode('hello bob');
    const encrypted = await encryptRatchetMessage(aliceState, plaintext, undefined, noopLog);

    // Bob initializes (as responder with the same shared secret)
    const bobState = makeState({ sessionId: 'sess-bob' });
    await initializeBob(bobState, sharedSecret, bobKP, noopLog);

    const decrypted = await decryptRatchetMessage(bobState, config, encrypted, noopLog);
    expect(Array.from(decrypted.plaintext)).toEqual(Array.from(plaintext));
    expect(decrypted.wasSkipped).toBe(false);
  });

  it('multiple messages in sequence', async () => {
    const sharedSecret = new Uint8Array(32).fill(0xee);
    const bobKP = await generateDHKeyPair();
    const config = makeConfig();

    const aliceState = makeState({ sessionId: 's1' });
    await initializeAlice(aliceState, sharedSecret, bobKP.rawPublicKey, noopLog);

    const bobState = makeState({ sessionId: 's1' });
    await initializeBob(bobState, sharedSecret, bobKP, noopLog);

    for (let i = 0; i < 5; i++) {
      const pt = new TextEncoder().encode(`message-${i}`);
      const enc = await encryptRatchetMessage(aliceState, pt, undefined, noopLog);
      const dec = await decryptRatchetMessage(bobState, config, enc, noopLog);
      expect(Array.from(dec.plaintext)).toEqual(Array.from(pt));
    }

    expect(aliceState.Ns).toBe(5);
    expect(bobState.Nr).toBe(5);
  });

  it('tampered MAC is detected', async () => {
    const sharedSecret = new Uint8Array(32).fill(0xff);
    const bobKP = await generateDHKeyPair();
    const config = makeConfig();

    const aliceState = makeState({ sessionId: 's-mac' });
    await initializeAlice(aliceState, sharedSecret, bobKP.rawPublicKey, noopLog);

    const encrypted = await encryptRatchetMessage(
      aliceState,
      new TextEncoder().encode('tamper test'),
      undefined,
      noopLog
    );

    // Tamper with MAC
    encrypted.mac[0]! ^= 0xff;

    const bobState = makeState({ sessionId: 's-mac' });
    await initializeBob(bobState, sharedSecret, bobKP, noopLog);

    await expect(
      decryptRatchetMessage(bobState, config, encrypted, noopLog)
    ).rejects.toThrow('Message authentication failed');
  });
});

describe('decryptRatchetMessage', () => {
  it('throws when no receiving chain established (edge case)', async () => {
    const state = makeState();
    const config = makeConfig();

    // Create a minimal encrypted message with a DH key that won't match
    const kp = await generateDHKeyPair();
    const fakeMessage = {
      header: {
        dh: kp.rawPublicKey,
        pn: 0,
        n: 0,
        sessionId: 'x',
        timestamp: Date.now(),
        version: 3,
      },
      ciphertext: new Uint8Array(32),
      nonce: new Uint8Array(12),
      mac: new Uint8Array(32),
    };

    // State has no DHs, so dhRatchet will fail trying to DH with null private key
    await expect(
      decryptRatchetMessage(state, config, fakeMessage as never, noopLog)
    ).rejects.toThrow();
  });
});
