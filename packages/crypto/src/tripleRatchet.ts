/**
 * Triple Ratchet — Post-Quantum Hybrid E2EE
 *
 * Implements Signal's Double Ratchet Revision 4, Section 6.
 * The Triple Ratchet composes TWO independent ratchets running in parallel:
 *
 *   1. EC Double Ratchet   — classical ECDH-based (existing DoubleRatchetEngine)
 *   2. SPQR                — Sparse Post-Quantum Ratchet (ML-KEM-768 based)
 *
 * Message keys from both are combined:
 *   mk = KDF_HYBRID(ec_mk, pq_mk)
 *
 * This provides defense-in-depth: security holds if EITHER the classical
 * OR the post-quantum primitive remains unbroken.
 *
 * Protocol version: 4 (matches Signal's current)
 *
 * @module @cgraph/crypto/tripleRatchet
 * @see Signal Double Ratchet Spec, Revision 4, Section 6
 */

import { CryptoError, CryptoErrorCode } from './errors';
import { SPQREngine, type SPQRHeader, type SPQRSendResult, type SPQRReceiveResult } from './spqr';
import { DoubleRatchetEngine, type MessageHeader, type KeyPair } from './doubleRatchet';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Protocol version for Triple Ratchet messages */
export const TRIPLE_RATCHET_VERSION = 4;

/** HKDF info string for KDF_HYBRID */
const TR_HYBRID_INFO = new TextEncoder().encode('CGraph Triple Ratchet v1');

// =============================================================================
// TYPES
// =============================================================================

/** Composite message header for Triple Ratchet */
export interface TripleRatchetHeader {
  /** EC Double Ratchet header */
  ec: MessageHeader;
  /** SPQR header (epoch, message number, optional KEM data) */
  pq: SPQRHeader;
  /** Protocol version */
  version: number;
}

/** Encrypted Triple Ratchet message */
export interface TripleRatchetMessage {
  /** Composite header */
  header: TripleRatchetHeader;
  /** AES-256-GCM ciphertext */
  ciphertext: Uint8Array;
  /** AES-256-GCM nonce (12 bytes) */
  nonce: Uint8Array;
  /** HMAC-SHA256 over header + ciphertext */
  mac: Uint8Array;
  /** Optional associated data */
  associatedData?: Uint8Array;
}

/** Decrypted Triple Ratchet message */
export interface TripleRatchetDecryptedMessage {
  /** Decrypted plaintext */
  plaintext: Uint8Array;
  /** Original header */
  header: TripleRatchetHeader;
  /** Whether the EC ratchet detected out-of-order delivery */
  isOutOfOrder: boolean;
}

/** Statistics for a Triple Ratchet session */
export interface TripleRatchetStats {
  /** Unique session ID */
  sessionId: string;
  /** Total messages encrypted + decrypted */
  messageCount: number;
  /** Current SPQR epoch */
  spqrEpoch: number;
  /** EC Double Ratchet DH ratchet count */
  dhRatchetCount: number;
  /** Session age in milliseconds */
  sessionAge: number;
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

/**
 * KDF_HYBRID — combine EC and PQ message keys.
 *
 * Per Signal spec:
 *   mk = HKDF(salt=pq_mk, ikm=ec_mk, info=TR_PROTOCOL_INFO, len=32)
 */
async function kdfHybrid(ecMessageKey: Uint8Array, pqMessageKey: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', toArrayBuffer(ecMessageKey), 'HKDF', false, [
    'deriveBits',
  ]);
  const out = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: toArrayBuffer(pqMessageKey),
      info: toArrayBuffer(TR_HYBRID_INFO),
    },
    key,
    256
  );
  return new Uint8Array(out);
}

/**
 * AES-256-GCM encrypt with associated data.
 */
async function aesGcmEncrypt(
  plaintext: Uint8Array,
  key: Uint8Array,
  ad: Uint8Array
): Promise<{ ciphertext: Uint8Array; nonce: Uint8Array }> {
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(key.slice(0, 32)),
    'AES-GCM',
    false,
    ['encrypt']
  );
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce, additionalData: toArrayBuffer(ad) },
    cryptoKey,
    toArrayBuffer(plaintext)
  );
  return { ciphertext: new Uint8Array(ct), nonce };
}

