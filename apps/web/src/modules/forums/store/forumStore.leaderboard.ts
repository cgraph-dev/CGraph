/**
 * Forum Store — Leaderboard Slice
 *
 * Standalone Zustand store for forum leaderboard state.
 * Manages unified leaderboard entries, my-rank, rank definitions, and period filtering.
 *
 * @module modules/forums/store/forumStore.leaderboard
 */

import { create } from 'zustand';
import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';

import type {
  LeaderboardPeriod,
  LeaderboardEntry,
  MyRankResponse,
  ForumRank,
} from '@cgraph/shared-types';

const logger = createLogger('ForumLeaderboardStore');

// ── State ──────────────────────────────────────────────────────────────

export interface ForumLeaderboardState {
  entries: LeaderboardEntry[];
  myRank: MyRankResponse | null;
  ranks: ForumRank[];
  period: LeaderboardPeriod;
  karmaLabel: string;
  isLoading: boolean;
  isLoadingMyRank: boolean;
  isLoadingRanks: boolean;
  hasMore: boolean;
  error: string | null;

  // Actions
  fetchLeaderboard: (forumId: string, period?: LeaderboardPeriod) => Promise<void>;
  fetchMyRank: (forumId: string) => Promise<void>;
  fetchRanks: (forumId: string) => Promise<void>;
  updateRanks: (forumId: string, ranks: Partial<ForumRank>[]) => Promise<void>;
  refreshRankings: (forumId: string) => Promise<void>;
  setPeriod: (period: LeaderboardPeriod) => void;
  reset: () => void;
}

const initialState = {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  entries: [] as LeaderboardEntry[],
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  myRank: null as MyRankResponse | null,
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  ranks: [] as ForumRank[],
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  period: 'all_time' as LeaderboardPeriod,
  karmaLabel: 'Karma',
  isLoading: false,
  isLoadingMyRank: false,
  isLoadingRanks: false,
  hasMore: false,
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  error: null as string | null,
};

// ── Store ──────────────────────────────────────────────────────────────

