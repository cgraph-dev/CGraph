/**
 * Tests for the Triple Ratchet Engine
 *
 * The Triple Ratchet composes EC Double Ratchet + SPQR via KDF_HYBRID.
 * This is the top-level E2EE protocol — Signal Revision 4.
 */
import { describe, it, expect } from 'vitest';
import { TripleRatchetEngine, TRIPLE_RATCHET_VERSION } from '../tripleRatchet';
import { generateDHKeyPair } from '../doubleRatchet';
import { CryptoError } from '../errors';

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Set up a complete Triple Ratchet session between Alice and Bob.
 * Uses random seeds (normally these come from PQXDH output).
 */
async function setupTripleRatchetSession() {
  const skEc = crypto.getRandomValues(new Uint8Array(32));
  const skScka = crypto.getRandomValues(new Uint8Array(32));
  const bobKeyPair = await generateDHKeyPair();

  const alice = await TripleRatchetEngine.initializeAlice(skEc, skScka, bobKeyPair.rawPublicKey);
  const bob = await TripleRatchetEngine.initializeBob(skEc, skScka, bobKeyPair);

  return { alice, bob, skEc, skScka };
}

// =============================================================================
// TESTS
// =============================================================================

describe('Triple Ratchet initialization', () => {
  it('initializes Alice and Bob', async () => {
    const { alice, bob } = await setupTripleRatchetSession();

    const aStats = alice.getStats();
    const bStats = bob.getStats();

    expect(aStats.version).toBe(TRIPLE_RATCHET_VERSION);
    expect(bStats.version).toBe(TRIPLE_RATCHET_VERSION);
    expect(aStats.sessionId).toBeTruthy();
    expect(bStats.sessionId).toBeTruthy();
    expect(aStats.messageCount).toBe(0);
  });

  it('has EC public key after init', async () => {
    const { alice, bob } = await setupTripleRatchetSession();
    expect(alice.getECPublicKey()).toBeInstanceOf(Uint8Array);
    expect(bob.getECPublicKey()).toBeInstanceOf(Uint8Array);
  });

  it('has KEM public key after init', async () => {
    const { alice, bob } = await setupTripleRatchetSession();
    expect(alice.getKEMPublicKey()).toBeInstanceOf(Uint8Array);
    expect(bob.getKEMPublicKey()).toBeInstanceOf(Uint8Array);
  });
});

describe('Triple Ratchet encrypt / decrypt', () => {
  it('Alice sends to Bob', async () => {
    const { alice, bob } = await setupTripleRatchetSession();
    const plaintext = new TextEncoder().encode('Hello from Triple Ratchet!');

    const encrypted = await alice.encrypt(plaintext);
    expect(encrypted.header.version).toBe(TRIPLE_RATCHET_VERSION);
    expect(encrypted.ciphertext).toBeInstanceOf(Uint8Array);
    expect(encrypted.nonce.length).toBe(12);
    expect(encrypted.mac.length).toBe(32);

    const decrypted = await bob.decrypt(encrypted);
    expect(decrypted.plaintext).toEqual(plaintext);
  });

  it('Bob sends to Alice', async () => {
    const { alice, bob } = await setupTripleRatchetSession();
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    // First Alice must send so Bob receives her DH ratchet key
    const init = await alice.encrypt(enc.encode('init'));
    await bob.decrypt(init);

    // Now Bob can send
    const msg = await bob.encrypt(enc.encode('Hello from Bob!'));
    const result = await alice.decrypt(msg);
    expect(dec.decode(result.plaintext)).toBe('Hello from Bob!');
  });

  it('bidirectional conversation', async () => {
    const { alice, bob } = await setupTripleRatchetSession();
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    // Alice → Bob
    const m1 = await alice.encrypt(enc.encode('A1'));
    const d1 = await bob.decrypt(m1);
    expect(dec.decode(d1.plaintext)).toBe('A1');

    // Bob → Alice
    const m2 = await bob.encrypt(enc.encode('B1'));
    const d2 = await alice.decrypt(m2);
    expect(dec.decode(d2.plaintext)).toBe('B1');

    // Alice → Bob
    const m3 = await alice.encrypt(enc.encode('A2'));
    const d3 = await bob.decrypt(m3);
    expect(dec.decode(d3.plaintext)).toBe('A2');

    // Bob → Alice
    const m4 = await bob.encrypt(enc.encode('B2'));
    const d4 = await alice.decrypt(m4);
    expect(dec.decode(d4.plaintext)).toBe('B2');
  });

  it('multiple messages in same direction', async () => {
    const { alice, bob } = await setupTripleRatchetSession();
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    const messages = [];
    for (let i = 0; i < 5; i++) {
      messages.push(await alice.encrypt(enc.encode(`Msg ${i}`)));
    }

    for (let i = 0; i < 5; i++) {
      const result = await bob.decrypt(messages[i]!);
      expect(dec.decode(result.plaintext)).toBe(`Msg ${i}`);
    }
  });

  it('encrypts empty message', async () => {
    const { alice, bob } = await setupTripleRatchetSession();

    const msg = await alice.encrypt(new Uint8Array(0));
    const result = await bob.decrypt(msg);
    expect(result.plaintext.length).toBe(0);
  });

  it('encrypts large message', async () => {
    const { alice, bob } = await setupTripleRatchetSession();

    const largePlaintext = crypto.getRandomValues(new Uint8Array(64 * 1024)); // 64 KB
    const msg = await alice.encrypt(largePlaintext);
    const result = await bob.decrypt(msg);
    expect(result.plaintext).toEqual(largePlaintext);
  });
});

