/**
 * Advanced E2EE Tests — Cross-Platform Messaging Simulation
 *
 * Simulates real-world messaging between web↔mobile users through
 * the complete protocol stack: PQXDH → Triple Ratchet → Messages.
 *
 * These tests verify that the crypto primitives produce identical
 * results regardless of which "client" (web or mobile) calls them,
 * ensuring cross-platform interoperability.
 *
 * @module __tests__/cross-platform.test
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { generateECKeyPair, generateSigningKeyPair } from '../x3dh';
import { kemKeygen } from '../kem';
import {
  pqxdhInitiate,
  pqxdhRespond,
  generatePQXDHBundle,
  splitTripleRatchetSecret,
} from '../pqxdh';
import { TripleRatchetEngine, type TripleRatchetMessage } from '../tripleRatchet';

// =============================================================================
// USER SIMULATION
// =============================================================================

interface SimulatedUser {
  name: string;
  identity: Awaited<ReturnType<typeof generateECKeyPair>>;
  signing: Awaited<ReturnType<typeof generateSigningKeyPair>>;
  kemKP: ReturnType<typeof kemKeygen>;
  ratchet?: TripleRatchetEngine;
}

async function createUser(name: string): Promise<SimulatedUser> {
  return {
    name,
    identity: await generateECKeyPair(),
    signing: await generateSigningKeyPair(),
    kemKP: kemKeygen(),
  };
}

/**
 * Full handshake: Alice initiates session with Bob.
 * Returns both users with active Triple Ratchet engines.
 */
async function performHandshake(alice: SimulatedUser, bob: SimulatedUser) {
  const { bundle, signedPreKeyPair: bobSPK } = await generatePQXDHBundle(
    bob.identity,
    bob.signing,
    bob.kemKP,
    1,
    100
  );

  const aliceResult = await pqxdhInitiate(alice.identity, bundle, 64);
  const bobResult = await pqxdhRespond(
    bob.identity,
    bobSPK,
    bob.kemKP.secretKey,
    alice.identity.rawPublicKey,
    aliceResult.ephemeralPublicKey,
    aliceResult.kemCipherText,
    undefined,
    64
  );

  expect(aliceResult.sharedSecret).toEqual(bobResult.sharedSecret);

  const { skEc, skScka } = splitTripleRatchetSecret(aliceResult.sharedSecret);

  alice.ratchet = await TripleRatchetEngine.initializeAlice(skEc, skScka, bobSPK.rawPublicKey);

  bob.ratchet = await TripleRatchetEngine.initializeBob(skEc, skScka, bobSPK);

  return { alice, bob };
}

// =============================================================================
// TESTS
// =============================================================================

