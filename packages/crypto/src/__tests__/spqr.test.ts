/**
 * Tests for SPQR — Sparse Post-Quantum Ratchet
 */
import { describe, it, expect } from 'vitest';
import { SPQREngine } from '../spqr';

// =============================================================================
// HELPERS
// =============================================================================

async function setupSPQRPair(): Promise<{ alice: SPQREngine; bob: SPQREngine }> {
  const seed = crypto.getRandomValues(new Uint8Array(32));
  const alice = await SPQREngine.initialize(seed, true, 100);
  const bob = await SPQREngine.initialize(seed, false, 100);
  return { alice, bob };
}

// =============================================================================
// TESTS
// =============================================================================

describe('SPQR initialization', () => {
  it('initializes Alice and Bob', async () => {
    const { alice, bob } = await setupSPQRPair();
    expect(alice.getEpoch()).toBe(0);
    expect(bob.getEpoch()).toBe(0);
    expect(alice.getPublicKey()).toBeTruthy();
    expect(bob.getPublicKey()).toBeTruthy();
  });
});

describe('SPQR send / receive', () => {
  it('Alice sends PQ message key to Bob', async () => {
    const { alice, bob } = await setupSPQRPair();

    const sendResult = await alice.ratchetSendKey();
    expect(sendResult.messageKey).toBeInstanceOf(Uint8Array);
    expect(sendResult.messageKey.length).toBe(32);
    expect(sendResult.header.epoch).toBe(0);
    expect(sendResult.header.n).toBe(0);

    const recvResult = await bob.ratchetReceiveKey(sendResult.header);
    expect(recvResult.messageKey).toEqual(sendResult.messageKey);
  });

  it('multiple sends produce unique message keys', async () => {
    const { alice, bob } = await setupSPQRPair();

    const s1 = await alice.ratchetSendKey();
    const s2 = await alice.ratchetSendKey();
    const s3 = await alice.ratchetSendKey();

    expect(s1.messageKey).not.toEqual(s2.messageKey);
    expect(s2.messageKey).not.toEqual(s3.messageKey);

    expect(s1.header.n).toBe(0);
    expect(s2.header.n).toBe(1);
    expect(s3.header.n).toBe(2);

    // Bob receives in order
    const r1 = await bob.ratchetReceiveKey(s1.header);
    const r2 = await bob.ratchetReceiveKey(s2.header);
    const r3 = await bob.ratchetReceiveKey(s3.header);

    expect(r1.messageKey).toEqual(s1.messageKey);
    expect(r2.messageKey).toEqual(s2.messageKey);
    expect(r3.messageKey).toEqual(s3.messageKey);
  });

  it('bidirectional communication', async () => {
    const { alice, bob } = await setupSPQRPair();

    // Alice → Bob
    const a1 = await alice.ratchetSendKey();
    const b1 = await bob.ratchetReceiveKey(a1.header);
    expect(b1.messageKey).toEqual(a1.messageKey);

    // Bob → Alice
    const b2 = await bob.ratchetSendKey();
    const a2 = await alice.ratchetReceiveKey(b2.header);
    expect(a2.messageKey).toEqual(b2.messageKey);
  });
});

describe('SPQR epoch transitions', () => {
  it('KEM public key exchange triggers epoch advance', async () => {
    const { alice, bob } = await setupSPQRPair();

    // Alice sends (first message includes KEM public key)
    const a1 = await alice.ratchetSendKey();
    expect(a1.header.scka.kemPublicKey).toBeTruthy();

    // Bob receives and stores Alice's key
    await bob.ratchetReceiveKey(a1.header);

    // Bob sends (encapsulates against Alice's KEM public key)
    const b1 = await bob.ratchetSendKey();
    expect(b1.header.scka.kemCipherText).toBeTruthy();
    expect(b1.header.scka.kemPublicKey).toBeTruthy();
    expect(bob.getEpoch()).toBe(1);

    // Alice receives (decapsulates, epoch advances)
    await alice.ratchetReceiveKey(b1.header);
    expect(alice.getEpoch()).toBe(1);
  });
});

describe('SPQR state management', () => {
  it('exports and imports state', async () => {
    const { alice } = await setupSPQRPair();
    await alice.ratchetSendKey();
    await alice.ratchetSendKey();

    const state = alice.exportState();
    expect(state.Ns).toBe(2);
    expect(state.Nr).toBe(0);

    const restored = SPQREngine.fromState(state);
    expect(restored.getEpoch()).toBe(alice.getEpoch());
  });

  it('destroy wipes all key material', async () => {
    const { alice } = await setupSPQRPair();
    alice.destroy();
    expect(alice.getPublicKey()).toBeNull();
  });
});