describe('Triple Ratchet security properties', () => {
  it('rejects tampered ciphertext', async () => {
    const { alice, bob } = await setupTripleRatchetSession();
    const msg = await alice.encrypt(new TextEncoder().encode('secret'));

    msg.ciphertext[0] ^= 0xff;

    await expect(bob.decrypt(msg)).rejects.toThrow();
  });

  it('rejects tampered MAC', async () => {
    const { alice, bob } = await setupTripleRatchetSession();
    const msg = await alice.encrypt(new TextEncoder().encode('secret'));

    msg.mac[0] ^= 0xff;

    await expect(bob.decrypt(msg)).rejects.toThrow(CryptoError);
  });

  it('rejects wrong protocol version', async () => {
    const { alice, bob } = await setupTripleRatchetSession();
    const msg = await alice.encrypt(new TextEncoder().encode('test'));

    msg.header.version = 99;

    await expect(bob.decrypt(msg)).rejects.toThrow('protocol version');
  });

  it('hybrid key: different EC and PQ keys each message', async () => {
    const { alice } = await setupTripleRatchetSession();

    // Each encrypt call advances both EC and PQ chains → unique hybrid keys
    const m1 = await alice.encrypt(new TextEncoder().encode('a'));
    const m2 = await alice.encrypt(new TextEncoder().encode('b'));

    // Headers should differ (different chain positions)
    expect(m1.header.pq.n).toBe(0);
    expect(m2.header.pq.n).toBe(1);
  });
});

describe('Triple Ratchet stats', () => {
  it('tracks message count', async () => {
    const { alice, bob } = await setupTripleRatchetSession();
    const enc = new TextEncoder();

    const msg1 = await alice.encrypt(enc.encode('hi'));
    await bob.decrypt(msg1);

    expect(alice.getStats().messageCount).toBe(1);
    expect(bob.getStats().messageCount).toBe(1);
  });

  it('reports SPQR epoch', async () => {
    const { alice } = await setupTripleRatchetSession();
    expect(alice.getStats().spqrEpoch).toBe(0);
  });

  it('reports session age', async () => {
    const { alice } = await setupTripleRatchetSession();
    // Should be very recent
    expect(alice.getStats().sessionAge).toBeLessThan(1000);
  });
});

describe('Triple Ratchet cleanup', () => {
  it('destroy wipes keys', async () => {
    const { alice } = await setupTripleRatchetSession();

    alice.destroy();

    // After destroy, keys should be null
    expect(alice.getKEMPublicKey()).toBeNull();
  });
});
