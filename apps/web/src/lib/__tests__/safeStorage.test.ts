/**
 * Safe Storage Wrapper Tests
 *
 * Tests for error-resilient localStorage and sessionStorage wrappers
 * used with Zustand persist middleware.
 *
 * Verifies graceful failure on:
 * - Storage quota exceeded
 * - Private/incognito mode blockers
 * - Corrupted storage data
 * - Policy-blocked storage access
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import {
  createSafeLocalStorage,
  createSafeSessionStorage,
  safeLocalStorage,
  safeSessionStorage,
} from '../safeStorage';

describe('safeStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // ── createSafeLocalStorage ───────────────────────────────────────────

  describe('createSafeLocalStorage', () => {
    it('should implement StateStorage interface', () => {
      const storage = createSafeLocalStorage();
      expect(storage).toHaveProperty('getItem');
      expect(storage).toHaveProperty('setItem');
      expect(storage).toHaveProperty('removeItem');
    });

    it('should set and get items', () => {
      const storage = createSafeLocalStorage();
      storage.setItem('key1', 'value1');
      expect(storage.getItem('key1')).toBe('value1');
    });

    it('should return null for missing keys', () => {
      const storage = createSafeLocalStorage();
      expect(storage.getItem('nonexistent')).toBeNull();
    });

    it('should remove items', () => {
      const storage = createSafeLocalStorage();
      storage.setItem('key2', 'value2');
      storage.removeItem('key2');
      expect(storage.getItem('key2')).toBeNull();
    });

    it('should handle getItem errors gracefully', () => {
      const storage = createSafeLocalStorage();
      const original = localStorage.getItem;
      localStorage.getItem = () => {
        throw new Error('SecurityError');
      };

      expect(storage.getItem('blocked')).toBeNull(); // Should NOT throw

      localStorage.getItem = original;
    });

    it('should handle setItem errors gracefully (quota exceeded)', () => {
      const storage = createSafeLocalStorage();
      const original = localStorage.setItem;
      localStorage.setItem = () => {
        throw new DOMException('QuotaExceededError');
      };

      // Should NOT throw
      expect(() => storage.setItem('big', 'data')).not.toThrow();

      localStorage.setItem = original;
    });

    it('should handle removeItem errors gracefully', () => {
      const storage = createSafeLocalStorage();
      const original = localStorage.removeItem;
      localStorage.removeItem = () => {
        throw new Error('SecurityError');
      };

      expect(() => storage.removeItem('blocked')).not.toThrow();

      localStorage.removeItem = original;
    });
  });

  // ── createSafeSessionStorage ─────────────────────────────────────────

  describe('createSafeSessionStorage', () => {
    it('should implement StateStorage interface', () => {
      const storage = createSafeSessionStorage();
      expect(storage).toHaveProperty('getItem');
      expect(storage).toHaveProperty('setItem');
      expect(storage).toHaveProperty('removeItem');
    });

    it('should set and get items in session storage', () => {
      const storage = createSafeSessionStorage();
      storage.setItem('session-key', 'session-value');
      expect(storage.getItem('session-key')).toBe('session-value');
    });

    it('should return null for missing keys', () => {
      const storage = createSafeSessionStorage();
      expect(storage.getItem('missing')).toBeNull();
    });

    it('should handle errors gracefully', () => {
      const storage = createSafeSessionStorage();
      const original = sessionStorage.getItem;
      sessionStorage.getItem = () => {
        throw new Error('Access denied');
      };

      expect(storage.getItem('blocked')).toBeNull();

      sessionStorage.getItem = original;
    });
  });

  // ── Pre-instantiated singletons ──────────────────────────────────────

  describe('pre-instantiated singletons', () => {
    it('safeLocalStorage should work as StateStorage', () => {
      safeLocalStorage.setItem('singleton-test', 'works');
      expect(safeLocalStorage.getItem('singleton-test')).toBe('works');
      safeLocalStorage.removeItem('singleton-test');
      expect(safeLocalStorage.getItem('singleton-test')).toBeNull();
    });

    it('safeSessionStorage should work as StateStorage', () => {
      safeSessionStorage.setItem('session-singleton', 'ok');
      expect(safeSessionStorage.getItem('session-singleton')).toBe('ok');
    });
  });
});
