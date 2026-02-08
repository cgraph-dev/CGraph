/**
 * Double Ratchet Protocol - Ratchet Operations
 *
 * Standalone functions for session initialization, DH ratchet steps,
 * and message key skipping. Operate on RatchetState in-place.
 *
 * @module lib/crypto/double-ratchet/ratchetOps
 * @version 3.0.0
 * @since v0.7.35
 */

import type { KeyPair, RatchetState, RatchetConfig } from './types';
import { generateDHKeyPair, importDHPublicKey, performDH, kdfRK, kdfCK } from './keyDerivation';
import { makeSkipKey } from './helpers';

/** Logger callback type matching DoubleRatchetEngine.log */
export type LogFn = (action: string, details: string) => void;

// =============================================================================
// SESSION INITIALIZATION
// =============================================================================

/**
 * Initialize ratchet state as Alice (initiator).
 * Called after X3DH key agreement is complete.
 */
export async function initializeAlice(
  state: RatchetState,
  sharedSecret: Uint8Array,
  bobPublicKey: Uint8Array,
  log: LogFn
): Promise<void> {
  log('INIT_ALICE', 'Initializing as session initiator');

  // Generate our first DH key pair
  state.DHs = await generateDHKeyPair();
  state.DHr = bobPublicKey;

  // Import Bob's public key and perform DH
  const bobKey = await importDHPublicKey(bobPublicKey);
  const dhOutput = await performDH(state.DHs.privateKey, bobKey);

  // Derive initial root key and sending chain key
  [state.RK, state.CKs] = await kdfRK(sharedSecret, dhOutput);

  state.lastActivity = Date.now();
  state.dhRatchetCount = 1;

  log('INIT_COMPLETE', `Session ${state.sessionId} initialized as Alice`);
}

/**
 * Initialize ratchet state as Bob (responder).
 * Called after X3DH key agreement is complete.
 */
export async function initializeBob(
  state: RatchetState,
  sharedSecret: Uint8Array,
  ourKeyPair: KeyPair,
  log: LogFn
): Promise<void> {
  log('INIT_BOB', 'Initializing as session responder');

  // Use the pre-key pair from X3DH
  state.DHs = ourKeyPair;
  state.RK = sharedSecret;

  state.lastActivity = Date.now();

  log('INIT_COMPLETE', `Session ${state.sessionId} initialized as Bob`);
}

// =============================================================================
// DH RATCHET
// =============================================================================

/**
 * Perform a DH ratchet step — advance the root chain with a new DH exchange.
 */
export async function dhRatchet(
  state: RatchetState,
  theirPublicKey: Uint8Array,
  log: LogFn
): Promise<void> {
  // Save previous chain length
  state.PN = state.Ns;
  state.Ns = 0;
  state.Nr = 0;

  // Update their public key
  state.DHr = theirPublicKey;

  // Import their key
  const theirKey = await importDHPublicKey(theirPublicKey);

  // Derive receiving chain
  if (state.DHs) {
    const dhOutput = await performDH(state.DHs.privateKey, theirKey);
    [state.RK, state.CKr] = await kdfRK(state.RK, dhOutput);
  }

  // Generate new DH key pair
  state.DHs = await generateDHKeyPair();

  // Derive sending chain
  const dhOutput = await performDH(state.DHs.privateKey, theirKey);
  [state.RK, state.CKs] = await kdfRK(state.RK, dhOutput);

  state.dhRatchetCount++;

  log('DH_RATCHET_COMPLETE', `DH ratchet step ${state.dhRatchetCount}`);
}

// =============================================================================
// SKIP & PRUNE MESSAGE KEYS
// =============================================================================

/**
 * Prune old skipped message keys beyond the configured maximum.
 */
export function pruneSkippedKeys(state: RatchetState, config: RatchetConfig, log: LogFn): void {
  if (state.MKSKIPPED.size > config.maxSkippedMessages) {
    const keysToDelete = Array.from(state.MKSKIPPED.keys()).slice(
      0,
      state.MKSKIPPED.size - config.maxSkippedMessages
    );

    for (const key of keysToDelete) {
      const mk = state.MKSKIPPED.get(key);
      if (mk) mk.fill(0); // Secure erase
      state.MKSKIPPED.delete(key);
    }

    log('PRUNE_KEYS', `Pruned ${keysToDelete.length} old skipped keys`);
  }
}

/**
 * Skip message keys and store them for later out-of-order decryption.
 */
export async function skipMessageKeys(
  state: RatchetState,
  config: RatchetConfig,
  dhPublicKey: Uint8Array,
  startN: number,
  endN: number,
  log: LogFn
): Promise<void> {
  if (!state.CKr) return;

  const toSkip = endN - startN;
  if (toSkip > config.maxSkippedMessages) {
    throw new Error(`Too many skipped messages: ${toSkip}`);
  }

  // Prune old skipped keys
  pruneSkippedKeys(state, config, log);

  // Store skipped message keys
  for (let n = startN; n < endN; n++) {
    const [newCKr, mk] = await kdfCK(state.CKr);
    state.CKr = newCKr;

    const key = makeSkipKey(dhPublicKey, n);
    state.MKSKIPPED.set(key, mk);

    log('SKIP_KEY', `Stored skipped key for message ${n}`);
  }

  state.Nr = endN;
}
