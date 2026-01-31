/**
 * E2EE (End-to-End Encryption) Test Suite
 *
 * Tests the cryptographic primitives and key management functions
 * for the E2EE implementation.
 *
 * @module lib/crypto/__tests__/e2ee.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  generateECDHKeyPair,
  generateECDSAKeyPair,
  exportPublicKey,
  exportPrivateKey,
  importPublicKey,
  importPrivateKey,
  importSigningPublicKey,
  importSigningPrivateKey,
  sign,
  verify,
  deriveSharedSecret,
  hkdf,
  sha256,
  encryptAES,
  decryptAES,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  generateKeyBundle,
} from '../e2ee';

// Mock localStorage for testing
const mockStorage: Record<string, string> = {};
beforeEach(() => {
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => mockStorage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key];
    }),
    clear: vi.fn(() => {
      Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    }),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
});

describe('E2EE Utility Functions', () => {
  describe('arrayBufferToBase64 / base64ToArrayBuffer', () => {
    it('should round-trip encode/decode correctly', () => {
      const original = new Uint8Array([1, 2, 3, 4, 5, 255, 0, 128]);
      const base64 = arrayBufferToBase64(original.buffer);
      const decoded = base64ToArrayBuffer(base64);

      expect(new Uint8Array(decoded)).toEqual(original);
    });

    it('should handle empty buffer', () => {
      const empty = new ArrayBuffer(0);
      const base64 = arrayBufferToBase64(empty);
      const decoded = base64ToArrayBuffer(base64);

      expect(decoded.byteLength).toBe(0);
    });

    it('should produce valid base64 strings', () => {
      const data = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const base64 = arrayBufferToBase64(data.buffer);

      expect(base64).toBe('SGVsbG8=');
    });
  });
});

describe('E2EE Key Generation', () => {
  describe('generateECDHKeyPair', () => {
    it('should generate a valid ECDH key pair', async () => {
      const keyPair = await generateECDHKeyPair();

      expect(keyPair).toBeDefined();
      expect(keyPair.publicKey).toBeDefined();
      expect(keyPair.privateKey).toBeDefined();
      expect(keyPair.publicKey.type).toBe('public');
      expect(keyPair.privateKey.type).toBe('private');
    });

    it('should generate unique key pairs', async () => {
      const keyPair1 = await generateECDHKeyPair();
      const keyPair2 = await generateECDHKeyPair();

      const pub1 = await exportPublicKey(keyPair1.publicKey);
      const pub2 = await exportPublicKey(keyPair2.publicKey);

      expect(arrayBufferToBase64(pub1)).not.toBe(arrayBufferToBase64(pub2));
    });
  });

  describe('generateECDSAKeyPair', () => {
    it('should generate a valid ECDSA key pair for signing', async () => {
      const keyPair = await generateECDSAKeyPair();

      expect(keyPair).toBeDefined();
      expect(keyPair.publicKey).toBeDefined();
      expect(keyPair.privateKey).toBeDefined();
      expect(keyPair.publicKey.type).toBe('public');
      expect(keyPair.privateKey.type).toBe('private');
    });
  });
});

describe('E2EE Key Import/Export', () => {
  describe('ECDH keys', () => {
    it('should export and import public key correctly', async () => {
      const keyPair = await generateECDHKeyPair();
      const exported = await exportPublicKey(keyPair.publicKey);
      const imported = await importPublicKey(exported);

      expect(imported.type).toBe('public');

      // Verify by re-exporting
      const reExported = await exportPublicKey(imported);
      expect(arrayBufferToBase64(reExported)).toBe(arrayBufferToBase64(exported));
    });

    it('should export and import private key correctly', async () => {
      const keyPair = await generateECDHKeyPair();
      const exported = await exportPrivateKey(keyPair.privateKey);
      const imported = await importPrivateKey(exported);

      expect(imported.type).toBe('private');
    });
  });

  describe('ECDSA signing keys', () => {
    it('should export and import signing public key correctly', async () => {
      const keyPair = await generateECDSAKeyPair();
      const exported = await exportPublicKey(keyPair.publicKey);
      const imported = await importSigningPublicKey(exported);

      expect(imported.type).toBe('public');
    });

    it('should export and import signing private key correctly', async () => {
      const keyPair = await generateECDSAKeyPair();
      const exported = await exportPrivateKey(keyPair.privateKey);
      const imported = await importSigningPrivateKey(exported);

      expect(imported.type).toBe('private');
    });
  });
});

describe('E2EE Signing and Verification', () => {
  it('should sign and verify data correctly', async () => {
    const keyPair = await generateECDSAKeyPair();
    const data = new TextEncoder().encode('Hello, World!');

    const signature = await sign(keyPair.privateKey, data.buffer);
    const isValid = await verify(keyPair.publicKey, signature, data.buffer);

    expect(isValid).toBe(true);
  });

  it('should reject invalid signatures', async () => {
    const keyPair = await generateECDSAKeyPair();
    const data = new TextEncoder().encode('Hello, World!');
    const tamperedData = new TextEncoder().encode('Hello, World?');

    const signature = await sign(keyPair.privateKey, data.buffer);
    const isValid = await verify(keyPair.publicKey, signature, tamperedData.buffer);

    expect(isValid).toBe(false);
  });

  it('should reject signatures from different key', async () => {
    const keyPair1 = await generateECDSAKeyPair();
    const keyPair2 = await generateECDSAKeyPair();
    const data = new TextEncoder().encode('Hello, World!');

    const signature = await sign(keyPair1.privateKey, data.buffer);
    const isValid = await verify(keyPair2.publicKey, signature, data.buffer);

    expect(isValid).toBe(false);
  });
});

describe('E2EE Key Derivation', () => {
  describe('deriveSharedSecret', () => {
    it('should derive same shared secret for both parties', async () => {
      const aliceKeyPair = await generateECDHKeyPair();
      const bobKeyPair = await generateECDHKeyPair();

      const aliceShared = await deriveSharedSecret(aliceKeyPair.privateKey, bobKeyPair.publicKey);

      const bobShared = await deriveSharedSecret(bobKeyPair.privateKey, aliceKeyPair.publicKey);

      expect(arrayBufferToBase64(aliceShared)).toBe(arrayBufferToBase64(bobShared));
    });

    it('should produce different secrets with different keys', async () => {
      const aliceKeyPair = await generateECDHKeyPair();
      const bobKeyPair = await generateECDHKeyPair();
      const charlieKeyPair = await generateECDHKeyPair();

      const aliceBobShared = await deriveSharedSecret(
        aliceKeyPair.privateKey,
        bobKeyPair.publicKey
      );

      const aliceCharlieShared = await deriveSharedSecret(
        aliceKeyPair.privateKey,
        charlieKeyPair.publicKey
      );

      expect(arrayBufferToBase64(aliceBobShared)).not.toBe(arrayBufferToBase64(aliceCharlieShared));
    });
  });

  describe('hkdf', () => {
    it('should derive key material of requested length', async () => {
      const inputKey = new Uint8Array(32);
      crypto.getRandomValues(inputKey);
      const salt = new Uint8Array(32).buffer;
      const info = new TextEncoder().encode('test-info').buffer;

      const derived = await hkdf(inputKey.buffer, salt, info, 64);

      expect(derived.byteLength).toBe(64);
    });

    it('should produce consistent output for same input', async () => {
      const inputKey = new Uint8Array(32);
      crypto.getRandomValues(inputKey);
      const salt = new Uint8Array(32).buffer;
      const info = new TextEncoder().encode('test-info').buffer;

      const derived1 = await hkdf(inputKey.buffer, salt, info, 32);
      const derived2 = await hkdf(inputKey.buffer, salt, info, 32);

      expect(arrayBufferToBase64(derived1)).toBe(arrayBufferToBase64(derived2));
    });

    it('should produce different output for different info', async () => {
      const inputKey = new Uint8Array(32);
      crypto.getRandomValues(inputKey);
      const salt = new Uint8Array(32).buffer;

      const info1 = new TextEncoder().encode('info-1').buffer;
      const info2 = new TextEncoder().encode('info-2').buffer;

      const derived1 = await hkdf(inputKey.buffer, salt, info1, 32);
      const derived2 = await hkdf(inputKey.buffer, salt, info2, 32);

      expect(arrayBufferToBase64(derived1)).not.toBe(arrayBufferToBase64(derived2));
    });
  });

  describe('sha256', () => {
    it('should hash data correctly', async () => {
      const data = new TextEncoder().encode('Hello, World!');
      const hash = await sha256(data.buffer);

      expect(hash.byteLength).toBe(32); // SHA-256 produces 32 bytes
    });

    it('should produce same hash for same input', async () => {
      const data = new TextEncoder().encode('Hello, World!');

      const hash1 = await sha256(data.buffer);
      const hash2 = await sha256(data.buffer);

      expect(arrayBufferToBase64(hash1)).toBe(arrayBufferToBase64(hash2));
    });

    it('should produce different hash for different input', async () => {
      const data1 = new TextEncoder().encode('Hello, World!');
      const data2 = new TextEncoder().encode('Hello, World?');

      const hash1 = await sha256(data1.buffer);
      const hash2 = await sha256(data2.buffer);

      expect(arrayBufferToBase64(hash1)).not.toBe(arrayBufferToBase64(hash2));
    });
  });
});

describe('E2EE Encryption/Decryption', () => {
  describe('encryptAES / decryptAES', () => {
    it('should encrypt and decrypt message correctly', async () => {
      const key = new Uint8Array(32);
      crypto.getRandomValues(key);

      const plaintext = 'Hello, secure world!';

      const { ciphertext, nonce } = await encryptAES(plaintext, key.buffer);
      const decrypted = await decryptAES(ciphertext, nonce, key.buffer);

      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertext for same plaintext (due to random nonce)', async () => {
      const key = new Uint8Array(32);
      crypto.getRandomValues(key);

      const plaintext = 'Hello';

      const result1 = await encryptAES(plaintext, key.buffer);
      const result2 = await encryptAES(plaintext, key.buffer);

      expect(arrayBufferToBase64(result1.ciphertext)).not.toBe(
        arrayBufferToBase64(result2.ciphertext)
      );
    });

    it('should fail to decrypt with wrong key', async () => {
      const key1 = new Uint8Array(32);
      const key2 = new Uint8Array(32);
      crypto.getRandomValues(key1);
      crypto.getRandomValues(key2);

      const plaintext = 'Secret message';
      const { ciphertext, nonce } = await encryptAES(plaintext, key1.buffer);

      await expect(decryptAES(ciphertext, nonce, key2.buffer)).rejects.toThrow();
    });

    it('should fail to decrypt with tampered ciphertext', async () => {
      const key = new Uint8Array(32);
      crypto.getRandomValues(key);

      const plaintext = 'Secret message';
      const { ciphertext, nonce } = await encryptAES(plaintext, key.buffer);

      // Tamper with ciphertext
      const tamperedCiphertext = new Uint8Array(ciphertext);
      if (tamperedCiphertext.length > 0) {
        tamperedCiphertext[0] = tamperedCiphertext[0]! ^ 0xff;
      }

      await expect(decryptAES(tamperedCiphertext.buffer, nonce, key.buffer)).rejects.toThrow();
    });
  });
});

describe('E2EE Key Bundle Generation', () => {
  it('should generate a complete key bundle', async () => {
    const bundle = await generateKeyBundle('device-1', 5);

    expect(bundle).toBeDefined();
    expect(bundle.deviceId).toBe('device-1');
    expect(bundle.identityKey).toBeDefined();
    expect(bundle.identityKey.keyPair).toBeDefined();
    expect(bundle.identityKey.signingKeyPair).toBeDefined();
    expect(bundle.signedPreKey).toBeDefined();
    expect(bundle.signedPreKey.signature).toBeDefined();
    expect(bundle.oneTimePreKeys).toHaveLength(5);
  });

  it('should generate valid signed prekey signature', async () => {
    const bundle = await generateKeyBundle('device-2', 1);

    // Verify the signed prekey signature
    const preKeyPublic = await exportPublicKey(bundle.signedPreKey.keyPair.publicKey);
    const isValid = await verify(
      bundle.identityKey.signingKeyPair.publicKey,
      bundle.signedPreKey.signature,
      preKeyPublic
    );

    expect(isValid).toBe(true);
  });

  it('should generate unique bundles for different devices', async () => {
    const bundle1 = await generateKeyBundle('device-a', 1);
    const bundle2 = await generateKeyBundle('device-b', 1);

    expect(bundle1.deviceId).not.toBe(bundle2.deviceId);

    // Also verify the identity keys are different
    const idKey1 = await exportPublicKey(bundle1.identityKey.keyPair.publicKey);
    const idKey2 = await exportPublicKey(bundle2.identityKey.keyPair.publicKey);
    expect(arrayBufferToBase64(idKey1)).not.toBe(arrayBufferToBase64(idKey2));
  });
});