/**
 * AES-256-GCM decrypt with associated data.
 */
async function aesGcmDecrypt(
  ciphertext: Uint8Array,
  key: Uint8Array,
  nonce: Uint8Array,
  ad: Uint8Array
): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(key.slice(0, 32)),
    'AES-GCM',
    false,
    ['decrypt']
  );
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(nonce), additionalData: toArrayBuffer(ad) },
    cryptoKey,
    toArrayBuffer(ciphertext)
  );
  return new Uint8Array(pt);
}

/**
 * HMAC-SHA256.
 */
async function computeMAC(data: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
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

/**
 * Constant-time comparison.
 */
function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return d === 0;
}

// =============================================================================
// TRIPLE RATCHET ENGINE
// =============================================================================

/**
 * Triple Ratchet Engine — composes EC Double Ratchet + SPQR.
 *
 * Usage:
 * ```ts
 * // After PQXDH:
 * const { skEc, skScka } = splitTripleRatchetSecret(pqxdhResult.sharedSecret);
 *
 * // Alice:
 * const alice = await TripleRatchetEngine.initializeAlice(skEc, skScka, bobPublicKey);
 *
 * // Bob:
 * const bob = await TripleRatchetEngine.initializeBob(skEc, skScka, ourKeyPair);
 *
 * // Encrypt:
 * const msg = await alice.encrypt(plaintext);
 *
 * // Decrypt:
 * const { plaintext } = await bob.decrypt(msg);
 * ```
 */
export class TripleRatchetEngine {
  private ecRatchet: DoubleRatchetEngine;
  private spqr: SPQREngine;
  private sessionId: string;
  private messageCount: number = 0;
  private createdAt: number;

  private constructor(ecRatchet: DoubleRatchetEngine, spqr: SPQREngine) {
    this.ecRatchet = ecRatchet;
    this.spqr = spqr;
    this.sessionId = this.generateSessionId();
    this.createdAt = Date.now();
  }

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  /**
   * Initialize as Alice (initiator).
   *
   * @param skEc          - 32-byte EC seed from PQXDH
   * @param skScka        - 32-byte SCKA seed from PQXDH
   * @param bobPublicKey  - Bob's signed pre-key (raw bytes)
   */
  static async initializeAlice(
    skEc: Uint8Array,
    skScka: Uint8Array,
    bobPublicKey: Uint8Array
  ): Promise<TripleRatchetEngine> {
    // Initialize EC Double Ratchet as Alice
    const ecRatchet = new DoubleRatchetEngine({ enablePostQuantum: false, enableAuditLog: false });
    await ecRatchet.initializeAlice(skEc, bobPublicKey);

    // Initialize SPQR as Alice
    const spqr = await SPQREngine.initialize(skScka, true);

    return new TripleRatchetEngine(ecRatchet, spqr);
  }

  /**
   * Initialize as Bob (responder).
   *
   * @param skEc        - 32-byte EC seed from PQXDH
   * @param skScka      - 32-byte SCKA seed from PQXDH
   * @param ourKeyPair  - Bob's signed pre-key pair (for EC ratchet)
   */
  static async initializeBob(
    skEc: Uint8Array,
    skScka: Uint8Array,
    ourKeyPair: KeyPair
  ): Promise<TripleRatchetEngine> {
    // Initialize EC Double Ratchet as Bob
    const ecRatchet = new DoubleRatchetEngine({ enablePostQuantum: false, enableAuditLog: false });
    await ecRatchet.initializeBob(skEc, ourKeyPair);

    // Initialize SPQR as Bob
    const spqr = await SPQREngine.initialize(skScka, false);

    return new TripleRatchetEngine(ecRatchet, spqr);
  }

  // ===========================================================================
  // ENCRYPT / DECRYPT
  // ===========================================================================

