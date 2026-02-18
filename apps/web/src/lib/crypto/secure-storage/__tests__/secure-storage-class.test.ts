/**
 * Tests for secure-storage/secure-storage-class.ts
 *
 * Encrypted storage powered by IndexedDB + Web Crypto.
 * We mock IndexedDB operations and crypto-ops to unit test
 * the class logic: lifecycle, TTL, CRUD, metadata.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock crypto-ops (the heavy crypto functions)
// ---------------------------------------------------------------------------
const { mockInitDB, mockGetDeviceSalt, mockDeriveKey, mockEncryptData, mockDecryptData } =
  vi.hoisted(() => ({
    mockInitDB: vi.fn(),
    mockGetDeviceSalt: vi.fn(),
    mockDeriveKey: vi.fn(),
    mockEncryptData: vi.fn(),
    mockDecryptData: vi.fn(),
  }));

vi.mock('../crypto-ops', () => ({
  initDB: mockInitDB,
  getDeviceSalt: mockGetDeviceSalt,
  deriveKey: mockDeriveKey,
  encryptData: mockEncryptData,
  decryptData: mockDecryptData,
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ log: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

// ---------------------------------------------------------------------------
// Fake IndexedDB transaction / object store
// ---------------------------------------------------------------------------
function createFakeStore(data: Map<string, unknown> = new Map()) {
  return {
    put: vi.fn((item: { id: string }) => {
      data.set(item.id, item);
      return { onerror: null, onsuccess: null, set onerror(_: unknown) {}, set onsuccess(cb: () => void) { cb?.(); } };
    }),
    get: vi.fn((key: string) => {
      const result = data.get(key) ?? null;
      return {
        result,
        onerror: null,
        set onerror(_: unknown) {},
        set onsuccess(cb: () => void) { cb?.(); },
        get onsuccess() { return null; },
      };
    }),
    delete: vi.fn((key: string) => {
      data.delete(key);
      return { set onerror(_: unknown) {}, set onsuccess(cb: () => void) { cb?.(); } };
    }),
    clear: vi.fn(() => {
      data.clear();
      return { set onerror(_: unknown) {}, set onsuccess(cb: () => void) { cb?.(); } };
    }),
    getAllKeys: vi.fn(() => {
      return {
        result: Array.from(data.keys()),
        set onerror(_: unknown) {},
        set onsuccess(cb: () => void) { cb?.(); },
      };
    }),
    index: vi.fn(() => ({
      openCursor: vi.fn(() => ({
        result: null,
        set onerror(_: unknown) {},
        set onsuccess(cb: () => void) { cb?.(); },
      })),
    })),
  };
}

function createFakeDB(store: ReturnType<typeof createFakeStore>) {
  return {
    transaction: vi.fn(() => ({
      objectStore: vi.fn(() => store),
    })),
  };
}

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------
import SecureStorage from '../secure-storage-class';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('SecureStorage', () => {
  let fakeStore: ReturnType<typeof createFakeStore>;
  let fakeDB: ReturnType<typeof createFakeDB>;
  const fakeKey = {} as CryptoKey;
  const fakeSalt = new Uint8Array(32).fill(0x01);

  beforeEach(() => {
    vi.clearAllMocks();
    SecureStorage.destroy(); // Reset static state

    fakeStore = createFakeStore();
    fakeDB = createFakeDB(fakeStore);

    mockGetDeviceSalt.mockResolvedValue(fakeSalt);
    mockDeriveKey.mockResolvedValue(fakeKey);
    mockInitDB.mockResolvedValue(fakeDB);
    mockEncryptData.mockResolvedValue({
      ciphertext: new ArrayBuffer(16),
      iv: new ArrayBuffer(12),
    });
    mockDecryptData.mockResolvedValue('decrypted-value');
  });

  // ── Lifecycle ───────────────────────────────────────────────────────
  describe('lifecycle', () => {
    it('starts as not ready', () => {
      expect(SecureStorage.isReady()).toBe(false);
    });

    it('initializes successfully', async () => {
      await SecureStorage.initialize('password123');
      expect(SecureStorage.isReady()).toBe(true);
      expect(mockGetDeviceSalt).toHaveBeenCalled();
      expect(mockDeriveKey).toHaveBeenCalledWith('password123', fakeSalt);
    });

    it('throws on initialization failure', async () => {
      mockGetDeviceSalt.mockRejectedValue(new Error('no indexeddb'));
      await expect(SecureStorage.initialize('pw')).rejects.toThrow(
        'Failed to initialize secure storage'
      );
      expect(SecureStorage.isReady()).toBe(false);
    });

    it('destroy clears key and resets state', async () => {
      await SecureStorage.initialize('pw');
      expect(SecureStorage.isReady()).toBe(true);
      SecureStorage.destroy();
      expect(SecureStorage.isReady()).toBe(false);
    });
  });

  // ── Operations require initialization ───────────────────────────────
  describe('uninitialized guards', () => {
    it('setItem throws when not initialized', async () => {
      await expect(SecureStorage.setItem('k', 'v')).rejects.toThrow('not initialized');
    });

    it('getItem throws when not initialized', async () => {
      await expect(SecureStorage.getItem('k')).rejects.toThrow('not initialized');
    });
  });

  // ── setItem ─────────────────────────────────────────────────────────
  describe('setItem', () => {
    beforeEach(async () => {
      await SecureStorage.initialize('pw');
    });

    it('encrypts and stores data', async () => {
      await SecureStorage.setItem('test-key', 'test-value');
      expect(mockEncryptData).toHaveBeenCalledWith('test-value', fakeKey);
      expect(fakeStore.put).toHaveBeenCalled();
    });

    it('stores with TTL when provided', async () => {
      const before = Date.now();
      await SecureStorage.setItem('ttl-key', 'val', 3600);
      const storedItem = fakeStore.put.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(storedItem.id).toBe('ttl-key');
      expect(storedItem.expiresAt).toBeGreaterThanOrEqual(before + 3600 * 1000);
    });

    it('stores without TTL when not provided', async () => {
      await SecureStorage.setItem('no-ttl', 'val');
      const storedItem = fakeStore.put.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(storedItem.expiresAt).toBeUndefined();
    });
  });

  // ── getItem ─────────────────────────────────────────────────────────
  describe('getItem', () => {
    beforeEach(async () => {
      await SecureStorage.initialize('pw');
    });

    it('returns null for missing key', async () => {
      // fakeStore.get returns null for missing keys
      const result = await SecureStorage.getItem('missing');
      expect(result).toBeNull();
    });
  });

  // ── removeItem ──────────────────────────────────────────────────────
  describe('removeItem', () => {
    it('deletes from store', async () => {
      await SecureStorage.initialize('pw');
      await SecureStorage.removeItem('some-key');
      expect(fakeStore.delete).toHaveBeenCalledWith('some-key');
    });
  });

  // ── clear ───────────────────────────────────────────────────────────
  describe('clear', () => {
    it('clears entire store', async () => {
      await SecureStorage.initialize('pw');
      await SecureStorage.clear();
      expect(fakeStore.clear).toHaveBeenCalled();
    });
  });

  // ── getMetadata ─────────────────────────────────────────────────────
  describe('getMetadata', () => {
    it('returns correct encryption metadata', () => {
      const meta = SecureStorage.getMetadata();
      expect(meta.algorithm).toBe('AES-GCM');
      expect(meta.keyDerivation).toBe('PBKDF2');
      expect(meta.iterations).toBe(600_000);
      expect(meta.ivLength).toBe(12);
      expect(meta.saltLength).toBe(32);
      expect(meta.version).toBe(2);
    });
  });

  // ── hasItem ─────────────────────────────────────────────────────────
  describe('hasItem', () => {
    beforeEach(async () => {
      await SecureStorage.initialize('pw');
    });

    it('returns false for missing key', async () => {
      expect(await SecureStorage.hasItem('missing')).toBe(false);
    });
  });

  // ── getAllKeys ───────────────────────────────────────────────────────
  describe('getAllKeys', () => {
    it('returns list of stored keys', async () => {
      await SecureStorage.initialize('pw');
      const storeData = new Map([
        ['key1', {}],
        ['key2', {}],
      ]);
      const store2 = createFakeStore(storeData);
      const db2 = createFakeDB(store2);
      mockInitDB.mockResolvedValue(db2);

      const keys = await SecureStorage.getAllKeys();
      expect(keys).toEqual(['key1', 'key2']);
    });
  });
});
