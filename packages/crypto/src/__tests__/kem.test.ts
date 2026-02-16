/**
 * Tests for ML-KEM-768 Key Encapsulation Mechanism
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  kemKeygen,
  kemEncapsulate,
  kemDecapsulate,
  serializeKEMPublicKey,
  deserializeKEMPublicKey,
  serializeKEMCiphertext,
  deserializeKEMCiphertext,
  wipeKEMKeyPair,
  KEM_PUBLIC_KEY_LENGTH,
  KEM_SECRET_KEY_LENGTH,
  KEM_CIPHERTEXT_LENGTH,
  KEM_SHARED_SECRET_LENGTH,
} from '../kem';
import { CryptoError, CryptoErrorCode } from '../errors';

describe('KEM key generation', () => {
  it('generates valid key pair with correct sizes', () => {
    const kp = kemKeygen();
    expect(kp.publicKey).toBeInstanceOf(Uint8Array);
    expect(kp.secretKey).toBeInstanceOf(Uint8Array);
    expect(kp.publicKey.length).toBe(KEM_PUBLIC_KEY_LENGTH); // 1184
    expect(kp.secretKey.length).toBe(KEM_SECRET_KEY_LENGTH); // 2400
  });

  it('generates unique key pairs', () => {
    const kp1 = kemKeygen();
    const kp2 = kemKeygen();
    expect(kp1.publicKey).not.toEqual(kp2.publicKey);
    expect(kp1.secretKey).not.toEqual(kp2.secretKey);
  });
});

describe('KEM encapsulation / decapsulation', () => {
  it('produces matching shared secrets', () => {
    const kp = kemKeygen();
    const { cipherText, sharedSecret } = kemEncapsulate(kp.publicKey);

    expect(cipherText.length).toBe(KEM_CIPHERTEXT_LENGTH); // 1088
    expect(sharedSecret.length).toBe(KEM_SHARED_SECRET_LENGTH); // 32

    const decapsulated = kemDecapsulate(cipherText, kp.secretKey);
    expect(decapsulated).toEqual(sharedSecret);
  });

  it('produces different shared secrets for different key pairs', () => {
    const kp1 = kemKeygen();
    const kp2 = kemKeygen();
    const enc1 = kemEncapsulate(kp1.publicKey);
    const enc2 = kemEncapsulate(kp2.publicKey);
    expect(enc1.sharedSecret).not.toEqual(enc2.sharedSecret);
  });

  it('produces different ciphertexts for same public key (randomized)', () => {
    const kp = kemKeygen();
    const enc1 = kemEncapsulate(kp.publicKey);
    const enc2 = kemEncapsulate(kp.publicKey);
    expect(enc1.cipherText).not.toEqual(enc2.cipherText);
    // But both should decapsulate to different secrets (different randomness)
  });

  it('implicit rejection: wrong key produces wrong secret (no throw)', () => {
    const kp1 = kemKeygen();
    const kp2 = kemKeygen();
    const { cipherText, sharedSecret } = kemEncapsulate(kp1.publicKey);

    // Decapsulate with wrong secret key — should NOT throw (implicit rejection)
    const wrong = kemDecapsulate(cipherText, kp2.secretKey);
    expect(wrong.length).toBe(KEM_SHARED_SECRET_LENGTH);
    expect(wrong).not.toEqual(sharedSecret);
  });

  it('rejects invalid public key size', () => {
    expect(() => kemEncapsulate(new Uint8Array(100))).toThrow(CryptoError);
    try {
      kemEncapsulate(new Uint8Array(100));
    } catch (e) {
      expect((e as CryptoError).code).toBe(CryptoErrorCode.INVALID_KEM_KEY);
    }
  });

  it('rejects invalid ciphertext size', () => {
    const kp = kemKeygen();
    expect(() => kemDecapsulate(new Uint8Array(100), kp.secretKey)).toThrow(CryptoError);
  });

  it('rejects invalid secret key size', () => {
    const ct = new Uint8Array(KEM_CIPHERTEXT_LENGTH);
    expect(() => kemDecapsulate(ct, new Uint8Array(100))).toThrow(CryptoError);
  });
});

describe('KEM serialization', () => {
  it('round-trips public key with type byte', () => {
    const kp = kemKeygen();
    const serialized = serializeKEMPublicKey(kp.publicKey);
    expect(serialized.length).toBe(1 + KEM_PUBLIC_KEY_LENGTH);
    expect(serialized[0]).toBe(0x05); // KEM_TYPE_BYTE

    const deserialized = deserializeKEMPublicKey(serialized);
    expect(deserialized).toEqual(kp.publicKey);
  });

  it('round-trips ciphertext with type byte', () => {
    const kp = kemKeygen();
    const { cipherText } = kemEncapsulate(kp.publicKey);
    const serialized = serializeKEMCiphertext(cipherText);
    expect(serialized.length).toBe(1 + KEM_CIPHERTEXT_LENGTH);
    expect(serialized[0]).toBe(0x06); // KEM_CT_TYPE_BYTE

    const deserialized = deserializeKEMCiphertext(serialized);
    expect(deserialized).toEqual(cipherText);
  });

  it('rejects wrong type byte on public key', () => {
    const data = new Uint8Array(1 + KEM_PUBLIC_KEY_LENGTH);
    data[0] = 0x99; // Wrong type byte
    expect(() => deserializeKEMPublicKey(data)).toThrow(CryptoError);
  });

  it('rejects wrong type byte on ciphertext', () => {
    const data = new Uint8Array(1 + KEM_CIPHERTEXT_LENGTH);
    data[0] = 0x99;
    expect(() => deserializeKEMCiphertext(data)).toThrow(CryptoError);
  });

  it('rejects wrong length on deserialize', () => {
    expect(() => deserializeKEMPublicKey(new Uint8Array(10))).toThrow(CryptoError);
    expect(() => deserializeKEMCiphertext(new Uint8Array(10))).toThrow(CryptoError);
  });
});

describe('KEM secure wipe', () => {
  it('zeroes secret key', () => {
    const kp = kemKeygen();
    expect(kp.secretKey.some((b) => b !== 0)).toBe(true);
    wipeKEMKeyPair(kp);
    expect(kp.secretKey.every((b) => b === 0)).toBe(true);
  });
});

describe('KEM property-based tests', () => {
  it('encapsulate-decapsulate roundtrip always succeeds', () => {
    // Run 5 iterations (KEM is slow)
    fc.assert(
      fc.property(fc.constant(null), () => {
        const kp = kemKeygen();
        const { cipherText, sharedSecret } = kemEncapsulate(kp.publicKey);
        const decapped = kemDecapsulate(cipherText, kp.secretKey);
        expect(decapped).toEqual(sharedSecret);
      }),
      { numRuns: 5 }
    );
  });
});
