/**
 * Feature Flag Store
 *
 * Zustand store for managing feature flags from the backend.
 * Polls the feature-flags endpoint with a 5-minute cache interval.
 * Used by both the useFeatureFlag hook and admin panel.
 *
 * @module stores/featureFlagStore
 */

import { create } from 'zustand';
import { createLogger } from '@/lib/logger';

const logger = createLogger('featureFlagStore');

// ── Types ──────────────────────────────────────────────────────────────

/** Supported feature flag types */
export type FlagType = 'boolean' | 'percentage' | 'variant' | 'targeted';

/** A single feature flag */
export interface FeatureFlag {
  readonly name: string;
  readonly type: FlagType;
  readonly enabled: boolean;
  readonly percentage?: number;
  readonly variant?: string;
  readonly variants?: string[];
  readonly description?: string;
  readonly updated_at?: string;
}

/** Feature flag history entry */
export interface FlagHistoryEntry {
  readonly action: string;
  readonly changed_by: string;
  readonly changes: Record<string, unknown>;
  readonly timestamp: string;
}

interface FeatureFlagState {
  /** All flags keyed by name */
  flags: Record<string, FeatureFlag>;
  /** Timestamp of last fetch */
  lastFetched: number;
  /** Whether a fetch is in progress */
  loading: boolean;
  /** Error message, if any */
  error: string | null;
}

interface FeatureFlagActions {
  /** Fetch flags from backend with 5-minute cache */
  fetchFlags: () => Promise<void>;
  /** Force-refresh flags ignoring cache */
  refreshFlags: () => Promise<void>;
  /** Check if a flag is enabled */
  isEnabled: (flagName: string) => boolean;
  /** Get a specific flag's variant */
  getVariant: (flagName: string) => string | undefined;
  /** Clear flag cache */
  clearCache: () => void;
}

type FeatureFlagStore = FeatureFlagState & FeatureFlagActions;

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const FLAGS_API_URL = '/api/v1/feature-flags';

export const useFeatureFlagStore = create<FeatureFlagStore>((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────
  flags: {},
  lastFetched: 0,
  loading: false,
  error: null,

  // ── Actions ────────────────────────────────────────────────────────

  fetchFlags: async () => {
    const now = Date.now();
    const { lastFetched, loading } = get();

    // Skip if fetched recently or already fetching
    if (loading || (now - lastFetched < CACHE_TTL_MS)) return;

    set({ loading: true, error: null });

    try {
      const response = await fetch(FLAGS_API_URL, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch flags: ${response.status}`);
      }

      const data = await response.json();
      const flagsMap: Record<string, FeatureFlag> = {};

      // Normalize array response to map
      const flagArray = data.data?.flags ?? data.flags ?? data.data ?? [];
      for (const flag of flagArray) {
        flagsMap[flag.name] = flag;
      }

      set({ flags: flagsMap, lastFetched: Date.now(), loading: false });
      logger.debug(`Fetched ${Object.keys(flagsMap).length} feature flags`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Failed to fetch feature flags:', message);
      set({ loading: false, error: message });
    }
  },

  refreshFlags: async () => {
    set({ lastFetched: 0 });
    await get().fetchFlags();
  },

  isEnabled: (flagName: string) => {
    const flag = get().flags[flagName];
    return flag?.enabled ?? false;
  },

  getVariant: (flagName: string) => {
    return get().flags[flagName]?.variant;
  },

  clearCache: () => {
    set({ flags: {}, lastFetched: 0 });
  },
}));
