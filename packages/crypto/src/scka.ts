/**
 * SCKA — Sparse Continuous Key Agreement (ML-KEM Braid)
 *
 * Implements the SCKA protocol from Signal's Double Ratchet Revision 4,
 * Section 5.1. This is the KEM-based continuous key agreement used by
 * SPQR (the Sparse Post-Quantum Ratchet).
 *
 * "Sparse" means KEM operations happen only when a new peer key is
 * available (not every message). Between KEM operations, the chain
 * key is ratcheted forward symmetrically.
 *
 * ML-KEM Braid:
 *   - Parties alternate generating KEM key pairs
 *   - When receiving a new peer public key, encapsulate against it
 *   - Send the ciphertext alongside normal messages
 *   - Peer decapsulates and both derive a new epoch key
 *
 * @module @cgraph/crypto/scka
 * @see Signal Double Ratchet Spec, Revision 4, Section 5
 */

import { kemKeygen, kemEncapsulate, kemDecapsulate, type KEMKeyPair } from './kem';

// =============================================================================
// CONSTANTS
// =============================================================================

const SCKA_KDF_INFO = new TextEncoder().encode('CGraph SCKA ML-KEM Braid v1');

// =============================================================================
// TYPES
// =============================================================================

/** Direction of communication for chain key ordering */
export enum SCKADirection {
  /** Alice-to-Bob: CKs uses first half, CKr uses second half */
  A2B = 'A2B',
  /** Bob-to-Alice: CKs uses second half, CKr uses first half */
  B2A = 'B2A',
}

/** SCKA send key result */
export interface SCKASendResult {
  /** Chain key for this epoch */
  chainKey: Uint8Array;
  /** New KEM public key to advertise (if we generated a new key pair) */
  newPublicKey?: Uint8Array;
  /** KEM ciphertext to include in message (if we encapsulated) */
  kemCipherText?: Uint8Array;
}

/** SCKA receive key result */
export interface SCKAReceiveResult {
  /** Chain key for this epoch */
  chainKey: Uint8Array;
}

/** Header component for SCKA within a Triple Ratchet message */
export interface SCKAHeader {
  /** Epoch number */
  epoch: number;
  /** Sender's new KEM public key (if rotating) — 1184 bytes */
  kemPublicKey?: Uint8Array;
  /** KEM ciphertext for receiver (if encapsulating) — 1088 bytes */
  kemCipherText?: Uint8Array;
}

/** Internal state of the SCKA protocol */
export interface SCKAState {
  /** Our current KEM key pair */
  ourKeyPair: KEMKeyPair | null;
  /** Their current KEM public key */
  theirPublicKey: Uint8Array | null;
  /** Current root key for the SCKA chain */
  rootKey: Uint8Array;
  /** Sending chain key */
  CKs: Uint8Array;
  /** Receiving chain key */
  CKr: Uint8Array;
  /** Current epoch number */
  epoch: number;
  /** Our direction */
  direction: SCKADirection;
  /** Whether we have a pending encapsulation (new peer key not yet used) */
  hasPendingPeerKey: boolean;
  /** Whether we need to send our new public key */
  needsSendPublicKey: boolean;
}

// =============================================================================
// HELPERS
// =============================================================================

function toArrayBuffer(data: Uint8Array): ArrayBuffer {
  const buf = new ArrayBuffer(data.byteLength);
  new Uint8Array(buf).set(data);
  return buf;
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

async function hmacSHA256(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, toArrayBuffer(data));
  return new Uint8Array(sig);
}

// =============================================================================
// SCKA ENGINE
// =============================================================================

export class SCKAEngine {
  private state: SCKAState;

  private constructor(state: SCKAState) {
    this.state = state;
  }

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  /**
   * Initialize SCKA from PQXDH shared secret (the SCKA portion).
   *
   * Per Signal spec Section 5, KDF_SCKA_INIT(SK):
   *   (RK, CKa2b, CKb2a) = HKDF(SK, "", info, 96)
   *
   * Alice uses (CKa2b, CKb2a) as (CKs, CKr)
   * Bob uses (CKb2a, CKa2b) as (CKs, CKr) — swapped
   *
   * @param skScka    - 32-byte SCKA seed from PQXDH secret split
   * @param direction - Whether we are Alice (A2B) or Bob (B2A)
   */
  static async initialize(skScka: Uint8Array, direction: SCKADirection): Promise<SCKAEngine> {
    const initInfo = new TextEncoder().encode('CGraph SCKA Init v1');
    const derived = await hkdfDerive(
      skScka,
      new Uint8Array(32), // zero salt
      initInfo,
      96 // 32 RK + 32 CKa2b + 32 CKb2a
    );

    const rk = derived.slice(0, 32);
    const ckA2B = derived.slice(32, 64);
    const ckB2A = derived.slice(64, 96);

    // Generate our initial KEM key pair
    const ourKeyPair = kemKeygen();

    const state: SCKAState = {
      ourKeyPair,
      theirPublicKey: null,
      rootKey: rk,
      CKs: direction === SCKADirection.A2B ? ckA2B : ckB2A,
      CKr: direction === SCKADirection.A2B ? ckB2A : ckA2B,
      epoch: 0,
      direction,
      hasPendingPeerKey: false,
      needsSendPublicKey: true, // Always send our key on first message
    };

    return new SCKAEngine(state);
  }

  // ===========================================================================
  // SEND / RECEIVE KEY
  // ===========================================================================

