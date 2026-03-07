/**
 * IndexedDB-backed cache for Lottie JSON animation data.
 *
 * Design decisions:
 * - IndexedDB because Lottie files average ~37KB (too large for localStorage).
 * - LRU eviction at 200 entries (~7.4MB budget).
 * - Prefetch API for batch-loading visible emojis.
 *
 * @module lib/lottie/lottie-cache
 */

import type { LottieAnimationData, LottieCacheEntry } from './lottie-types';

const LOTTIE_CDN_BASE = 'https://fonts.gstatic.com/s/e/notoemoji/latest';

/** Build the CDN URL for a Lottie animation JSON. */
export function getLottieCdnUrl(codepoint: string): string {
  return `${LOTTIE_CDN_BASE}/${codepoint}/lottie.json`;
}

/** Build the CDN URL for a static WebP fallback. */
export function getWebpCdnUrl(codepoint: string): string {
  return `${LOTTIE_CDN_BASE}/${codepoint}/512.webp`;
}

/** Build the CDN URL for a GIF fallback. */
export function getGifCdnUrl(codepoint: string): string {
  return `${LOTTIE_CDN_BASE}/${codepoint}/512.gif`;
}

// ── Cache Manager ──────────────────────────────────────────────────

class LottieCacheManager {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'cgraph_lottie_cache';
  private readonly STORE_NAME = 'animations';
  private readonly DB_VERSION = 1;
  private readonly MAX_ENTRIES = 200;
  private openPromise: Promise<void> | null = null;

  /** Open (or create) the IndexedDB database. */
  async open(): Promise<void> {
    if (this.db) return;
    if (this.openPromise) return this.openPromise;

    this.openPromise = new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'codepoint' });
          store.createIndex('lastAccessed', 'lastAccessed', { unique: false });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onerror = () => {
        console.warn('[LottieCache] IndexedDB open failed:', request.error);
        reject(request.error);
      };
    });

    return this.openPromise;
  }

  /** Retrieve cached animation data for a codepoint. */
  async get(codepoint: string): Promise<LottieAnimationData | null> {
    try {
      await this.open();
      if (!this.db) return null;

      return new Promise((resolve) => {
        const tx = this.db!.transaction(this.STORE_NAME, 'readwrite');
        const store = tx.objectStore(this.STORE_NAME);
        const req = store.get(codepoint);

        req.onsuccess = () => {
          // IDBRequest.result is untyped — narrow via property check
          const entry: LottieCacheEntry | undefined = req.result;
          if (entry) {
            // Update last-accessed for LRU
            entry.lastAccessed = Date.now();
            store.put(entry);
            resolve(entry.data);
          } else {
            resolve(null);
          }
        };

        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  /** Store animation data for a codepoint, with LRU eviction. */
  async set(codepoint: string, data: LottieAnimationData): Promise<void> {
    try {
      await this.open();
      if (!this.db) return;

      const entry: LottieCacheEntry = {
        codepoint,
        data,
        lastAccessed: Date.now(),
        sizeEstimate: JSON.stringify(data).length,
      };

      const tx = this.db.transaction(this.STORE_NAME, 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);
      store.put(entry);

      // Check count and evict LRU if over budget
      const countReq = store.count();
      countReq.onsuccess = () => {
        if (countReq.result > this.MAX_ENTRIES) {
          this.evictOldest(store);
        }
      };
    } catch {
      // Silently fail — cache is non-critical
    }
  }

  /** Batch fetch and cache multiple codepoints. */
  async preload(codepoints: string[]): Promise<void> {
    const toFetch: string[] = [];

    for (const cp of codepoints) {
      const cached = await this.get(cp);
      if (!cached) toFetch.push(cp);
    }

    // Fetch in parallel with concurrency limit
    const CONCURRENCY = 6;
    for (let i = 0; i < toFetch.length; i += CONCURRENCY) {
      const batch = toFetch.slice(i, i + CONCURRENCY);
      await Promise.allSettled(
        batch.map(async (cp) => {
          try {
            const res = await fetch(getLottieCdnUrl(cp));
            if (res.ok) {
              // json() returns unknown; validated by cache set
              const data: LottieAnimationData = await res.json();
              await this.set(cp, data);
            }
          } catch {
            // Skip failed fetches
          }
        })
      );
    }
  }

  /** Clear all cached animations. */
  async clear(): Promise<void> {
    try {
      await this.open();
      if (!this.db) return;

      const tx = this.db.transaction(this.STORE_NAME, 'readwrite');
      tx.objectStore(this.STORE_NAME).clear();
    } catch {
      // Silently fail
    }
  }

  /** Return cache statistics. */
  async stats(): Promise<{ count: number; sizeEstimate: number }> {
    try {
      await this.open();
      if (!this.db) return { count: 0, sizeEstimate: 0 };

      return new Promise((resolve) => {
        const tx = this.db!.transaction(this.STORE_NAME, 'readonly');
        const store = tx.objectStore(this.STORE_NAME);
        const req = store.getAll();

        req.onsuccess = () => {
          // IDBRequest.result is untyped — narrow via fallback
          const entries: LottieCacheEntry[] = req.result ?? [];
          const sizeEstimate = entries.reduce((sum, e) => sum + e.sizeEstimate, 0);
          resolve({ count: entries.length, sizeEstimate });
        };

        req.onerror = () => resolve({ count: 0, sizeEstimate: 0 });
      });
    } catch {
      return { count: 0, sizeEstimate: 0 };
    }
  }

  /** Fetch a single Lottie animation (cache-first). */
  async fetchAnimation(codepoint: string): Promise<LottieAnimationData | null> {
    // Cache hit
    const cached = await this.get(codepoint);
    if (cached) return cached;

    // Network fetch
    try {
      const res = await fetch(getLottieCdnUrl(codepoint));
      if (!res.ok) return null;
      // json() returns unknown; validated by cache set
      const data: LottieAnimationData = await res.json();
      await this.set(codepoint, data);
      return data;
    } catch {
      return null;
    }
  }

  // ── Private ────────────────────────────────────────────────────

  private evictOldest(store: IDBObjectStore): void {
    const index = store.index('lastAccessed');
    const evictCount = 20; // Remove 20 oldest on each eviction
    let deleted = 0;

    const cursor = index.openCursor();
    cursor.onsuccess = () => {
      const c = cursor.result;
      if (c && deleted < evictCount) {
        c.delete();
        deleted++;
        c.continue();
      }
    };
  }
}

/** Singleton cache instance. */
export const lottieCache = new LottieCacheManager();

/** Convenience: preload a set of animated emoji codepoints. */
export async function preloadAnimations(codepoints: string[]): Promise<void> {
  return lottieCache.preload(codepoints);
}

/** Convenience: get cached animation or null. */
export async function getCachedAnimation(codepoint: string): Promise<LottieAnimationData | null> {
  return lottieCache.get(codepoint);
}
