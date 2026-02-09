/**
 * useGamificationFacade Unit Tests
 *
 * Tests for the gamification composition facade hook.
 * Validates multi-store aggregation across gamification, prestige, events, referrals.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGamificationFacade } from '../useGamificationFacade';

// ── Mock stores ────────────────────────────────────────────────────

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
  useGamificationStore: vi.fn((sel: (s: typeof mockGamificationState) => unknown) =>
    sel(mockGamificationState)
  ),
  usePrestigeStore: vi.fn((sel: (s: typeof mockPrestigeState) => unknown) =>
    sel(mockPrestigeState)
  ),
  useSeasonalEventStore: vi.fn((sel: (s: typeof mockSeasonalState) => unknown) =>
    sel(mockSeasonalState)
  ),
  useReferralStore: vi.fn((sel: (s: typeof mockReferralState) => unknown) =>
    sel(mockReferralState)
  ),
}));

function resetState() {
  Object.assign(mockGamificationState, {
    level: 5,
    currentXP: 1200,
    totalXP: 3500,
    karma: 42,
    loginStreak: 7,
    isLoading: false,
    achievements: [{ id: 'ach-1', name: 'First Steps' }],
    recentlyUnlocked: [],
    equippedBadges: ['early-adopter'],
    activeQuests: [{ id: 'q-1', name: 'Send 10 Messages' }],
    completedQuests: [],
    equippedTitle: { id: 'title-1', name: 'Pioneer', color: '#10b981' },
    availableTitles: [
      { id: 'title-1', name: 'Pioneer', color: '#10b981' },
      { id: 'title-2', name: 'Explorer', color: '#06b6d4' },
    ],
  });
  mockPrestigeState.prestige = { level: 2, multiplier: 1.5 };
  mockPrestigeState.canPrestige = true;
  mockSeasonalState.activeEvents = [{ id: 'evt-1', name: 'Winter Festival' }];
  mockSeasonalState.featuredEvent = { id: 'evt-1', name: 'Winter Festival' };
  mockReferralState.referralCode = { code: 'REF123', url: 'https://cgraph.app/ref/REF123' };
  mockReferralState.stats = { totalReferrals: 5, pendingRewards: 2 };
}

describe('useGamificationFacade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetState();
  });

  // ── Core progression ─────────────────────────────────────────────

  it('exposes level, XP, karma, loginStreak from gamification store', () => {
    const { result } = renderHook(() => useGamificationFacade());
    expect(result.current.level).toBe(5);
    expect(result.current.currentXP).toBe(1200);
    expect(result.current.totalXP).toBe(3500);
    expect(result.current.karma).toBe(42);
    expect(result.current.loginStreak).toBe(7);
  });

  it('exposes isLoading from gamification store', () => {
    const { result } = renderHook(() => useGamificationFacade());
    expect(result.current.isLoading).toBe(false);
  });

  // ── Achievements ─────────────────────────────────────────────────

  it('exposes achievements list', () => {
    const { result } = renderHook(() => useGamificationFacade());
    expect(result.current.achievements).toHaveLength(1);
  });

  it('exposes empty achievements when none exist', () => {
    mockGamificationState.achievements = [];
    const { result } = renderHook(() => useGamificationFacade());
    expect(result.current.achievements).toEqual([]);
  });

  it('exposes recentlyUnlocked', () => {
    mockGamificationState.recentlyUnlocked = [{ id: 'ach-2', name: 'Streak Master' }];
    const { result } = renderHook(() => useGamificationFacade());
    expect(result.current.recentlyUnlocked).toHaveLength(1);
  });

  it('exposes equippedBadges', () => {
    const { result } = renderHook(() => useGamificationFacade());
    expect(result.current.equippedBadges).toEqual(['early-adopter']);
  });

  // ── Quests ───────────────────────────────────────────────────────

  it('exposes active quests', () => {
    const { result } = renderHook(() => useGamificationFacade());
    expect(result.current.activeQuests).toHaveLength(1);
  });

  it('exposes empty activeQuests when none', () => {
    mockGamificationState.activeQuests = [];
    const { result } = renderHook(() => useGamificationFacade());
    expect(result.current.activeQuests).toEqual([]);
  });

  it('exposes completed quests', () => {
    mockGamificationState.completedQuests = [{ id: 'q-2', name: 'Done Quest' }];
    const { result } = renderHook(() => useGamificationFacade());
    expect(result.current.completedQuests).toHaveLength(1);
  });

  // ── Titles ───────────────────────────────────────────────────────

  it('exposes equipped title', () => {
    const { result } = renderHook(() => useGamificationFacade());
    expect(result.current.equippedTitle).toEqual({
      id: 'title-1',
      name: 'Pioneer',
      color: '#10b981',
    });
  });

  it('exposes null equippedTitle when none equipped', () => {
    mockGamificationState.equippedTitle = null;
    const { result } = renderHook(() => useGamificationFacade());
    expect(result.current.equippedTitle).toBeNull();
  });

  it('exposes available titles', () => {
    const { result } = renderHook(() => useGamificationFacade());
    expect(result.current.availableTitles).toHaveLength(2);
  });

  // ── Prestige (cross-store) ───────────────────────────────────────

  it('derives prestigeLevel from prestige store', () => {
    const { result } = renderHook(() => useGamificationFacade());
    expect(result.current.prestigeLevel).toBe(2);
  });

  it('defaults prestigeLevel to 0 when prestige is null', () => {
    mockPrestigeState.prestige = null;
    const { result } = renderHook(() => useGamificationFacade());
    expect(result.current.prestigeLevel).toBe(0);
  });

  it('exposes canPrestige', () => {
    const { result } = renderHook(() => useGamificationFacade());
    expect(result.current.canPrestige).toBe(true);
  });

  // ── Seasonal events (cross-store) ────────────────────────────────

  it('exposes active events', () => {
    const { result } = renderHook(() => useGamificationFacade());
    expect(result.current.activeEvents).toHaveLength(1);
  });

  it('exposes featuredEvent', () => {
    const { result } = renderHook(() => useGamificationFacade());
    expect(result.current.featuredEvent).not.toBeNull();
  });

  it('exposes null featuredEvent when none', () => {
    mockSeasonalState.featuredEvent = null;
    const { result } = renderHook(() => useGamificationFacade());
    expect(result.current.featuredEvent).toBeNull();
  });

  // ── Referrals (cross-store) ──────────────────────────────────────

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

  it('defaults referral values when objects are null', () => {
    mockReferralState.referralCode = null;
    mockReferralState.stats = null;
    const { result } = renderHook(() => useGamificationFacade());
    expect(result.current.referralCode).toBeNull();
    expect(result.current.referralUrl).toBeNull();
    expect(result.current.referralCount).toBe(0);
  });

  // ── Action delegation ────────────────────────────────────────────

  it('fetchGamificationData delegates to store', () => {
    const { result } = renderHook(() => useGamificationFacade());
    result.current.fetchGamificationData();
    expect(mockGamificationState.fetchGamificationData).toHaveBeenCalledOnce();
  });

  it('fetchAchievements delegates to store', () => {
    const { result } = renderHook(() => useGamificationFacade());
    result.current.fetchAchievements();
    expect(mockGamificationState.fetchAchievements).toHaveBeenCalledOnce();
  });

  it('completeQuest delegates with questId', () => {
    const { result } = renderHook(() => useGamificationFacade());
    result.current.completeQuest('q-1');
    expect(mockGamificationState.completeQuest).toHaveBeenCalledWith('q-1');
  });

  it('equipTitle delegates with titleId', () => {
    const { result } = renderHook(() => useGamificationFacade());
    result.current.equipTitle('title-2');
    expect(mockGamificationState.equipTitle).toHaveBeenCalledWith('title-2');
  });

  it('equipBadge delegates with badgeId', () => {
    const { result } = renderHook(() => useGamificationFacade());
    result.current.equipBadge('badge-99');
    expect(mockGamificationState.equipBadge).toHaveBeenCalledWith('badge-99');
  });

  it('unequipBadge delegates with badgeId', () => {
    const { result } = renderHook(() => useGamificationFacade());
    result.current.unequipBadge('early-adopter');
    expect(mockGamificationState.unequipBadge).toHaveBeenCalledWith('early-adopter');
  });

  // ── Interface completeness ───────────────────────────────────────

  it('returns all 27 expected keys', () => {
    const { result } = renderHook(() => useGamificationFacade());
    const keys = Object.keys(result.current);

    const expected = [
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
    for (const k of expected) expect(keys).toContain(k);
    expect(keys).toHaveLength(expected.length);
  });

  it('all action properties are functions', () => {
    const { result } = renderHook(() => useGamificationFacade());
    const actions = [
      'fetchGamificationData',
      'fetchAchievements',
      'fetchQuests',
      'completeQuest',
      'equipTitle',
      'equipBadge',
      'unequipBadge',
    ] as const;
    for (const a of actions) {
      expect(typeof result.current[a]).toBe('function');
    }
  });
});
