/**
 * E2EE Session, Key-Bundle Storage, and Safety Number Tests
 *
 * Covers session management (loadSessions, saveSession, getSession),
 * safety number generation, fingerprint, key bundle storage/loading,
 * and isE2EESetUp / clearE2EEData.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  generateECDHKeyPair,
  generateECDSAKeyPair,
  exportPublicKey,
  arrayBufferToBase64,
  generateKeyBundle,
  storeKeyBundle,
  loadIdentityKeyPair,
  loadSignedPreKey,
  getDeviceId,
  isE2EESetUp,
  clearE2EEData,
  formatKeysForRegistration,
  generateSafetyNumber,
  fingerprint,
  loadSessions,
  saveSession,
  getSession,
} from '../e2ee';

// ── Mock localStorage ────────────────────────────────────────────────

let mockStorage: Record<string, string> = {};

beforeEach(() => {
  mockStorage = {};
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => mockStorage[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key];
    }),
    clear: vi.fn(() => {
      mockStorage = {};
    }),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// =============================================================================
// SESSION MANAGEMENT
// =============================================================================

describe('Session Management', () => {
  describe('loadSessions', () => {
    it('returns empty Map when no sessions stored', () => {
      const sessions = loadSessions();
      expect(sessions).toBeInstanceOf(Map);
      expect(sessions.size).toBe(0);
    });

    it('returns empty Map for invalid JSON', () => {
      mockStorage['cgraph_e2ee_sessions'] = '{{invalid';
      const sessions = loadSessions();
      expect(sessions.size).toBe(0);
    });

    it('loads stored sessions correctly', () => {
      const data = {
        'user-1': { rootKey: 'abc', chainKey: 'def' },
        'user-2': { rootKey: 'ghi', chainKey: 'jkl' },
      };
      mockStorage['cgraph_e2ee_sessions'] = JSON.stringify(data);
      const sessions = loadSessions();
      expect(sessions.size).toBe(2);
      expect(sessions.get('user-1')).toEqual({ rootKey: 'abc', chainKey: 'def' });
    });
  });

  describe('saveSession', () => {
    it('saves a session and persists to storage', () => {
      const session = { rootKey: 'rk1', chainKey: 'ck1' } as any;
      saveSession('recipient-1', session);

      expect(localStorage.setItem).toHaveBeenCalled();
      const stored = JSON.parse(mockStorage['cgraph_e2ee_sessions']!);
      expect(stored['recipient-1']).toEqual(session);
    });

    it('preserves existing sessions when adding new ones', () => {
      saveSession('r1', { rootKey: 'a', chainKey: 'b' } as any);
      saveSession('r2', { rootKey: 'c', chainKey: 'd' } as any);

      const stored = JSON.parse(mockStorage['cgraph_e2ee_sessions']!);
      expect(stored['r1']).toBeDefined();
      expect(stored['r2']).toBeDefined();
    });

    it('overwrites existing session for same recipientId', () => {
      saveSession('r1', { rootKey: 'a', chainKey: 'b' } as any);
      saveSession('r1', { rootKey: 'x', chainKey: 'y' } as any);

      const stored = JSON.parse(mockStorage['cgraph_e2ee_sessions']!);
      expect(stored['r1'].rootKey).toBe('x');
    });
  });

  describe('getSession', () => {
    it('returns null when session does not exist', () => {
      expect(getSession('nonexistent')).toBeNull();
    });

    it('returns the session when it exists', () => {
      const session = { rootKey: 'rk', chainKey: 'ck' } as any;
      saveSession('user-A', session);
      const loaded = getSession('user-A');
      expect(loaded).toEqual(session);
    });
  });
});

// =============================================================================
// SAFETY NUMBERS & FINGERPRINTS
// =============================================================================

describe('Safety Number Generation', () => {
  it('generates a 60+ character safety number', async () => {
    const key1 = new Uint8Array(32);
    const key2 = new Uint8Array(32);
    crypto.getRandomValues(key1);
    crypto.getRandomValues(key2);

    const safetyNum = await generateSafetyNumber(key1.buffer, 'alice', key2.buffer, 'bob');

    // 12 groups of 5 digits with 11 spaces = 71 chars
    expect(safetyNum.length).toBe(71);
    expect(safetyNum.split(' ').length).toBe(12);
  });

  it('is symmetric — same result regardless of who generates', async () => {
    const keyA = new Uint8Array(32);
    const keyB = new Uint8Array(32);
    crypto.getRandomValues(keyA);
    crypto.getRandomValues(keyB);

    const fromAlice = await generateSafetyNumber(keyA.buffer, 'alice', keyB.buffer, 'bob');
    const fromBob = await generateSafetyNumber(keyB.buffer, 'bob', keyA.buffer, 'alice');

    expect(fromAlice).toBe(fromBob);
  });

  it('produces different numbers for different key pairs', async () => {
    const key1 = new Uint8Array(32);
    const key2 = new Uint8Array(32);
    const key3 = new Uint8Array(32);
    crypto.getRandomValues(key1);
    crypto.getRandomValues(key2);
    crypto.getRandomValues(key3);

    const sn1 = await generateSafetyNumber(key1.buffer, 'alice', key2.buffer, 'bob');
    const sn2 = await generateSafetyNumber(key1.buffer, 'alice', key3.buffer, 'charlie');

    expect(sn1).not.toBe(sn2);
  });
});

describe('fingerprint', () => {
  it('returns a hex string', async () => {
    const key = new Uint8Array(32);
    crypto.getRandomValues(key);
    const fp = await fingerprint(key.buffer);
    expect(fp).toMatch(/^[0-9a-f]+$/);
  });

  it('returns 64-char hex for SHA-256 output', async () => {
    const key = new Uint8Array(32);
    crypto.getRandomValues(key);
    const fp = await fingerprint(key.buffer);
    expect(fp.length).toBe(64);
  });

  it('same input produces same fingerprint', async () => {
    const key = new Uint8Array([1, 2, 3, 4, 5]);
    const fp1 = await fingerprint(key.buffer);
    const fp2 = await fingerprint(key.buffer);
    expect(fp1).toBe(fp2);
  });
});

// =============================================================================
// KEY BUNDLE STORAGE & LOADING
// =============================================================================

describe('Key Bundle Storage', () => {
  it('stores and loads identity key pair', async () => {
    const bundle = await generateKeyBundle('test-device', 1);
    await storeKeyBundle(bundle);

    const loaded = await loadIdentityKeyPair();
    expect(loaded).not.toBeNull();
    expect(loaded!.keyId).toBe(bundle.identityKey.keyId);

    // Verify loaded public key matches original
    const originalPub = await exportPublicKey(bundle.identityKey.keyPair.publicKey);
    const loadedPub = await exportPublicKey(loaded!.keyPair.publicKey);
    expect(arrayBufferToBase64(loadedPub)).toBe(arrayBufferToBase64(originalPub));
  });

  it('stores and loads signed pre-key', async () => {
    const bundle = await generateKeyBundle('test-device', 1);
    await storeKeyBundle(bundle);

    const loaded = await loadSignedPreKey();
    expect(loaded).not.toBeNull();
    expect(loaded!.keyId).toBe(bundle.signedPreKey.keyId);
  });

  it('stores and retrieves device ID', async () => {
    const bundle = await generateKeyBundle('my-device-123', 1);
    await storeKeyBundle(bundle);

    expect(getDeviceId()).toBe('my-device-123');
  });

  it('loadIdentityKeyPair returns null when nothing stored', async () => {
    const result = await loadIdentityKeyPair();
    expect(result).toBeNull();
  });

  it('loadSignedPreKey returns null when nothing stored', async () => {
    const result = await loadSignedPreKey();
    expect(result).toBeNull();
  });
});

describe('isE2EESetUp', () => {
  it('returns false when no keys stored', async () => {
    expect(await isE2EESetUp()).toBe(false);
  });

  it('returns true after storing a key bundle', async () => {
    const bundle = await generateKeyBundle('device-1', 1);
    await storeKeyBundle(bundle);
    expect(await isE2EESetUp()).toBe(true);
  });
});

describe('clearE2EEData', () => {
  it('removes all E2EE data from storage', async () => {
    const bundle = await generateKeyBundle('device-1', 1);
    await storeKeyBundle(bundle);
    expect(await isE2EESetUp()).toBe(true);

    clearE2EEData();
    expect(localStorage.removeItem).toHaveBeenCalled();
  });
});

describe('formatKeysForRegistration', () => {
  it('returns server-ready registration object', async () => {
    const bundle = await generateKeyBundle('device-x', 2);
    const formatted = await formatKeysForRegistration(bundle);

    expect(formatted).toHaveProperty('device_id', 'device-x');
    expect(formatted).toHaveProperty('identity_key');
    expect(formatted).toHaveProperty('signing_key');
    expect(formatted).toHaveProperty('key_id');
    expect(formatted).toHaveProperty('one_time_prekeys');
    // signed_prekey is an object with public_key, signature, key_id
    expect(formatted).toHaveProperty('signed_prekey');
    const spk = formatted.signed_prekey as Record<string, unknown>;
    expect(spk).toHaveProperty('public_key');
    expect(spk).toHaveProperty('signature');
    expect(spk).toHaveProperty('key_id');
    const otpks = formatted.one_time_prekeys as unknown[];
    expect(otpks).toHaveLength(2);
  });

  it('formats one-time prekeys with key_id and public_key', async () => {
    const bundle = await generateKeyBundle('device-y', 3);
    const formatted = await formatKeysForRegistration(bundle);
    const otpks = formatted.one_time_prekeys as Array<{
      key_id: string;
      public_key: string;
    }>;
    for (const k of otpks) {
      expect(k).toHaveProperty('key_id');
      expect(k).toHaveProperty('public_key');
      expect(typeof k.public_key).toBe('string');
    }
  });
});
