/**
 * SPQR — Sparse Post-Quantum Ratchet
 *
 * Implements Signal's Double Ratchet Revision 4, Section 5.
 * SPQR runs in PARALLEL with the EC Double Ratchet — its message keys
 * are combined with EC message keys via KDF_HYBRID in the Triple Ratchet.
 *
 * SPQR uses the SCKA (ML-KEM Braid) protocol for epoch-based key agreement.
 * Between epochs, chain keys are ratcheted symmetrically.
 *
 * Key properties:
 * - Post-quantum forward secrecy (KEM-based)
 * - Sparse: KEM operations only when new peer keys available
 * - Independent from EC ratchet — provides defense-in-depth
 * - Epoch-based chain management
 *
 * @module @cgraph/crypto/spqr
 * @see Signal Double Ratchet Spec, Revision 4, Section 5
 */

import { SCKAEngine, SCKADirection, type SCKAHeader, type SCKAState } from './scka';

// =============================================================================
// TYPES
// =============================================================================

/** SPQR state (wraps SCKA state with message counters) */
export interface SPQRState {
  /** Underlying SCKA state */
  scka: SCKAState;
  /** Sending message counter within current epoch */
  Ns: number;
  /** Receiving message counter within current epoch */
  Nr: number;
  /** Skipped message keys: Map<"epoch:n", chainKey> */
  skippedKeys: Map<string, Uint8Array>;
  /** Maximum skipped messages per epoch */
  maxSkip: number;
}

/** SPQR header — included in Triple Ratchet messages */
export interface SPQRHeader {
  /** Current SCKA epoch */
  epoch: number;
  /** Message number within epoch */
  n: number;
  /** SCKA header components (KEM key/ciphertext) */
  scka: SCKAHeader;
}

/** SPQR send result */
export interface SPQRSendResult {
  /** Post-quantum message key (32 bytes) — combined with EC mk via KDF_HYBRID */
  messageKey: Uint8Array;
  /** SPQR header to include in message */
  header: SPQRHeader;
}

/** SPQR receive result */
export interface SPQRReceiveResult {
  /** Post-quantum message key (32 bytes) */
  messageKey: Uint8Array;
}

// =============================================================================
// SPQR ENGINE
// =============================================================================

export class SPQREngine {
  private scka: SCKAEngine;
  private Ns: number = 0;
  private Nr: number = 0;
  private skippedKeys = new Map<string, Uint8Array>();
  private maxSkip: number;

  private constructor(scka: SCKAEngine, maxSkip: number) {
    this.scka = scka;
    this.maxSkip = maxSkip;
  }

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  /**
   * Initialize SPQR from the SCKA portion of a PQXDH shared secret.
   *
   * @param skScka    - 32-byte SCKA seed from PQXDH
   * @param isAlice   - True if we're the initiator
   * @param maxSkip   - Maximum skipped messages to store (default 100)
   */
  static async initialize(
    skScka: Uint8Array,
    isAlice: boolean,
    maxSkip: number = 100
  ): Promise<SPQREngine> {
    const direction = isAlice ? SCKADirection.A2B : SCKADirection.B2A;
    const scka = await SCKAEngine.initialize(skScka, direction);
    return new SPQREngine(scka, maxSkip);
  }

  // ===========================================================================
  // RATCHET SEND / RECEIVE
  // ===========================================================================

  /**
   * SCKARatchetSendKey — derive a PQ message key for sending.
   *
   * Called by Triple Ratchet before each message.
   * The returned messageKey is combined with EC messageKey via KDF_HYBRID.
   */
  async ratchetSendKey(): Promise<SPQRSendResult> {
    const sendResult = await this.scka.ratchetSendKey();

    const header: SPQRHeader = {
      epoch: this.scka.getEpoch(),
      n: this.Ns,
      scka: {
        epoch: this.scka.getEpoch(),
        kemPublicKey: sendResult.newPublicKey,
        kemCipherText: sendResult.kemCipherText,
      },
    };

    this.Ns++;

    return {
      messageKey: sendResult.chainKey,
      header,
    };
  }

  /**
   * SCKARatchetReceiveKey — derive a PQ message key for receiving.
   *
   * Handles epoch transitions (when KEM data is present) and
   * out-of-order message delivery within an epoch.
   */
  async ratchetReceiveKey(header: SPQRHeader): Promise<SPQRReceiveResult> {
    // Check for skipped key
    const skipKey = this.makeSkipKey(header.epoch, header.n);
    const skipped = this.skippedKeys.get(skipKey);
    if (skipped) {
      this.skippedKeys.delete(skipKey);
      return { messageKey: skipped };
    }

    // Process SCKA header (may advance epoch)
    const receiveResult = await this.scka.ratchetReceiveKey(header.scka);

    // Skip messages if needed (within current epoch)
    if (header.n > this.Nr) {
      const toSkip = header.n - this.Nr;
      if (toSkip > this.maxSkip) {
        throw new Error(`SPQR: too many skipped messages (${toSkip} > ${this.maxSkip})`);
      }

      // Store skipped keys
      // Note: the first key was already consumed by ratchetReceiveKey above
      // We need to ratchet forward for the remaining skipped messages
      // But actually the first call already gave us one key...
      // We store it and ratchet forward for the remaining

      // The first ratchetReceiveKey call already advanced the chain once.
      // That key is for Nr. If header.n > Nr, we need to store the key for Nr
      // and ratchet forward.

      // Store the key we just got for position Nr
      this.skippedKeys.set(this.makeSkipKey(header.epoch, this.Nr), receiveResult.chainKey);

      // Ratchet forward for messages between Nr+1 and header.n-1
      for (let n = this.Nr + 1; n < header.n; n++) {
        const extra = await this.scka.ratchetReceiveKey({
          epoch: header.epoch,
        });
        this.skippedKeys.set(this.makeSkipKey(header.epoch, n), extra.chainKey);
      }

      // Get the actual key for header.n
      const actual = await this.scka.ratchetReceiveKey({
        epoch: header.epoch,
      });

      this.Nr = header.n + 1;
      return { messageKey: actual.chainKey };
    }

    this.Nr++;
    return { messageKey: receiveResult.chainKey };
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  private makeSkipKey(epoch: number, n: number): string {
    return `${epoch}:${n}`;
  }

  /** Get our current KEM public key */
  getPublicKey(): Uint8Array | null {
    return this.scka.getPublicKey();
  }

  /** Get current epoch */
  getEpoch(): number {
    return this.scka.getEpoch();
  }

  /** Export state for serialization */
  exportState(): SPQRState {
    return {
      scka: this.scka.exportState(),
      Ns: this.Ns,
      Nr: this.Nr,
      skippedKeys: new Map(this.skippedKeys),
      maxSkip: this.maxSkip,
    };
  }

  /** Import state */
  static fromState(state: SPQRState): SPQREngine {
    const engine = new SPQREngine(SCKAEngine.fromState(state.scka), state.maxSkip);
    engine.Ns = state.Ns;
    engine.Nr = state.Nr;
    engine.skippedKeys = new Map(state.skippedKeys);
    return engine;
  }

  /** Securely destroy all key material */
  destroy(): void {
    this.scka.destroy();
    for (const [, key] of this.skippedKeys) {
      key.fill(0);
    }
    this.skippedKeys.clear();
  }
}
