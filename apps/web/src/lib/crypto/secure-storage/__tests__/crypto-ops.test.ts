/**
 * Tests for secure-storage/crypto-ops.ts
 *
 * Low-level crypto: randomBytes, PBKDF2 key derivation,
 * AES-256-GCM encrypt/decrypt.
 * Uses real Web Crypto API (no mocks).
 *
 * NOTE: initDB and getDeviceSalt require IndexedDB which isn't
 * available in jsdom, so we test the crypto functions only.
 */
import { describe, it, expect } from 'vitest';
import { randomBytes, deriveKey, encryptData, decryptData } from '../crypto-ops';

describe('randomBytes', () => {
  it('returns Uint8Array of requested length', () => {
    const bytes = randomBytes(32);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.byteLength).toBe(32);
  });

  it('returns different values each call', () => {
    const a = randomBytes(16);
    const b = randomBytes(16);
    expect(Array.from(a)).not.toEqual(Array.from(b));
  });

  it('handles zero length', () => {
    const bytes = randomBytes(0);
    expect(bytes.byteLength).toBe(0);
  });

  it('handles large length', () => {
    const bytes = randomBytes(1024);
    expect(bytes.byteLength).toBe(1024);
  });
});

describe('deriveKey', () => {
  it('derives a non-extractable AES-GCM key', async () => {
    const salt = randomBytes(32);
    const key = await deriveKey('password123', salt);

    expect(key).toBeDefined();
    expect(key.type).toBe('secret');
    expect(key.algorithm).toMatchObject({ name: 'AES-GCM', length: 256 });
    expect(key.extractable).toBe(false);
    expect(key.usages).toEqual(expect.arrayContaining(['encrypt', 'decrypt']));
  });

  it('produces same key for same password + salt', async () => {
    const salt = randomBytes(32);
    const key1 = await deriveKey('same-pass', salt);
    const key2 = await deriveKey('same-pass', salt);

    // We can't compare CryptoKeys directly, but we can verify
    // they encrypt the same way by decrypting with the other
    const { ciphertext, iv } = await encryptData('test', key1);
    const decrypted = await decryptData(ciphertext, iv, key2);
    expect(decrypted).toBe('test');
  });

  it('produces different key for different passwords', async () => {
    const salt = randomBytes(32);
    const key1 = await deriveKey('pass-A', salt);
    const key2 = await deriveKey('pass-B', salt);

    const { ciphertext, iv } = await encryptData('test', key1);
    await expect(decryptData(ciphertext, iv, key2)).rejects.toThrow();
  });

  it('produces different key for different salts', async () => {
    const key1 = await deriveKey('same-pass', randomBytes(32));
    const key2 = await deriveKey('same-pass', randomBytes(32));

    const { ciphertext, iv } = await encryptData('test', key1);
    await expect(decryptData(ciphertext, iv, key2)).rejects.toThrow();
  });
});

describe('encryptData + decryptData', () => {
  let key: CryptoKey;

  beforeAll(async () => {
    key = await deriveKey('test-pw', randomBytes(32));
  });

  it('roundtrips plaintext', async () => {
    const { ciphertext, iv } = await encryptData('hello world', key);
    const decrypted = await decryptData(ciphertext, iv, key);
    expect(decrypted).toBe('hello world');
  });

  it('produces different ciphertext each time (unique IV)', async () => {
    const e1 = await encryptData('same', key);
    const e2 = await encryptData('same', key);

    const c1 = new Uint8Array(e1.ciphertext);
    const c2 = new Uint8Array(e2.ciphertext);
    expect(Array.from(c1)).not.toEqual(Array.from(c2));
  });

  it('IV is 12 bytes (96-bit)', async () => {
    const { iv } = await encryptData('test', key);
    expect(new Uint8Array(iv).byteLength).toBe(12);
  });

  it('handles empty string', async () => {
    const { ciphertext, iv } = await encryptData('', key);
    const decrypted = await decryptData(ciphertext, iv, key);
    expect(decrypted).toBe('');
  });

  it('handles unicode', async () => {
    const text = '日本語テスト 🔐🔑';
    const { ciphertext, iv } = await encryptData(text, key);
    const decrypted = await decryptData(ciphertext, iv, key);
    expect(decrypted).toBe(text);
  });

  it('fails with wrong key', async () => {
    const wrongKey = await deriveKey('wrong', randomBytes(32));
    const { ciphertext, iv } = await encryptData('secret', key);
    await expect(decryptData(ciphertext, iv, wrongKey)).rejects.toThrow();
  });

  it('fails with tampered ciphertext', async () => {
    const { ciphertext, iv } = await encryptData('secret', key);
    const tampered = new Uint8Array(ciphertext);
    tampered[0]! ^= 0xff;
    await expect(decryptData(tampered.buffer as ArrayBuffer, iv, key)).rejects.toThrow();
  });
});
