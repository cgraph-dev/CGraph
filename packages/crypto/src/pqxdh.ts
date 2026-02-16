/**
 * PQXDH — Post-Quantum Extended Diffie-Hellman Key Agreement
 *
 * Extends X3DH with ML-KEM-768 encapsulation for quantum resistance.
 * Follows Signal's PQXDH Revision 3 specification exactly.
 *
 * Protocol flow:
 *   DH1 = DH(IK_A, SPK_B)
 *   DH2 = DH(EK_A, IK_B)
 *   DH3 = DH(EK_A, SPK_B)
 *   DH4 = DH(EK_A, OPK_B)           — optional
 *   (ct, SS) = Encaps(PQPK_B)        — ML-KEM-768
 *   SK = KDF(F || DH1 || DH2 || DH3 [|| DH4] || SS)
 *
 * Where F = 0xFF repeated 32 times (discontinuity bytes).
 *
 * For Triple Ratchet initialization, SK is split:
 *   SKec   = SK[0..32]   — seeds the EC Double Ratchet
 *   SKscka = SK[32..64]  — seeds the SPQR (SCKA) ratchet
 *
 * @module @cgraph/crypto/pqxdh
 * @see https://signal.org/docs/specifications/pqxdh/
 */

import { CryptoError, CryptoErrorCode } from './errors';
import {
  kemEncapsulate,
  kemDecapsulate,
  KEM_PUBLIC_KEY_LENGTH,
  type KEMEncapsulation,
} from './kem';
import { generateECKeyPair, sign, type ECKeyPair } from './x3dh';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Discontinuity bytes — 0xFF × 32, prepended to KDF input per PQXDH spec */
const DISCONTINUITY_BYTES = new Uint8Array(32).fill(0xff);

/** HKDF info string */
const PQXDH_INFO = new TextEncoder().encode('CGraph_P256_SHA-256_ML-KEM-768');

/** Protocol version */
export const PQXDH_VERSION = 4;

// =============================================================================
// TYPES
// =============================================================================

/** Bob's pre-key bundle published to the server, now with KEM key */
export interface PQXDHPreKeyBundle {
  /** Bob's identity key (ECDH P-256, raw) */
  identityKey: Uint8Array;
  /** Bob's signing key (ECDSA P-256, raw) */
  signingKey: Uint8Array;
  /** Bob's signed pre-key (ECDH P-256, raw) */
  signedPreKey: Uint8Array;
  /** ECDSA signature over signedPreKey */
  signedPreKeySignature: Uint8Array;
  signedPreKeyId: number;
  /** Bob's one-time pre-key (optional) */
  oneTimePreKey?: Uint8Array;
  oneTimePreKeyId?: number;
  /** Bob's ML-KEM-768 pre-key (1184 bytes) */
  kyberPreKey: Uint8Array;
  /** ECDSA signature over kyberPreKey */
  kyberPreKeySignature: Uint8Array;
  kyberPreKeyId: number;
}

/** Result of PQXDH key agreement */
export interface PQXDHResult {
  /** Full shared secret (64 bytes for Triple Ratchet, 32 for standard) */
  sharedSecret: Uint8Array;
  /** Alice's ephemeral EC public key (sent to Bob) */
  ephemeralPublicKey: Uint8Array;
  /** KEM ciphertext (sent to Bob, 1088 bytes) */
  kemCipherText: Uint8Array;
  /** Whether a one-time pre-key was used */
  usedOneTimePreKey: boolean;
  /** Associated data: IK_A || IK_B */
  associatedData: Uint8Array;
  /** Protocol version */
  version: number;
}

/** Initial message from Alice to Bob */
export interface PQXDHInitialMessage {
  /** Alice's identity key (raw) */
  identityKey: Uint8Array;
  /** Alice's ephemeral key (raw) */
  ephemeralKey: Uint8Array;
  /** KEM ciphertext for Bob's kyberPreKey */
  kemCipherText: Uint8Array;
  /** IDs used (so Bob knows which keys to use) */
  signedPreKeyId: number;
  oneTimePreKeyId?: number;
  kyberPreKeyId: number;
  /** Protocol version */
  version: number;
}

