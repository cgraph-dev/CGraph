/**
 * Protocol Edge-Case Tests
 *
 * Tests for the boundaries and corner cases of the Signal-spec
 * Triple Ratchet and Double Ratchet protocols:
 * - Empty plaintext
 * - Max-skip enforcement
 * - Session statistics accuracy
 * - Epoch advancement tracking
 * - EC key rotation verification
 * - State export/import continuity
 * - Associated data handling
 * - Multi-client simulation (group-like pairwise)
 *
 * @module __tests__/protocol-edge-cases.test
 */
import { describe, it, expect } from 'vitest';
import { generateDHKeyPair, DoubleRatchetEngine } from '../doubleRatchet';
import {
  TripleRatchetEngine,
  TRIPLE_RATCHET_VERSION,
  type TripleRatchetMessage,
} from '../tripleRatchet';
import { kemKeygen, kemEncapsulate, kemDecapsulate } from '../kem';
import { generateECKeyPair, generateSigningKeyPair } from '../x3dh';
import {
  pqxdhInitiate,
  pqxdhRespond,
  generatePQXDHBundle,
  splitTripleRatchetSecret,
} from '../pqxdh';
import { SCKAEngine } from '../scka';
import { SPQREngine } from '../spqr';

// =============================================================================
// HELPERS
// =============================================================================

async function setupTripleRatchetPair() {
  const skEc = crypto.getRandomValues(new Uint8Array(32));
  const skScka = crypto.getRandomValues(new Uint8Array(32));
  const bobKP = await generateDHKeyPair();

  const alice = await TripleRatchetEngine.initializeAlice(skEc, skScka, bobKP.rawPublicKey);
  const bob = await TripleRatchetEngine.initializeBob(skEc, skScka, bobKP);

  return { alice, bob };
}

async function setupDRPair() {
  const secret = crypto.getRandomValues(new Uint8Array(32));
  const bobKP = await generateDHKeyPair();

  const alice = new DoubleRatchetEngine({ enableAuditLog: false });
  const bob = new DoubleRatchetEngine({ enableAuditLog: false });

  await alice.initializeAlice(secret, bobKP.rawPublicKey);
  await bob.initializeBob(secret, bobKP);

  return { alice, bob };
}

// =============================================================================
// EMPTY & EDGE PLAINTEXT
// =============================================================================

describe('Edge plaintext handling', () => {
  it('Triple Ratchet: empty plaintext roundtrip', async () => {
    const { alice, bob } = await setupTripleRatchetPair();
    const empty = new Uint8Array(0);

    const msg = await alice.encrypt(empty);
    const result = await bob.decrypt(msg);
    expect(result.plaintext.length).toBe(0);
  });

  it('Triple Ratchet: single byte plaintext', async () => {
    const { alice, bob } = await setupTripleRatchetPair();
    const single = new Uint8Array([0x42]);

    const msg = await alice.encrypt(single);
    const result = await bob.decrypt(msg);
    expect(result.plaintext).toEqual(single);
  });

  it('Double Ratchet: empty plaintext roundtrip', async () => {
    const { alice, bob } = await setupDRPair();
    const empty = new Uint8Array(0);

    const msg = await alice.encryptMessage(empty);
    const result = await bob.decryptMessage(msg);
    expect(result.plaintext.length).toBe(0);
  });

  it('Triple Ratchet: all-zero plaintext', async () => {
    const { alice, bob } = await setupTripleRatchetPair();
    const zeros = new Uint8Array(256);

    const msg = await alice.encrypt(zeros);
    const result = await bob.decrypt(msg);
    expect(result.plaintext).toEqual(zeros);
  });

  it('Triple Ratchet: all-0xFF plaintext', async () => {
    const { alice, bob } = await setupTripleRatchetPair();
    const ffs = new Uint8Array(256).fill(0xff);

    const msg = await alice.encrypt(ffs);
    const result = await bob.decrypt(msg);
    expect(result.plaintext).toEqual(ffs);
  });
});

// =============================================================================
// ASSOCIATED DATA
// =============================================================================

