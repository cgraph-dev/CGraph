/**
 * ML-KEM-768 Key Encapsulation Mechanism
 *
 * Wraps @noble/post-quantum's ML-KEM-768 with:
 * - Type-byte prefixed serialization (Signal pattern)
 * - Typed errors (CryptoError)
 * - Secure key wiping
 * - Cross-platform compatibility (Web + React Native)
 *
 * ML-KEM-768 (formerly Kyber-768) provides IND-CCA2 security at
 * NIST Security Level 3. Standardized in FIPS 203.
 *
 * Key sizes:
 *   Public key:    1184 bytes
 *   Secret key:    2400 bytes
 *   Ciphertext:    1088 bytes
 *   Shared secret: 32 bytes
 *
 * @module @cgraph/crypto/kem
 * @see https://doi.org/10.6028/NIST.FIPS.203
 */

import { ml_kem768 } from '@noble/post-quantum/ml-kem';
import { CryptoError, CryptoErrorCode } from './errors';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Type byte prefixes for serialized keys (Signal pattern) */
export const KEM_TYPE_BYTE = 0x05; // ML-KEM-768 public key
export const KEM_CT_TYPE_BYTE = 0x06; // ML-KEM-768 ciphertext

/** Expected sizes */
export const KEM_PUBLIC_KEY_LENGTH = 1184;
export const KEM_SECRET_KEY_LENGTH = 2400;
export const KEM_CIPHERTEXT_LENGTH = 1088;
export const KEM_SHARED_SECRET_LENGTH = 32;

// =============================================================================
// TYPES
// =============================================================================

/** ML-KEM-768 key pair */
export interface KEMKeyPair {
  /** Public (encapsulation) key — 1184 bytes */
  readonly publicKey: Uint8Array;
  /** Secret (decapsulation) key — 2400 bytes */
  readonly secretKey: Uint8Array;
}

/** Result of KEM encapsulation */
export interface KEMEncapsulation {
  /** Ciphertext to send to peer — 1088 bytes */
  readonly cipherText: Uint8Array;
  /** Shared secret derived by encapsulator — 32 bytes */
  readonly sharedSecret: Uint8Array;
}

// =============================================================================
// KEY GENERATION
// =============================================================================

/**
 * Generate a fresh ML-KEM-768 key pair.
 *
 * @returns Key pair with 1184-byte public key and 2400-byte secret key
 * @throws CryptoError on generation failure
 */
export function kemKeygen(): KEMKeyPair {
  try {
    return ml_kem768.keygen();
  } catch (e) {
    throw new CryptoError(
      CryptoErrorCode.KEY_GENERATION_FAILED,
      'ML-KEM-768 key generation failed',
      e instanceof Error ? e : undefined
    );
  }
}

// =============================================================================
// ENCAPSULATION / DECAPSULATION
// =============================================================================

/**
 * Encapsulate: generate a shared secret and ciphertext for the given public key.
 *
 * @param publicKey - Recipient's ML-KEM-768 public key (1184 bytes)
 * @returns Ciphertext (1088 bytes) and shared secret (32 bytes)
 * @throws CryptoError on invalid key or encapsulation failure
 */
export function kemEncapsulate(publicKey: Uint8Array): KEMEncapsulation {
  if (publicKey.length !== KEM_PUBLIC_KEY_LENGTH) {
    throw new CryptoError(
      CryptoErrorCode.INVALID_KEM_KEY,
      `ML-KEM-768 public key must be ${KEM_PUBLIC_KEY_LENGTH} bytes, got ${publicKey.length}`
    );
  }

  try {
    return ml_kem768.encapsulate(publicKey);
  } catch (e) {
    throw new CryptoError(
      CryptoErrorCode.KEM_ENCAPSULATION_FAILED,
      'ML-KEM-768 encapsulation failed',
      e instanceof Error ? e : undefined
    );
  }
}

/**
 * Decapsulate: derive shared secret from ciphertext using our secret key.
 *
 * IMPORTANT: ML-KEM uses implicit rejection — if the ciphertext is invalid,
 * decapsulate returns a pseudorandom value instead of throwing. This is by
 * design (IND-CCA2 security). The caller MUST verify the shared secret
 * through MAC verification in the protocol layer.
 *
 * @param cipherText - KEM ciphertext (1088 bytes)
 * @param secretKey  - Our ML-KEM-768 secret key (2400 bytes)
 * @returns Shared secret (32 bytes) — may be pseudorandom if ciphertext invalid
 * @throws CryptoError on wrong key/ciphertext sizes
 */