  /**
   * TripleRatchetEncrypt — encrypt a message with hybrid EC+PQ keys.
   *
   * Per Signal spec Section 6:
   *   ec_mk  = RatchetSendKey(ec_state)
   *   pq_mk  = SCKARatchetSendKey(spqr_state)
   *   mk     = KDF_HYBRID(ec_mk, pq_mk)
   *   ct     = AEAD_Encrypt(mk, plaintext, AD)
   *
   * @param plaintext      - Data to encrypt
   * @param associatedData - Optional additional authenticated data
   */
  async encrypt(plaintext: Uint8Array, associatedData?: Uint8Array): Promise<TripleRatchetMessage> {
    // 1. Get raw EC message key via RatchetSendKey
    const ecSend = await this.ecRatchet.ratchetSendKey();

    // 2. Get PQ message key from SPQR
    const pqSend: SPQRSendResult = await this.spqr.ratchetSendKey();

    // 3. KDF_HYBRID: combine EC and PQ keys
    const hybridKey = await kdfHybrid(ecSend.messageKey, pqSend.messageKey);

    // 4. Build composite header
    const header: TripleRatchetHeader = {
      ec: ecSend.header,
      pq: pqSend.header,
      version: TRIPLE_RATCHET_VERSION,
    };

    // 5. Serialize header for associated data
    const headerBytes = this.serializeHeader(header);
    const fullAD = associatedData ? concat(headerBytes, associatedData) : headerBytes;

    // 6. Single AEAD encrypt with hybrid key
    const { ciphertext, nonce } = await aesGcmEncrypt(plaintext, hybridKey, fullAD);

    // 7. MAC over header + ciphertext + nonce
    const macInput = concat(headerBytes, ciphertext, nonce);
    const mac = await computeMAC(macInput, hybridKey);

    // 8. Wipe intermediates
    ecSend.messageKey.fill(0);
    pqSend.messageKey.fill(0);
    hybridKey.fill(0);

    this.messageCount++;

    return { header, ciphertext, nonce, mac, associatedData };
  }

  /**
   * TripleRatchetDecrypt — decrypt a message with hybrid EC+PQ keys.
   *
   * Per Signal spec Section 6:
   *   ec_mk  = RatchetReceiveKey(ec_state, ec_header)
   *   pq_mk  = SCKARatchetReceiveKey(spqr_state, scka_header)
   *   mk     = KDF_HYBRID(ec_mk, pq_mk)
   *   pt     = AEAD_Decrypt(mk, ciphertext, AD)
   */
  async decrypt(message: TripleRatchetMessage): Promise<TripleRatchetDecryptedMessage> {
    // Verify protocol version
    if (message.header.version !== TRIPLE_RATCHET_VERSION) {
      throw new CryptoError(
        CryptoErrorCode.UNSUPPORTED_PROTOCOL_VERSION,
        `Expected protocol version ${TRIPLE_RATCHET_VERSION}, got ${message.header.version}`
      );
    }

    // 1. Get raw EC message key via RatchetReceiveKey
    const ecRecv = await this.ecRatchet.ratchetReceiveKey(message.header.ec);

    // 2. Get PQ message key from SPQR
    const pqRecv: SPQRReceiveResult = await this.spqr.ratchetReceiveKey(message.header.pq);

    // 3. KDF_HYBRID: combine EC and PQ keys
    const hybridKey = await kdfHybrid(ecRecv.messageKey, pqRecv.messageKey);

    // 4. Verify MAC
    const headerBytes = this.serializeHeader(message.header);
    const macInput = concat(headerBytes, message.ciphertext, message.nonce);
    const expectedMac = await computeMAC(macInput, hybridKey);
    if (!constantTimeEqual(message.mac, expectedMac)) {
      // Wipe before throwing
      ecRecv.messageKey.fill(0);
      pqRecv.messageKey.fill(0);
      hybridKey.fill(0);
      throw new CryptoError(
        CryptoErrorCode.MAC_VERIFICATION_FAILED,
        'Triple Ratchet MAC verification failed'
      );
    }

    // 5. AEAD decrypt with hybrid key
    const fullAD = message.associatedData
      ? concat(headerBytes, message.associatedData)
      : headerBytes;

    const plaintext = await aesGcmDecrypt(message.ciphertext, hybridKey, message.nonce, fullAD);

    // 6. Wipe intermediates
    ecRecv.messageKey.fill(0);
    pqRecv.messageKey.fill(0);
    hybridKey.fill(0);

    this.messageCount++;

    return {
      plaintext,
      header: message.header,
      isOutOfOrder: ecRecv.isOutOfOrder,
    };
  }