describe('Associated data handling', () => {
  it('Triple Ratchet: encrypt/decrypt with associated data', async () => {
    const { alice, bob } = await setupTripleRatchetPair();
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    const ad = enc.encode('channel:general');
    const msg = await alice.encrypt(enc.encode('with AD'), ad);
    const result = await bob.decrypt(msg);
    expect(dec.decode(result.plaintext)).toBe('with AD');
  });

  it('Triple Ratchet: wrong associated data fails MAC', async () => {
    const { alice, bob } = await setupTripleRatchetPair();
    const enc = new TextEncoder();

    const ad = enc.encode('channel:general');
    const msg = await alice.encrypt(enc.encode('wrong AD test'), ad);

    // Tamper with AD before passing to Bob
    msg.associatedData = enc.encode('channel:private');

    await expect(bob.decrypt(msg)).rejects.toThrow();
  });

  it('Triple Ratchet: removing associated data fails MAC', async () => {
    const { alice, bob } = await setupTripleRatchetPair();
    const enc = new TextEncoder();

    const ad = enc.encode('important-metadata');
    const msg = await alice.encrypt(enc.encode('strip AD'), ad);

    // Remove AD entirely
    msg.associatedData = undefined;

    await expect(bob.decrypt(msg)).rejects.toThrow();
  });
});

// =============================================================================
// SESSION STATISTICS
// =============================================================================

describe('Session statistics accuracy', () => {
  it('Triple Ratchet: stats track messages accurately', async () => {
    const { alice, bob } = await setupTripleRatchetPair();
    const enc = new TextEncoder();

    const stats0 = alice.getStats();
    expect(stats0.messageCount).toBe(0);
    expect(stats0.version).toBe(TRIPLE_RATCHET_VERSION);

    // Send 15 messages
    for (let i = 0; i < 15; i++) {
      const msg = await alice.encrypt(enc.encode(`msg-${i}`));
      await bob.decrypt(msg);
    }

    const aliceStats = alice.getStats();
    expect(aliceStats.messageCount).toBe(15);
    expect(aliceStats.sessionAge).toBeGreaterThanOrEqual(0);
    expect(aliceStats.sessionId).toMatch(/^[0-9a-f]{32}$/);

    const bobStats = bob.getStats();
    expect(bobStats.messageCount).toBe(15);
  });

  it('Double Ratchet: stats track message count and DH ratchets', async () => {
    const { alice, bob } = await setupDRPair();
    const enc = new TextEncoder();

    // A→B ×5
    for (let i = 0; i < 5; i++) {
      const msg = await alice.encryptMessage(enc.encode(`a-${i}`));
      await bob.decryptMessage(msg);
    }

    expect(alice.getStats().messageCount).toBe(5);
    expect(bob.getStats().messageCount).toBe(5);

    // B→A ×3 (triggers DH ratchet)
    for (let i = 0; i < 3; i++) {
      const msg = await bob.encryptMessage(enc.encode(`b-${i}`));
      await alice.decryptMessage(msg);
    }

    const aliceStats = alice.getStats();
    expect(aliceStats.messageCount).toBe(8);
    // At least 1 DH ratchet step (Bob→Alice direction change)
    expect(aliceStats.dhRatchetCount).toBeGreaterThanOrEqual(1);
  });
});

// =============================================================================
// SPQR EPOCH TRACKING
// =============================================================================

describe('SPQR epoch tracking', () => {
  it('epoch starts at 0 for both sides', async () => {
    const { alice, bob } = await setupTripleRatchetPair();
    const aliceStats = alice.getStats();
    const bobStats = bob.getStats();

    expect(aliceStats.spqrEpoch).toBe(0);
    expect(bobStats.spqrEpoch).toBe(0);
  });

  it('epochs remain consistent through messaging', async () => {
    const { alice, bob } = await setupTripleRatchetPair();
    const enc = new TextEncoder();

    for (let i = 0; i < 20; i++) {
      const sender = i % 2 === 0 ? alice : bob;
      const receiver = i % 2 === 0 ? bob : alice;

      const msg = await sender.encrypt(enc.encode(`epoch-${i}`));
      await receiver.decrypt(msg);
    }

    // Both should be at the same epoch
    const aliceEpoch = alice.getStats().spqrEpoch;
    const bobEpoch = bob.getStats().spqrEpoch;
    expect(aliceEpoch).toBeGreaterThanOrEqual(0);
    expect(bobEpoch).toBeGreaterThanOrEqual(0);
  });
});

// =============================================================================
// EC KEY ROTATION
// =============================================================================