export function kemDecapsulate(cipherText: Uint8Array, secretKey: Uint8Array): Uint8Array {
  if (cipherText.length !== KEM_CIPHERTEXT_LENGTH) {
    throw new CryptoError(
      CryptoErrorCode.INVALID_KEM_CIPHERTEXT,
      `ML-KEM-768 ciphertext must be ${KEM_CIPHERTEXT_LENGTH} bytes, got ${cipherText.length}`
    );
  }
  if (secretKey.length !== KEM_SECRET_KEY_LENGTH) {
    throw new CryptoError(
      CryptoErrorCode.INVALID_KEM_KEY,
      `ML-KEM-768 secret key must be ${KEM_SECRET_KEY_LENGTH} bytes, got ${secretKey.length}`
    );
  }

  try {
    return ml_kem768.decapsulate(cipherText, secretKey);
  } catch (e) {
    throw new CryptoError(
      CryptoErrorCode.KEM_DECAPSULATION_FAILED,
      'ML-KEM-768 decapsulation failed',
      e instanceof Error ? e : undefined
    );
  }
}

// =============================================================================
// SERIALIZATION — type-byte prefix (Signal pattern)
// =============================================================================

/**
 * Serialize a KEM public key with type-byte prefix.
 * Format: [0x05][1184 bytes public key]
 */
export function serializeKEMPublicKey(publicKey: Uint8Array): Uint8Array {
  if (publicKey.length !== KEM_PUBLIC_KEY_LENGTH) {
    throw new CryptoError(
      CryptoErrorCode.INVALID_KEM_KEY,
      `Expected ${KEM_PUBLIC_KEY_LENGTH}-byte public key`
    );
  }
  const out = new Uint8Array(1 + KEM_PUBLIC_KEY_LENGTH);
  out[0] = KEM_TYPE_BYTE;
  out.set(publicKey, 1);
  return out;
}

/**
 * Deserialize a type-byte-prefixed KEM public key.
 * @throws CryptoError if type byte or length is wrong
 */
export function deserializeKEMPublicKey(data: Uint8Array): Uint8Array {
  if (data.length !== 1 + KEM_PUBLIC_KEY_LENGTH) {
    throw new CryptoError(
      CryptoErrorCode.INVALID_KEM_KEY,
      `Expected ${1 + KEM_PUBLIC_KEY_LENGTH}-byte serialized KEM key, got ${data.length}`
    );
  }
  if (data[0] !== KEM_TYPE_BYTE) {
    throw new CryptoError(
      CryptoErrorCode.INVALID_KEY_TYPE,
      `Expected KEM type byte 0x${KEM_TYPE_BYTE.toString(16)}, got 0x${data[0]?.toString(16)}`
    );
  }
  return data.slice(1);
}

/**
 * Serialize a KEM ciphertext with type-byte prefix.
 * Format: [0x06][1088 bytes ciphertext]
 */
export function serializeKEMCiphertext(ct: Uint8Array): Uint8Array {
  if (ct.length !== KEM_CIPHERTEXT_LENGTH) {
    throw new CryptoError(
      CryptoErrorCode.INVALID_KEM_CIPHERTEXT,
      `Expected ${KEM_CIPHERTEXT_LENGTH}-byte ciphertext`
    );
  }
  const out = new Uint8Array(1 + KEM_CIPHERTEXT_LENGTH);
  out[0] = KEM_CT_TYPE_BYTE;
  out.set(ct, 1);
  return out;
}

/**
 * Deserialize a type-byte-prefixed KEM ciphertext.
 */
export function deserializeKEMCiphertext(data: Uint8Array): Uint8Array {
  if (data.length !== 1 + KEM_CIPHERTEXT_LENGTH) {
    throw new CryptoError(
      CryptoErrorCode.INVALID_KEM_CIPHERTEXT,
      `Expected ${1 + KEM_CIPHERTEXT_LENGTH}-byte serialized ciphertext, got ${data.length}`
    );
  }
  if (data[0] !== KEM_CT_TYPE_BYTE) {
    throw new CryptoError(
      CryptoErrorCode.INVALID_KEY_TYPE,
      `Expected ciphertext type byte 0x${KEM_CT_TYPE_BYTE.toString(16)}, got 0x${data[0]?.toString(16)}`
    );
  }
  return data.slice(1);
}

// =============================================================================
// SECURE WIPE
// =============================================================================

/**
 * Securely wipe a KEM key pair from memory.
 * Overwrites secret key bytes with zeros.
 */
export function wipeKEMKeyPair(kp: KEMKeyPair): void {
  kp.secretKey.fill(0);
}
