/**
 * Integration test — Full protocol flow: PQXDH → Triple Ratchet → Messages
 *
 * This test exercises the complete E2EE lifecycle as it would be used
 * in the CGraph app: key bundle generation, PQXDH key agreement,
 * Triple Ratchet initialization, and encrypted messaging.
 */
import { describe, it, expect } from 'vitest';
import { generateECKeyPair, generateSigningKeyPair } from '../x3dh';
import { kemKeygen } from '../kem';
import {
  pqxdhInitiate,
  pqxdhRespond,
  generatePQXDHBundle,
  splitTripleRatchetSecret,
} from '../pqxdh';
import { TripleRatchetEngine } from '../tripleRatchet';

describe('Full protocol flow: PQXDH → Triple Ratchet', () => {
  it('complete E2EE lifecycle without OPK', async () => {
    // ==========================================
    // 1. KEY GENERATION (registration time)
    // ==========================================

    // Alice generates her long-term keys
    const aliceIdentity = await generateECKeyPair();
    const _aliceSigning = await generateSigningKeyPair();

    // Bob generates his long-term keys
    const bobIdentity = await generateECKeyPair();
    const bobSigning = await generateSigningKeyPair();
    const bobKemKP = kemKeygen();

    // ==========================================
    // 2. BOB PUBLISHES PRE-KEY BUNDLE
    // ==========================================

    const { bundle, signedPreKeyPair: bobSignedPreKey } = await generatePQXDHBundle(
      bobIdentity,
      bobSigning,
      bobKemKP,
      1,
      100
    );

    // ==========================================
    // 3. PQXDH KEY AGREEMENT (Alice initiates)
    // ==========================================

    // Alice performs PQXDH with Bob's bundle
    const alicePQXDH = await pqxdhInitiate(aliceIdentity, bundle, 64);
    expect(alicePQXDH.sharedSecret.length).toBe(64);

    // Bob computes matching secret from Alice's initial message
    const bobPQXDH = await pqxdhRespond(
      bobIdentity,
      bobSignedPreKey,
      bobKemKP.secretKey,
      aliceIdentity.rawPublicKey,
      alicePQXDH.ephemeralPublicKey,
      alicePQXDH.kemCipherText,
      undefined,
      64
    );

    // Verify both derived the same shared secret
    expect(bobPQXDH.sharedSecret).toEqual(alicePQXDH.sharedSecret);

    // ==========================================
    // 4. SPLIT SECRET FOR TRIPLE RATCHET
    // ==========================================

    const aliceSplit = splitTripleRatchetSecret(alicePQXDH.sharedSecret);
    const bobSplit = splitTripleRatchetSecret(bobPQXDH.sharedSecret);

    expect(aliceSplit.skEc).toEqual(bobSplit.skEc);
    expect(aliceSplit.skScka).toEqual(bobSplit.skScka);

    // ==========================================
    // 5. INITIALIZE TRIPLE RATCHET
    // ==========================================

    // Use Bob's signed pre-key as the initial DH ratchet key
    const alice = await TripleRatchetEngine.initializeAlice(
      aliceSplit.skEc,
      aliceSplit.skScka,
      bobSignedPreKey.rawPublicKey
    );

    const bob = await TripleRatchetEngine.initializeBob(bobSplit.skEc, bobSplit.skScka, {
      publicKey: bobSignedPreKey.publicKey,
      privateKey: bobSignedPreKey.privateKey,
      rawPublicKey: bobSignedPreKey.rawPublicKey,
    });

    // ==========================================
    // 6. EXCHANGE MESSAGES
    // ==========================================
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    // Alice sends first message
    const msg1 = await alice.encrypt(enc.encode('Hey Bob! Quantum-secure greetings! 🔐'));
    const dec1 = await bob.decrypt(msg1);
    expect(dec.decode(dec1.plaintext)).toBe('Hey Bob! Quantum-secure greetings! 🔐');

    // Bob replies
    const msg2 = await bob.encrypt(enc.encode('Hey Alice! PQ ratchet engaged! 🛡️'));
    const dec2 = await alice.decrypt(msg2);
    expect(dec.decode(dec2.plaintext)).toBe('Hey Alice! PQ ratchet engaged! 🛡️');

    // Multiple back-and-forth
    for (let i = 0; i < 10; i++) {
      const sender = i % 2 === 0 ? alice : bob;
      const receiver = i % 2 === 0 ? bob : alice;
      const text = `Message ${i} from ${i % 2 === 0 ? 'Alice' : 'Bob'}`;

      const m = await sender.encrypt(enc.encode(text));
      const d = await receiver.decrypt(m);
      expect(dec.decode(d.plaintext)).toBe(text);
    }

    // ==========================================
    // 7. VERIFY SESSION STATS
    // ==========================================

    const aliceStats = alice.getStats();
    const bobStats = bob.getStats();

    expect(aliceStats.messageCount).toBe(12); // 1 + 5 sends + 6 recvs... actually it's encrypt/decrypt counting
    expect(bobStats.messageCount).toBe(12);
    expect(aliceStats.version).toBe(4);

    // ==========================================
    // 8. CLEANUP
    // ==========================================

    alice.destroy();
    bob.destroy();
  });

  it('complete E2EE lifecycle with OPK', async () => {
    const aliceIdentity = await generateECKeyPair();
    const bobIdentity = await generateECKeyPair();
    const bobSigning = await generateSigningKeyPair();
    const bobKemKP = kemKeygen();
    const bobOPK = await generateECKeyPair();

    const { bundle, signedPreKeyPair: bobSPK } = await generatePQXDHBundle(
      bobIdentity,
      bobSigning,
      bobKemKP,
      1,
      100,
      [{ id: 42, keyPair: bobOPK }]
    );

    // PQXDH with OPK
    const aliceResult = await pqxdhInitiate(aliceIdentity, bundle, 64);
    expect(aliceResult.usedOneTimePreKey).toBe(true);

    const bobResult = await pqxdhRespond(
      bobIdentity,
      bobSPK,
      bobKemKP.secretKey,
      aliceIdentity.rawPublicKey,
      aliceResult.ephemeralPublicKey,
      aliceResult.kemCipherText,
      bobOPK,
      64
    );

    expect(bobResult.sharedSecret).toEqual(aliceResult.sharedSecret);

    // Triple Ratchet
    const { skEc, skScka } = splitTripleRatchetSecret(aliceResult.sharedSecret);

    const alice = await TripleRatchetEngine.initializeAlice(skEc, skScka, bobSPK.rawPublicKey);
    const bob = await TripleRatchetEngine.initializeBob(skEc, skScka, bobSPK);

    const enc = new TextEncoder();
    const dec = new TextDecoder();

    const msg = await alice.encrypt(enc.encode('OPK flow works!'));
    const result = await bob.decrypt(msg);
    expect(dec.decode(result.plaintext)).toBe('OPK flow works!');

    alice.destroy();
    bob.destroy();
  });
});

