/**
 * Tests for X3DH — Extended Triple Diffie-Hellman Key Agreement
 */
import { describe, it, expect } from 'vitest';
import {
  generateECKeyPair,
  generateSigningKeyPair,
  sign,
  x3dhInitiate,
  x3dhRespond,
  type ECKeyPair,
  type X3DHPreKeyBundle,
} from '../x3dh';

// =============================================================================
// HELPERS
// =============================================================================

async function makeIdentityBundle() {
  const identityKP = await generateECKeyPair();
  const signingKP = await generateSigningKeyPair();
  const signedPreKP = await generateECKeyPair();
  const spkSig = await sign(signingKP.privateKey, signedPreKP.rawPublicKey);
  return { identityKP, signingKP, signedPreKP, spkSig };
}

async function makeBobBundle(
  bob: Awaited<ReturnType<typeof makeIdentityBundle>>,
  oneTimePreKP?: ECKeyPair
): Promise<{
  bundle: X3DHPreKeyBundle;
  signedPreKP: ECKeyPair;
  oneTimePreKP?: ECKeyPair;
}> {
  const bundle: X3DHPreKeyBundle = {
    identityKey: bob.identityKP.rawPublicKey,
    signingKey: bob.signingKP.rawPublicKey,
    signedPreKey: bob.signedPreKP.rawPublicKey,
    signedPreKeySignature: bob.spkSig,
    signedPreKeyId: 'spk-1',
  };

  if (oneTimePreKP) {
    bundle.oneTimePreKey = oneTimePreKP.rawPublicKey;
    bundle.oneTimePreKeyId = 'opk-1';
  }

  return { bundle, signedPreKP: bob.signedPreKP, oneTimePreKP };
}

// =============================================================================
// TESTS
// =============================================================================

describe('EC key generation', () => {
  it('generates ECDH key pair', async () => {
    const kp = await generateECKeyPair();
    expect(kp.publicKey).toBeTruthy();
    expect(kp.privateKey).toBeTruthy();
    expect(kp.rawPublicKey).toBeInstanceOf(Uint8Array);
    // P-256 uncompressed point: 1 byte prefix + 32 bytes x + 32 bytes y = 65 bytes
    expect(kp.rawPublicKey.length).toBe(65);
  });

  it('generates unique key pairs', async () => {
    const kp1 = await generateECKeyPair();
    const kp2 = await generateECKeyPair();
    expect(kp1.rawPublicKey).not.toEqual(kp2.rawPublicKey);
  });

  it('generates ECDSA signing key pair', async () => {
    const kp = await generateSigningKeyPair();
    expect(kp.publicKey).toBeTruthy();
    expect(kp.privateKey).toBeTruthy();
    expect(kp.rawPublicKey.length).toBe(65);
  });
});

describe('ECDSA signing', () => {
  it('produces valid signature', async () => {
    const kp = await generateSigningKeyPair();
    const data = new TextEncoder().encode('Hello, World!');
    const sig = await sign(kp.privateKey, data);
    expect(sig).toBeInstanceOf(Uint8Array);
    expect(sig.length).toBeGreaterThan(0);
  });

  it('different data produces different signatures', async () => {
    const kp = await generateSigningKeyPair();
    const sig1 = await sign(kp.privateKey, new TextEncoder().encode('aaa'));
    const sig2 = await sign(kp.privateKey, new TextEncoder().encode('bbb'));
    expect(sig1).not.toEqual(sig2);
  });
});

describe('X3DH key agreement', () => {
  it('Alice and Bob derive same shared secret (without OPK)', async () => {
    const alice = await makeIdentityBundle();
    const bob = await makeIdentityBundle();
    const { bundle } = await makeBobBundle(bob);

    const aliceResult = await x3dhInitiate(alice.identityKP, bundle);
    expect(aliceResult.sharedSecret.length).toBe(32);
    expect(aliceResult.usedOneTimePreKey).toBe(false);
    expect(aliceResult.ephemeralPublicKey.length).toBe(65);

    const bobResult = await x3dhRespond(
      bob.identityKP,
      bob.signedPreKP,
      alice.identityKP.rawPublicKey,
      aliceResult.ephemeralPublicKey,
      undefined // no OPK
    );

    expect(bobResult.sharedSecret).toEqual(aliceResult.sharedSecret);
  });

  it('Alice and Bob derive same shared secret (with OPK)', async () => {
    const alice = await makeIdentityBundle();
    const bob = await makeIdentityBundle();
    const oneTimePreKP = await generateECKeyPair();
    const { bundle } = await makeBobBundle(bob, oneTimePreKP);

    const aliceResult = await x3dhInitiate(alice.identityKP, bundle);
    expect(aliceResult.usedOneTimePreKey).toBe(true);

    const bobResult = await x3dhRespond(
      bob.identityKP,
      bob.signedPreKP,
      alice.identityKP.rawPublicKey,
      aliceResult.ephemeralPublicKey,
      oneTimePreKP
    );

    expect(bobResult.sharedSecret).toEqual(aliceResult.sharedSecret);
  });

  it('different sessions produce different shared secrets', async () => {
    const alice = await makeIdentityBundle();
    const bob = await makeIdentityBundle();
    const { bundle } = await makeBobBundle(bob);

    const r1 = await x3dhInitiate(alice.identityKP, bundle);
    const r2 = await x3dhInitiate(alice.identityKP, bundle);

    // Different ephemeral keys => different secrets
    expect(r1.sharedSecret).not.toEqual(r2.sharedSecret);
  });

  it('rejects invalid signed pre-key signature', async () => {
    const alice = await makeIdentityBundle();
    const bob = await makeIdentityBundle();
    const { bundle } = await makeBobBundle(bob);

    // Corrupt signature
    bundle.signedPreKeySignature = new Uint8Array(bundle.signedPreKeySignature.length);

    await expect(x3dhInitiate(alice.identityKP, bundle)).rejects.toThrow(
      'signature verification failed'
    );
  });

  it('associated data contains IK_A || IK_B', async () => {
    const alice = await makeIdentityBundle();
    const bob = await makeIdentityBundle();
    const { bundle } = await makeBobBundle(bob);

    const result = await x3dhInitiate(alice.identityKP, bundle);

    expect(result.associatedData.length).toBe(65 + 65); // Two P-256 public keys
    expect(result.associatedData.slice(0, 65)).toEqual(alice.identityKP.rawPublicKey);
    expect(result.associatedData.slice(65)).toEqual(bob.identityKP.rawPublicKey);
  });
});
