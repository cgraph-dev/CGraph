/**
 * Tests for PQXDH — Post-Quantum Extended Diffie-Hellman
 */
import { describe, it, expect } from 'vitest';
import {
  pqxdhInitiate,
  pqxdhRespond,
  generatePQXDHBundle,
  splitTripleRatchetSecret,
  PQXDH_VERSION,
  type PQXDHPreKeyBundle,
} from '../pqxdh';
import { generateECKeyPair, generateSigningKeyPair, sign, type ECKeyPair } from '../x3dh';
import { kemKeygen, KEM_PUBLIC_KEY_LENGTH, KEM_CIPHERTEXT_LENGTH } from '../kem';
import { CryptoError } from '../errors';

// =============================================================================
// HELPERS
// =============================================================================

async function setupPQXDHParties() {
  // Alice
  const aliceIdentity = await generateECKeyPair();
  const aliceSigning = await generateSigningKeyPair();

  // Bob
  const bobIdentity = await generateECKeyPair();
  const bobSigning = await generateSigningKeyPair();
  const bobSignedPreKey = await generateECKeyPair();
  const bobSpkSig = await sign(bobSigning.privateKey, bobSignedPreKey.rawPublicKey);
  const bobKemKP = kemKeygen();
  const bobKemSig = await sign(bobSigning.privateKey, bobKemKP.publicKey);

  return {
    alice: { identity: aliceIdentity, signing: aliceSigning },
    bob: {
      identity: bobIdentity,
      signing: bobSigning,
      signedPreKey: bobSignedPreKey,
      spkSig: bobSpkSig,
      kemKP: bobKemKP,
      kemSig: bobKemSig,
    },
  };
}

function buildBundle(
  bob: Awaited<ReturnType<typeof setupPQXDHParties>>['bob'],
  oneTimePreKP?: ECKeyPair
): PQXDHPreKeyBundle {
  const bundle: PQXDHPreKeyBundle = {
    identityKey: bob.identity.rawPublicKey,
    signingKey: bob.signing.rawPublicKey,
    signedPreKey: bob.signedPreKey.rawPublicKey,
    signedPreKeySignature: bob.spkSig,
    signedPreKeyId: 1,
    kyberPreKey: bob.kemKP.publicKey,
    kyberPreKeySignature: bob.kemSig,
    kyberPreKeyId: 100,
  };

  if (oneTimePreKP) {
    bundle.oneTimePreKey = oneTimePreKP.rawPublicKey;
    bundle.oneTimePreKeyId = 200;
  }

  return bundle;
}

// =============================================================================
// TESTS
// =============================================================================

describe('PQXDH key agreement', () => {
  it('Alice and Bob derive same shared secret (64 bytes, no OPK)', async () => {
    const { alice, bob } = await setupPQXDHParties();
    const bundle = buildBundle(bob);

    const aliceResult = await pqxdhInitiate(alice.identity, bundle, 64);
    expect(aliceResult.sharedSecret.length).toBe(64);
    expect(aliceResult.version).toBe(PQXDH_VERSION);
    expect(aliceResult.usedOneTimePreKey).toBe(false);
    expect(aliceResult.ephemeralPublicKey.length).toBe(65); // P-256
    expect(aliceResult.kemCipherText.length).toBe(KEM_CIPHERTEXT_LENGTH);

    const bobResult = await pqxdhRespond(
      bob.identity,
      bob.signedPreKey,
      bob.kemKP.secretKey,
      alice.identity.rawPublicKey,
      aliceResult.ephemeralPublicKey,
      aliceResult.kemCipherText,
      undefined,
      64
    );

    expect(bobResult.sharedSecret).toEqual(aliceResult.sharedSecret);
  });

  it('Alice and Bob derive same shared secret (32 bytes, standard mode)', async () => {
    const { alice, bob } = await setupPQXDHParties();
    const bundle = buildBundle(bob);

    const aliceResult = await pqxdhInitiate(alice.identity, bundle, 32);
    expect(aliceResult.sharedSecret.length).toBe(32);

    const bobResult = await pqxdhRespond(
      bob.identity,
      bob.signedPreKey,
      bob.kemKP.secretKey,
      alice.identity.rawPublicKey,
      aliceResult.ephemeralPublicKey,
      aliceResult.kemCipherText,
      undefined,
      32
    );

    expect(bobResult.sharedSecret).toEqual(aliceResult.sharedSecret);
  });

  it('Alice and Bob derive same shared secret (with OPK)', async () => {
    const { alice, bob } = await setupPQXDHParties();
    const oneTimePreKP = await generateECKeyPair();
    const bundle = buildBundle(bob, oneTimePreKP);

    const aliceResult = await pqxdhInitiate(alice.identity, bundle, 64);
    expect(aliceResult.usedOneTimePreKey).toBe(true);

    const bobResult = await pqxdhRespond(
      bob.identity,
      bob.signedPreKey,
      bob.kemKP.secretKey,
      alice.identity.rawPublicKey,
      aliceResult.ephemeralPublicKey,
      aliceResult.kemCipherText,
      oneTimePreKP,
      64
    );

    expect(bobResult.sharedSecret).toEqual(aliceResult.sharedSecret);
  });

  it('defaults to 64-byte output', async () => {
    const { alice, bob } = await setupPQXDHParties();
    const bundle = buildBundle(bob);

    const aliceResult = await pqxdhInitiate(alice.identity, bundle);
    expect(aliceResult.sharedSecret.length).toBe(64);
  });

  it('rejects invalid SPK signature', async () => {
    const { alice, bob } = await setupPQXDHParties();
    const bundle = buildBundle(bob);
    bundle.signedPreKeySignature = new Uint8Array(bundle.signedPreKeySignature.length);

    await expect(pqxdhInitiate(alice.identity, bundle)).rejects.toThrow(
      'Signed pre-key signature verification failed'
    );
  });

  it('rejects invalid KEM pre-key signature', async () => {
    const { alice, bob } = await setupPQXDHParties();
    const bundle = buildBundle(bob);
    bundle.kyberPreKeySignature = new Uint8Array(bundle.kyberPreKeySignature.length);

    await expect(pqxdhInitiate(alice.identity, bundle)).rejects.toThrow(
      'KEM pre-key signature verification failed'
    );
  });

  it('rejects invalid KEM key length', async () => {
    const { alice, bob } = await setupPQXDHParties();
    const bundle = buildBundle(bob);
    bundle.kyberPreKey = new Uint8Array(100); // Wrong size

    await expect(pqxdhInitiate(alice.identity, bundle)).rejects.toThrow(CryptoError);
  });

  it('associated data is IK_A || IK_B', async () => {
    const { alice, bob } = await setupPQXDHParties();
    const bundle = buildBundle(bob);

    const result = await pqxdhInitiate(alice.identity, bundle);

    expect(result.associatedData.length).toBe(65 + 65);
    expect(result.associatedData.slice(0, 65)).toEqual(alice.identity.rawPublicKey);
    expect(result.associatedData.slice(65)).toEqual(bob.identity.rawPublicKey);
  });

  it('different sessions produce different secrets (ephemeral randomness)', async () => {
    const { alice, bob } = await setupPQXDHParties();
    const bundle = buildBundle(bob);

    const r1 = await pqxdhInitiate(alice.identity, bundle);
    const r2 = await pqxdhInitiate(alice.identity, bundle);

    expect(r1.sharedSecret).not.toEqual(r2.sharedSecret);
    expect(r1.kemCipherText).not.toEqual(r2.kemCipherText);
  });
});

