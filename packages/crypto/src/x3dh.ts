/**
 * X3DH — Extended Triple Diffie-Hellman Key Agreement
 *
 * Platform-agnostic implementation consolidated from apps/web.
 * Uses P-256 ECDH via Web Crypto API.
 *
 * X3DH establishes a shared secret between two parties (Alice and Bob)
 * even when Bob is offline, using a bundle of pre-published keys.
 *
 * This module is the CLASSICAL key agreement. For post-quantum hybrid
 * key agreement, use PQXDH from './pqxdh'.
 *
 * @module @cgraph/crypto/x3dh
 * @see https://signal.org/docs/specifications/x3dh/
 */

import { CryptoError, CryptoErrorCode } from './errors';

// =============================================================================
// CONSTANTS
// =============================================================================

const X3DH_INFO = new TextEncoder().encode('CGraph X3DH v1');
const CURVE = 'P-256';
const DH_BITS = 256;

// =============================================================================
// TYPES
// =============================================================================

export interface ECKeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
  rawPublicKey: Uint8Array;
}

export interface X3DHPreKeyBundle {
  /** Bob's identity key (ECDH) */
  identityKey: Uint8Array;
  /** Bob's signed pre-key */
  signedPreKey: Uint8Array;
  /** Signature over signed pre-key by Bob's signing key */
  signedPreKeySignature: Uint8Array;
  /** Bob's signing key (ECDSA) for signature verification */
  signingKey: Uint8Array;
  /** Bob's one-time pre-key (optional, consumed on use) */
  oneTimePreKey?: Uint8Array;
  /** Key IDs for server tracking */
  signedPreKeyId: string;
  oneTimePreKeyId?: string;
}

export interface X3DHResult {
  /** Shared secret (32 bytes) */
  sharedSecret: Uint8Array;
  /** Alice's ephemeral public key (sent to Bob) */
  ephemeralPublicKey: Uint8Array;
  /** Whether a one-time pre-key was used */
  usedOneTimePreKey: boolean;
  /** Associated data for the first message */
  associatedData: Uint8Array;
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

// =============================================================================
// KEY GENERATION
// =============================================================================

/** Generate an ECDH key pair on P-256 */
export async function generateECKeyPair(): Promise<ECKeyPair> {
  const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: CURVE }, true, [
    'deriveBits',
  ]);
  const raw = await crypto.subtle.exportKey('raw', kp.publicKey);
  return { publicKey: kp.publicKey, privateKey: kp.privateKey, rawPublicKey: new Uint8Array(raw) };
}

/** Generate an ECDSA signing key pair on P-256 */
export async function generateSigningKeyPair(): Promise<ECKeyPair> {
  const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: CURVE }, true, [
    'sign',
    'verify',
  ]);
  const raw = await crypto.subtle.exportKey('raw', kp.publicKey);
  return { publicKey: kp.publicKey, privateKey: kp.privateKey, rawPublicKey: new Uint8Array(raw) };
}

async function importECDHPublicKey(raw: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    toArrayBuffer(raw),
    { name: 'ECDH', namedCurve: CURVE },
    true,
    []
  );
}

async function importECDSAPublicKey(raw: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    toArrayBuffer(raw),
    { name: 'ECDSA', namedCurve: CURVE },
    true,
    ['verify']
  );
}

async function dh(priv: CryptoKey, pub: CryptoKey): Promise<Uint8Array> {
  const bits = await crypto.subtle.deriveBits({ name: 'ECDH', public: pub }, priv, DH_BITS);
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

/** Sign data with ECDSA P-256 / SHA-256 */
export async function sign(privateKey: CryptoKey, data: Uint8Array): Promise<Uint8Array> {
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    toArrayBuffer(data)
  );
  return new Uint8Array(sig);
}

