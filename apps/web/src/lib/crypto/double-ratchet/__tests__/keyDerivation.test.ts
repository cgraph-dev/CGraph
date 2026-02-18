/**
 * Tests for double-ratchet/keyDerivation.ts
 *
 * ECDH key generation, HKDF derivation, KDF chain ratchets,
 * AES-256-GCM encrypt/decrypt, HMAC-SHA256 MAC.
 *
 * Uses real Web Crypto API (available in Node 20+ / Vitest).
 */
import { describe, it, expect } from 'vitest';
import {
  toArrayBuffer,
  generateDHKeyPair,
  importDHPublicKey,
  performDH,
  hkdfDerive,
  kdfRK,
  kdfCK,
  encrypt,
  decrypt,
  computeMAC,
} from '../keyDerivation';

// ---------------------------------------------------------------------------
// toArrayBuffer
// ---------------------------------------------------------------------------
describe('toArrayBuffer', () => {
  it('returns a proper ArrayBuffer copy', () => {
    const input = new Uint8Array([1, 2, 3, 4]);
    const buf = toArrayBuffer(input);
    expect(buf).toBeInstanceOf(ArrayBuffer);
    expect(buf.byteLength).toBe(4);
    expect(new Uint8Array(buf)).toEqual(input);
  });

  it('creates a copy (not a view of the same buffer)', () => {
    const input = new Uint8Array([10, 20]);
    const buf = toArrayBuffer(input);
    input[0] = 99;
    expect(new Uint8Array(buf)[0]).toBe(10); // unchanged
  });
});

// ---------------------------------------------------------------------------
// ECDH Operations
// ---------------------------------------------------------------------------
describe('ECDH operations', () => {
  it('generateDHKeyPair produces valid key pair', async () => {
    const kp = await generateDHKeyPair();
    expect(kp.publicKey).toBeDefined();
    expect(kp.privateKey).toBeDefined();
    expect(kp.rawPublicKey).toBeInstanceOf(Uint8Array);
    // P-256 uncompressed public key = 65 bytes (0x04 prefix + 32 + 32)
    expect(kp.rawPublicKey.byteLength).toBe(65);
  });

  it('generates unique key pairs', async () => {
    const kp1 = await generateDHKeyPair();
    const kp2 = await generateDHKeyPair();
    expect(kp1.rawPublicKey).not.toEqual(kp2.rawPublicKey);
  });

  it('importDHPublicKey round-trips a raw public key', async () => {
    const kp = await generateDHKeyPair();
    const imported = await importDHPublicKey(kp.rawPublicKey);
    expect(imported).toBeDefined();
    expect(imported.type).toBe('public');
  });

  it('performDH produces a 32-byte shared secret', async () => {
    const alice = await generateDHKeyPair();
    const bob = await generateDHKeyPair();

    const bobPub = await importDHPublicKey(bob.rawPublicKey);
    const shared = await performDH(alice.privateKey, bobPub);
    expect(shared).toBeInstanceOf(Uint8Array);
    expect(shared.byteLength).toBe(32);
  });

  it('ECDH produces the same shared secret on both sides', async () => {
    const alice = await generateDHKeyPair();
    const bob = await generateDHKeyPair();

    const bobPub = await importDHPublicKey(bob.rawPublicKey);
    const alicePub = await importDHPublicKey(alice.rawPublicKey);

    const sharedA = await performDH(alice.privateKey, bobPub);
    const sharedB = await performDH(bob.privateKey, alicePub);
    expect(sharedA).toEqual(sharedB);
  });
});

// ---------------------------------------------------------------------------
// HKDF
// ---------------------------------------------------------------------------
describe('hkdfDerive', () => {
  it('produces output of requested length', async () => {
    const input = new Uint8Array(32).fill(0xab);
    const salt = new Uint8Array(32).fill(0x01);
    const info = new TextEncoder().encode('test-info');

    const derived = await hkdfDerive(input, salt, info, 48);
    expect(derived.byteLength).toBe(48);
  });

  it('same inputs produce same output (deterministic)', async () => {
    const input = new Uint8Array(32).fill(0xcc);
    const salt = new Uint8Array(32).fill(0x02);
    const info = new TextEncoder().encode('deterministic');

    const d1 = await hkdfDerive(input, salt, info, 32);
    const d2 = await hkdfDerive(input, salt, info, 32);
    expect(d1).toEqual(d2);
  });

  it('different info produces different output', async () => {
    const input = new Uint8Array(32).fill(0xdd);
    const salt = new Uint8Array(32).fill(0x03);

    const d1 = await hkdfDerive(input, salt, new TextEncoder().encode('info-a'), 32);
    const d2 = await hkdfDerive(input, salt, new TextEncoder().encode('info-b'), 32);
    expect(d1).not.toEqual(d2);
  });
});