export const useForumLeaderboardStore = create<ForumLeaderboardState>((set, get) => ({
  ...initialState,

  fetchLeaderboard: async (forumId, period) => {
    const p = period ?? get().period;
    set({ isLoading: true, error: null, period: p });

    try {
      const response = await api.get(`/api/v1/forums/${forumId}/leaderboard`, {
        params: { period: p, limit: 50 },
      });

      const data = response.data?.data ?? [];
      const meta = response.data?.meta ?? {};

      const entries: LeaderboardEntry[] = data.map((e: Record<string, unknown>) => {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const user = (e.user ?? {}) as Record<string, unknown>;
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const rank = e.rank as Record<string, unknown> | null;
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        const change = (e.change ?? {}) as Record<string, unknown>;

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        return {
          position: e.position,
          user: {
            id: user.id,
            username: user.username,
            displayName: user.display_name ?? user.displayName ?? null,
            avatarUrl: user.avatar_url ?? user.avatarUrl ?? null,
            level: user.level ?? 1,
            isVerified: user.is_verified ?? false,
            isPremium: user.is_premium ?? false,
          },
          score: e.score ?? 0,
          forumKarma: e.forum_karma ?? 0,
          xp: e.xp ?? 0,
          rank: rank
            ? {
                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                id: rank.id as string,
                forumId,
                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                name: rank.name as string,
                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                minScore: rank.min_score as number,
                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                maxScore: (rank.max_score as number) ?? null,
                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                imageUrl: (rank.image_url as string) ?? null,
                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                color: rank.color as string,
                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                position: rank.position as number,
                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                isDefault: (rank.is_default as boolean) ?? false,
              }
            : null,
          change: {
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            direction: (change.direction as string) ?? 'same',
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            amount: (change.amount as number) ?? 0,
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            previousRank: (change.previous_rank as number) ?? null,
          },
        } as LeaderboardEntry;
      });

      set({ entries, hasMore: meta.has_more ?? false, isLoading: false });
    } catch (err) {
      logger.error('Failed to fetch leaderboard:', err);
      set({ error: 'Failed to load leaderboard', isLoading: false });
    }
  },

  fetchMyRank: async (forumId) => {
    set({ isLoadingMyRank: true });
    try {
      const response = await api.get(`/api/v1/forums/${forumId}/leaderboard/my-rank`);
      const d = response.data?.data;

      if (!d) {
        set({ myRank: null, isLoadingMyRank: false });
        return;
      }

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const rank = d.rank as Record<string, unknown> | null;
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const progress = (d.progress ?? {}) as Record<string, unknown>;
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const currentRank = progress.current_rank as Record<string, unknown> | null;
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const nextRank = progress.next_rank as Record<string, unknown> | null;

      const mapRank = (r: Record<string, unknown> | null): ForumRank | null =>
        r
          ? {
              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              id: r.id as string,
              forumId,
              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              name: r.name as string,
              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              minScore: r.min_score as number,
              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              maxScore: (r.max_score as number) ?? null,
              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              imageUrl: (r.image_url as string) ?? null,
              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              color: r.color as string,
              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              position: r.position as number,
              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              isDefault: (r.is_default as boolean) ?? false,
            }
          : null;

      set({
        myRank: {
          position: d.position,
          score: d.score,
          forumKarma: d.forum_karma ?? 0,
          xp: d.xp ?? 0,
          rank: mapRank(rank),
          progress: {
            currentRank: mapRank(currentRank)!,
            nextRank: mapRank(nextRank),
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            currentScore: (progress.current_score as number) ?? 0,
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            scoreToNextRank: (progress.score_to_next_rank as number) ?? null,
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            progressPercent: (progress.progress_percent as number) ?? 0,
          },
          change: {
            direction: 'same',
            amount: 0,
            previousRank: null,
          },
        },
        isLoadingMyRank: false,
      });
    } catch (err) {
      logger.error('Failed to fetch my rank:', err);
      set({ isLoadingMyRank: false });
    }
  },

  fetchRanks: async (forumId) => {
    set({ isLoadingRanks: true });
    try {
      const response = await api.get(`/api/v1/forums/${forumId}/ranks`);
      const data = response.data?.data ?? {};
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const ranksRaw = (data.ranks ?? []) as Record<string, unknown>[];

      const ranks: ForumRank[] = ranksRaw.map((r) => ({
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        id: r.id as string,
        forumId,
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        name: r.name as string,
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        minScore: r.min_score as number,
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        maxScore: (r.max_score as number) ?? null,
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        imageUrl: (r.image_url as string) ?? null,
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        color: r.color as string,
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        position: r.position as number,
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        isDefault: (r.is_default as boolean) ?? false,
      }));

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      set({ ranks, karmaLabel: (data.karma_label as string) ?? 'Karma', isLoadingRanks: false });
    } catch (err) {
      logger.error('Failed to fetch ranks:', err);
      set({ isLoadingRanks: false });
    }
  },

  updateRanks: async (forumId, ranksData) => {
    try {
      const payload = ranksData.map((r, i) => ({
        name: r.name,
        min_score: r.minScore,
        max_score: r.maxScore,
        image_url: r.imageUrl,
        color: r.color,
        position: r.position ?? i,
        is_default: r.isDefault ?? false,
      }));

      await api.put(`/api/v1/forums/${forumId}/ranks`, { ranks: payload });

      // Refresh ranks after update
      get().fetchRanks(forumId);
    } catch (err) {
      logger.error('Failed to update ranks:', err);
    }
  },

  refreshRankings: async (forumId) => {
    try {
      await api.post(`/api/v1/forums/${forumId}/leaderboard/refresh`);
      // Re-fetch after a short delay to allow the worker to process
      setTimeout(() => {
        get().fetchLeaderboard(forumId);
      }, 2000);
    } catch (err) {
      logger.error('Failed to refresh rankings:', err);
    }
  },

  setPeriod: (period) => set({ period }),

  reset: () => set({ ...initialState }),
}));
