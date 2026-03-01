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
  entries: [] as LeaderboardEntry[],
  myRank: null as MyRankResponse | null,
  ranks: [] as ForumRank[],
  period: 'all_time' as LeaderboardPeriod,
  karmaLabel: 'Karma',
  isLoading: false,
  isLoadingMyRank: false,
  isLoadingRanks: false,
  hasMore: false,
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
        const user = (e.user ?? {}) as Record<string, unknown>;
        const rank = e.rank as Record<string, unknown> | null;
        const change = (e.change ?? {}) as Record<string, unknown>;

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
                id: rank.id as string,
                forumId,
                name: rank.name as string,
                minScore: rank.min_score as number,
                maxScore: (rank.max_score as number) ?? null,
                imageUrl: (rank.image_url as string) ?? null,
                color: rank.color as string,
                position: rank.position as number,
                isDefault: (rank.is_default as boolean) ?? false,
              }
            : null,
          change: {
            direction: (change.direction as string) ?? 'same',
            amount: (change.amount as number) ?? 0,
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

      const rank = d.rank as Record<string, unknown> | null;
      const progress = (d.progress ?? {}) as Record<string, unknown>;
      const currentRank = progress.current_rank as Record<string, unknown> | null;
      const nextRank = progress.next_rank as Record<string, unknown> | null;

      const mapRank = (r: Record<string, unknown> | null): ForumRank | null =>
        r
          ? {
              id: r.id as string,
              forumId,
              name: r.name as string,
              minScore: r.min_score as number,
              maxScore: (r.max_score as number) ?? null,
              imageUrl: (r.image_url as string) ?? null,
              color: r.color as string,
              position: r.position as number,
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
            currentScore: (progress.current_score as number) ?? 0,
            scoreToNextRank: (progress.score_to_next_rank as number) ?? null,
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
      const ranksRaw = (data.ranks ?? []) as Record<string, unknown>[];

      const ranks: ForumRank[] = ranksRaw.map((r) => ({
        id: r.id as string,
        forumId,
        name: r.name as string,
        minScore: r.min_score as number,
        maxScore: (r.max_score as number) ?? null,
        imageUrl: (r.image_url as string) ?? null,
        color: r.color as string,
        position: r.position as number,
        isDefault: (r.is_default as boolean) ?? false,
      }));

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
