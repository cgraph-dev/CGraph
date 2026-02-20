/**
 * Tests for e2ee/key-bundle.ts
 *
 * Key bundle generation, storage, loading, device ID,
 * E2EE setup check, server registration formatting, and cleanup.
 *
 * Uses real Web Crypto API (Node 20+) with mocked localStorage.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateKeyBundle,
  storeKeyBundle,
  loadIdentityKeyPair,
  loadSignedPreKey,
  getDeviceId,
  isE2EESetUp,
  formatKeysForRegistration,
  clearE2EEData,
} from '../key-bundle';

// ---------------------------------------------------------------------------
// Mock localStorage
// ---------------------------------------------------------------------------
const store: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete store[key];
  }),
  clear: vi.fn(() => {
    for (const k of Object.keys(store)) delete store[k];
  }),
};

Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage, writable: true });

// ---------- helpers --------------------------------------------------------

function clearStore() {
  for (const k of Object.keys(store)) delete store[k];
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('key-bundle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearStore();
  });

  // ── generateKeyBundle ───────────────────────────────────────────────
  describe('generateKeyBundle', () => {
    it('returns a complete bundle with correct deviceId', async () => {
      const bundle = await generateKeyBundle('device-1', 5);
      expect(bundle.deviceId).toBe('device-1');
      expect(bundle.identityKey).toBeDefined();
      expect(bundle.signedPreKey).toBeDefined();
      expect(bundle.oneTimePreKeys).toHaveLength(5);
    });

    it('identity key has both ECDH and ECDSA key pairs', async () => {
      const bundle = await generateKeyBundle('d1', 1);
      expect(bundle.identityKey.keyPair.publicKey.type).toBe('public');
      expect(bundle.identityKey.keyPair.privateKey.type).toBe('private');
      // ECDSA signing key pair
      expect(bundle.identityKey.signingKeyPair.publicKey.type).toBe('public');
      expect(bundle.identityKey.signingKeyPair.privateKey.type).toBe('private');
    });

    it('signed prekey has a signature', async () => {
      const bundle = await generateKeyBundle('d1', 1);
      expect(bundle.signedPreKey.signature).toBeDefined();
      expect(bundle.signedPreKey.signature.byteLength).toBeGreaterThan(0);
    });

    it('each one-time prekey has unique keyId', async () => {
      const bundle = await generateKeyBundle('d1', 10);
      const ids = bundle.oneTimePreKeys.map((k) => k.keyId);
      expect(new Set(ids).size).toBe(10);
    });

    it('defaults to 100 one-time prekeys when count omitted', async () => {
      const bundle = await generateKeyBundle('d1');
      expect(bundle.oneTimePreKeys.length).toBe(100);
    });
  });

  // ── storeKeyBundle ──────────────────────────────────────────────────
  describe('storeKeyBundle', () => {
    it('stores identity, signed prekey, and device ID', async () => {
      const bundle = await generateKeyBundle('dev-store', 2);
      await storeKeyBundle(bundle);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'cgraph_e2ee_identity',
        expect.any(String)
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'cgraph_e2ee_signed_prekey',
        expect.any(String)
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('cgraph_e2ee_device_id', 'dev-store');
    });

    it('stored identity data is valid JSON with expected keys', async () => {
      const bundle = await generateKeyBundle('d1', 1);
      await storeKeyBundle(bundle);

      const raw = store['cgraph_e2ee_identity'];
      expect(raw).toBeDefined();
      const parsed = JSON.parse(raw!);
      expect(parsed).toHaveProperty('publicKey');
      expect(parsed).toHaveProperty('privateKey');
      expect(parsed).toHaveProperty('signingPublicKey');
      expect(parsed).toHaveProperty('signingPrivateKey');
      expect(parsed).toHaveProperty('keyId');
    });
  });

  // ── loadIdentityKeyPair ─────────────────────────────────────────────
  describe('loadIdentityKeyPair', () => {
    it('returns null when nothing stored', async () => {
      const result = await loadIdentityKeyPair();
      expect(result).toBeNull();
    });

    it('round-trips through store and load', async () => {
      const bundle = await generateKeyBundle('d1', 1);
      await storeKeyBundle(bundle);

      const loaded = await loadIdentityKeyPair();
      expect(loaded).not.toBeNull();
      expect(loaded!.keyId).toBe(bundle.identityKey.keyId);
      expect(loaded!.keyPair.publicKey.type).toBe('public');
      expect(loaded!.keyPair.privateKey.type).toBe('private');
      expect(loaded!.signingKeyPair.publicKey.type).toBe('public');
      expect(loaded!.signingKeyPair.privateKey.type).toBe('private');
    });

    it('returns null on corrupt JSON', async () => {
      store['cgraph_e2ee_identity'] = 'not-valid-json{{{';
      const result = await loadIdentityKeyPair();
      expect(result).toBeNull();
    });
  });

  // ── loadSignedPreKey ────────────────────────────────────────────────
  describe('loadSignedPreKey', () => {
    it('returns null when nothing stored', async () => {
      expect(await loadSignedPreKey()).toBeNull();
    });

    it('round-trips through store and load', async () => {
      const bundle = await generateKeyBundle('d1', 1);
      await storeKeyBundle(bundle);

      const loaded = await loadSignedPreKey();
      expect(loaded).not.toBeNull();
      expect(loaded!.keyId).toBe(bundle.signedPreKey.keyId);
      expect(loaded!.signature).toBeDefined();
    });

    it('returns null on corrupt data', async () => {
      store['cgraph_e2ee_signed_prekey'] = '{bad}';
      expect(await loadSignedPreKey()).toBeNull();
    });
  });

  // ── getDeviceId ─────────────────────────────────────────────────────
  describe('getDeviceId', () => {
    it('returns null when not stored', async () => {
      expect(await getDeviceId()).toBeNull();
    });

    it('returns stored device ID', async () => {
      const bundle = await generateKeyBundle('my-device', 1);
      await storeKeyBundle(bundle);
      expect(await getDeviceId()).toBe('my-device');
    });
  });

  // ── isE2EESetUp ─────────────────────────────────────────────────────
  describe('isE2EESetUp', () => {
    it('returns false when no keys stored', async () => {
      expect(await isE2EESetUp()).toBe(false);
    });

    it('returns true after storing a bundle', async () => {
      const bundle = await generateKeyBundle('d1', 1);
      await storeKeyBundle(bundle);
      expect(await isE2EESetUp()).toBe(true);
    });
  });

  // ── formatKeysForRegistration ───────────────────────────────────────
  describe('formatKeysForRegistration', () => {
    it('produces server-ready format', async () => {
      const bundle = await generateKeyBundle('d-reg', 3);
      const formatted = await formatKeysForRegistration(bundle);

      expect(formatted.device_id).toBe('d-reg');
      expect(typeof formatted.identity_key).toBe('string');
      expect(typeof formatted.signing_key).toBe('string');
      expect(typeof formatted.key_id).toBe('string');

      const signedPK = formatted.signed_prekey as Record<string, unknown>;
      expect(typeof signedPK.public_key).toBe('string');
      expect(typeof signedPK.signature).toBe('string');
      expect(typeof signedPK.key_id).toBe('string');

      const otpks = formatted.one_time_prekeys as Array<Record<string, unknown>>;
      expect(otpks).toHaveLength(3);
      expect(typeof otpks[0]!.public_key).toBe('string');
      expect(typeof otpks[0]!.key_id).toBe('string');
    });
  });

  // ── clearE2EEData ───────────────────────────────────────────────────
  describe('clearE2EEData', () => {
    it('removes all E2EE keys from storage', async () => {
      const bundle = await generateKeyBundle('d1', 1);
      await storeKeyBundle(bundle);
      expect(await getDeviceId()).toBe('d1');

      await clearE2EEData();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('cgraph_e2ee_identity');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('cgraph_e2ee_signed_prekey');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('cgraph_e2ee_device_id');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('cgraph_e2ee_sessions');
    });
  });
});
