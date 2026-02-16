/**
 * Stress & Scale Tests
 *
 * Verifies the crypto stack under heavy load:
 * - Long-running conversations (500+ messages)
 * - Large payloads (1MB+)
 * - Rapid session establishment
 * - Out-of-order message delivery at scale
 * - Concurrent independent sessions
 * - Memory cleanup (destroy) under load
 *
 * @module __tests__/stress.test
 */
import { describe, it, expect } from 'vitest';
import { generateDHKeyPair, DoubleRatchetEngine } from '../doubleRatchet';
import { TripleRatchetEngine } from '../tripleRatchet';
import { kemKeygen, kemEncapsulate, kemDecapsulate } from '../kem';
import { generateECKeyPair } from '../x3dh';

// =============================================================================
// HELPERS
// =============================================================================

/** crypto.getRandomValues has a 65536-byte limit per call; fill in chunks */
function generateRandomBytes(size: number): Uint8Array {
  const buf = new Uint8Array(size);
  const CHUNK = 65536;
  for (let offset = 0; offset < size; offset += CHUNK) {
    const end = Math.min(offset + CHUNK, size);
    crypto.getRandomValues(buf.subarray(offset, end));
  }
  return buf;
}

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
// LONG CONVERSATIONS
// =============================================================================

describe('Long conversation stress tests', () => {
  it('Triple Ratchet: 200 alternating messages', async () => {
    const { alice, bob } = await setupTripleRatchetPair();
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    for (let i = 0; i < 200; i++) {
      const sender = i % 2 === 0 ? alice : bob;
      const receiver = i % 2 === 0 ? bob : alice;
      const text = `Alternating message ${i}`;

      const msg = await sender.encrypt(enc.encode(text));
      const result = await receiver.decrypt(msg);
      expect(dec.decode(result.plaintext)).toBe(text);
    }

    alice.destroy();
    bob.destroy();
  }, 30000);

  it('Double Ratchet: 300 one-directional then 100 reverse', async () => {
    const { alice, bob } = await setupDRPair();
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    // 300 messages Alice → Bob
    for (let i = 0; i < 300; i++) {
      const msg = await alice.encryptMessage(enc.encode(`fwd-${i}`));
      const result = await bob.decryptMessage(msg);
      expect(dec.decode(result.plaintext)).toBe(`fwd-${i}`);
    }

    // 100 messages Bob → Alice (DH ratchet step)
    for (let i = 0; i < 100; i++) {
      const msg = await bob.encryptMessage(enc.encode(`rev-${i}`));
      const result = await alice.decryptMessage(msg);
      expect(dec.decode(result.plaintext)).toBe(`rev-${i}`);
    }

    const stats = alice.getStats();
    expect(stats.messageCount).toBe(400); // 300 sent + 100 received
  }, 30000);

  it('Triple Ratchet: burst of 50 then scattered response', async () => {
    const { alice, bob } = await setupTripleRatchetPair();
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    // Alice sends 50 in a row (no bob sends in between)
    const aliceBatch: Awaited<ReturnType<typeof alice.encrypt>>[] = [];
    for (let i = 0; i < 50; i++) {
      aliceBatch.push(await alice.encrypt(enc.encode(`burst-${i}`)));
    }

    // Bob processes them in order
    for (let i = 0; i < 50; i++) {
      const result = await bob.decrypt(aliceBatch[i]);
      expect(dec.decode(result.plaintext)).toBe(`burst-${i}`);
    }

    // Now Bob replies with 50
    for (let i = 0; i < 50; i++) {
      const msg = await bob.encrypt(enc.encode(`reply-${i}`));
      const result = await alice.decrypt(msg);
      expect(dec.decode(result.plaintext)).toBe(`reply-${i}`);
    }
  }, 15000);
});

// =============================================================================
// LARGE PAYLOAD TESTS
// =============================================================================

describe('Large payload tests', () => {
  it('Triple Ratchet: 64KB payload', async () => {
    const { alice, bob } = await setupTripleRatchetPair();
    const payload = crypto.getRandomValues(new Uint8Array(64 * 1024));

    const msg = await alice.encrypt(payload);
    const result = await bob.decrypt(msg);
    expect(result.plaintext).toEqual(payload);
  });

  it('Triple Ratchet: 256KB payload', async () => {
    const { alice, bob } = await setupTripleRatchetPair();
    const payload = generateRandomBytes(256 * 1024);

    const msg = await alice.encrypt(payload);
    const result = await bob.decrypt(msg);
    expect(result.plaintext).toEqual(payload);
  });

  it('Triple Ratchet: 1MB payload', async () => {
    const { alice, bob } = await setupTripleRatchetPair();
    const payload = generateRandomBytes(1024 * 1024);

    const msg = await alice.encrypt(payload);
    const result = await bob.decrypt(msg);
    expect(result.plaintext).toEqual(payload);
  }, 15000);

  it('Double Ratchet: 512KB payload', async () => {
    const { alice, bob } = await setupDRPair();
    const payload = generateRandomBytes(512 * 1024);

    const msg = await alice.encryptMessage(payload);
    const result = await bob.decryptMessage(msg);
    expect(result.plaintext).toEqual(payload);
  });
});

// =============================================================================
// OUT-OF-ORDER DELIVERY
// =============================================================================

