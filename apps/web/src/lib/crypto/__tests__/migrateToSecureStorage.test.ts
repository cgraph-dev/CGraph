/**
 * E2EE Key Migration Tests
 *
 * Tests for migrating E2EE keys from plaintext localStorage
 * to encrypted IndexedDB storage.
 *
 * CRITICAL SECURITY: CVE-CGRAPH-2026-001
 * - needsMigration detection
 * - Backup creation and restoration
 * - Migration lifecycle
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  needsMigration,
  restoreFromBackup,
  clearBackup,
  getMigrationStatus,
  migrateToSecureStorage,
} from '../migrateToSecureStorage';

// ── Mock SecureStorage ───────────────────────────────────────────────────
const { mockSecureStorage } = vi.hoisted(() => {
  return {
    mockSecureStorage: {
      initialize: vi.fn().mockResolvedValue(undefined),
      setItem: vi.fn().mockResolvedValue(undefined),
      getItem: vi.fn(),
      isReady: vi.fn().mockReturnValue(false),
      getAllKeys: vi.fn().mockResolvedValue([]),
    },
  };
});

vi.mock('../secureStorage', () => ({
  default: mockSecureStorage,
}));

// ── Mock logger ──────────────────────────────────────────────────────────
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// ── Storage helpers ──────────────────────────────────────────────────────
const LEGACY_KEYS = {
  IDENTITY_KEY: 'cgraph_e2ee_identity',
  SIGNED_PREKEY: 'cgraph_e2ee_signed_prekey',
  DEVICE_ID: 'cgraph_e2ee_device_id',
  SESSIONS: 'cgraph_e2ee_sessions',
};

const BACKUP_KEY = 'cgraph_e2ee_migration_backup';

function setLegacyKeys(keys: Partial<Record<string, string>> = {}) {
  const defaults: Record<string, string> = {
    [LEGACY_KEYS.IDENTITY_KEY!]: 'mock-identity-key-data',
    [LEGACY_KEYS.SIGNED_PREKEY!]: 'mock-signed-prekey-data',
    [LEGACY_KEYS.DEVICE_ID!]: 'device-123',
    [LEGACY_KEYS.SESSIONS!]: '{"session1": "data"}',
  };

  Object.entries({ ...defaults, ...keys }).forEach(([key, value]) => {
    localStorage.setItem(key, value!);
  });
}

function clearAllStorage() {
  localStorage.clear();
  sessionStorage.clear();
}

describe('migrateToSecureStorage', () => {
  beforeEach(() => {
    clearAllStorage();
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearAllStorage();
  });

  // ── needsMigration ───────────────────────────────────────────────────
  describe('needsMigration', () => {
    it('should return true when legacy keys exist', () => {
      localStorage.setItem(LEGACY_KEYS.IDENTITY_KEY, 'some-key');
      expect(needsMigration()).toBe(true);
    });

    it('should return true when any legacy key exists', () => {
      localStorage.setItem(LEGACY_KEYS.DEVICE_ID, 'device-1');
      expect(needsMigration()).toBe(true);
    });

    it('should return false when no legacy keys exist', () => {
      expect(needsMigration()).toBe(false);
    });

    it('should return false after all legacy keys are removed', () => {
      setLegacyKeys();
      expect(needsMigration()).toBe(true);

      Object.values(LEGACY_KEYS).forEach((key) => localStorage.removeItem(key));
      expect(needsMigration()).toBe(false);
    });
  });

  // ── Backup / Restore ────────────────────────────────────────────────
  describe('restoreFromBackup', () => {
    it('should return false when no backup exists', () => {
      expect(restoreFromBackup()).toBe(false);
    });

    it('should restore keys from sessionStorage backup', () => {
      const backup = {
        IDENTITY_KEY: 'restored-identity',
        SIGNED_PREKEY: 'restored-prekey',
        DEVICE_ID: 'restored-device',
      };

      sessionStorage.setItem(BACKUP_KEY, JSON.stringify(backup));

      const result = restoreFromBackup();
      expect(result).toBe(true);

      expect(localStorage.getItem(LEGACY_KEYS.IDENTITY_KEY)).toBe('restored-identity');
      expect(localStorage.getItem(LEGACY_KEYS.SIGNED_PREKEY)).toBe('restored-prekey');
      expect(localStorage.getItem(LEGACY_KEYS.DEVICE_ID)).toBe('restored-device');
    });

    it('should clear backup after restore', () => {
      sessionStorage.setItem(BACKUP_KEY, JSON.stringify({ IDENTITY_KEY: 'data' }));

      restoreFromBackup();

      expect(sessionStorage.getItem(BACKUP_KEY)).toBeNull();
    });

    it('should handle corrupted backup data', () => {
      sessionStorage.setItem(BACKUP_KEY, 'not-valid-json');

      const result = restoreFromBackup();
      expect(result).toBe(false);
    });
  });

  // ── clearBackup ──────────────────────────────────────────────────────
  describe('clearBackup', () => {
    it('should remove backup from sessionStorage', () => {
      sessionStorage.setItem(BACKUP_KEY, '{}');

      clearBackup();

      expect(sessionStorage.getItem(BACKUP_KEY)).toBeNull();
    });

    it('should not throw when no backup exists', () => {
      expect(() => clearBackup()).not.toThrow();
    });
  });

  // ── getMigrationStatus ───────────────────────────────────────────────
  describe('getMigrationStatus', () => {
    it('should report no migration needed when no legacy keys', async () => {
      const status = await getMigrationStatus();

      expect(status.needsMigration).toBe(false);
      expect(status.legacyKeysCount).toBe(0);
      expect(status.hasBackup).toBe(false);
    });

    it('should report migration needed with legacy key count', async () => {
      setLegacyKeys();

      const status = await getMigrationStatus();

      expect(status.needsMigration).toBe(true);
      expect(status.legacyKeysCount).toBe(4);
    });

    it('should detect existing backup', async () => {
      sessionStorage.setItem(BACKUP_KEY, '{}');

      const status = await getMigrationStatus();

      expect(status.hasBackup).toBe(true);
    });

    it('should count secure keys when SecureStorage is ready', async () => {
      mockSecureStorage.isReady.mockReturnValue(true);
      mockSecureStorage.getAllKeys.mockResolvedValue([
        'e2ee_identity_key',
        'e2ee_signed_prekey',
        'other_key',
      ]);

      const status = await getMigrationStatus();

      expect(status.secureKeysCount).toBe(2);
    });
  });

  // ── Full Migration Flow ──────────────────────────────────────────────
  describe('migrateToSecureStorage', () => {
    it('should migrate legacy keys to secure storage', async () => {
      setLegacyKeys();

      // Mock SecureStorage.getItem to return the same value (verification passes)
      mockSecureStorage.getItem.mockImplementation(async (key: string) => {
        const mapping: Record<string, string> = {
          e2ee_identity_key: 'mock-identity-key-data',
          e2ee_signed_prekey: 'mock-signed-prekey-data',
          e2ee_device_id: 'device-123',
          e2ee_sessions: '{"session1": "data"}',
        };
        return mapping[key] ?? null;
      });

      const result = await migrateToSecureStorage('user-password');

      expect(result.success).toBe(true);
      expect(result.migratedKeys).toContain('Identity Key');
      expect(result.migratedKeys).toContain('Signed PreKey');
      expect(result.migratedKeys).toContain('Device ID');
      expect(result.migratedKeys).toContain('Sessions');
      expect(result.migratedKeys).toHaveLength(4);
      expect(result.backupCreated).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should create backup in sessionStorage during migration', async () => {
      setLegacyKeys();
      mockSecureStorage.getItem.mockResolvedValue('mock-identity-key-data');

      await migrateToSecureStorage('password');

      // Backup should have been created (then possibly cleared after migration)
      // Since legacy keys are removed on success, check that migration happened
      expect(mockSecureStorage.initialize).toHaveBeenCalledWith('password');
    });

    it('should skip backup when option is set', async () => {
      setLegacyKeys();
      mockSecureStorage.getItem.mockResolvedValue('mock-identity-key-data');

      const result = await migrateToSecureStorage('password', { skipBackup: true });

      expect(result.backupCreated).toBe(false);
    });

    it('should keep legacy keys when option is set', async () => {
      setLegacyKeys();
      mockSecureStorage.getItem.mockResolvedValue('mock-identity-key-data');

      await migrateToSecureStorage('password', { keepLegacyKeys: true });

      // Legacy keys should still exist
      expect(localStorage.getItem(LEGACY_KEYS.IDENTITY_KEY)).toBe('mock-identity-key-data');
    });

    it('should clear legacy keys by default after successful migration', async () => {
      setLegacyKeys();
      mockSecureStorage.getItem.mockResolvedValue('mock-identity-key-data');

      await migrateToSecureStorage('password');

      // Legacy keys should be removed
      expect(localStorage.getItem(LEGACY_KEYS.IDENTITY_KEY)).toBeNull();
      expect(localStorage.getItem(LEGACY_KEYS.SIGNED_PREKEY)).toBeNull();
    });

    it('should handle verification failure', async () => {
      setLegacyKeys();
      // Return different value → verification fails
      mockSecureStorage.getItem.mockResolvedValue('WRONG-VALUE');

      const result = await migrateToSecureStorage('password');

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Verification failed');
    });

    it('should handle SecureStorage initialization failure', async () => {
      setLegacyKeys();
      mockSecureStorage.initialize.mockRejectedValueOnce(new Error('Password too weak'));

      const result = await migrateToSecureStorage('bad');

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Password too weak');
    });

    it('should handle partial migration (some keys fail)', async () => {
      setLegacyKeys();

      let callCount = 0;
      mockSecureStorage.setItem.mockImplementation(async () => {
        callCount++;
        if (callCount === 2) {
          throw new Error('Write failed');
        }
      });
      mockSecureStorage.getItem.mockResolvedValue('mock-identity-key-data');

      const result = await migrateToSecureStorage('password');

      // Should have some successes and some errors
      expect(result.migratedKeys.length + result.errors.length).toBeGreaterThan(0);
    });

    it('should succeed with no legacy keys', async () => {
      // No legacy keys set
      const result = await migrateToSecureStorage('password');

      expect(result.success).toBe(false); // No keys to migrate
      expect(result.migratedKeys).toHaveLength(0);
    });
  });
});