describe('Protocol composability', () => {
  it('PQXDH 32-byte output works with standalone Double Ratchet', async () => {
    const aliceIdentity = await generateECKeyPair();
    const bobIdentity = await generateECKeyPair();
    const bobSigning = await generateSigningKeyPair();
    const bobKemKP = kemKeygen();

    const { bundle, signedPreKeyPair: bobSPK } = await generatePQXDHBundle(
      bobIdentity,
      bobSigning,
      bobKemKP,
      1,
      100
    );

    // Use 32-byte output for standard Double Ratchet (not Triple)
    const aliceResult = await pqxdhInitiate(aliceIdentity, bundle, 32);
    expect(aliceResult.sharedSecret.length).toBe(32);

    const bobResult = await pqxdhRespond(
      bobIdentity,
      bobSPK,
      bobKemKP.secretKey,
      aliceIdentity.rawPublicKey,
      aliceResult.ephemeralPublicKey,
      aliceResult.kemCipherText,
      undefined,
      32
    );

    expect(bobResult.sharedSecret).toEqual(aliceResult.sharedSecret);

    // This 32-byte secret can be used directly with DoubleRatchetEngine
    // (standalone, non-hybrid mode)
    const { DoubleRatchetEngine } = await import('../doubleRatchet');
    const alice = new DoubleRatchetEngine({ enableAuditLog: false });
    const bob = new DoubleRatchetEngine({ enableAuditLog: false });

    await alice.initializeAlice(aliceResult.sharedSecret, bobSPK.rawPublicKey);
    await bob.initializeBob(bobResult.sharedSecret, bobSPK);

    const enc = new TextEncoder();
    const dec = new TextDecoder();

    const msg = await alice.encryptMessage(enc.encode('PQXDH + DR works!'));
    const result = await bob.decryptMessage(msg);
    expect(dec.decode(result.plaintext)).toBe('PQXDH + DR works!');
  });
});