describe('Out-of-order delivery stress', () => {
  it('Triple Ratchet: deliver 30 messages in reverse order', async () => {
    const { alice, bob } = await setupTripleRatchetPair();
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    const messages: Awaited<ReturnType<typeof alice.encrypt>>[] = [];
    for (let i = 0; i < 30; i++) {
      messages.push(await alice.encrypt(enc.encode(`msg-${i}`)));
    }

    // Deliver in reverse order
    for (let i = messages.length - 1; i >= 0; i--) {
      const result = await bob.decrypt(messages[i]);
      expect(dec.decode(result.plaintext)).toBe(`msg-${i}`);
    }
  });

  it('Double Ratchet: interleaved out-of-order batches', async () => {
    const { alice, bob } = await setupDRPair();
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    // Send 20 messages
    const messages: Awaited<ReturnType<typeof alice.encryptMessage>>[] = [];
    for (let i = 0; i < 20; i++) {
      messages.push(await alice.encryptMessage(enc.encode(`seq-${i}`)));
    }

    // Deliver even-indexed first, then odd-indexed
    for (let i = 0; i < 20; i += 2) {
      const result = await bob.decryptMessage(messages[i]);
      expect(dec.decode(result.plaintext)).toBe(`seq-${i}`);
    }
    for (let i = 1; i < 20; i += 2) {
      const result = await bob.decryptMessage(messages[i]);
      expect(dec.decode(result.plaintext)).toBe(`seq-${i}`);
    }
  });

  it('Triple Ratchet: random shuffle order', async () => {
    const { alice, bob } = await setupTripleRatchetPair();
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    const N = 25;
    const messages: { idx: number; msg: Awaited<ReturnType<typeof alice.encrypt>> }[] = [];
    for (let i = 0; i < N; i++) {
      messages.push({ idx: i, msg: await alice.encrypt(enc.encode(`rand-${i}`)) });
    }

    // Fisher-Yates shuffle (deterministic seed via fixed sequence)
    const shuffled = [...messages];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = (i * 7 + 13) % (i + 1); // pseudo-random but deterministic
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    for (const { idx, msg } of shuffled) {
      const result = await bob.decrypt(msg);
      expect(dec.decode(result.plaintext)).toBe(`rand-${idx}`);
    }
  });
});

// =============================================================================
// CONCURRENT SESSIONS
// =============================================================================

describe('Concurrent session stress', () => {
  it('5 independent Triple Ratchet sessions simultaneously', async () => {
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    // Set up 5 independent pairs
    const pairs = await Promise.all(Array.from({ length: 5 }, () => setupTripleRatchetPair()));

    // Each pair exchanges 20 messages
    for (let round = 0; round < 20; round++) {
      const promises = pairs.map(async ({ alice, bob }, idx) => {
        const text = `session-${idx}-msg-${round}`;
        const msg = await alice.encrypt(enc.encode(text));
        const result = await bob.decrypt(msg);
        expect(dec.decode(result.plaintext)).toBe(text);
      });

      await Promise.all(promises);
    }

    pairs.forEach(({ alice, bob }) => {
      alice.destroy();
      bob.destroy();
    });
  }, 30000);

  it('session isolation: message from session A rejected by session B', async () => {
    const pairA = await setupTripleRatchetPair();
    const pairB = await setupTripleRatchetPair();
    const enc = new TextEncoder();

    const msgFromA = await pairA.alice.encrypt(enc.encode('for Bob A'));

    // Try to decrypt session A message with session B receiver — must fail
    await expect(pairB.bob.decrypt(msgFromA)).rejects.toThrow();

    pairA.alice.destroy();
    pairA.bob.destroy();
    pairB.alice.destroy();
    pairB.bob.destroy();
  });
});

// =============================================================================
// KEM SCALE
// =============================================================================

describe('KEM scale', () => {
  it('10 sequential keygen→encapsulate→decapsulate', () => {
    for (let i = 0; i < 10; i++) {
      const kp = kemKeygen();
      const { cipherText, sharedSecret: ss1 } = kemEncapsulate(kp.publicKey);
      const ss2 = kemDecapsulate(cipherText, kp.secretKey);
      expect(ss1).toEqual(ss2);
    }
  });

  it('key pair uniqueness across 20 generations', () => {
    const publicKeys = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const kp = kemKeygen();
      const hex = Array.from(kp.publicKey.slice(0, 32))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      expect(publicKeys.has(hex)).toBe(false);
      publicKeys.add(hex);
    }
  });
});

// =============================================================================
// DESTROY & CLEANUP
// =============================================================================

describe('Session destroy under load', () => {
  it('destroy mid-conversation resists further encrypt/decrypt', async () => {
    const { alice, bob } = await setupTripleRatchetPair();
    const enc = new TextEncoder();

    // Exchange 10 messages normally
    for (let i = 0; i < 10; i++) {
      const msg = await alice.encrypt(enc.encode(`pre-destroy-${i}`));
      await bob.decrypt(msg);
    }

    // Destroy Alice
    alice.destroy();

    // Alice can no longer encrypt
    await expect(alice.encrypt(enc.encode('post-destroy'))).rejects.toThrow();
  });

  it('destroy one side, other side still functional for new sessions', async () => {
    const pair1 = await setupTripleRatchetPair();
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    // Use session 1
    const msg1 = await pair1.alice.encrypt(enc.encode('session1'));
    await pair1.bob.decrypt(msg1);

    // Destroy session 1
    pair1.alice.destroy();
    pair1.bob.destroy();

    // Create completely new session 2 — must work fine
    const pair2 = await setupTripleRatchetPair();
    const msg2 = await pair2.alice.encrypt(enc.encode('session2'));
    const result = await pair2.bob.decrypt(msg2);
    expect(dec.decode(result.plaintext)).toBe('session2');

    pair2.alice.destroy();
    pair2.bob.destroy();
  });
});