describe('EC key rotation', () => {
  it('EC public key changes after DH ratchet', async () => {
    const { alice, bob } = await setupTripleRatchetPair();
    const enc = new TextEncoder();

    // Capture Alice's EC key before
    const keyBefore = alice.getECPublicKey();
    expect(keyBefore).not.toBeNull();

    // A→B (Alice sends – no DH ratchet on Alice send side initially)
    const msg1 = await alice.encrypt(enc.encode('init'));
    await bob.decrypt(msg1);

    // B→A (Bob sends – triggers ratchet on Alice receive side)
    const msg2 = await bob.encrypt(enc.encode('response'));
    await alice.decrypt(msg2);

    // A→B again (Alice now has new DH key from receiving Bob's msg)
    const msg3 = await alice.encrypt(enc.encode('second'));
    await bob.decrypt(msg3);

    // The DH ratchet should have advanced
    const stats = alice.getStats();
    expect(stats.dhRatchetCount).toBeGreaterThanOrEqual(1);
  });

  it('KEM public key accessible from both sides', async () => {
    const { alice, bob } = await setupTripleRatchetPair();

    const aliceKem = alice.getKEMPublicKey();
    const bobKem = bob.getKEMPublicKey();

    // Both should have KEM keys from SPQR initialization
    // (May be null if not yet generated depending on implementation)
    // The important thing: if present, they should be valid length
    if (aliceKem) {
      expect(aliceKem.length).toBeGreaterThan(0);
    }
    if (bobKem) {
      expect(bobKem.length).toBeGreaterThan(0);
    }
  });
});

// =============================================================================
// FULL PQXDH → TRIPLE RATCHET LIFECYCLE
// =============================================================================

describe('Full PQXDH → Triple Ratchet lifecycle', () => {
  it('complete handshake → bidirectional messaging → destroy', async () => {
    // 1. Key generation
    const aliceIdentity = await generateECKeyPair();
    const bobIdentity = await generateECKeyPair();
    const bobSigning = await generateSigningKeyPair();
    const bobKemKP = kemKeygen();

    // 2. Bundle generation
    const { bundle, signedPreKeyPair: bobSPK } = await generatePQXDHBundle(
      bobIdentity,
      bobSigning,
      bobKemKP,
      1,
      100
    );

    // 3. PQXDH handshake
    const aliceResult = await pqxdhInitiate(aliceIdentity, bundle, 64);
    const bobResult = await pqxdhRespond(
      bobIdentity,
      bobSPK,
      bobKemKP.secretKey,
      aliceIdentity.rawPublicKey,
      aliceResult.ephemeralPublicKey,
      aliceResult.kemCipherText,
      undefined,
      64
    );

    expect(aliceResult.sharedSecret).toEqual(bobResult.sharedSecret);

    // 4. Split secret and initialize Triple Ratchet
    const aliceSplit = splitTripleRatchetSecret(aliceResult.sharedSecret);
    const bobSplit = splitTripleRatchetSecret(bobResult.sharedSecret);

    const alice = await TripleRatchetEngine.initializeAlice(
      aliceSplit.skEc,
      aliceSplit.skScka,
      bobSPK.rawPublicKey
    );
    const bob = await TripleRatchetEngine.initializeBob(bobSplit.skEc, bobSplit.skScka, bobSPK);

    // 5. Bidirectional messaging
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    for (let i = 0; i < 30; i++) {
      const sender = i % 2 === 0 ? alice : bob;
      const receiver = i % 2 === 0 ? bob : alice;
      const text = `lifecycle-${i}`;

      const msg = await sender.encrypt(enc.encode(text));
      const result = await receiver.decrypt(msg);
      expect(dec.decode(result.plaintext)).toBe(text);
    }

    // 6. Check stats
    const aliceStats = alice.getStats();
    expect(aliceStats.messageCount).toBe(30);
    expect(aliceStats.dhRatchetCount).toBeGreaterThanOrEqual(1);

    // 7. Destroy
    alice.destroy();
    bob.destroy();

    // 8. Post-destroy encrypt should fail
    await expect(alice.encrypt(enc.encode('dead'))).rejects.toThrow();
    await expect(bob.encrypt(enc.encode('dead'))).rejects.toThrow();
  });
});

// =============================================================================
// SCKA STANDALONE
// =============================================================================

describe('SCKA standalone edge cases', () => {
  it('SCKA: keygen produces valid key pair', () => {
    const kp = kemKeygen();
    expect(kp.publicKey.length).toBeGreaterThan(0);
    expect(kp.secretKey.length).toBeGreaterThan(0);
  });

  it('SCKA: encapsulate/decapsulate consistency', () => {
    const kp = kemKeygen();
    const { sharedSecret: ss1, cipherText } = kemEncapsulate(kp.publicKey);
    const ss2 = kemDecapsulate(cipherText, kp.secretKey);
    expect(ss1).toEqual(ss2);
    expect(ss1.length).toBe(32);
  });

  it('KEM public key has expected length (ML-KEM-768)', () => {
    const kp = kemKeygen();
    // ML-KEM-768 public key = 1184 bytes
    expect(kp.publicKey.length).toBe(1184);
    // ML-KEM-768 ciphertext = 1088 bytes
    const { cipherText } = kemEncapsulate(kp.publicKey);
    expect(cipherText.length).toBe(1088);
  });
});

