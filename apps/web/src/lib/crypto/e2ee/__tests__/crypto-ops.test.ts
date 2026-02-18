/**
 * Tests for e2ee/crypto-ops.ts
 *
 * ECDH key agreement, HKDF derivation, SHA-256 hashing,
 * AES-256-GCM encrypt/decrypt — using real Web Crypto API.
 */
import { describe, it, expect } from 'vitest';
import { deriveSharedSecret, hkdf, sha256, encryptAES, decryptAES } from '../crypto-ops';

// ---------------------------------------------------------------------------
// Helpers — generate ECDH key pairs with Web Crypto
// ---------------------------------------------------------------------------
async function generateECDHPair() {
  return crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
}

// ---------------------------------------------------------------------------
// deriveSharedSecret
// ---------------------------------------------------------------------------
describe('deriveSharedSecret', () => {
  it('produces a 32-byte ArrayBuffer', async () => {
    const alice = await generateECDHPair();
    const bob = await generateECDHPair();
    const shared = await deriveSharedSecret(alice.privateKey, bob.publicKey);
    expect(shared.byteLength).toBe(32);
  });

  it('both sides compute the same secret', async () => {
    const alice = await generateECDHPair();
    const bob = await generateECDHPair();
    const sharedAB = await deriveSharedSecret(alice.privateKey, bob.publicKey);
    const sharedBA = await deriveSharedSecret(bob.privateKey, alice.publicKey);
    expect(new Uint8Array(sharedAB)).toEqual(new Uint8Array(sharedBA));
  });

  it('different key pairs produce different secrets', async () => {
    const alice = await generateECDHPair();
    const bob = await generateECDHPair();
    const carol = await generateECDHPair();
    const sharedAB = await deriveSharedSecret(alice.privateKey, bob.publicKey);
    const sharedAC = await deriveSharedSecret(alice.privateKey, carol.publicKey);
    expect(new Uint8Array(sharedAB)).not.toEqual(new Uint8Array(sharedAC));
  });
});

// ---------------------------------------------------------------------------
// hkdf
// ---------------------------------------------------------------------------
describe('hkdf', () => {
  it('produces output of requested length', async () => {
    const input = new Uint8Array(32).fill(0x11).buffer as ArrayBuffer;
    const salt = new Uint8Array(32).buffer as ArrayBuffer;
    const info = new TextEncoder().encode('test').buffer as ArrayBuffer;
    const derived = await hkdf(input, salt, info, 48);
    expect(derived.byteLength).toBe(48);
  });

  it('is deterministic', async () => {
    const input = new Uint8Array(32).fill(0x22).buffer as ArrayBuffer;
    const salt = new Uint8Array(32).fill(0x01).buffer as ArrayBuffer;
    const info = new TextEncoder().encode('det').buffer as ArrayBuffer;
    const d1 = await hkdf(input, salt, info, 32);
    const d2 = await hkdf(input, salt, info, 32);
    expect(new Uint8Array(d1)).toEqual(new Uint8Array(d2));
  });

  it('different info yields different output', async () => {
    const input = new Uint8Array(32).fill(0x33).buffer as ArrayBuffer;
    const salt = new Uint8Array(32).buffer as ArrayBuffer;
    const d1 = await hkdf(input, salt, new TextEncoder().encode('a').buffer as ArrayBuffer, 32);
    const d2 = await hkdf(input, salt, new TextEncoder().encode('b').buffer as ArrayBuffer, 32);
    expect(new Uint8Array(d1)).not.toEqual(new Uint8Array(d2));
  });
});

// ---------------------------------------------------------------------------
// sha256
// ---------------------------------------------------------------------------
describe('sha256', () => {
  it('produces a 32-byte digest', async () => {
    const data = new TextEncoder().encode('hello').buffer as ArrayBuffer;
    const hash = await sha256(data);
    expect(hash.byteLength).toBe(32);
  });

  it('is deterministic', async () => {
    const data = new TextEncoder().encode('test').buffer as ArrayBuffer;
    const h1 = await sha256(data);
    const h2 = await sha256(data);
    expect(new Uint8Array(h1)).toEqual(new Uint8Array(h2));
  });

  it('different inputs produce different hashes', async () => {
    const h1 = await sha256(new TextEncoder().encode('a').buffer as ArrayBuffer);
    const h2 = await sha256(new TextEncoder().encode('b').buffer as ArrayBuffer);
    expect(new Uint8Array(h1)).not.toEqual(new Uint8Array(h2));
  });
});

// ---------------------------------------------------------------------------
// AES-256-GCM encrypt/decrypt
// ---------------------------------------------------------------------------
describe('AES-256-GCM (encryptAES / decryptAES)', () => {
  // Generate a proper AES-256 key (32 bytes)
  async function makeKey(): Promise<ArrayBuffer> {
    const raw = new Uint8Array(32);
    crypto.getRandomValues(raw);
    return raw.buffer as ArrayBuffer;
  }

  it('encrypt returns ciphertext and 12-byte nonce', async () => {
    const key = await makeKey();
    const { ciphertext, nonce } = await encryptAES('hello world', key);
    expect(ciphertext.byteLength).toBeGreaterThan(0);
    expect(nonce.byteLength).toBe(12);
  });

  it('decrypt recovers original plaintext', async () => {
    const key = await makeKey();
    const original = 'secret message 🔐';
    const { ciphertext, nonce } = await encryptAES(original, key);
    const decrypted = await decryptAES(ciphertext, nonce, key);
    expect(decrypted).toBe(original);
  });

  it('decrypt fails with wrong key', async () => {
    const key1 = await makeKey();
    const key2 = await makeKey();
    const { ciphertext, nonce } = await encryptAES('test', key1);
    await expect(decryptAES(ciphertext, nonce, key2)).rejects.toThrow();
  });

  it('each encryption produces a unique nonce', async () => {
    const key = await makeKey();
    const { nonce: n1 } = await encryptAES('same', key);
    const { nonce: n2 } = await encryptAES('same', key);
    expect(new Uint8Array(n1)).not.toEqual(new Uint8Array(n2));
  });

  it('handles empty string plaintext', async () => {
    const key = await makeKey();
    const { ciphertext, nonce } = await encryptAES('', key);
    const decrypted = await decryptAES(ciphertext, nonce, key);
    expect(decrypted).toBe('');
  });

  it('handles unicode plaintext', async () => {
    const key = await makeKey();
    const original = '日本語テスト 🎉🚀';
    const { ciphertext, nonce } = await encryptAES(original, key);
    const decrypted = await decryptAES(ciphertext, nonce, key);
    expect(decrypted).toBe(original);
  });
});