// ---------------------------------------------------------------------------
// KDF chains
// ---------------------------------------------------------------------------
describe('kdfRK (root key ratchet)', () => {
  it('returns two 32-byte keys (new root key, chain key)', async () => {
    const rk = new Uint8Array(32).fill(0x10);
    const dhOut = new Uint8Array(32).fill(0x20);

    const [newRK, ck] = await kdfRK(rk, dhOut);
    expect(newRK.byteLength).toBe(32);
    expect(ck.byteLength).toBe(32);
  });

  it('output differs from input', async () => {
    const rk = new Uint8Array(32).fill(0x30);
    const dhOut = new Uint8Array(32).fill(0x40);
    const [newRK, ck] = await kdfRK(rk, dhOut);
    expect(newRK).not.toEqual(rk);
    expect(ck).not.toEqual(rk);
  });
});

describe('kdfCK (chain key ratchet)', () => {
  it('returns two 32-byte keys (new chain key, message key)', async () => {
    const ck = new Uint8Array(32).fill(0x50);
    const [newCK, mk] = await kdfCK(ck);
    expect(newCK.byteLength).toBe(32);
    expect(mk.byteLength).toBe(32);
  });

  it('chain key and message key are different', async () => {
    const ck = new Uint8Array(32).fill(0x60);
    const [newCK, mk] = await kdfCK(ck);
    expect(newCK).not.toEqual(mk);
  });

  it('is deterministic', async () => {
    const ck = new Uint8Array(32).fill(0x70);
    const [ck1, mk1] = await kdfCK(ck);
    const [ck2, mk2] = await kdfCK(ck);
    expect(ck1).toEqual(ck2);
    expect(mk1).toEqual(mk2);
  });
});

// ---------------------------------------------------------------------------
// AES-256-GCM encrypt/decrypt
// ---------------------------------------------------------------------------
describe('AES-256-GCM encrypt/decrypt', () => {
  const key = new Uint8Array(32).fill(0xaa);
  const ad = new TextEncoder().encode('associated-data');

  it('encrypt returns ciphertext and 12-byte nonce', async () => {
    const plaintext = new TextEncoder().encode('hello world');
    const { ciphertext, nonce } = await encrypt(plaintext, key, ad);
    expect(nonce.byteLength).toBe(12);
    expect(ciphertext.byteLength).toBeGreaterThan(0);
    // Ciphertext should be different from plaintext
    expect(ciphertext).not.toEqual(plaintext);
  });

  it('decrypt recovers original plaintext', async () => {
    const original = new TextEncoder().encode('secret message 🔐');
    const { ciphertext, nonce } = await encrypt(original, key, ad);
    const decrypted = await decrypt(ciphertext, key, nonce, ad);
    // Compare via Array to avoid Uint8Array buffer-backing differences
    expect(Array.from(decrypted)).toEqual(Array.from(original));
  });

  it('decrypt fails with wrong key', async () => {
    const original = new TextEncoder().encode('test');
    const { ciphertext, nonce } = await encrypt(original, key, ad);

    const wrongKey = new Uint8Array(32).fill(0xbb);
    await expect(decrypt(ciphertext, wrongKey, nonce, ad)).rejects.toThrow();
  });

  it('decrypt fails with wrong associated data', async () => {
    const original = new TextEncoder().encode('test');
    const { ciphertext, nonce } = await encrypt(original, key, ad);

    const wrongAd = new TextEncoder().encode('wrong-ad');
    await expect(decrypt(ciphertext, key, nonce, wrongAd)).rejects.toThrow();
  });

  it('decrypt fails with tampered ciphertext', async () => {
    const original = new TextEncoder().encode('important data');
    const { ciphertext, nonce } = await encrypt(original, key, ad);

    ciphertext[0]! ^= 0xff; // flip bits
    await expect(decrypt(ciphertext, key, nonce, ad)).rejects.toThrow();
  });

  it('each encryption produces a different nonce', async () => {
    const plaintext = new TextEncoder().encode('same input');
    const { nonce: n1 } = await encrypt(plaintext, key, ad);
    const { nonce: n2 } = await encrypt(plaintext, key, ad);
    expect(n1).not.toEqual(n2);
  });
});

// ---------------------------------------------------------------------------
// HMAC
// ---------------------------------------------------------------------------
describe('computeMAC', () => {
  it('produces a 32-byte HMAC-SHA256', async () => {
    const data = new TextEncoder().encode('message');
    const key = new Uint8Array(32).fill(0x11);
    const mac = await computeMAC(data, key);
    expect(mac.byteLength).toBe(32);
  });

  it('is deterministic for same inputs', async () => {
    const data = new TextEncoder().encode('hello');
    const key = new Uint8Array(32).fill(0x22);
    const m1 = await computeMAC(data, key);
    const m2 = await computeMAC(data, key);
    expect(m1).toEqual(m2);
  });

  it('produces different MACs for different data', async () => {
    const key = new Uint8Array(32).fill(0x33);
    const m1 = await computeMAC(new TextEncoder().encode('msg1'), key);
    const m2 = await computeMAC(new TextEncoder().encode('msg2'), key);
    expect(m1).not.toEqual(m2);
  });

  it('produces different MACs for different keys', async () => {
    const data = new TextEncoder().encode('same data');
    const m1 = await computeMAC(data, new Uint8Array(32).fill(0x44));
    const m2 = await computeMAC(data, new Uint8Array(32).fill(0x55));
    expect(m1).not.toEqual(m2);
  });
});