async function verify(
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
// X3DH — INITIATOR (ALICE)
// =============================================================================

/**
 * Perform X3DH key agreement as the initiator (Alice).
 *
 * Computes:
 *   DH1 = DH(IK_A, SPK_B)
 *   DH2 = DH(EK_A, IK_B)
 *   DH3 = DH(EK_A, SPK_B)
 *   DH4 = DH(EK_A, OPK_B)   — if one-time pre-key available
 *   SK  = KDF(DH1 || DH2 || DH3 [|| DH4])
 *
 * @param identityKeyPair - Alice's long-term identity key pair
 * @param bundle          - Bob's pre-key bundle from the server
 * @returns Shared secret and ephemeral key to send to Bob
 */
export async function x3dhInitiate(
  identityKeyPair: ECKeyPair,
  bundle: X3DHPreKeyBundle
): Promise<X3DHResult> {
  // Verify the signed pre-key signature
  const signingKey = await importECDSAPublicKey(bundle.signingKey);
  const validSig = await verify(signingKey, bundle.signedPreKeySignature, bundle.signedPreKey);
  if (!validSig) {
    throw new CryptoError(
      CryptoErrorCode.SIGNATURE_VERIFICATION_FAILED,
      'Signed pre-key signature verification failed'
    );
  }

  // Import Bob's keys
  const bobIdentityKey = await importECDHPublicKey(bundle.identityKey);
  const bobSignedPreKey = await importECDHPublicKey(bundle.signedPreKey);

  // Generate ephemeral key pair
  const ephemeralKP = await generateECKeyPair();

  // Compute DH values
  const dh1 = await dh(identityKeyPair.privateKey, bobSignedPreKey);
  const dh2 = await dh(ephemeralKP.privateKey, bobIdentityKey);
  const dh3 = await dh(ephemeralKP.privateKey, bobSignedPreKey);

  let dhConcat: Uint8Array;
  let usedOneTimePreKey = false;

  if (bundle.oneTimePreKey) {
    const bobOPK = await importECDHPublicKey(bundle.oneTimePreKey);
    const dh4 = await dh(ephemeralKP.privateKey, bobOPK);
    dhConcat = concat(dh1, dh2, dh3, dh4);
    usedOneTimePreKey = true;
  } else {
    dhConcat = concat(dh1, dh2, dh3);
  }

  // KDF — zero salt for X3DH (per spec)
  const salt = new Uint8Array(32);
  const sharedSecret = await hkdfDerive(dhConcat, salt, X3DH_INFO, 32);

  // Associated data = IK_A || IK_B
  const associatedData = concat(identityKeyPair.rawPublicKey, bundle.identityKey);

  return {
    sharedSecret,
    ephemeralPublicKey: ephemeralKP.rawPublicKey,
    usedOneTimePreKey,
    associatedData,
  };
}

// =============================================================================
// X3DH — RESPONDER (BOB)
// =============================================================================

/**
 * Perform X3DH key agreement as the responder (Bob).
 *
 * @param identityKeyPair   - Bob's long-term identity key pair
 * @param signedPreKeyPair  - Bob's signed pre-key pair
 * @param aliceIdentityKey  - Alice's identity public key (raw)
 * @param aliceEphemeralKey - Alice's ephemeral public key (raw)
 * @param oneTimePreKeyPair - Bob's one-time pre-key pair (if Alice used one)
 */
export async function x3dhRespond(
  identityKeyPair: ECKeyPair,
  signedPreKeyPair: ECKeyPair,
  aliceIdentityKey: Uint8Array,
  aliceEphemeralKey: Uint8Array,
  oneTimePreKeyPair?: ECKeyPair
): Promise<X3DHResult> {
  const aliceIK = await importECDHPublicKey(aliceIdentityKey);
  const aliceEK = await importECDHPublicKey(aliceEphemeralKey);

  // Mirror DH computations
  const dh1 = await dh(signedPreKeyPair.privateKey, aliceIK);
  const dh2 = await dh(identityKeyPair.privateKey, aliceEK);
  const dh3 = await dh(signedPreKeyPair.privateKey, aliceEK);

  let dhConcat: Uint8Array;
  let usedOneTimePreKey = false;

  if (oneTimePreKeyPair) {
    const dh4 = await dh(oneTimePreKeyPair.privateKey, aliceEK);
    dhConcat = concat(dh1, dh2, dh3, dh4);
    usedOneTimePreKey = true;
  } else {
    dhConcat = concat(dh1, dh2, dh3);
  }

  const salt = new Uint8Array(32);
  const sharedSecret = await hkdfDerive(dhConcat, salt, X3DH_INFO, 32);

  const associatedData = concat(aliceIdentityKey, identityKeyPair.rawPublicKey);

  return {
    sharedSecret,
    ephemeralPublicKey: new Uint8Array(0), // Bob doesn't send ephemeral
    usedOneTimePreKey,
    associatedData,
  };
}
