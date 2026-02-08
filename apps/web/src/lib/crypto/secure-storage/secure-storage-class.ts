/**
 * Secure Storage Class
 *
 * Provides encrypted storage for sensitive data (E2EE keys, tokens)
 * using IndexedDB with Web Crypto API encryption.
 *
 * WHY THIS IS NECESSARY:
 * - localStorage/sessionStorage are vulnerable to XSS attacks
 * - E2EE private keys must NEVER be accessible via JavaScript injection
 * - HTTP-only cookies protect tokens but cannot store asymmetric keys
 *
 * THREAT MODEL:
 * ✓ XSS Attacks: Encrypted data useless without password-derived key
 * ✓ localStorage Theft: No sensitive data in localStorage
 * ✓ Browser Extensions: Cannot access without user password
 * ✗ Memory Dumps: Keys temporarily in memory during use (OS-level attack)
 * ✗ Keyloggers: User password compromise (requires malware)
 *
 * Usage:
 * ```typescript
 * import SecureStorage from '@/lib/crypto/secureStorage';
 *
 * // Initialize with user password (derived from auth)
 * await SecureStorage.initialize(userPassword);
 *
 * // Store E2EE private key
 * await SecureStorage.setItem('identity_key', JSON.stringify(keyData));
 *
 * // Retrieve key
 * const key = await SecureStorage.getItem('identity_key');
 * ```
 *
 * @module lib/crypto/secure-storage/secure-storage-class
 * @security CRITICAL - DO NOT MODIFY WITHOUT SECURITY REVIEW
 */

import { createLogger } from '@/lib/logger';
import { STORE_NAME, PBKDF2_ITERATIONS } from './types';
import type { EncryptedItem, EncryptionMetadata } from './types';
import { initDB, getDeviceSalt, deriveKey, encryptData, decryptData } from './crypto-ops';

const logger = createLogger('SecureStorage');

/**
 * Secure Storage API
 */
class SecureStorage {
  private static encryptionKey: CryptoKey | null = null;
  private static deviceSalt: Uint8Array | null = null;
  private static isInitialized = false;

  /**
   * Initialize secure storage with password-derived encryption key
   *
   * IMPORTANT: Call this after successful authentication
   * The password should be the user's actual password (not stored anywhere)
   */
  static async initialize(password: string): Promise<void> {
    try {
      this.deviceSalt = await getDeviceSalt();
      this.encryptionKey = await deriveKey(password, this.deviceSalt);
      this.isInitialized = true;

      // Clean up expired items
      await this.cleanupExpiredItems();
    } catch (error) {
      logger.error('Initialization failed:', error);
      throw new Error('Failed to initialize secure storage');
    }
  }

  /**
   * Check if storage is initialized
   */
  static isReady(): boolean {
    return this.isInitialized && this.encryptionKey !== null;
  }

  /**
   * Store encrypted item
   */
  static async setItem(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.isReady()) {
      throw new Error('SecureStorage not initialized - call initialize() first');
    }

    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const { ciphertext, iv } = await encryptData(value, this.encryptionKey!);

    const item: EncryptedItem = {
      id: key,
      ciphertext,
      iv,
      salt: this.deviceSalt!.buffer as ArrayBuffer,
      createdAt: Date.now(),
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    };

    return new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Retrieve and decrypt item
   */
  static async getItem(key: string): Promise<string | null> {
    if (!this.isReady()) {
      throw new Error('SecureStorage not initialized - call initialize() first');
    }

    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = async () => {
        if (!request.result) {
          resolve(null);
          return;
        }

        const item = request.result as EncryptedItem;

        // Check expiration
        if (item.expiresAt && item.expiresAt < Date.now()) {
          await this.removeItem(key);
          resolve(null);
          return;
        }

        try {
          const plaintext = await decryptData(item.ciphertext, item.iv, this.encryptionKey!);
          resolve(plaintext);
        } catch (error) {
          logger.error('Decryption failed:', error);
          resolve(null);
        }
      };
    });
  }

  /**
   * Remove item
   */
  static async removeItem(key: string): Promise<void> {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Clear all encrypted data
   */
  static async clear(): Promise<void> {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Cleanup expired items
   */
  static async cleanupExpiredItems(): Promise<number> {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('expiresAt');

    return new Promise((resolve, reject) => {
      const request = index.openCursor();
      let deletedCount = 0;

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const item = cursor.value as EncryptedItem;
          if (item.expiresAt && item.expiresAt < Date.now()) {
            cursor.delete();
            deletedCount++;
          }
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };
    });
  }

  /**
   * Get metadata about encryption configuration
   */
  static getMetadata(): EncryptionMetadata {
    return {
      algorithm: 'AES-GCM',
      keyDerivation: 'PBKDF2',
      iterations: PBKDF2_ITERATIONS,
      ivLength: 12,
      saltLength: 32,
      version: 2,
    };
  }

  /**
   * Destroy the encryption key (logout)
   */
  static destroy(): void {
    this.encryptionKey = null;
    this.deviceSalt = null;
    this.isInitialized = false;
  }

  /**
   * Check if a key exists
   */
  static async hasItem(key: string): Promise<boolean> {
    const value = await this.getItem(key);
    return value !== null;
  }

  /**
   * Get all keys (for migration purposes)
   */
  static async getAllKeys(): Promise<string[]> {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.getAllKeys();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as string[]);
    });
  }
}

export default SecureStorage;
