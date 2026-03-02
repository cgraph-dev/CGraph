/**
 * Mobile Feature Flag Store
 *
 * Zustand store for managing feature flags on React Native.
 * Polls the backend with a 5-minute cache interval.
 * Uses AsyncStorage for persistent flag cache (offline support).
 *
 * @module stores/featureFlagStore
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../lib/api';

// ── Types ──────────────────────────────────────────────────────────────

export type FlagType = 'boolean' | 'percentage' | 'variant' | 'targeted';

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

interface FeatureFlagState {
  flags: Record<string, FeatureFlag>;
  lastFetched: number;
  loading: boolean;
  error: string | null;
}

interface FeatureFlagActions {
  fetchFlags: () => Promise<void>;
  refreshFlags: () => Promise<void>;
  isEnabled: (flagName: string) => boolean;
  getVariant: (flagName: string) => string | undefined;
  loadCachedFlags: () => Promise<void>;
  clearCache: () => void;
}

type FeatureFlagStore = FeatureFlagState & FeatureFlagActions;

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY = '@cgraph:feature_flags';
const FLAGS_API_PATH = '/feature-flags';

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

    if (loading || (now - lastFetched < CACHE_TTL_MS)) return;

    set({ loading: true, error: null });

    try {
      const response = await api.get(FLAGS_API_PATH);
      const flagsMap: Record<string, FeatureFlag> = {};

      const flagArray = response.data?.data?.flags ?? response.data?.flags ?? response.data?.data ?? [];
      for (const flag of flagArray) {
        flagsMap[flag.name] = flag;
      }

      set({ flags: flagsMap, lastFetched: Date.now(), loading: false });

      // Persist to AsyncStorage for offline access
      await AsyncStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ flags: flagsMap, cachedAt: Date.now() })
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      set({ loading: false, error: message });
    }
  },

  refreshFlags: async () => {
    set({ lastFetched: 0 });
    await get().fetchFlags();
  },

  isEnabled: (flagName: string) => {
    return get().flags[flagName]?.enabled ?? false;
  },

  getVariant: (flagName: string) => {
    return get().flags[flagName]?.variant;
  },

  loadCachedFlags: async () => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const { flags, cachedAt } = JSON.parse(cached);
        set({ flags, lastFetched: cachedAt });
      }
    } catch {
      // Ignore cache read errors
    }
  },

  clearCache: () => {
    set({ flags: {}, lastFetched: 0 });
    AsyncStorage.removeItem(CACHE_KEY).catch(() => {});
  },
}));