  // ===========================================================================
  // SERIALIZATION
  // ===========================================================================

  /**
   * Serialize a Triple Ratchet header to bytes.
   */
  private serializeHeader(header: TripleRatchetHeader): Uint8Array {
    const encoder = new TextEncoder();

    // Serialize EC header components
    const ecSessionBytes = encoder.encode(header.ec.sessionId);

    // EC header: version(1) + pn(4) + n(4) + ts(8) + sidLen(1) + sid + dh
    const ecPart = new Uint8Array(1 + 4 + 4 + 8 + 1 + ecSessionBytes.length + header.ec.dh.length);
    const ecView = new DataView(ecPart.buffer);
    let off = 0;
    ecPart[off++] = header.ec.version;
    ecView.setUint32(off, header.ec.pn, false);
    off += 4;
    ecView.setUint32(off, header.ec.n, false);
    off += 4;
    ecView.setBigUint64(off, BigInt(header.ec.timestamp), false);
    off += 8;
    ecPart[off++] = ecSessionBytes.length;
    ecPart.set(ecSessionBytes, off);
    off += ecSessionBytes.length;
    ecPart.set(header.ec.dh, off);

    // PQ header: epoch(4) + n(4) + flags(1) + [kemPK] + [kemCT]
    const pqFlags =
      (header.pq.scka.kemPublicKey ? 0x01 : 0) | (header.pq.scka.kemCipherText ? 0x02 : 0);
    const pqKeyLen = header.pq.scka.kemPublicKey?.length ?? 0;
    const pqCtLen = header.pq.scka.kemCipherText?.length ?? 0;
    const pqPart = new Uint8Array(4 + 4 + 1 + pqKeyLen + pqCtLen);
    const pqView = new DataView(pqPart.buffer);
    let pqOff = 0;
    pqView.setUint32(pqOff, header.pq.epoch, false);
    pqOff += 4;
    pqView.setUint32(pqOff, header.pq.n, false);
    pqOff += 4;
    pqPart[pqOff++] = pqFlags;
    if (header.pq.scka.kemPublicKey) {
      pqPart.set(header.pq.scka.kemPublicKey, pqOff);
      pqOff += pqKeyLen;
    }
    if (header.pq.scka.kemCipherText) {
      pqPart.set(header.pq.scka.kemCipherText, pqOff);
    }

    // Final: version(1) + ecLen(2) + ec + pq
    const total = new Uint8Array(1 + 2 + ecPart.length + pqPart.length);
    const totalView = new DataView(total.buffer);
    total[0] = header.version;
    totalView.setUint16(1, ecPart.length, false);
    total.set(ecPart, 3);
    total.set(pqPart, 3 + ecPart.length);

    return total;
  }

  private generateSessionId(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // ===========================================================================
  // PUBLIC API
  // ===========================================================================

  /** Get session statistics */
  getStats(): TripleRatchetStats {
    const ecStats = this.ecRatchet.getStats();
    return {
      sessionId: this.sessionId,
      messageCount: this.messageCount,
      spqrEpoch: this.spqr.getEpoch(),
      dhRatchetCount: ecStats.dhRatchetCount,
      sessionAge: Date.now() - this.createdAt,
      version: TRIPLE_RATCHET_VERSION,
    };
  }

  /** Get our EC ratchet public key */
  getECPublicKey(): Uint8Array | null {
    return this.ecRatchet.getPublicKey();
  }

  /** Get our current SPQR KEM public key */
  getKEMPublicKey(): Uint8Array | null {
    return this.spqr.getPublicKey();
  }

  /** Securely destroy all key material */
  destroy(): void {
    this.ecRatchet.destroy();
    this.spqr.destroy();
  }
}