// =============================================================================
// HELPERS
// =============================================================================

function toArrayBuffer(data: Uint8Array): ArrayBuffer {
  const buf = new ArrayBuffer(data.byteLength);
  new Uint8Array(buf).set(data);
  return buf;
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const len = arrays.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(len);
  let off = 0;
  for (const a of arrays) {
    out.set(a, off);
    off += a.length;
  }
  return out;
}

async function importECDHPublicKey(raw: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    toArrayBuffer(raw),
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    []
  );
}

async function importECDSAPublicKey(raw: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    toArrayBuffer(raw),
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['verify']
  );
}

async function ecdhDerive(priv: CryptoKey, pub: CryptoKey): Promise<Uint8Array> {
  const bits = await crypto.subtle.deriveBits({ name: 'ECDH', public: pub }, priv, 256);
  return new Uint8Array(bits);
}

async function hkdfDerive(
  ikm: Uint8Array,
  salt: Uint8Array,
  info: Uint8Array,
  length: number
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', toArrayBuffer(ikm), 'HKDF', false, [
    'deriveBits',
  ]);
  const out = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: toArrayBuffer(salt), info: toArrayBuffer(info) },
    key,
    length * 8
  );
  return new Uint8Array(out);
}

async function ecdsaVerify(
  publicKey: CryptoKey,
  signature: Uint8Array,
  data: Uint8Array
): Promise<boolean> {
  return crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    publicKey,
    toArrayBuffer(signature),
    toArrayBuffer(data)
  );
}

// =============================================================================
// PQXDH — INITIATOR (ALICE)
// =============================================================================

/**
 * Perform PQXDH key agreement as initiator.
 *
 * @param identityKeyPair - Alice's long-term identity key pair
 * @param bundle          - Bob's pre-key bundle (includes KEM key)
 * @param outputLength    - Output key length: 64 for Triple Ratchet, 32 for standard
 * @returns PQXDH result with shared secret, ephemeral key, and KEM ciphertext
 */
export async function pqxdhInitiate(
  identityKeyPair: ECKeyPair,
  bundle: PQXDHPreKeyBundle,
  outputLength: 32 | 64 = 64
): Promise<PQXDHResult> {
  // 1. Verify signed pre-key signature
  const signingKey = await importECDSAPublicKey(bundle.signingKey);
  const spkValid = await ecdsaVerify(signingKey, bundle.signedPreKeySignature, bundle.signedPreKey);
  if (!spkValid) {
    throw new CryptoError(
      CryptoErrorCode.SIGNATURE_VERIFICATION_FAILED,
      'Signed pre-key signature verification failed'
    );
  }

  // 2. Verify KEM pre-key signature
  if (bundle.kyberPreKey.length !== KEM_PUBLIC_KEY_LENGTH) {
    throw new CryptoError(
      CryptoErrorCode.INVALID_KEM_KEY,
      `KEM pre-key must be ${KEM_PUBLIC_KEY_LENGTH} bytes`
    );
  }
  const kemSigValid = await ecdsaVerify(
    signingKey,
    bundle.kyberPreKeySignature,
    bundle.kyberPreKey
  );
  if (!kemSigValid) {
    throw new CryptoError(
      CryptoErrorCode.SIGNATURE_VERIFICATION_FAILED,
      'KEM pre-key signature verification failed'
    );
  }

  // 3. Generate ephemeral key pair
  const ephemeralKP = await generateECKeyPair();

  // 4. Import Bob's EC keys
  const bobIdentityKey = await importECDHPublicKey(bundle.identityKey);
  const bobSignedPreKey = await importECDHPublicKey(bundle.signedPreKey);

  // 5. Compute EC DH values
  const dh1 = await ecdhDerive(identityKeyPair.privateKey, bobSignedPreKey);
  const dh2 = await ecdhDerive(ephemeralKP.privateKey, bobIdentityKey);
  const dh3 = await ecdhDerive(ephemeralKP.privateKey, bobSignedPreKey);

  // 6. Optional DH4 with one-time pre-key
  let dh4: Uint8Array | null = null;
  let usedOneTimePreKey = false;
  if (bundle.oneTimePreKey) {
    const bobOPK = await importECDHPublicKey(bundle.oneTimePreKey);
    dh4 = await ecdhDerive(ephemeralKP.privateKey, bobOPK);
    usedOneTimePreKey = true;
  }

  // 7. KEM encapsulation
  const kemResult: KEMEncapsulation = kemEncapsulate(bundle.kyberPreKey);

  // 8. Construct KDF input: F || DH1 || DH2 || DH3 [|| DH4] || SS
  const parts: Uint8Array[] = [DISCONTINUITY_BYTES, dh1, dh2, dh3];
  if (dh4) parts.push(dh4);
  parts.push(kemResult.sharedSecret);
  const kdfInput = concat(...parts);

  // 9. Derive shared secret via HKDF
  const salt = new Uint8Array(32); // Zero salt per spec
  const sharedSecret = await hkdfDerive(kdfInput, salt, PQXDH_INFO, outputLength);

  // 10. Associated data: IK_A || IK_B
  const associatedData = concat(identityKeyPair.rawPublicKey, bundle.identityKey);

  // 11. Wipe intermediate values
  dh1.fill(0);
  dh2.fill(0);
  dh3.fill(0);
  dh4?.fill(0);
  kdfInput.fill(0);
  kemResult.sharedSecret.fill(0);

  return {
    sharedSecret,
    ephemeralPublicKey: ephemeralKP.rawPublicKey,
    kemCipherText: kemResult.cipherText,
    usedOneTimePreKey,
    associatedData,
    version: PQXDH_VERSION,
  };
}