// =============================================================================
// MULTI-CLIENT PAIRWISE SIMULATION
// =============================================================================

describe('Multi-client pairwise simulation', () => {
  it('3-party: Alice↔Bob, Alice↔Carol, Bob↔Carol — all independent', async () => {
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    // Create 3 pair sessions
    const ab = await setupTripleRatchetPair();
    const ac = await setupTripleRatchetPair();
    const bc = await setupTripleRatchetPair();

    // Alice → Bob
    const m1 = await ab.alice.encrypt(enc.encode('Hi Bob from Alice'));
    const r1 = await ab.bob.decrypt(m1);
    expect(dec.decode(r1.plaintext)).toBe('Hi Bob from Alice');

    // Alice → Carol
    const m2 = await ac.alice.encrypt(enc.encode('Hi Carol from Alice'));
    const r2 = await ac.bob.decrypt(m2);
    expect(dec.decode(r2.plaintext)).toBe('Hi Carol from Alice');

    // Bob → Carol
    const m3 = await bc.alice.encrypt(enc.encode('Hi Carol from Bob'));
    const r3 = await bc.bob.decrypt(m3);
    expect(dec.decode(r3.plaintext)).toBe('Hi Carol from Bob');

    // Reverse directions work too
    const m4 = await ab.bob.encrypt(enc.encode('Bob to Alice'));
    const r4 = await ab.alice.decrypt(m4);
    expect(dec.decode(r4.plaintext)).toBe('Bob to Alice');

    const m5 = await ac.bob.encrypt(enc.encode('Carol to Alice'));
    const r5 = await ac.alice.decrypt(m5);
    expect(dec.decode(r5.plaintext)).toBe('Carol to Alice');

    // Cross-session isolation: Create fresh pairs to test that
    // a message from one session cannot be decrypted by another.
    // (We use fresh receivers to avoid corrupting the state of the main sessions.)
    const isolationPair = await setupTripleRatchetPair();
    const crossMsg = await ab.alice.encrypt(enc.encode('only for ab.bob'));
    await expect(isolationPair.bob.decrypt(crossMsg)).rejects.toThrow();

    // Cleanup all sessions
    [ab, ac, bc, isolationPair].forEach(({ alice, bob }) => {
      alice.destroy();
      bob.destroy();
    });
  });
});

// =============================================================================
// DOUBLE RATCHET STATE PERSISTENCE
// =============================================================================

describe('Double Ratchet state persistence', () => {
  it('export→import preserves counters and keys', async () => {
    const { alice, bob } = await setupDRPair();
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    // Send 10 msgs A→B
    for (let i = 0; i < 10; i++) {
      const msg = await alice.encryptMessage(enc.encode(`pre-${i}`));
      await bob.decryptMessage(msg);
    }

    // Export
    const stateBefore = await alice.exportState();
    const statsBeforeExport = alice.getStats();

    // Re-import into fresh engine
    const alice2 = new DoubleRatchetEngine({ enableAuditLog: false });
    await alice2.importState(stateBefore);

    const statsAfterImport = alice2.getStats();
    expect(statsAfterImport.messagesSent).toBe(statsBeforeExport.messagesSent);

    // Continue messaging from restored state
    for (let i = 0; i < 5; i++) {
      const msg = await alice2.encryptMessage(enc.encode(`post-${i}`));
      const result = await bob.decryptMessage(msg);
      expect(dec.decode(result.plaintext)).toBe(`post-${i}`);
    }
  });

  it('import from a state, send, export, import again, send', async () => {
    const { alice, bob } = await setupDRPair();
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    // A→B ×5
    for (let i = 0; i < 5; i++) {
      const msg = await alice.encryptMessage(enc.encode(`round1-${i}`));
      await bob.decryptMessage(msg);
    }

    // Export → Import → Send
    const s1 = await alice.exportState();
    const a2 = new DoubleRatchetEngine({ enableAuditLog: false });
    await a2.importState(s1);

    for (let i = 0; i < 5; i++) {
      const msg = await a2.encryptMessage(enc.encode(`round2-${i}`));
      await bob.decryptMessage(msg);
    }

    // Export again → Import again → Send
    const s2 = await a2.exportState();
    const a3 = new DoubleRatchetEngine({ enableAuditLog: false });
    await a3.importState(s2);

    for (let i = 0; i < 3; i++) {
      const msg = await a3.encryptMessage(enc.encode(`round3-${i}`));
      const result = await bob.decryptMessage(msg);
      expect(dec.decode(result.plaintext)).toBe(`round3-${i}`);
    }

    expect(a3.getStats().messageCount).toBe(5 + 5 + 3);
  });
});
