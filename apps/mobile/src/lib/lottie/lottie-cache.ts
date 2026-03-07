/**
 * MobileLottieCache — Filesystem-backed Lottie animation cache
 *
 * Uses expo-file-system to cache Lottie JSON on the device for offline access.
 * Implements LRU eviction based on last-access time and a configurable size limit.
 *
 * @module lib/lottie/lottie-cache
 */

import * as FileSystem from 'expo-file-system';
import { getLottieCdnUrl, type LottieCacheEntry } from './lottie-types';

const CACHE_DIR = `${FileSystem.cacheDirectory}lottie/`;
const MANIFEST_PATH = `${CACHE_DIR}manifest.json`;
const MAX_CACHE_SIZE_MB = 50;
const MAX_CACHE_SIZE_BYTES = MAX_CACHE_SIZE_MB * 1024 * 1024;

class MobileLottieCache {
  private manifest: Map<string, LottieCacheEntry> = new Map();
  private initialized = false;

  /** Ensure cache directory exists and load manifest */
  async init(): Promise<void> {
    if (this.initialized) return;

    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }

    // Load manifest
    const manifestInfo = await FileSystem.getInfoAsync(MANIFEST_PATH);
    if (manifestInfo.exists) {
      try {
        const raw = await FileSystem.readAsStringAsync(MANIFEST_PATH);
        const entries: LottieCacheEntry[] = JSON.parse(raw);
        for (const entry of entries) {
          this.manifest.set(entry.codepoint, entry);
        }
      } catch {
        // Corrupt manifest — start fresh
        this.manifest.clear();
      }
    }

    this.initialized = true;
  }

  /** Get a cached file path for a codepoint, or null if not cached */
  async get(codepoint: string): Promise<string | null> {
    await this.init();

    const entry = this.manifest.get(codepoint);
    if (!entry) return null;

    const info = await FileSystem.getInfoAsync(entry.filePath);
    if (!info.exists) {
      this.manifest.delete(codepoint);
      await this.persistManifest();
      return null;
    }

    // Update last-access time
    entry.lastAccessedAt = Date.now();
    return entry.filePath;
  }

  /** Download and cache a Lottie JSON for the given codepoint. Returns file path. */
  async set(codepoint: string, jsonData: string): Promise<string> {
    await this.init();

    const filePath = `${CACHE_DIR}${codepoint}.json`;
    await FileSystem.writeAsStringAsync(filePath, jsonData);

    const info = await FileSystem.getInfoAsync(filePath);
    const sizeBytes = info.exists && !info.isDirectory ? (info.size ?? 0) : 0;
    const now = Date.now();

    this.manifest.set(codepoint, {
      codepoint,
      filePath,
      sizeBytes,
      cachedAt: now,
      lastAccessedAt: now,
    });

    await this.persistManifest();
    await this.enforceLimit();

    return filePath;
  }

  /** Fetch from CDN and cache. Returns file path. */
  async fetchAndCache(codepoint: string): Promise<string> {
    await this.init();

    const existing = await this.get(codepoint);
    if (existing) return existing;

    const url = getLottieCdnUrl(codepoint);
    const filePath = `${CACHE_DIR}${codepoint}.json`;

    const downloadResult = await FileSystem.downloadAsync(url, filePath);

    if (downloadResult.status !== 200) {
      // Clean up failed download
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(filePath, { idempotent: true });
      }
      throw new Error(`Failed to download Lottie for ${codepoint}: HTTP ${downloadResult.status}`);
    }

    const info = await FileSystem.getInfoAsync(filePath);
    const sizeBytes = info.exists && !info.isDirectory ? (info.size ?? 0) : 0;
    const now = Date.now();

    this.manifest.set(codepoint, {
      codepoint,
      filePath,
      sizeBytes,
      cachedAt: now,
      lastAccessedAt: now,
    });

    await this.persistManifest();
    return filePath;
  }

  /** Preload a batch of codepoints concurrently (max 6 at a time) */
  async preload(codepoints: string[]): Promise<void> {
    const BATCH = 6;
    for (let i = 0; i < codepoints.length; i += BATCH) {
      const batch = codepoints.slice(i, i + BATCH);
      await Promise.allSettled(batch.map((cp) => this.fetchAndCache(cp)));
    }
  }

  /** Clear the entire cache */
  async clear(): Promise<void> {
    await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
    this.manifest.clear();
    this.initialized = false;
  }

  /** Get total cache size in bytes */
  getCacheSize(): number {
    let total = 0;
    for (const entry of this.manifest.values()) {
      total += entry.sizeBytes;
    }
    return total;
  }

  /** Evict oldest entries until cache is within limit */
  private async enforceLimit(): Promise<void> {
    let totalSize = this.getCacheSize();
    if (totalSize <= MAX_CACHE_SIZE_BYTES) return;

    // Sort by last accessed (oldest first)
    const entries = [...this.manifest.values()].sort(
      (a, b) => a.lastAccessedAt - b.lastAccessedAt,
    );

    for (const entry of entries) {
      if (totalSize <= MAX_CACHE_SIZE_BYTES) break;

      await FileSystem.deleteAsync(entry.filePath, { idempotent: true });
      totalSize -= entry.sizeBytes;
      this.manifest.delete(entry.codepoint);
    }

    await this.persistManifest();
  }

  /** Write manifest to disk */
  private async persistManifest(): Promise<void> {
    const entries = [...this.manifest.values()];
    await FileSystem.writeAsStringAsync(MANIFEST_PATH, JSON.stringify(entries));
  }
}

/** Singleton cache instance */
export const lottieCache = new MobileLottieCache();

/** Convenience: preload animations for a list of codepoints */
export const preloadAnimations = (codepoints: string[]) => lottieCache.preload(codepoints);

/** Convenience: get cached file path for a codepoint */
export const getCachedPath = (codepoint: string) => lottieCache.get(codepoint);
