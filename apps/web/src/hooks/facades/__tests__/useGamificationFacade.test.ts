/**
 * useGamificationFacade Unit Tests
 *
 * Tests for the gamification composition facade hook.
 * Validates multi-store aggregation across gamification, prestige, events, referrals.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGamificationFacade } from '../useGamificationFacade';

// Mock all gamification stores
const mockGamificationState: Record<string, unknown> = {
  level: 5,
  currentXP: 1200,
  totalXP: 3500,
  karma: 42,
  loginStreak: 7,
  isLoading: false,
  achievements: [{ id: 'ach-1', name: 'First Steps', unlockedAt: '2026-01-01' }],
  recentlyUnlocked: [],
  equippedBadges: ['early-adopter'],
  activeQuests: [{ id: 'q-1', name: 'Send 10 Messages', progress: 3, target: 10 }],
  completedQuests: [],
  equippedTitle: { id: 'title-1', name: 'Pioneer', color: '#10b981' },
  availableTitles: [
    { id: 'title-1', name: 'Pioneer', color: '#10b981' },
    { id: 'title-2', name: 'Explorer', color: '#06b6d4' },
  ],
  fetchGamificationData: vi.fn(),
  fetchAchievements: vi.fn(),
  fetchQuests: vi.fn(),
  completeQuest: vi.fn(),
  equipTitle: vi.fn(),
  equipBadge: vi.fn(),
  unequipBadge: vi.fn(),
};

const mockPrestigeState: Record<string, unknown> = {
  prestige: { level: 2, multiplier: 1.5 },
  canPrestige: true,
};

const mockSeasonalState: Record<string, unknown> = {
  activeEvents: [{ id: 'evt-1', name: 'Winter Festival', endsAt: '2026-02-01' }],
  featuredEvent: { id: 'evt-1', name: 'Winter Festival', endsAt: '2026-02-01' },
};

const mockReferralState: Record<string, unknown> = {
  referralCode: { code: 'REF123', url: 'https://cgraph.app/ref/REF123' },
  stats: { totalReferrals: 5, pendingRewards: 2 },
};

vi.mock('@/modules/gamification/store', () => ({
  useGamificationStore: vi.fn((selector: (s: typeof mockGamificationState) => unknown) =>
    selector(mockGamificationState)
  ),
  usePrestigeStore: vi.fn((selector: (s: typeof mockPrestigeState) => unknown) =>
    selector(mockPrestigeState)
  ),
  useSeasonalEventStore: vi.fn((selector: (s: typeof mockSeasonalState) => unknown) =>
    selector(mockSeasonalState)
  ),
  useReferralStore: vi.fn((selector: (s: typeof mockReferralState) => unknown) =>
    selector(mockReferralState)
  ),
}));

describe('useGamificationFacade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('core progression', () => {
    it('exposes level from gamification store', () => {
      const { result } = renderHook(() => useGamificationFacade());
      expect(result.current.level).toBe(5);
    });

    it('exposes XP values', () => {
      const { result } = renderHook(() => useGamificationFacade());
      expect(result.current.currentXP).toBe(1200);
      expect(result.current.totalXP).toBe(3500);
    });

    it('exposes karma', () => {
      const { result } = renderHook(() => useGamificationFacade());
      expect(result.current.karma).toBe(42);
    });

    it('exposes login streak', () => {
      const { result } = renderHook(() => useGamificationFacade());
      expect(result.current.loginStreak).toBe(7);
    });

    it('exposes loading state', () => {
      const { result } = renderHook(() => useGamificationFacade());
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('achievements', () => {
    it('exposes achievements list', () => {
      const { result } = renderHook(() => useGamificationFacade());
      expect(result.current.achievements).toHaveLength(1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.current.achievements[0] as any).name).toBe('First Steps');
    });

    it('exposes recentlyUnlocked', () => {
      const { result } = renderHook(() => useGamificationFacade());
      expect(result.current.recentlyUnlocked).toEqual([]);
    });

    it('exposes equippedBadges', () => {
      const { result } = renderHook(() => useGamificationFacade());
      expect(result.current.equippedBadges).toEqual(['early-adopter']);
    });
  });

  describe('quests', () => {
    it('exposes active quests', () => {
      const { result } = renderHook(() => useGamificationFacade());
      expect(result.current.activeQuests).toHaveLength(1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.current.activeQuests[0] as any).name).toBe('Send 10 Messages');
    });

    it('exposes completed quests', () => {
      const { result } = renderHook(() => useGamificationFacade());
      expect(result.current.completedQuests).toEqual([]);
    });
  });

  describe('titles', () => {
    it('exposes equipped title', () => {
      const { result } = renderHook(() => useGamificationFacade());
      expect(result.current.equippedTitle).toEqual({
        id: 'title-1',
        name: 'Pioneer',
        color: '#10b981',
      });
    });

    it('exposes available titles', () => {
      const { result } = renderHook(() => useGamificationFacade());
      expect(result.current.availableTitles).toHaveLength(2);
    });
  });

  describe('prestige (cross-store)', () => {
    it('derives prestigeLevel from prestige store', () => {
      const { result } = renderHook(() => useGamificationFacade());
      expect(result.current.prestigeLevel).toBe(2);
    });

    it('exposes canPrestige', () => {
      const { result } = renderHook(() => useGamificationFacade());
      expect(result.current.canPrestige).toBe(true);
    });

    it('defaults prestigeLevel to 0 when prestige is null', () => {
      mockPrestigeState.prestige = null;
      const { result } = renderHook(() => useGamificationFacade());
      expect(result.current.prestigeLevel).toBe(0);
      mockPrestigeState.prestige = { level: 2, multiplier: 1.5 };
    });
  });

  describe('seasonal events (cross-store)', () => {
    it('exposes active events', () => {
      const { result } = renderHook(() => useGamificationFacade());
      expect(result.current.activeEvents).toHaveLength(1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.current.activeEvents[0] as any).name).toBe('Winter Festival');
    });

    it('exposes featured event', () => {
      const { result } = renderHook(() => useGamificationFacade());
      expect(result.current.featuredEvent).not.toBeNull();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((result.current.featuredEvent as any).name).toBe('Winter Festival');
    });
  });

  describe('referrals (cross-store)', () => {
    it('derives referralCode from referral store', () => {
      const { result } = renderHook(() => useGamificationFacade());
      expect(result.current.referralCode).toBe('REF123');
    });

    it('derives referralUrl from referral store', () => {
      const { result } = renderHook(() => useGamificationFacade());
      expect(result.current.referralUrl).toBe('https://cgraph.app/ref/REF123');
    });

    it('derives referralCount from referral stats', () => {
      const { result } = renderHook(() => useGamificationFacade());
      expect(result.current.referralCount).toBe(5);
    });

    it('defaults referral values when null', () => {
      mockReferralState.referralCode = null;
      mockReferralState.stats = null;
      const { result } = renderHook(() => useGamificationFacade());
      expect(result.current.referralCode).toBeNull();
      expect(result.current.referralUrl).toBeNull();
      expect(result.current.referralCount).toBe(0);
      // Restore
      mockReferralState.referralCode = { code: 'REF123', url: 'https://cgraph.app/ref/REF123' };
      mockReferralState.stats = { totalReferrals: 5, pendingRewards: 2 };
    });
  });

  describe('actions', () => {
    it('exposes all gamification actions as functions', () => {
      const { result } = renderHook(() => useGamificationFacade());
      expect(typeof result.current.fetchGamificationData).toBe('function');
      expect(typeof result.current.fetchAchievements).toBe('function');
      expect(typeof result.current.fetchQuests).toBe('function');
      expect(typeof result.current.completeQuest).toBe('function');
      expect(typeof result.current.equipTitle).toBe('function');
      expect(typeof result.current.equipBadge).toBe('function');
      expect(typeof result.current.unequipBadge).toBe('function');
    });
  });

  describe('interface completeness', () => {
    it('returns all expected keys', () => {
      const { result } = renderHook(() => useGamificationFacade());
      const keys = Object.keys(result.current);

      const expectedKeys = [
        'level',
        'currentXP',
        'totalXP',
        'karma',
        'loginStreak',
        'isLoading',
        'achievements',
        'recentlyUnlocked',
        'equippedBadges',
        'activeQuests',
        'completedQuests',
        'equippedTitle',
        'availableTitles',
        'prestigeLevel',
        'canPrestige',
        'activeEvents',
        'featuredEvent',
        'referralCode',
        'referralUrl',
        'referralCount',
        'fetchGamificationData',
        'fetchAchievements',
        'fetchQuests',
        'completeQuest',
        'equipTitle',
        'equipBadge',
        'unequipBadge',
      ];

      for (const key of expectedKeys) {
        expect(keys).toContain(key);
      }
    });
  });
});
