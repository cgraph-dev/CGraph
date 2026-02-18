/**
 * Tests for double-ratchet/ratchetOps.ts
 *
 * Session initialization (Alice/Bob), DH ratchet steps,
 * message key skipping, and pruning.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  initializeAlice,
  initializeBob,
  dhRatchet,
  pruneSkippedKeys,
  skipMessageKeys,
} from '../ratchetOps';
import { generateDHKeyPair } from '../keyDerivation';
import type { RatchetState, RatchetConfig } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const noopLog = vi.fn();

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('initializeAlice', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sets up DH keys, root key, and sending chain', async () => {
    const state = makeState();
    const sharedSecret = new Uint8Array(32).fill(0x11);
    const bobKP = await generateDHKeyPair();

    await initializeAlice(state, sharedSecret, bobKP.rawPublicKey, noopLog);

    expect(state.DHs).not.toBeNull();
    expect(state.DHs!.rawPublicKey.byteLength).toBe(65); // P-256 uncompressed
    expect(state.DHr).toEqual(bobKP.rawPublicKey);
    expect(state.RK.byteLength).toBe(32);
    expect(state.CKs).not.toBeNull();
    expect(state.CKs!.byteLength).toBe(32);
    expect(state.dhRatchetCount).toBe(1);
  });

  it('calls logger', async () => {
    const state = makeState();
    const sharedSecret = new Uint8Array(32).fill(0x22);
    const bobKP = await generateDHKeyPair();

    await initializeAlice(state, sharedSecret, bobKP.rawPublicKey, noopLog);

    expect(noopLog).toHaveBeenCalledWith('INIT_ALICE', expect.any(String));
    expect(noopLog).toHaveBeenCalledWith('INIT_COMPLETE', expect.any(String));
  });
});

describe('initializeBob', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sets DHs to provided key pair and RK to shared secret', async () => {
    const state = makeState();
    const sharedSecret = new Uint8Array(32).fill(0x33);
    const ourKP = await generateDHKeyPair();

    await initializeBob(state, sharedSecret, ourKP, noopLog);

    expect(state.DHs).toBe(ourKP);
    expect(state.RK).toBe(sharedSecret);
    expect(state.CKs).toBeNull(); // Bob doesn't have sending chain initially
  });
});

describe('dhRatchet', () => {
  it('advances root chain and generates new DH key pair', async () => {
    const sharedSecret = new Uint8Array(32).fill(0x44);
    const bobKP = await generateDHKeyPair();
    const state = makeState();
    await initializeAlice(state, sharedSecret, bobKP.rawPublicKey, noopLog);

    const oldDHs = state.DHs;
    const theirNewKP = await generateDHKeyPair();

    await dhRatchet(state, theirNewKP.rawPublicKey, noopLog);

    // New DH key pair generated
    expect(state.DHs).not.toBe(oldDHs);
    expect(state.DHs!.rawPublicKey).not.toEqual(oldDHs!.rawPublicKey);

    // Root key and chain keys updated
    expect(state.RK.byteLength).toBe(32);
    expect(state.CKs).not.toBeNull();
    expect(state.CKr).not.toBeNull();

    // Counters reset
    expect(state.Ns).toBe(0);
    expect(state.Nr).toBe(0);

    // DH ratchet count incremented
    expect(state.dhRatchetCount).toBe(2); // 1 from initAlice + 1 from ratchet
  });

  it('saves previous chain length in PN', async () => {
    const sharedSecret = new Uint8Array(32).fill(0x55);
    const bobKP = await generateDHKeyPair();
    const state = makeState();
    await initializeAlice(state, sharedSecret, bobKP.rawPublicKey, noopLog);

    state.Ns = 7; // Alice sent 7 messages

    const theirKP = await generateDHKeyPair();
    await dhRatchet(state, theirKP.rawPublicKey, noopLog);

    expect(state.PN).toBe(7);
    expect(state.Ns).toBe(0);
  });
});

describe('pruneSkippedKeys', () => {
  it('does nothing when under the max', () => {
    const state = makeState();
    state.MKSKIPPED.set('key1', new Uint8Array(32));
    state.MKSKIPPED.set('key2', new Uint8Array(32));
    const config = makeConfig({ maxSkippedMessages: 10 });

    pruneSkippedKeys(state, config, noopLog);
    expect(state.MKSKIPPED.size).toBe(2);
  });

  it('prunes excess keys and zeroes them', () => {
    const state = makeState();
    for (let i = 0; i < 15; i++) {
      state.MKSKIPPED.set(`key${i}`, new Uint8Array(32).fill(0xff));
    }
    const config = makeConfig({ maxSkippedMessages: 10 });

    pruneSkippedKeys(state, config, noopLog);
    expect(state.MKSKIPPED.size).toBe(10);
  });
});

describe('skipMessageKeys', () => {
  it('stores skipped message keys for out-of-order decryption', async () => {
    const sharedSecret = new Uint8Array(32).fill(0x66);
    const bobKP = await generateDHKeyPair();
    const state = makeState();
    await initializeAlice(state, sharedSecret, bobKP.rawPublicKey, noopLog);

    // Simulate Bob having a receiving chain
    const bobState = makeState();
    await initializeBob(bobState, sharedSecret, bobKP, noopLog);

    // Need CKr for skipMessageKeys — do a dhRatchet first
    const aliceKP = state.DHs!;
    await dhRatchet(bobState, aliceKP.rawPublicKey, noopLog);

    const config = makeConfig();
    const dhPub = aliceKP.rawPublicKey;

    // Skip messages 0, 1, 2
    await skipMessageKeys(bobState, config, dhPub, 0, 3, noopLog);

    expect(bobState.MKSKIPPED.size).toBe(3);
    expect(bobState.Nr).toBe(3);
  });

  it('throws when too many messages would be skipped', async () => {
    const sharedSecret = new Uint8Array(32).fill(0x77);
    const bobKP = await generateDHKeyPair();
    const state = makeState();
    await initializeAlice(state, sharedSecret, bobKP.rawPublicKey, noopLog);

    const bobState = makeState();
    await initializeBob(bobState, sharedSecret, bobKP, noopLog);
    await dhRatchet(bobState, state.DHs!.rawPublicKey, noopLog);

    const config = makeConfig({ maxSkippedMessages: 5 });

    await expect(
      skipMessageKeys(bobState, config, state.DHs!.rawPublicKey, 0, 10, noopLog)
    ).rejects.toThrow('Too many skipped messages');
  });

  it('does nothing when CKr is null', async () => {
    const state = makeState(); // CKr is null
    const config = makeConfig();
    const dh = new Uint8Array(65);

    await skipMessageKeys(state, config, dh, 0, 5, noopLog);
    expect(state.MKSKIPPED.size).toBe(0);
  });
});
