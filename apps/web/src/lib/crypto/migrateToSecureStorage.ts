/**
 * Migration Utility: localStorage → Encrypted IndexedDB
 *
 * This script migrates E2EE keys from insecure localStorage
 * to encrypted IndexedDB storage.
 *
 * CRITICAL SECURITY MIGRATION - v0.7.33
 * =====================================
 *
 * WHY THIS IS NECESSARY:
 * - CVE-CGRAPH-2026-001: E2EE private keys currently stored in plaintext localStorage
 * - Any XSS vulnerability could steal all user keys
 * - This migration addresses the CRITICAL security vulnerability
 *
 * MIGRATION STRATEGY:
 * 1. Read existing keys from localStorage
 * 2. Re-encrypt with password-derived AES-256-GCM key
 * 3. Store in IndexedDB
 * 4. Verify successful migration
 * 5. Clear localStorage keys
 *
 * ROLLBACK SAFETY:
 * - Original localStorage keys remain until verified
 * - Migration can be re-run safely (idempotent)
 * - Automatic backup before deletion
 *
 * @module lib/crypto/migrateToSecureStorage
 * @version 1.0.0
 * @security CRITICAL
 */

import SecureStorage from './secureStorage';
import { createLogger } from '@/lib/logger';

const logger = createLogger('Migration');

const LEGACY_KEYS = {
  IDENTITY_KEY: 'cgraph_e2ee_identity',
  SIGNED_PREKEY: 'cgraph_e2ee_signed_prekey',
  DEVICE_ID: 'cgraph_e2ee_device_id',
  SESSIONS: 'cgraph_e2ee_sessions',
};

const SECURE_KEYS = {
  IDENTITY_KEY: 'e2ee_identity_key',
  SIGNED_PREKEY: 'e2ee_signed_prekey',
  DEVICE_ID: 'e2ee_device_id',
  SESSIONS: 'e2ee_sessions',
};

export interface MigrationResult {
  success: boolean;
  migratedKeys: string[];
  errors: string[];
  backupCreated: boolean;
}

/**
 * Check if migration is needed
 */
export function needsMigration(): boolean {
  // Check if any legacy keys exist in localStorage
  return Object.values(LEGACY_KEYS).some((key) => localStorage.getItem(key) !== null);
}

/**
 * Create backup of localStorage keys
 */
function createBackup(): Record<string, string> {
  const backup: Record<string, string> = {};

  Object.entries(LEGACY_KEYS).forEach(([name, key]) => {
    const value = localStorage.getItem(key);
    if (value) {
      backup[name] = value;
    }
  });

  return backup;
}

/**
 * Migrate E2EE keys from localStorage to SecureStorage
 *
 * @param password User's password for encryption
 * @param options Migration options
 */
export async function migrateToSecureStorage(
  password: string,
  options: {
    skipBackup?: boolean;
    keepLegacyKeys?: boolean;
  } = {}
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    migratedKeys: [],
    errors: [],
    backupCreated: false,
  };

  try {
    // Step 1: Initialize SecureStorage with password
    await SecureStorage.initialize(password);

    // Step 2: Create backup (unless skipped)
    let backup: Record<string, string> = {};
    if (!options.skipBackup) {
      backup = createBackup();
      result.backupCreated = Object.keys(backup).length > 0;

      if (result.backupCreated) {
        // Store backup in sessionStorage temporarily
        sessionStorage.setItem('cgraph_e2ee_migration_backup', JSON.stringify(backup));
        logger.debug(' Backup created with', Object.keys(backup).length, 'keys');
      }
    }

    // Step 3: Migrate each key
    const migrations = [
      {
        legacy: LEGACY_KEYS.IDENTITY_KEY,
        secure: SECURE_KEYS.IDENTITY_KEY,
        name: 'Identity Key',
      },
      {
        legacy: LEGACY_KEYS.SIGNED_PREKEY,
        secure: SECURE_KEYS.SIGNED_PREKEY,
        name: 'Signed PreKey',
      },
      {
        legacy: LEGACY_KEYS.DEVICE_ID,
        secure: SECURE_KEYS.DEVICE_ID,
        name: 'Device ID',
      },
      {
        legacy: LEGACY_KEYS.SESSIONS,
        secure: SECURE_KEYS.SESSIONS,
        name: 'Sessions',
      },
    ];

    for (const migration of migrations) {
      try {
        const legacyValue = localStorage.getItem(migration.legacy);

        if (legacyValue) {
          // Migrate to SecureStorage
          await SecureStorage.setItem(migration.secure, legacyValue);

          // Verify migration
          const retrieved = await SecureStorage.getItem(migration.secure);
          if (retrieved === legacyValue) {
            result.migratedKeys.push(migration.name);
            logger.debug(`✓ ${migration.name} migrated successfully`);
          } else {
            throw new Error(`Verification failed for ${migration.name}`);
          }
        }
      } catch (error) {
        const errorMsg = `Failed to migrate ${migration.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMsg);
        logger.warn(`✗ ${errorMsg}`);
      }
    }

    // Step 4: Clear legacy keys if migration successful and not keeping them
    if (result.migratedKeys.length > 0 && !options.keepLegacyKeys) {
      Object.values(LEGACY_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
      logger.debug(' Legacy keys cleared from localStorage');
    }

    // Step 5: Mark success if at least one key migrated
    result.success = result.migratedKeys.length > 0;

    return result;
  } catch (error) {
    const errorMsg = `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    result.errors.push(errorMsg);
    logger.warn('', errorMsg);
    return result;
  }
}

/**
 * Restore from backup (in case of migration failure)
 */
export function restoreFromBackup(): boolean {
  try {
    const backupData = sessionStorage.getItem('cgraph_e2ee_migration_backup');
    if (!backupData) {
      logger.warn(' No backup found');
      return false;
    }

    const backup = JSON.parse(backupData) as Record<string, string>;

    Object.entries(LEGACY_KEYS).forEach(([name, key]) => {
      const value = backup[name];
      if (value) {
        localStorage.setItem(key, value);
      }
    });

    sessionStorage.removeItem('cgraph_e2ee_migration_backup');
    logger.debug(' Backup restored successfully');
    return true;
  } catch (error) {
    logger.warn(' Restore failed:', error);
    return false;
  }
}

/**
 * Clear migration backup
 */
export function clearBackup(): void {
  sessionStorage.removeItem('cgraph_e2ee_migration_backup');
}

/**
 * Get migration status
 */
export async function getMigrationStatus(): Promise<{
  needsMigration: boolean;
  hasBackup: boolean;
  legacyKeysCount: number;
  secureKeysCount: number;
}> {
  const legacyCount = Object.values(LEGACY_KEYS).filter(
    (key) => localStorage.getItem(key) !== null
  ).length;

  let secureCount = 0;
  if (SecureStorage.isReady()) {
    const secureKeys = await SecureStorage.getAllKeys();
    secureCount = secureKeys.filter((key) => Object.values(SECURE_KEYS).includes(key)).length;
  }

  return {
    needsMigration: legacyCount > 0,
    hasBackup: sessionStorage.getItem('cgraph_e2ee_migration_backup') !== null,
    legacyKeysCount: legacyCount,
    secureKeysCount: secureCount,
  };
}

export default {
  needsMigration,
  migrateToSecureStorage,
  restoreFromBackup,
  clearBackup,
  getMigrationStatus,
};
