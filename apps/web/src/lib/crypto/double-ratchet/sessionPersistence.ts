/**
 * Double Ratchet Protocol - Session Persistence & Diagnostics
 *
 * Functions for exporting, importing, and destroying ratchet sessions,
 * plus diagnostic utilities for session statistics and audit logs.
 *
 * @module lib/crypto/double-ratchet/sessionPersistence
 * @version 3.0.0
 * @since v0.7.35
 */

import type { RatchetState } from './types';
import { toArrayBuffer } from './keyDerivation';

// =============================================================================
// CRYPTO KEY HELPERS
// =============================================================================

async function exportPrivateKey(key: CryptoKey): Promise<number[]> {
  const exported = await crypto.subtle.exportKey('pkcs8', key);
  return Array.from(new Uint8Array(exported));
}

async function importPublicKey(raw: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    toArrayBuffer(raw),
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    []
  );
}

async function importPrivateKeyFromExport(exported: number[]): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'pkcs8',
    new Uint8Array(exported),
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );
}

// =============================================================================
// STATE EXPORT / IMPORT
// =============================================================================

/**
 * Export ratchet session state to a JSON string (for persistence)
 */
export async function exportSessionState(state: RatchetState): Promise<string> {
  const exportable = {
    DHs: state.DHs
      ? {
          rawPublicKey: Array.from(state.DHs.rawPublicKey),
          privateKey: await exportPrivateKey(state.DHs.privateKey),
        }
      : null,
    DHr: state.DHr ? Array.from(state.DHr) : null,
    RK: Array.from(state.RK),
    CKs: state.CKs ? Array.from(state.CKs) : null,
    CKr: state.CKr ? Array.from(state.CKr) : null,
    Ns: state.Ns,
    Nr: state.Nr,
    PN: state.PN,
    MKSKIPPED: Array.from(state.MKSKIPPED.entries()).map(([k, v]) => [k, Array.from(v)]),
    sessionId: state.sessionId,
    createdAt: state.createdAt,
    lastActivity: state.lastActivity,
    messageCount: state.messageCount,
    ratchetSteps: state.ratchetSteps,
    dhRatchetCount: state.dhRatchetCount,
  };

  return JSON.stringify(exportable);
}

/**
 * Import ratchet session state from a JSON string (from persistence)
 */
export async function importSessionState(stateJson: string): Promise<RatchetState> {
  const imported = JSON.parse(stateJson);

  return {
    DHs: imported.DHs
      ? {
          rawPublicKey: new Uint8Array(imported.DHs.rawPublicKey),
          publicKey: await importPublicKey(new Uint8Array(imported.DHs.rawPublicKey)),
          privateKey: await importPrivateKeyFromExport(imported.DHs.privateKey),
        }
      : null,
    DHr: imported.DHr ? new Uint8Array(imported.DHr) : null,
    RK: new Uint8Array(imported.RK),
    CKs: imported.CKs ? new Uint8Array(imported.CKs) : null,
    CKr: imported.CKr ? new Uint8Array(imported.CKr) : null,
    Ns: imported.Ns,
    Nr: imported.Nr,
    PN: imported.PN,
    MKSKIPPED: new Map(
      imported.MKSKIPPED.map(([k, v]: [string, number[]]) => [k, new Uint8Array(v)])
    ),
    sessionId: imported.sessionId,
    createdAt: imported.createdAt,
    lastActivity: imported.lastActivity,
    messageCount: imported.messageCount,
    ratchetSteps: imported.ratchetSteps,
    dhRatchetCount: imported.dhRatchetCount,
  };
}

// =============================================================================
// SESSION LIFECYCLE
// =============================================================================

/**
 * Securely erase all key material in the session state
 */
export function destroySessionState(state: RatchetState): void {
  if (state.RK) state.RK.fill(0);
  if (state.CKs) state.CKs.fill(0);
  if (state.CKr) state.CKr.fill(0);

  for (const [, mk] of state.MKSKIPPED) {
    mk.fill(0);
  }
  state.MKSKIPPED.clear();
}

// =============================================================================
// DIAGNOSTICS
// =============================================================================

/** Session statistics shape */
export interface SessionStats {
  sessionId: string;
  messageCount: number;
  ratchetSteps: number;
  dhRatchetCount: number;
  skippedKeysCount: number;
  sessionAge: number;
  lastActivity: number;
}

/**
 * Get session statistics from current ratchet state
 */
export function getSessionStats(state: RatchetState): SessionStats {
  return {
    sessionId: state.sessionId,
    messageCount: state.messageCount,
    ratchetSteps: state.ratchetSteps,
    dhRatchetCount: state.dhRatchetCount,
    skippedKeysCount: state.MKSKIPPED.size,
    sessionAge: Date.now() - state.createdAt,
    lastActivity: state.lastActivity,
  };
}
