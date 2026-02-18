/**
 * Tests for e2ee-secure/key-storage.ts
 *
 * Encrypted key storage using SecureStorage.
 * Mocks SecureStorage and e2ee module to test storage/load logic.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const { mockSecureStorage, mockConstants } = vi.hoisted(() => ({
  mockSecureStorage: {
    isReady: vi.fn(() => true),
    setItem: vi.fn(),
    getItem: vi.fn(),
  },
  mockConstants: {
    IDENTITY_KEY: 'e2ee_identity_key',
    SIGNED_PREKEY: 'e2ee_signed_prekey',
    DEVICE_ID: 'e2ee_device_id',
  },
}));

vi.mock('../../secureStorage', () => ({
  default: mockSecureStorage,
}));

vi.mock('../constants', () => ({
  SECURE_KEYS: mockConstants,
}));

// Mock the dynamic import of '../e2ee'
const mockExportPublicKey = vi.fn(async () => new ArrayBuffer(65));
const mockExportPrivateKey = vi.fn(async () => new ArrayBuffer(32));
const mockImportPublicKey = vi.fn(async () => ({ type: 'public' }) as unknown as CryptoKey);
const mockImportPrivateKey = vi.fn(async () => ({ type: 'private' }) as unknown as CryptoKey);
const mockImportSigningPublicKey = vi.fn(async () => ({ type: 'public' }) as unknown as CryptoKey);
const mockImportSigningPrivateKey = vi.fn(async () => ({ type: 'private' }) as unknown as CryptoKey);
const mockGenerateECDSAKeyPair = vi.fn(async () => ({
  publicKey: { type: 'public' } as unknown as CryptoKey,
  privateKey: { type: 'private' } as unknown as CryptoKey,
}));
const mockArrayBufferToBase64 = vi.fn(() => 'base64data');
const mockBase64ToArrayBuffer = vi.fn(() => new ArrayBuffer(32));

vi.mock('../../e2ee', () => ({
  exportPublicKey: mockExportPublicKey,
  exportPrivateKey: mockExportPrivateKey,
  importPublicKey: mockImportPublicKey,
  importPrivateKey: mockImportPrivateKey,
  importSigningPublicKey: mockImportSigningPublicKey,
  importSigningPrivateKey: mockImportSigningPrivateKey,
  generateECDSAKeyPair: mockGenerateECDSAKeyPair,
  arrayBufferToBase64: mockArrayBufferToBase64,
  base64ToArrayBuffer: mockBase64ToArrayBuffer,
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------
import {
  storeKeyBundle,
  loadIdentityKeyPair,
  loadSignedPreKey,
  getDeviceId,
  isE2EESetUp,
} from '../key-storage';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('storeKeyBundle', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws when SecureStorage not ready', async () => {
    mockSecureStorage.isReady.mockReturnValue(false);
    const bundle = {
      identityKey: { keyPair: { publicKey: {}, privateKey: {} }, keyId: 1 },
      signedPreKey: { keyPair: { publicKey: {}, privateKey: {} }, keyId: 2, signature: new ArrayBuffer(64) },
      deviceId: 'dev-1',
      oneTimePreKeys: [],
    };
    await expect(storeKeyBundle(bundle as never)).rejects.toThrow('SecureStorage not initialized');
  });

  it('stores identity key, signed prekey, and device ID', async () => {
    mockSecureStorage.isReady.mockReturnValue(true);
    const bundle = {
      identityKey: { keyPair: { publicKey: {}, privateKey: {} }, keyId: 1 },
      signedPreKey: { keyPair: { publicKey: {}, privateKey: {} }, keyId: 2, signature: new ArrayBuffer(64) },
      deviceId: 'dev-123',
      oneTimePreKeys: [],
    };

    await storeKeyBundle(bundle as never);

    expect(mockSecureStorage.setItem).toHaveBeenCalledTimes(3);
    expect(mockSecureStorage.setItem).toHaveBeenCalledWith(
      mockConstants.IDENTITY_KEY,
      expect.any(String)
    );
    expect(mockSecureStorage.setItem).toHaveBeenCalledWith(
      mockConstants.SIGNED_PREKEY,
      expect.any(String)
    );
    expect(mockSecureStorage.setItem).toHaveBeenCalledWith(
      mockConstants.DEVICE_ID,
      'dev-123'
    );
  });
});

describe('loadIdentityKeyPair', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns null when SecureStorage not ready', async () => {
    mockSecureStorage.isReady.mockReturnValue(false);
    expect(await loadIdentityKeyPair()).toBeNull();
  });

  it('returns null when no stored data', async () => {
    mockSecureStorage.isReady.mockReturnValue(true);
    mockSecureStorage.getItem.mockResolvedValue(null);
    expect(await loadIdentityKeyPair()).toBeNull();
  });

  it('loads and imports key pair with signing keys', async () => {
    mockSecureStorage.isReady.mockReturnValue(true);
    mockSecureStorage.getItem.mockResolvedValue(
      JSON.stringify({
        publicKey: 'pub64',
        privateKey: 'priv64',
        keyId: 42,
        signingPublicKey: 'spub64',
        signingPrivateKey: 'spriv64',
      })
    );

    const result = await loadIdentityKeyPair();
    expect(result).not.toBeNull();
    expect(result!.keyId).toBe(42);
    expect(mockImportPublicKey).toHaveBeenCalled();
    expect(mockImportPrivateKey).toHaveBeenCalled();
    expect(mockImportSigningPublicKey).toHaveBeenCalled();
    expect(mockImportSigningPrivateKey).toHaveBeenCalled();
  });

  it('generates signing keys on migration', async () => {
    mockSecureStorage.isReady.mockReturnValue(true);
    mockSecureStorage.getItem.mockResolvedValue(
      JSON.stringify({
        publicKey: 'pub64',
        privateKey: 'priv64',
        keyId: 1,
        // No signing keys — triggers migration
      })
    );

    const result = await loadIdentityKeyPair();
    expect(result).not.toBeNull();
    expect(mockGenerateECDSAKeyPair).toHaveBeenCalled();
    // Should update storage with new signing keys
    expect(mockSecureStorage.setItem).toHaveBeenCalledWith(
      mockConstants.IDENTITY_KEY,
      expect.any(String)
    );
  });

  it('returns null on parse error', async () => {
    mockSecureStorage.isReady.mockReturnValue(true);
    mockSecureStorage.getItem.mockResolvedValue('invalid json{{{');
    expect(await loadIdentityKeyPair()).toBeNull();
  });
});

describe('loadSignedPreKey', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns null when not ready', async () => {
    mockSecureStorage.isReady.mockReturnValue(false);
    expect(await loadSignedPreKey()).toBeNull();
  });

  it('returns null when no data', async () => {
    mockSecureStorage.isReady.mockReturnValue(true);
    mockSecureStorage.getItem.mockResolvedValue(null);
    expect(await loadSignedPreKey()).toBeNull();
  });

  it('loads signed prekey with imported keys', async () => {
    mockSecureStorage.isReady.mockReturnValue(true);
    mockSecureStorage.getItem.mockResolvedValue(
      JSON.stringify({
        publicKey: 'spk-pub',
        privateKey: 'spk-priv',
        keyId: 7,
        signature: 'sig64',
      })
    );

    const result = await loadSignedPreKey();
    expect(result).not.toBeNull();
    expect(result!.keyId).toBe(7);
    expect(mockImportPublicKey).toHaveBeenCalled();
    expect(mockImportPrivateKey).toHaveBeenCalled();
    expect(mockBase64ToArrayBuffer).toHaveBeenCalledWith('sig64');
  });
});

describe('getDeviceId', () => {
  it('returns null when not ready', async () => {
    mockSecureStorage.isReady.mockReturnValue(false);
    expect(await getDeviceId()).toBeNull();
  });

  it('returns device ID from secure storage', async () => {
    mockSecureStorage.isReady.mockReturnValue(true);
    mockSecureStorage.getItem.mockResolvedValue('dev-abc');
    expect(await getDeviceId()).toBe('dev-abc');
  });
});

describe('isE2EESetUp', () => {
  it('returns false when not ready', async () => {
    mockSecureStorage.isReady.mockReturnValue(false);
    expect(await isE2EESetUp()).toBe(false);
  });

  it('returns true when identity key loads', async () => {
    mockSecureStorage.isReady.mockReturnValue(true);
    mockSecureStorage.getItem.mockResolvedValue(
      JSON.stringify({
        publicKey: 'p', privateKey: 'p', keyId: 1,
        signingPublicKey: 'sp', signingPrivateKey: 'sp',
      })
    );
    expect(await isE2EESetUp()).toBe(true);
  });

  it('returns false when identity key missing', async () => {
    mockSecureStorage.isReady.mockReturnValue(true);
    mockSecureStorage.getItem.mockResolvedValue(null);
    expect(await isE2EESetUp()).toBe(false);
  });
});
