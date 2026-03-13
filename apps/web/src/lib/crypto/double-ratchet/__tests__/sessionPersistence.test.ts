/**
 * Tests for double-ratchet/sessionPersistence.ts
 *
 * Export/import session state, destroy session, get session stats.
 * Uses real Web Crypto for key import/export roundtrips.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  exportSessionState,
  importSessionState,
  destroySessionState,
  getSessionStats,
  type SessionStats,
} from '../sessionPersistence';
import { generateDHKeyPair } from '../keyDerivation';
import { initializeAlice } from '../ratchetOps';
import type { RatchetState } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const noopLog = vi.fn();

function makeState(overrides?: Partial<RatchetState>): RatchetState {
  return {
    DHs: null,
    DHr: null,
    RK: new Uint8Array(32).fill(0x42),
    CKs: null,
    CKr: null,
    Ns: 0,
    Nr: 0,
    PN: 0,
    MKSKIPPED: new Map(),
    sessionId: 'test-session-123',
    createdAt: 1700000000000,
    lastActivity: 1700000001000,
    messageCount: 5,
    ratchetSteps: 3,
    dhRatchetCount: 2,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('exportSessionState + importSessionState', () => {
  beforeEach(() => vi.clearAllMocks());

  it('roundtrips a minimal state (no DH keys)', async () => {
    const state = makeState();
    const json = await exportSessionState(state);
    const restored = await importSessionState(json);

    expect(restored.sessionId).toBe(state.sessionId);
    expect(restored.Ns).toBe(state.Ns);
    expect(restored.Nr).toBe(state.Nr);
    expect(restored.PN).toBe(state.PN);
    expect(restored.messageCount).toBe(state.messageCount);
    expect(restored.dhRatchetCount).toBe(state.dhRatchetCount);
    expect(Array.from(restored.RK)).toEqual(Array.from(state.RK));
    expect(restored.DHs).toBeNull();
    expect(restored.DHr).toBeNull();
    expect(restored.CKs).toBeNull();
    expect(restored.CKr).toBeNull();
  });

  it('roundtrips state with DH keys (real crypto)', async () => {
    const sharedSecret = new Uint8Array(32).fill(0xab);
    const bobKP = await generateDHKeyPair();
    const state = makeState();
    await initializeAlice(state, sharedSecret, bobKP.rawPublicKey, noopLog);

    const json = await exportSessionState(state);
    const restored = await importSessionState(json);

    // DH public key should match
    expect(Array.from(restored.DHs!.rawPublicKey)).toEqual(Array.from(state.DHs!.rawPublicKey));
    // DHr should match
    expect(Array.from(restored.DHr!)).toEqual(Array.from(state.DHr!));
    // Chain keys should match
    expect(Array.from(restored.CKs!)).toEqual(Array.from(state.CKs!));
    // Root key should match
    expect(Array.from(restored.RK)).toEqual(Array.from(state.RK));
  });

  it('preserves skipped message keys', async () => {
    const state = makeState();
    state.MKSKIPPED.set('pk1:0', new Uint8Array([1, 2, 3]));
    state.MKSKIPPED.set('pk2:5', new Uint8Array([4, 5, 6]));

    const json = await exportSessionState(state);
    const restored = await importSessionState(json);

    expect(restored.MKSKIPPED.size).toBe(2);
    expect(Array.from(restored.MKSKIPPED.get('pk1:0')!)).toEqual([1, 2, 3]);
    expect(Array.from(restored.MKSKIPPED.get('pk2:5')!)).toEqual([4, 5, 6]);
  });

  it('produces valid JSON', async () => {
    const state = makeState();
    const json = await exportSessionState(state);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

describe('destroySessionState', () => {
  it('zeroes root key', () => {
    const state = makeState();
    expect(state.RK[0]).toBe(0x42);
    destroySessionState(state);
    expect(state.RK.every((b) => b === 0)).toBe(true);
  });

  it('zeroes chain keys when present', () => {
    const state = makeState({
      CKs: new Uint8Array(32).fill(0xff),
      CKr: new Uint8Array(32).fill(0xee),
    });
    destroySessionState(state);
    expect(state.CKs!.every((b) => b === 0)).toBe(true);
    expect(state.CKr!.every((b) => b === 0)).toBe(true);
  });

  it('zeroes and clears skipped keys', () => {
    const mk = new Uint8Array(32).fill(0xdd);
    const state = makeState();
    state.MKSKIPPED.set('key', mk);

    destroySessionState(state);
    expect(mk.every((b) => b === 0)).toBe(true);
    expect(state.MKSKIPPED.size).toBe(0);
  });

  it('handles null chain keys gracefully', () => {
    const state = makeState({ CKs: null, CKr: null });
    expect(() => destroySessionState(state)).not.toThrow();
  });
});

describe('getSessionStats', () => {
  it('returns correct statistics shape', () => {
    const state = makeState({
      messageCount: 42,
      ratchetSteps: 10,
      dhRatchetCount: 5,
    });
    state.MKSKIPPED.set('k1', new Uint8Array(32));
    state.MKSKIPPED.set('k2', new Uint8Array(32));

    const stats: SessionStats = getSessionStats(state);

    expect(stats.sessionId).toBe('test-session-123');
    expect(stats.messageCount).toBe(42);
    expect(stats.ratchetSteps).toBe(10);
    expect(stats.dhRatchetCount).toBe(5);
    expect(stats.skippedKeysCount).toBe(2);
    expect(stats.sessionAge).toBeGreaterThan(0);
    expect(stats.lastActivity).toBe(1700000001000);
  });

  it('returns zero skipped keys for empty Map', () => {
    const stats = getSessionStats(makeState());
    expect(stats.skippedKeysCount).toBe(0);
  });
});
