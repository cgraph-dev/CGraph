/**
 * Tests for SCKA — Sparse Continuous Key Agreement (ML-KEM Braid)
 */
import { describe, it, expect } from 'vitest';
import { SCKAEngine, SCKADirection } from '../scka';

// =============================================================================
// HELPERS
// =============================================================================

async function setupSCKAPair(): Promise<{ alice: SCKAEngine; bob: SCKAEngine }> {
  const seed = crypto.getRandomValues(new Uint8Array(32));
  const alice = await SCKAEngine.initialize(seed, SCKADirection.A2B);
  const bob = await SCKAEngine.initialize(seed, SCKADirection.B2A);
  return { alice, bob };
}

// =============================================================================
// TESTS
// =============================================================================

describe('SCKA initialization', () => {
  it('initializes Alice and Bob from same seed', async () => {
    const { alice, bob } = await setupSCKAPair();
    expect(alice.getEpoch()).toBe(0);
    expect(bob.getEpoch()).toBe(0);
    expect(alice.getPublicKey()).toBeTruthy();
    expect(bob.getPublicKey()).toBeTruthy();
  });

  it('Alice and Bob have different public keys', async () => {
    const { alice, bob } = await setupSCKAPair();
    expect(alice.getPublicKey()).not.toEqual(bob.getPublicKey());
  });
});

describe('SCKA chain key ratchet', () => {
  it('Alice send chain matches Bob receive chain', async () => {
    const { alice, bob } = await setupSCKAPair();

    // Alice derives a send key
    const aliceSend = await alice.ratchetSendKey();
    expect(aliceSend.chainKey.length).toBe(32);

    // Bob derives corresponding receive key (no KEM data in first epoch)
    const bobRecv = await bob.ratchetReceiveKey({ epoch: 0 });
    expect(bobRecv.chainKey).toEqual(aliceSend.chainKey);
  });

  it('Bob send chain matches Alice receive chain', async () => {
    const { alice, bob } = await setupSCKAPair();

    const bobSend = await bob.ratchetSendKey();
    const aliceRecv = await alice.ratchetReceiveKey({ epoch: 0 });
    expect(aliceRecv.chainKey).toEqual(bobSend.chainKey);
  });

  it('multiple sends produce distinct chain keys', async () => {
    const { alice, bob } = await setupSCKAPair();

    const s1 = await alice.ratchetSendKey();
    const s2 = await alice.ratchetSendKey();
    const s3 = await alice.ratchetSendKey();

    expect(s1.chainKey).not.toEqual(s2.chainKey);
    expect(s2.chainKey).not.toEqual(s3.chainKey);

    // Bob receives in order
    const r1 = await bob.ratchetReceiveKey({ epoch: 0 });
    const r2 = await bob.ratchetReceiveKey({ epoch: 0 });
    const r3 = await bob.ratchetReceiveKey({ epoch: 0 });

    expect(r1.chainKey).toEqual(s1.chainKey);
    expect(r2.chainKey).toEqual(s2.chainKey);
    expect(r3.chainKey).toEqual(s3.chainKey);
  });
});

describe('SCKA epoch advance (KEM Braid)', () => {
  it('advances epoch when receiving new KEM public key + encapsulating', async () => {
    const { alice, bob } = await setupSCKAPair();

    // Alice sends with her new public key (first message always includes it)
    const aliceSend = await alice.ratchetSendKey();
    expect(aliceSend.newPublicKey).toBeTruthy(); // First message includes public key

    // Bob receives Alice's public key
    await bob.ratchetReceiveKey({
      epoch: 0,
      kemPublicKey: aliceSend.newPublicKey,
    });

    // Bob now has a pending peer key. Next send encapsulates.
    const bobSend = await bob.ratchetSendKey();
    expect(bobSend.kemCipherText).toBeTruthy(); // Encapsulated against Alice's key
    expect(bobSend.newPublicKey).toBeTruthy(); // Also sends new public key
    expect(bob.getEpoch()).toBe(1); // Epoch advanced

    // Alice receives Bob's KEM ciphertext + new public key
    await alice.ratchetReceiveKey({
      epoch: 1,
      kemCipherText: bobSend.kemCipherText,
      kemPublicKey: bobSend.newPublicKey,
    });
    expect(alice.getEpoch()).toBe(1); // Epoch advanced on Alice side too
  });

  it('full KEM braid cycle produces matching chain keys', async () => {
    const { alice, bob } = await setupSCKAPair();

    // Step 1: Alice sends (includes her KEM public key)
    const a1 = await alice.ratchetSendKey();

    // Step 2: Bob receives Alice's key, then sends (encapsulates)
    await bob.ratchetReceiveKey({
      epoch: 0,
      kemPublicKey: a1.newPublicKey,
    });
    const b1 = await bob.ratchetSendKey();

    // Step 3: Alice receives Bob's ciphertext + key
    await alice.ratchetReceiveKey({
      epoch: bob.getEpoch(),
      kemCipherText: b1.kemCipherText,
      kemPublicKey: b1.newPublicKey,
    });

    // Now both are in epoch 1. Alice sends again (encapsulates against Bob's key)
    const a2 = await alice.ratchetSendKey();
    expect(a2.kemCipherText).toBeTruthy(); // Encapsulated
    expect(alice.getEpoch()).toBe(2);

    // Bob receives
    const b2 = await bob.ratchetReceiveKey({
      epoch: alice.getEpoch(),
      kemCipherText: a2.kemCipherText,
      kemPublicKey: a2.newPublicKey,
    });
    expect(bob.getEpoch()).toBe(2);

    // The chain key from Alice's send should match Bob's receive
    // (after epoch advance alignment)
    expect(b2.chainKey).toEqual(a2.chainKey);
  });
});

describe('SCKA state management', () => {
  it('exports and imports state', async () => {
    const { alice } = await setupSCKAPair();
    await alice.ratchetSendKey();

    const state = alice.exportState();
    const restored = SCKAEngine.fromState(state);

    expect(restored.getEpoch()).toBe(alice.getEpoch());
  });

  it('destroy wipes key material', async () => {
    const { alice } = await setupSCKAPair();
    alice.destroy();
    // After destroy, public key is null
    expect(alice.getPublicKey()).toBeNull();
  });
});
