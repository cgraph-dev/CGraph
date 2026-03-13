/**
 * Discovery Store — Zustand store for feed discovery modes.
 *
 * Manages the 5 discovery feed modes (trending, fresh, following,
 * recommended, nearby), feed items, topic filtering, and pagination.
 * Persists active mode and filters via AsyncStorage (manual, no persist middleware).
 *
 * @module stores/discoveryStore
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FeedMode = 'trending' | 'fresh' | 'following' | 'recommended' | 'nearby';

export const FEED_MODES: readonly FeedMode[] = [
  'trending',
  'fresh',
  'following',
  'recommended',
  'nearby',
] as const;

export interface FeedItem {
  readonly id: string;
  readonly type: 'post' | 'community' | 'user' | 'topic';
  readonly title: string;
  readonly description?: string;
  readonly imageUrl?: string;
  readonly authorName?: string;
  readonly authorAvatar?: string;
  readonly score?: number;
  readonly createdAt: string;
  readonly tags?: string[];
}

export interface FeedFilters {
  readonly topics?: string[];
  readonly timeRange?: 'day' | 'week' | 'month' | 'all';
  readonly minScore?: number;
}

interface DiscoveryState {
  readonly activeMode: FeedMode;
  readonly feedItems: FeedItem[];
  readonly filters: FeedFilters;
  readonly topics: string[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly offset: number;
  readonly hasMore: boolean;
}

interface DiscoveryActions {
  readonly setMode: (mode: FeedMode) => Promise<void>;
  readonly fetchFeed: (reset?: boolean) => Promise<void>;
  readonly setFilters: (filters: FeedFilters) => Promise<void>;
  readonly refreshFeed: () => Promise<void>;
  readonly loadMore: () => Promise<void>;
  readonly hydrate: () => Promise<void>;
  readonly reset: () => void;
}

type DiscoveryStore = DiscoveryState & DiscoveryActions;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY_MODE = '@cgraph_discovery_mode';
const STORAGE_KEY_FILTERS = '@cgraph_discovery_filters';
const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useDiscoveryStore = create<DiscoveryStore>((set, get) => ({
  activeMode: 'trending',
  feedItems: [],
  filters: {},
  topics: [],
  isLoading: false,
  error: null,
  offset: 0,
  hasMore: true,

  setMode: async (mode: FeedMode) => {
    set({ activeMode: mode, feedItems: [], offset: 0, hasMore: true, error: null });
    await AsyncStorage.setItem(STORAGE_KEY_MODE, mode).catch(() => {});
    await get().fetchFeed(true);
  },

  fetchFeed: async (reset = false) => {
    const { activeMode, filters, offset, isLoading } = get();
    if (isLoading) return;

    try {
      set({ isLoading: true, error: null });
      const currentOffset = reset ? 0 : offset;

      const response = await api.get('/api/v1/discovery/feed', {
        params: {
          mode: activeMode,
          topics: filters.topics?.join(',') || undefined,
          time_range: filters.timeRange || undefined,
          min_score: filters.minScore || undefined,
          limit: PAGE_SIZE,
          offset: currentOffset,
        },
      });

      const payload = response.data?.data ?? response.data;
      const items: FeedItem[] = payload?.items ?? [];
      const availableTopics: string[] = payload?.topics ?? get().topics;

      if (reset) {
        set({
          feedItems: items,
          offset: items.length,
          hasMore: items.length >= PAGE_SIZE,
          topics: availableTopics,
        });
      } else {
        set((state) => ({
          feedItems: [...state.feedItems, ...items],
          offset: state.offset + items.length,
          hasMore: items.length >= PAGE_SIZE,
          topics: availableTopics,
        }));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch feed';
      set({ error: message });
    } finally {
      set({ isLoading: false });
    }
  },

  setFilters: async (filters: FeedFilters) => {
    set({ filters, feedItems: [], offset: 0, hasMore: true });
    await AsyncStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify(filters)).catch(() => {});
    await get().fetchFeed(true);
  },

  refreshFeed: async () => {
    set({ offset: 0, hasMore: true, error: null });
    await get().fetchFeed(true);
  },

  loadMore: async () => {
    const { isLoading, hasMore } = get();
    if (isLoading || !hasMore) return;
    await get().fetchFeed(false);
  },

  hydrate: async () => {
    try {
      const [storedMode, storedFilters] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_MODE),
        AsyncStorage.getItem(STORAGE_KEY_FILTERS),
      ]);

      const validModes: readonly string[] = [
        'trending',
        'fresh',
        'following',
        'recommended',
        'nearby',
      ];
      const isFeedMode = (v: string): v is FeedMode => validModes.includes(v);
      const mode: FeedMode = storedMode && isFeedMode(storedMode) ? storedMode : 'trending';

      const filters: FeedFilters = storedFilters ? JSON.parse(storedFilters) : {};

      set({ activeMode: mode, filters });
    } catch {
      // Keep defaults on failure
    }
  },

  reset: () =>
    set({
      activeMode: 'trending',
      feedItems: [],
      filters: {},
      topics: [],
      isLoading: false,
      error: null,
      offset: 0,
      hasMore: true,
    }),
}));

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

/** Select active feed mode. */
export const useActiveMode = () => useDiscoveryStore((s) => s.activeMode);

/** Select feed items. */
export const useFeedItems = () => useDiscoveryStore((s) => s.feedItems);

/** Select available topics. */
export const useTopics = () => useDiscoveryStore((s) => s.topics);

/** Select loading state. */
export const useDiscoveryLoading = () => useDiscoveryStore((s) => s.isLoading);

/** Select feed error. */
export const useDiscoveryError = () => useDiscoveryStore((s) => s.error);