// =============================================================================
// PQXDH — RESPONDER (BOB)
// =============================================================================

/**
 * Perform PQXDH key agreement as responder (Bob).
 *
 * @param identityKeyPair   - Bob's identity key pair
 * @param signedPreKeyPair  - Bob's signed pre-key pair
 * @param kyberSecretKey    - Bob's ML-KEM-768 secret key (2400 bytes)
 * @param aliceIdentityKey  - Alice's identity public key (raw)
 * @param aliceEphemeralKey - Alice's ephemeral public key (raw)
 * @param kemCipherText     - KEM ciphertext from Alice (1088 bytes)
 * @param oneTimePreKeyPair - Bob's one-time pre-key pair (if used)
 * @param outputLength      - 64 for Triple Ratchet, 32 for standard
 */
export async function pqxdhRespond(
  identityKeyPair: ECKeyPair,
  signedPreKeyPair: ECKeyPair,
  kyberSecretKey: Uint8Array,
  aliceIdentityKey: Uint8Array,
  aliceEphemeralKey: Uint8Array,
  kemCipherText: Uint8Array,
  oneTimePreKeyPair?: ECKeyPair,
  outputLength: 32 | 64 = 64
): Promise<PQXDHResult> {
  // Import Alice's keys
  const aliceIK = await importECDHPublicKey(aliceIdentityKey);
  const aliceEK = await importECDHPublicKey(aliceEphemeralKey);

  // Mirror DH computations (same order, swapped roles)
  const dh1 = await ecdhDerive(signedPreKeyPair.privateKey, aliceIK);
  const dh2 = await ecdhDerive(identityKeyPair.privateKey, aliceEK);
  const dh3 = await ecdhDerive(signedPreKeyPair.privateKey, aliceEK);

  let dh4: Uint8Array | null = null;
  let usedOneTimePreKey = false;
  if (oneTimePreKeyPair) {
    dh4 = await ecdhDerive(oneTimePreKeyPair.privateKey, aliceEK);
    usedOneTimePreKey = true;
  }

  // KEM decapsulation
  // Note: ML-KEM uses implicit rejection — returns pseudorandom on bad CT
  const ss = kemDecapsulate(kemCipherText, kyberSecretKey);

  // Construct KDF input: F || DH1 || DH2 || DH3 [|| DH4] || SS
  const parts: Uint8Array[] = [DISCONTINUITY_BYTES, dh1, dh2, dh3];
  if (dh4) parts.push(dh4);
  parts.push(ss);
  const kdfInput = concat(...parts);

  // Derive shared secret
  const salt = new Uint8Array(32);
  const sharedSecret = await hkdfDerive(kdfInput, salt, PQXDH_INFO, outputLength);

  // Associated data: IK_A || IK_B
  const associatedData = concat(aliceIdentityKey, identityKeyPair.rawPublicKey);

  // Wipe intermediates
  dh1.fill(0);
  dh2.fill(0);
  dh3.fill(0);
  dh4?.fill(0);
  ss.fill(0);
  kdfInput.fill(0);

  return {
    sharedSecret,
    ephemeralPublicKey: new Uint8Array(0),
    kemCipherText: new Uint8Array(0),
    usedOneTimePreKey,
    associatedData,
    version: PQXDH_VERSION,
  };
}