describe('PQXDH bundle generation', () => {
  it('generates a valid bundle', async () => {
    const identity = await generateECKeyPair();
    const signing = await generateSigningKeyPair();
    const kemKP = kemKeygen();

    const { bundle, signedPreKeyPair } = await generatePQXDHBundle(
      identity,
      signing,
      kemKP,
      1,
      100
    );

    expect(bundle.identityKey).toEqual(identity.rawPublicKey);
    expect(bundle.signingKey).toEqual(signing.rawPublicKey);
    expect(bundle.signedPreKey).toEqual(signedPreKeyPair.rawPublicKey);
    expect(bundle.signedPreKeyId).toBe(1);
    expect(bundle.kyberPreKey).toEqual(kemKP.publicKey);
    expect(bundle.kyberPreKeyId).toBe(100);
    expect(bundle.kyberPreKey.length).toBe(KEM_PUBLIC_KEY_LENGTH);
    expect(bundle.signedPreKeySignature.length).toBeGreaterThan(0);
    expect(bundle.kyberPreKeySignature.length).toBeGreaterThan(0);
  });

  it('includes first OPK when provided', async () => {
    const identity = await generateECKeyPair();
    const signing = await generateSigningKeyPair();
    const kemKP = kemKeygen();
    const opk = await generateECKeyPair();

    const { bundle } = await generatePQXDHBundle(identity, signing, kemKP, 1, 100, [
      { id: 42, keyPair: opk },
    ]);

    expect(bundle.oneTimePreKey).toEqual(opk.rawPublicKey);
    expect(bundle.oneTimePreKeyId).toBe(42);
  });

  it('generated bundle can be used for full PQXDH flow', async () => {
    const aliceIdentity = await generateECKeyPair();
    const bobIdentity = await generateECKeyPair();
    const bobSigning = await generateSigningKeyPair();
    const bobKemKP = kemKeygen();

    const { bundle, signedPreKeyPair } = await generatePQXDHBundle(
      bobIdentity,
      bobSigning,
      bobKemKP,
      1,
      100
    );

    const aliceResult = await pqxdhInitiate(aliceIdentity, bundle, 64);

    const bobResult = await pqxdhRespond(
      bobIdentity,
      signedPreKeyPair,
      bobKemKP.secretKey,
      aliceIdentity.rawPublicKey,
      aliceResult.ephemeralPublicKey,
      aliceResult.kemCipherText,
      undefined,
      64
    );

    expect(bobResult.sharedSecret).toEqual(aliceResult.sharedSecret);
  });
});

describe('splitTripleRatchetSecret', () => {
  it('splits 64-byte secret into skEc and skScka', () => {
    const sk = new Uint8Array(64);
    for (let i = 0; i < 64; i++) sk[i] = i;

    const { skEc, skScka } = splitTripleRatchetSecret(sk);

    expect(skEc.length).toBe(32);
    expect(skScka.length).toBe(32);
    expect(skEc).toEqual(sk.slice(0, 32));
    expect(skScka).toEqual(sk.slice(32, 64));
  });

  it('rejects non-64-byte input', () => {
    expect(() => splitTripleRatchetSecret(new Uint8Array(32))).toThrow(CryptoError);
    expect(() => splitTripleRatchetSecret(new Uint8Array(128))).toThrow(CryptoError);
  });
});
