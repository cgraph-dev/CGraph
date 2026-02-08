/**
 * Double Ratchet Protocol - Message Encryption/Decryption
 *
 * Standalone functions for encrypting and decrypting messages
 * using the Double Ratchet chain state.
 *
 * @module lib/crypto/double-ratchet/messageEncryption
 * @version 3.0.0
 * @since v0.7.35
 */

import type {
  RatchetState,
  RatchetConfig,
  MessageHeader,
  EncryptedMessage,
  DecryptedMessage,
} from './types';
import { kdfCK, encrypt, decrypt, computeMAC } from './keyDerivation';
import { serializeHeader, concatArrays, arraysEqual, makeSkipKey } from './helpers';
import type { LogFn } from './ratchetOps';
import { dhRatchet, skipMessageKeys } from './ratchetOps';

// =============================================================================
// ENCRYPT
// =============================================================================

/**
 * Encrypt a plaintext message using the Double Ratchet sending chain.
 * Mutates state in-place (advances chain key and counters).
 */
export async function encryptRatchetMessage(
  state: RatchetState,
  plaintext: Uint8Array,
  associatedData: Uint8Array | undefined,
  log: LogFn
): Promise<EncryptedMessage> {
  if (!state.DHs) {
    throw new Error('Session not initialized');
  }
  if (!state.CKs) {
    throw new Error('No sending chain established');
  }

  log('ENCRYPT_START', `Encrypting message #${state.Ns}`);

  // Derive message key from chain
  const [newCKs, messageKey] = await kdfCK(state.CKs);
  state.CKs = newCKs;

  // Build header
  const header: MessageHeader = {
    dh: state.DHs.rawPublicKey,
    pn: state.PN,
    n: state.Ns,
    sessionId: state.sessionId,
    timestamp: Date.now(),
    version: 3,
  };

  // Serialize header for associated data
  const headerBytes = serializeHeader(header);
  const fullAD = associatedData ? concatArrays(headerBytes, associatedData) : headerBytes;

  // Encrypt
  const { ciphertext, nonce } = await encrypt(plaintext, messageKey, fullAD);

  // Compute MAC
  const macInput = concatArrays(headerBytes, ciphertext, nonce);
  const mac = await computeMAC(macInput, messageKey);

  // Increment message number
  state.Ns++;
  state.messageCount++;
  state.ratchetSteps++;
  state.lastActivity = Date.now();

  // Securely clear message key
  messageKey.fill(0);

  log('ENCRYPT_COMPLETE', `Message encrypted, chain advanced`);

  return { header, ciphertext, nonce, mac, associatedData };
}

// =============================================================================
// DECRYPT
// =============================================================================

/**
 * Try to decrypt a message using a skipped message key.
 * Returns null if no skipped key matches.
 */
async function trySkippedKey(
  state: RatchetState,
  message: EncryptedMessage,
  log: LogFn
): Promise<DecryptedMessage | null> {
  const { header, ciphertext, nonce, associatedData } = message;
  const skipKey = makeSkipKey(header.dh, header.n);
  const skippedMK = state.MKSKIPPED.get(skipKey);

  if (!skippedMK) return null;

  log('DECRYPT_SKIPPED', 'Using skipped message key');
  state.MKSKIPPED.delete(skipKey);

  const headerBytes = serializeHeader(header);
  const fullAD = associatedData ? concatArrays(headerBytes, associatedData) : headerBytes;
  const plaintext = await decrypt(ciphertext, skippedMK, nonce, fullAD);

  skippedMK.fill(0);

  return { plaintext, header, isOutOfOrder: true, wasSkipped: true };
}

/**
 * Decrypt an encrypted message using the Double Ratchet receiving chain.
 * Mutates state in-place (advances chain keys, may perform DH ratchet).
 */
export async function decryptRatchetMessage(
  state: RatchetState,
  config: RatchetConfig,
  message: EncryptedMessage,
  log: LogFn
): Promise<DecryptedMessage> {
  log('DECRYPT_START', `Decrypting message from chain`);

  const { header, ciphertext, nonce, mac, associatedData } = message;

  // First, try skipped message keys
  const skippedResult = await trySkippedKey(state, message, log);
  if (skippedResult) return skippedResult;

  // Check if we need to perform a DH ratchet
  const needsRatchet = !state.DHr || !arraysEqual(header.dh, state.DHr);

  if (needsRatchet) {
    log('DH_RATCHET', 'Performing DH ratchet step');

    if (state.CKr) {
      await skipMessageKeys(state, config, state.DHr!, state.Nr, header.pn, log);
    }

    await dhRatchet(state, header.dh, log);
  }

  // Skip any messages before this one in current chain
  const isOutOfOrder = header.n > state.Nr;
  if (isOutOfOrder) {
    await skipMessageKeys(state, config, header.dh, state.Nr, header.n, log);
  }

  if (!state.CKr) {
    throw new Error('No receiving chain established');
  }

  const [newCKr, messageKey] = await kdfCK(state.CKr);
  state.CKr = newCKr;
  state.Nr++;

  // Verify MAC
  const headerBytes = serializeHeader(header);
  const macInput = concatArrays(headerBytes, ciphertext, nonce);
  const expectedMac = await computeMAC(macInput, messageKey);

  if (!arraysEqual(mac, expectedMac)) {
    log('MAC_FAILURE', 'Message authentication failed');
    throw new Error('Message authentication failed');
  }

  // Decrypt
  const fullAD = associatedData ? concatArrays(headerBytes, associatedData) : headerBytes;
  const plaintext = await decrypt(ciphertext, messageKey, nonce, fullAD);

  state.messageCount++;
  state.ratchetSteps++;
  state.lastActivity = Date.now();

  messageKey.fill(0);

  log('DECRYPT_COMPLETE', `Message decrypted successfully`);

  return { plaintext, header, isOutOfOrder, wasSkipped: false };
}