// =============================================================================
// KEY BUNDLE GENERATION
// =============================================================================

/**
 * Generate a complete PQXDH pre-key bundle for publishing to the server.
 *
 * @param identityKeyPair - Long-term identity key pair
 * @param signingKeyPair  - Long-term signing key pair (ECDSA)
 * @param kemKeyPair      - ML-KEM-768 key pair { publicKey, secretKey }
 * @param signedPreKeyId  - ID for the signed pre-key
 * @param kyberPreKeyId   - ID for the KEM pre-key
 * @param oneTimePreKeys  - Optional array of one-time pre-key pairs with IDs
 */
export async function generatePQXDHBundle(
  identityKeyPair: ECKeyPair,
  signingKeyPair: ECKeyPair,
  kemKeyPair: { publicKey: Uint8Array; secretKey: Uint8Array },
  signedPreKeyId: number,
  kyberPreKeyId: number,
  oneTimePreKeys?: Array<{ id: number; keyPair: ECKeyPair }>
): Promise<{
  bundle: PQXDHPreKeyBundle;
  signedPreKeyPair: ECKeyPair;
  oneTimePreKeyPairs?: Array<{ id: number; keyPair: ECKeyPair }>;
}> {
  // Generate signed pre-key
  const signedPreKeyPair = await generateECKeyPair();

  // Sign the signed pre-key with our signing key
  const spkSignature = await sign(signingKeyPair.privateKey, signedPreKeyPair.rawPublicKey);

  // Sign the KEM pre-key with our signing key
  const kemSignature = await sign(signingKeyPair.privateKey, kemKeyPair.publicKey);

  const bundle: PQXDHPreKeyBundle = {
    identityKey: identityKeyPair.rawPublicKey,
    signingKey: signingKeyPair.rawPublicKey,
    signedPreKey: signedPreKeyPair.rawPublicKey,
    signedPreKeySignature: spkSignature,
    signedPreKeyId,
    kyberPreKey: kemKeyPair.publicKey,
    kyberPreKeySignature: kemSignature,
    kyberPreKeyId,
  };

  // Attach first one-time pre-key to bundle if available
  if (oneTimePreKeys && oneTimePreKeys.length > 0) {
    const first = oneTimePreKeys[0]!;
    bundle.oneTimePreKey = first.keyPair.rawPublicKey;
    bundle.oneTimePreKeyId = first.id;
  }

  return { bundle, signedPreKeyPair, oneTimePreKeyPairs: oneTimePreKeys };
}

// =============================================================================
// TRIPLE RATCHET INITIALIZATION HELPERS
// =============================================================================

/**
 * Split a 64-byte PQXDH shared secret into EC and SCKA seeds.
 * Used when initializing a Triple Ratchet session.
 *
 * @param sk - 64-byte shared secret from PQXDH
 * @returns { skEc: first 32 bytes, skScka: last 32 bytes }
 */
export function splitTripleRatchetSecret(sk: Uint8Array): {
  skEc: Uint8Array;
  skScka: Uint8Array;
} {
  if (sk.length !== 64) {
    throw new CryptoError(
      CryptoErrorCode.INVALID_KEY_LENGTH,
      `Triple Ratchet requires 64-byte PQXDH secret, got ${sk.length}`
    );
  }
  return {
    skEc: sk.slice(0, 32),
    skScka: sk.slice(32, 64),
  };
}