  /**
   * SCKARatchetSendKey — derive a send-side chain key for an epoch.
   *
   * If we have a pending peer public key that hasn't been used for
   * encapsulation yet, perform KEM encapsulation and advance the epoch.
   * Otherwise, just ratchet the current sending chain.
   *
   * @returns Chain key and optional SCKA header components
   */
  async ratchetSendKey(): Promise<SCKASendResult> {
    const result: SCKASendResult = {
      chainKey: new Uint8Array(0),
    };

    // If we have a new peer key, encapsulate and start new epoch
    if (this.state.hasPendingPeerKey && this.state.theirPublicKey) {
      // Encapsulate against their public key
      const { cipherText, sharedSecret } = kemEncapsulate(this.state.theirPublicKey);

      // Advance epoch: KDF_SCKA_RK(RK, ss) → (new RK, new CKs, new CKr)
      await this.advanceEpoch(sharedSecret);
      sharedSecret.fill(0);

      result.kemCipherText = cipherText;
      this.state.hasPendingPeerKey = false;
    }

    // If we need to send/re-send our public key
    if (this.state.needsSendPublicKey && this.state.ourKeyPair) {
      result.newPublicKey = this.state.ourKeyPair.publicKey;
      this.state.needsSendPublicKey = false;
    }

    // Ratchet the sending chain: HMAC(CKs, 0x01) → mk, HMAC(CKs, 0x02) → new CKs
    const [newCKs, messageChainKey] = await this.kdfChain(this.state.CKs);
    this.state.CKs = newCKs;
    result.chainKey = messageChainKey;

    return result;
  }

  /**
   * SCKARatchetReceiveKey — derive a receive-side chain key for an epoch.
   *
   * If the message contains a KEM ciphertext, decapsulate and advance epoch.
   * If the message contains a new peer public key, store it for next send.
   *
   * @param header - SCKA header from received Triple Ratchet message
   * @returns Chain key for decryption
   */
  async ratchetReceiveKey(header: SCKAHeader): Promise<SCKAReceiveResult> {
    // If message includes a KEM ciphertext, decapsulate and advance epoch
    if (header.kemCipherText && this.state.ourKeyPair) {
      const sharedSecret = kemDecapsulate(header.kemCipherText, this.state.ourKeyPair.secretKey);

      // Advance epoch
      await this.advanceEpoch(sharedSecret);
      sharedSecret.fill(0);

      // Generate new KEM key pair for next round
      this.state.ourKeyPair = kemKeygen();
      this.state.needsSendPublicKey = true;
    }

    // If message includes their new public key, store for next encapsulation
    if (header.kemPublicKey) {
      this.state.theirPublicKey = header.kemPublicKey;
      this.state.hasPendingPeerKey = true;
    }

    // Ratchet the receiving chain
    const [newCKr, messageChainKey] = await this.kdfChain(this.state.CKr);
    this.state.CKr = newCKr;

    return { chainKey: messageChainKey };
  }

  // ===========================================================================
  // EPOCH MANAGEMENT
  // ===========================================================================

  /**
   * Advance to a new epoch using KEM shared secret.
   *
   * KDF_SCKA_RK(rk, sckaOutput):
   *   (RK, CKa2b, CKb2a) = HKDF(sckaOutput, rk, info, 96)
   *
   * Direction determines which chain key is (CKs, CKr).
   */
  private async advanceEpoch(kemSharedSecret: Uint8Array): Promise<void> {
    const derived = await hkdfDerive(kemSharedSecret, this.state.rootKey, SCKA_KDF_INFO, 96);

    this.state.rootKey = derived.slice(0, 32);
    const ckA2B = derived.slice(32, 64);
    const ckB2A = derived.slice(64, 96);

    // Wipe old chain keys
    this.state.CKs.fill(0);
    this.state.CKr.fill(0);

    // Assign based on direction
    this.state.CKs = this.state.direction === SCKADirection.A2B ? ckA2B : ckB2A;
    this.state.CKr = this.state.direction === SCKADirection.A2B ? ckB2A : ckA2B;

    this.state.epoch++;
  }

  /**
   * KDF for chain key ratchet (symmetric step).
   * Returns [newChainKey, messageKey].
   */
  private async kdfChain(ck: Uint8Array): Promise<[Uint8Array, Uint8Array]> {
    const newCK = await hmacSHA256(ck, new Uint8Array([0x02]));
    const mk = await hmacSHA256(ck, new Uint8Array([0x01]));
    return [newCK, mk];
  }

  // ===========================================================================
  // STATE MANAGEMENT
  // ===========================================================================

  /** Get current epoch number */
  getEpoch(): number {
    return this.state.epoch;
  }

  /** Get our current public key (to advertise to peer) */
  getPublicKey(): Uint8Array | null {
    return this.state.ourKeyPair?.publicKey ?? null;
  }

  /** Export state for serialization */
  exportState(): SCKAState {
    return { ...this.state };
  }

  /** Import state from serialization */
  static fromState(state: SCKAState): SCKAEngine {
    return new SCKAEngine(state);
  }

  /** Securely wipe all key material */
  destroy(): void {
    if (this.state.ourKeyPair) {
      this.state.ourKeyPair.secretKey.fill(0);
    }
    this.state.rootKey.fill(0);
    this.state.CKs.fill(0);
    this.state.CKr.fill(0);
    this.state.theirPublicKey = null;
    this.state.ourKeyPair = null;
  }
}