describe('Cross-platform messaging simulation', () => {
  let alice: SimulatedUser;
  let bob: SimulatedUser;

  beforeEach(async () => {
    const users = await performHandshake(await createUser('Alice'), await createUser('Bob'));
    alice = users.alice;
    bob = users.bob;
  });

  it('simulates web → mobile messaging (50 messages)', async () => {
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    for (let i = 0; i < 50; i++) {
      const text = `Web→Mobile msg #${i}: ${Date.now()}`;
      const encrypted = await alice.ratchet!.encrypt(enc.encode(text));
      const decrypted = await bob.ratchet!.decrypt(encrypted);
      expect(dec.decode(decrypted.plaintext)).toBe(text);
    }
  });

  it('simulates mobile → web messaging (50 messages)', async () => {
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    // Bob must receive first so he gets Alice's DH key
    const init = await alice.ratchet!.encrypt(enc.encode('init'));
    await bob.ratchet!.decrypt(init);

    for (let i = 0; i < 50; i++) {
      const text = `Mobile→Web msg #${i}: ${Date.now()}`;
      const encrypted = await bob.ratchet!.encrypt(enc.encode(text));
      const decrypted = await alice.ratchet!.decrypt(encrypted);
      expect(dec.decode(decrypted.plaintext)).toBe(text);
    }
  });

  it('simulates rapid bidirectional chat (100 messages alternating)', async () => {
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    for (let i = 0; i < 100; i++) {
      const sender = i % 2 === 0 ? alice : bob;
      const receiver = i % 2 === 0 ? bob : alice;
      const text = `${sender.name} says: message ${i}`;

      const encrypted = await sender.ratchet!.encrypt(enc.encode(text));
      const decrypted = await receiver.ratchet!.decrypt(encrypted);
      expect(dec.decode(decrypted.plaintext)).toBe(text);
    }

    // Verify stats reflect message counts
    const aliceStats = alice.ratchet!.getStats();
    const bobStats = bob.ratchet!.getStats();
    expect(aliceStats.messageCount).toBe(100);
    expect(bobStats.messageCount).toBe(100);
  });

  it('handles burst messages (20 from Alice, then 20 from Bob)', async () => {
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    // Alice sends 20 messages in a burst
    const aliceMessages: TripleRatchetMessage[] = [];
    for (let i = 0; i < 20; i++) {
      aliceMessages.push(await alice.ratchet!.encrypt(enc.encode(`Alice burst ${i}`)));
    }

    // Bob decrypts all
    for (let i = 0; i < 20; i++) {
      const d = await bob.ratchet!.decrypt(aliceMessages[i]!);
      expect(dec.decode(d.plaintext)).toBe(`Alice burst ${i}`);
    }

    // Bob sends 20 messages in a burst
    const bobMessages: TripleRatchetMessage[] = [];
    for (let i = 0; i < 20; i++) {
      bobMessages.push(await bob.ratchet!.encrypt(enc.encode(`Bob burst ${i}`)));
    }

    // Alice decrypts all
    for (let i = 0; i < 20; i++) {
      const d = await alice.ratchet!.decrypt(bobMessages[i]!);
      expect(dec.decode(d.plaintext)).toBe(`Bob burst ${i}`);
    }
  });

  it('handles mixed message types (text, empty, binary, unicode)', async () => {
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    const testCases = [
      'Hello!',
      '', // Empty
      '🔐🛡️🔑', // Emoji
      'مرحبا بالعالم', // Arabic
      '日本語テスト', // Japanese
      '안녕하세요', // Korean
      'Привет мир', // Russian
      'A'.repeat(10000), // 10KB single message
      '\n\r\t\0', // Control characters
      '<script>alert("xss")</script>', // HTML
      '{"malicious": true}', // JSON
    ];

    for (const text of testCases) {
      const encrypted = await alice.ratchet!.encrypt(enc.encode(text));
      const decrypted = await bob.ratchet!.decrypt(encrypted);
      expect(dec.decode(decrypted.plaintext)).toBe(text);
    }
  });

  it('handles binary data (images, files)', async () => {
    // Simulate sending a small "image" (random binary)
    // crypto.getRandomValues has 65536 byte limit per call in test env
    const imageData = new Uint8Array(128 * 1024);
    for (let offset = 0; offset < imageData.length; offset += 65536) {
      const end = Math.min(offset + 65536, imageData.length);
      crypto.getRandomValues(imageData.subarray(offset, end));
    }

    const encrypted = await alice.ratchet!.encrypt(imageData);
    const decrypted = await bob.ratchet!.decrypt(encrypted);
    expect(decrypted.plaintext).toEqual(imageData);
  });

  it('DH ratchet advances on direction change', async () => {
    const enc = new TextEncoder();

    // Alice sends → ratchet state fixed
    const m1 = await alice.ratchet!.encrypt(enc.encode('a→b'));
    await bob.ratchet!.decrypt(m1);

    const aliceKey1 = alice.ratchet!.getECPublicKey();

    // Bob replies → triggers DH ratchet
    const m2 = await bob.ratchet!.encrypt(enc.encode('b→a'));
    await alice.ratchet!.decrypt(m2);

    // Alice sends again → new DH key
    const m3 = await alice.ratchet!.encrypt(enc.encode('a→b again'));
    await bob.ratchet!.decrypt(m3);

    const aliceKey2 = alice.ratchet!.getECPublicKey();
    expect(aliceKey1).not.toEqual(aliceKey2);
  });

  it('session cleanup destroys both sides independently', async () => {
    const enc = new TextEncoder();

    // First have Alice send so Bob receives (establishes his state)
    const m1 = await alice.ratchet!.encrypt(enc.encode('hello'));
    await bob.ratchet!.decrypt(m1);

    // Bob replies (establishes his sending chain)
    const m2 = await bob.ratchet!.encrypt(enc.encode('hey'));
    await alice.ratchet!.decrypt(m2);

    // Now destroy Alice
    alice.ratchet!.destroy();

    // Bob can still encrypt (he doesn't know Alice destroyed)
    const msg = await bob.ratchet!.encrypt(enc.encode('are you there?'));
    expect(msg).toBeTruthy();

    bob.ratchet!.destroy();

    // After destroy, keys are wiped
    await expect(alice.ratchet!.encrypt(enc.encode('dead'))).rejects.toThrow();
    await expect(bob.ratchet!.encrypt(enc.encode('dead'))).rejects.toThrow();
  });
});

describe('Multi-user conversation simulation', () => {
  it('Alice chats with Bob AND Carol independently', async () => {
    const alice = await createUser('Alice');
    const bob = await createUser('Bob');
    const carol = await createUser('Carol');

    // Alice ↔ Bob session
    const ab = await performHandshake(
      { ...alice, ratchet: undefined },
      { ...bob, ratchet: undefined }
    );

    // Alice ↔ Carol session (separate)
    const ac = await performHandshake(
      { ...alice, ratchet: undefined },
      { ...carol, ratchet: undefined }
    );

    const enc = new TextEncoder();
    const dec = new TextDecoder();

    // Message to Bob
    const toBob = await ab.alice.ratchet!.encrypt(enc.encode('Secret for Bob'));
    const fromBob = await ab.bob.ratchet!.decrypt(toBob);
    expect(dec.decode(fromBob.plaintext)).toBe('Secret for Bob');

    // Message to Carol
    const toCarol = await ac.alice.ratchet!.encrypt(enc.encode('Secret for Carol'));
    const fromCarol = await ac.bob.ratchet!.decrypt(toCarol);
    expect(dec.decode(fromCarol.plaintext)).toBe('Secret for Carol');

    // Bob can't decrypt Carol's message (different session)
    await expect(ab.bob.ratchet!.decrypt(toCarol)).rejects.toThrow();

    ab.alice.ratchet!.destroy();
    ab.bob.ratchet!.destroy();
    ac.alice.ratchet!.destroy();
    ac.bob.ratchet!.destroy();
  });
});
