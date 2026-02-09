// @ts-nocheck
/**
 * Prestige Store Unit Tests
 *
 * Covers: initial state, fetchPrestige, fetchRewards, fetchLeaderboard,
 * performPrestige, getProgressPercent, getBonusForLevel, getXpWithBonus,
 * getCoinWithBonus, error handling, edge cases.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePrestigeStore } from '../prestigeSlice';
import type { PrestigeData, PrestigeRequirements } from '../prestige-types';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

vi.mock('@/lib/safeStorage', () => ({
  safeLocalStorage: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

import { api } from '@/lib/api';

const mockedApi = vi.mocked(api, { deep: true });

// ── Fixtures ──────────────────────────────────────────────────────────

const mockPrestige: PrestigeData = {
  level: 3,
  xp: 45000,
  xpToNext: 337500,
  bonuses: { xp: 0.15, coins: 0.09, karma: 0.06, dropRate: 0.03 },
  lifetime: { xp: 500000, karma: 1200, coinsEarned: 80000, messages: 5000 },
  totalResets: 3,
  lastPrestigeAt: '2026-01-01T00:00:00Z',
  exclusiveTitles: ['Prestige 1', 'Prestige 2', 'Prestige 3'],
  exclusiveBorders: [],
  exclusiveEffects: [],
};

const mockRequirements: PrestigeRequirements = {
  requiredXp: 337500,
  currentXp: 45000,
  progress: 13.3,
  nextLevel: 4,
};

function resetStore() {
  usePrestigeStore.setState({
    prestige: null,
    requirements: null,
    canPrestige: false,
    allTiers: [],
    leaderboard: [],
    isLoading: false,
    isPrestiging: false,
  });
}

// ── Tests ──────────────────────────────────────────────────────────────

describe('prestigeStore', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  // ==================== INITIAL STATE ====================

  describe('initial state', () => {
    it('has null prestige', () => {
      expect(usePrestigeStore.getState().prestige).toBeNull();
    });

    it('has canPrestige false', () => {
      expect(usePrestigeStore.getState().canPrestige).toBe(false);
    });

    it('has empty tiers and leaderboard', () => {
      const s = usePrestigeStore.getState();
      expect(s.allTiers).toEqual([]);
      expect(s.leaderboard).toEqual([]);
    });

    it('has loading flags false', () => {
      const s = usePrestigeStore.getState();
      expect(s.isLoading).toBe(false);
      expect(s.isPrestiging).toBe(false);
    });
  });

  // ==================== fetchPrestige ====================

  describe('fetchPrestige', () => {
    it('sets prestige data from API', async () => {
      mockedApi.get.mockResolvedValueOnce({
        data: {
          prestige: mockPrestige,
          nextPrestigeRequirements: mockRequirements,
          canPrestige: true,
        },
      });

      await usePrestigeStore.getState().fetchPrestige();

      const s = usePrestigeStore.getState();
      expect(s.prestige?.level).toBe(3);
      expect(s.canPrestige).toBe(true);
      expect(s.requirements?.nextLevel).toBe(4);
      expect(s.isLoading).toBe(false);
    });

    it('sets default data on API error', async () => {
      mockedApi.get.mockRejectedValueOnce(new Error('Network'));

      await usePrestigeStore.getState().fetchPrestige();

      const s = usePrestigeStore.getState();
      expect(s.prestige?.level).toBe(0);
      expect(s.prestige?.xp).toBe(0);
      expect(s.canPrestige).toBe(false);
      expect(s.isLoading).toBe(false);
    });

    it('always clears isLoading even on error', async () => {
      mockedApi.get.mockRejectedValueOnce(new Error('fail'));
      await usePrestigeStore.getState().fetchPrestige();
      expect(usePrestigeStore.getState().isLoading).toBe(false);
    });
  });

  // ==================== fetchRewards ====================

  describe('fetchRewards', () => {
    it('sets allTiers from API', async () => {
      mockedApi.get.mockResolvedValueOnce({
        data: {
          rewards: [
            {
              level: 1,
              xpRequired: 100000,
              bonuses: { xp: 0.05, coins: 0.03, karma: 0.02, dropRate: 0.01 },
              exclusiveRewards: [],
            },
          ],
        },
      });

      await usePrestigeStore.getState().fetchRewards();
      expect(usePrestigeStore.getState().allTiers).toHaveLength(1);
    });

    it('generates 20 default tiers on error', async () => {
      mockedApi.get.mockRejectedValueOnce(new Error('fail'));

      await usePrestigeStore.getState().fetchRewards();
      expect(usePrestigeStore.getState().allTiers).toHaveLength(20);
      expect(usePrestigeStore.getState().allTiers[0].level).toBe(1);
    });
  });

  // ==================== fetchLeaderboard ====================

  describe('fetchLeaderboard', () => {
    it('populates leaderboard', async () => {
      mockedApi.get.mockResolvedValueOnce({
        data: { leaderboard: [{ rank: 1, userId: 'u1', username: 'Alice' }] },
      });

      await usePrestigeStore.getState().fetchLeaderboard(10, 0);
      expect(usePrestigeStore.getState().leaderboard).toHaveLength(1);
    });

    it('passes limit and offset params', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: { leaderboard: [] } });
      await usePrestigeStore.getState().fetchLeaderboard(25, 50);
      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/prestige/leaderboard', {
        params: { limit: 25, offset: 50 },
      });
    });

    it('silently handles errors', async () => {
      mockedApi.get.mockRejectedValueOnce(new Error('err'));
      await usePrestigeStore.getState().fetchLeaderboard();
      // Should not throw
    });
  });

  // ==================== performPrestige ====================

  describe('performPrestige', () => {
    it('returns success and updates prestige data', async () => {
      usePrestigeStore.setState({ canPrestige: true });
      const newPrestige = { ...mockPrestige, level: 4 };
      mockedApi.post.mockResolvedValueOnce({
        data: {
          success: true,
          prestige: newPrestige,
          rewards: [{ type: 'title', name: 'Prestige 4' }],
        },
      });
      // fetchPrestige call after success
      mockedApi.get.mockResolvedValueOnce({
        data: {
          prestige: newPrestige,
          nextPrestigeRequirements: mockRequirements,
          canPrestige: false,
        },
      });

      const result = await usePrestigeStore.getState().performPrestige();

      expect(result.success).toBe(true);
      expect(result.rewards).toBeDefined();
      expect(usePrestigeStore.getState().isPrestiging).toBe(false);
    });

    it('returns failure when canPrestige is false', async () => {
      usePrestigeStore.setState({ canPrestige: false });
      const result = await usePrestigeStore.getState().performPrestige();
      expect(result.success).toBe(false);
      expect(mockedApi.post).not.toHaveBeenCalled();
    });

    it('returns failure when already prestiging', async () => {
      usePrestigeStore.setState({ canPrestige: true, isPrestiging: true });
      const result = await usePrestigeStore.getState().performPrestige();
      expect(result.success).toBe(false);
    });

    it('returns failure on API error', async () => {
      usePrestigeStore.setState({ canPrestige: true });
      mockedApi.post.mockRejectedValueOnce(new Error('Server error'));

      const result = await usePrestigeStore.getState().performPrestige();
      expect(result.success).toBe(false);
      expect(usePrestigeStore.getState().isPrestiging).toBe(false);
    });
  });

  // ==================== Computed Getters ====================

  describe('getProgressPercent', () => {
    it('returns 0 when no requirements', () => {
      expect(usePrestigeStore.getState().getProgressPercent()).toBe(0);
    });

    it('calculates percentage correctly', () => {
      usePrestigeStore.setState({
        requirements: { requiredXp: 200, currentXp: 50, progress: 25, nextLevel: 2 },
      });
      expect(usePrestigeStore.getState().getProgressPercent()).toBe(25);
    });

    it('caps at 100%', () => {
      usePrestigeStore.setState({
        requirements: { requiredXp: 100, currentXp: 200, progress: 200, nextLevel: 2 },
      });
      expect(usePrestigeStore.getState().getProgressPercent()).toBe(100);
    });

    it('returns 0 when requiredXp is 0', () => {
      usePrestigeStore.setState({
        requirements: { requiredXp: 0, currentXp: 0, progress: 0, nextLevel: 1 },
      });
      expect(usePrestigeStore.getState().getProgressPercent()).toBe(0);
    });
  });

  describe('getBonusForLevel', () => {
    it('returns correct bonuses for level 5', () => {
      const bonuses = usePrestigeStore.getState().getBonusForLevel(5);
      expect(bonuses.xp).toBeCloseTo(0.25);
      expect(bonuses.coins).toBeCloseTo(0.15);
      expect(bonuses.karma).toBeCloseTo(0.1);
      expect(bonuses.dropRate).toBeCloseTo(0.05);
    });

    it('returns zero bonuses for level 0', () => {
      const bonuses = usePrestigeStore.getState().getBonusForLevel(0);
      expect(bonuses.xp).toBe(0);
    });
  });

  describe('getXpWithBonus', () => {
    it('returns base XP when no prestige', () => {
      expect(usePrestigeStore.getState().getXpWithBonus(100)).toBe(100);
    });

    it('applies prestige XP bonus', () => {
      usePrestigeStore.setState({ prestige: mockPrestige }); // 0.15 xp bonus
      expect(usePrestigeStore.getState().getXpWithBonus(100)).toBe(115);
    });
  });

  describe('getCoinWithBonus', () => {
    it('returns base coins when no prestige', () => {
      expect(usePrestigeStore.getState().getCoinWithBonus(100)).toBe(100);
    });

    it('applies prestige coin bonus', () => {
      usePrestigeStore.setState({ prestige: mockPrestige }); // 0.09 coins bonus
      expect(usePrestigeStore.getState().getCoinWithBonus(100)).toBe(109);
    });
  });
});
