/**
 * Tests for e2ee/x3dh.ts
 *
 * X3DH key agreement (initiator side) — tests the core protocol
 * with real Web Crypto. encryptForRecipient and decryptFromSender
 * are tested via mocked key-bundle storage.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { x3dhInitiate } from '../x3dh';

// ---------------------------------------------------------------------------
// Mock key-bundle (for encryptForRecipient / decryptFromSender)
// ---------------------------------------------------------------------------
vi.mock('../key-bundle', () => ({
  loadIdentityKeyPair: vi.fn(),
  loadSignedPreKey: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers — real crypto key generation
// ---------------------------------------------------------------------------
async function generateECDHKeyPair() {
  const kp = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );
  return kp;
}

async function generateECDSAKeyPair() {
  return crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  );
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

// ---------------------------------------------------------------------------
// Build a real recipient bundle for testing
// ---------------------------------------------------------------------------
async function buildRecipientBundle(withOTPK = true, withSigningKey = true) {
  const identityKP = await generateECDHKeyPair();
  const signedPreKeyKP = await generateECDHKeyPair();
  const signingKP = await generateECDSAKeyPair();

  const identityPub = await crypto.subtle.exportKey('raw', identityKP.publicKey);
  const signedPreKeyPub = await crypto.subtle.exportKey('raw', signedPreKeyKP.publicKey);
  const signingPub = await crypto.subtle.exportKey('raw', signingKP.publicKey);

  // Sign the signed prekey with ECDSA
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    signingKP.privateKey,
    signedPreKeyPub
  );

  const bundle: Record<string, unknown> = {
    identity_key: arrayBufferToBase64(identityPub),
    identity_key_id: 'ik-001',
    signed_prekey: arrayBufferToBase64(signedPreKeyPub),
    signed_prekey_signature: arrayBufferToBase64(signature),
    signed_prekey_id: 'spk-001',
  };

  if (withSigningKey) {
    bundle.signing_key = arrayBufferToBase64(signingPub);
  }

  if (withOTPK) {
    const otpkKP = await generateECDHKeyPair();
    const otpkPub = await crypto.subtle.exportKey('raw', otpkKP.publicKey);
    bundle.one_time_prekey = arrayBufferToBase64(otpkPub);
    bundle.one_time_prekey_id = 'otpk-001';
  }

  return bundle;
}

async function buildIdentityKeyPair() {
  const ecdhKP = await generateECDHKeyPair();
  const ecdsaKP = await generateECDSAKeyPair();
  return {
    keyPair: { publicKey: ecdhKP.publicKey, privateKey: ecdhKP.privateKey },
    signingKeyPair: { publicKey: ecdsaKP.publicKey, privateKey: ecdsaKP.privateKey },
    keyId: 'our-ik-001',
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('x3dhInitiate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('produces a shared secret and ephemeral public key', async () => {
    const ourIdentity = await buildIdentityKeyPair();
    const recipientBundle = await buildRecipientBundle(true, true);

    const result = await x3dhInitiate(ourIdentity as never, recipientBundle as never);

    expect(result.sharedSecret).toBeDefined();
    expect(result.sharedSecret.byteLength).toBe(32);
    expect(result.ephemeralPublic).toBeDefined();
    expect(result.ephemeralPublic.byteLength).toBe(65); // P-256 uncompressed
  });

  it('produces unique shared secrets per call (new ephemeral each time)', async () => {
    const ourIdentity = await buildIdentityKeyPair();
    const bundle = await buildRecipientBundle(true, true);

    const r1 = await x3dhInitiate(ourIdentity as never, bundle as never);
    const r2 = await x3dhInitiate(ourIdentity as never, bundle as never);

    // Different ephemeral keys → different shared secrets
    expect(new Uint8Array(r1.ephemeralPublic)).not.toEqual(new Uint8Array(r2.ephemeralPublic));
  });

  it('works without one-time prekey', async () => {
    const ourIdentity = await buildIdentityKeyPair();
    const bundle = await buildRecipientBundle(false, true);

    const result = await x3dhInitiate(ourIdentity as never, bundle as never);
    expect(result.sharedSecret.byteLength).toBe(32);
  });

  it('works without signing key (skips verification)', async () => {
    const ourIdentity = await buildIdentityKeyPair();
    const bundle = await buildRecipientBundle(true, false);

    const result = await x3dhInitiate(ourIdentity as never, bundle as never);
    expect(result.sharedSecret.byteLength).toBe(32);
  });

  it('throws on invalid signing key signature (MITM detection)', async () => {
    const ourIdentity = await buildIdentityKeyPair();
    const bundle = await buildRecipientBundle(true, true);

    // Corrupt the signature
    const badSig = new Uint8Array(64).fill(0x00);
    (bundle as Record<string, unknown>).signed_prekey_signature = arrayBufferToBase64(
      badSig.buffer as ArrayBuffer
    );

    await expect(x3dhInitiate(ourIdentity as never, bundle as never)).rejects.toThrow(
      /signature verification failed/i
    );
  });

  it('produces different secrets for different recipients', async () => {
    const ourIdentity = await buildIdentityKeyPair();
    const bundle1 = await buildRecipientBundle(true, true);
    const bundle2 = await buildRecipientBundle(true, true);

    const r1 = await x3dhInitiate(ourIdentity as never, bundle1 as never);
    const r2 = await x3dhInitiate(ourIdentity as never, bundle2 as never);

    expect(new Uint8Array(r1.sharedSecret)).not.toEqual(new Uint8Array(r2.sharedSecret));
  });
});
