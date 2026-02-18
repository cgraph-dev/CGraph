/**
 * Tests for gamificationStore
 * @module stores/__tests__/gamificationStore
 */

import { useGamificationStore } from '../gamificationStore';

// ── Mocks ──────────────────────────────────────────────────────────────

const mockGetStats = jest.fn();
const mockGetAchievements = jest.fn();
const mockGetActiveQuests = jest.fn();
const mockClaimDailyStreak = jest.fn();
const mockEquipTitle = jest.fn();
const mockUnequipTitle = jest.fn();

jest.mock('../../services/gamificationService', () => ({
  getGamificationStats: (...args: unknown[]) => mockGetStats(...args),
  getAchievements: (...args: unknown[]) => mockGetAchievements(...args),
  getActiveQuests: (...args: unknown[]) => mockGetActiveQuests(...args),
  claimDailyStreak: (...args: unknown[]) => mockClaimDailyStreak(...args),
  equipTitle: (...args: unknown[]) => mockEquipTitle(...args),
  unequipTitle: (...args: unknown[]) => mockUnequipTitle(...args),
}));

// ── Helpers ────────────────────────────────────────────────────────────

function resetStore() {
  useGamificationStore.getState().reset();
}

const MOCK_STATS = {
  xp: 1500,
  level: 5,
  coins: 200,
  streak: 7,
  levelProgress: 0.6,
  xpForNextLevel: 500,
  achievementsUnlocked: 3,
  totalAchievements: 20,
  questsCompleted: 10,
  currentTitle: 'Explorer',
  equippedTitleId: 'title-1',
  lastStreakClaim: null,
  titles: [],
};

const MOCK_ACHIEVEMENTS = [
  {
    id: 'a1',
    name: 'First Steps',
    description: 'Send first message',
    icon: '👋',
    rarity: 'common' as const,
    category: 'social',
    xpReward: 50,
    coinReward: 10,
    requirement: 1,
    progress: 1,
    unlocked: true,
    unlockedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'a2',
    name: 'Chatty',
    description: 'Send 100 messages',
    icon: '💬',
    rarity: 'rare' as const,
    category: 'social',
    xpReward: 200,
    coinReward: 50,
    requirement: 100,
    progress: 45,
    unlocked: false,
    unlockedAt: null,
  },
];

const MOCK_QUESTS = [
  {
    id: 'q1',
    quest: {
      id: 'quest-1',
      name: 'Daily Chat',
      description: 'Send 5 messages today',
      type: 'daily' as const,
      objectives: [
        {
          id: 'obj-1',
          description: 'Send messages',
          targetValue: 5,
          currentValue: 2,
          completed: false,
        },
      ],
      rewards: [
        { type: 'xp' as const, amount: 50 },
        { type: 'coins' as const, amount: 10 },
      ],
      expiresAt: '2024-01-02T00:00:00Z',
    },
    accepted: true,
    progress: {},
    completed: false,
    claimed: false,
    acceptedAt: '2024-01-01T00:00:00Z',
    completedAt: null,
  },
];

// ── Tests ──────────────────────────────────────────────────────────────

describe('gamificationStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
  });

  describe('initial state', () => {
    it('has default values', () => {
      const state = useGamificationStore.getState();
      expect(state.xp).toBe(0);
      expect(state.level).toBe(1);
      expect(state.coins).toBe(0);
      expect(state.streak).toBe(0);
      expect(state.achievements).toEqual([]);
      expect(state.activeQuests).toEqual([]);
      expect(state.isLoading).toBe(false);
    });
  });

  // ── fetchGamificationData ──────────────────────────────────────────

  describe('fetchGamificationData', () => {
    it('fetches and sets gamification stats', async () => {
      mockGetStats.mockResolvedValueOnce(MOCK_STATS);

      await useGamificationStore.getState().fetchGamificationData();

      const state = useGamificationStore.getState();
      expect(state.xp).toBe(1500);
      expect(state.level).toBe(5);
      expect(state.coins).toBe(200);
      expect(state.streak).toBe(7);
      expect(state.levelProgress).toBe(0.6);
      expect(state.xpForNextLevel).toBe(500);
      expect(state.achievementsUnlocked).toBe(3);
      expect(state.totalAchievements).toBe(20);
      expect(state.questsCompleted).toBe(10);
      expect(state.currentTitle).toBe('Explorer');
      expect(state.equippedTitleId).toBe('title-1');
      expect(state.isLoading).toBe(false);
    });

    it('skips fetch if already loading', async () => {
      useGamificationStore.setState({ isLoading: true });

      await useGamificationStore.getState().fetchGamificationData();

      expect(mockGetStats).not.toHaveBeenCalled();
    });

    it('handles API error', async () => {
      mockGetStats.mockRejectedValueOnce(new Error('fail'));

      await useGamificationStore.getState().fetchGamificationData();

      expect(useGamificationStore.getState().isLoading).toBe(false);
    });
  });

  // ── fetchAchievements ──────────────────────────────────────────────

  describe('fetchAchievements', () => {
    it('fetches and transforms achievements', async () => {
      mockGetAchievements.mockResolvedValueOnce(MOCK_ACHIEVEMENTS);

      await useGamificationStore.getState().fetchAchievements();

      const state = useGamificationStore.getState();
      expect(state.achievements).toHaveLength(2);
      expect(state.achievements[0]).toEqual({
        id: 'a1',
        name: 'First Steps',
        description: 'Send first message',
        icon: '👋',
        rarity: 'common',
        category: 'social',
        xpReward: 50,
        progress: 1,
        maxProgress: 1,
        unlocked: true,
        unlockedAt: '2024-01-01T00:00:00Z',
      });
      expect(state.isLoadingAchievements).toBe(false);
    });

    it('maps requirement to maxProgress', async () => {
      mockGetAchievements.mockResolvedValueOnce(MOCK_ACHIEVEMENTS);

      await useGamificationStore.getState().fetchAchievements();

      expect(useGamificationStore.getState().achievements[1].maxProgress).toBe(100);
    });

    it('passes category filter', async () => {
      mockGetAchievements.mockResolvedValueOnce([]);

      await useGamificationStore.getState().fetchAchievements('social');

      expect(mockGetAchievements).toHaveBeenCalledWith('social');
    });

    it('handles error', async () => {
      mockGetAchievements.mockRejectedValueOnce(new Error('fail'));

      await useGamificationStore.getState().fetchAchievements();

      expect(useGamificationStore.getState().isLoadingAchievements).toBe(false);
    });
  });

  // ── fetchQuests ────────────────────────────────────────────────────

  describe('fetchQuests', () => {
    it('fetches and transforms quests', async () => {
      mockGetActiveQuests.mockResolvedValueOnce(MOCK_QUESTS);

      await useGamificationStore.getState().fetchQuests();

      const state = useGamificationStore.getState();
      expect(state.activeQuests).toHaveLength(1);
      expect(state.activeQuests[0]).toEqual({
        id: 'q1',
        title: 'Daily Chat',
        description: 'Send 5 messages today',
        type: 'daily',
        xpReward: 50,
        objectives: [
          {
            id: 'obj-1',
            description: 'Send messages',
            targetValue: 5,
            currentValue: 2,
            completed: false,
          },
        ],
        completed: false,
        expiresAt: '2024-01-02T00:00:00Z',
      });
      expect(state.isLoadingQuests).toBe(false);
    });

    it('sums only xp rewards for xpReward field', async () => {
      mockGetActiveQuests.mockResolvedValueOnce(MOCK_QUESTS);

      await useGamificationStore.getState().fetchQuests();

      // MOCK_QUESTS has { type: 'xp', amount: 50 } and { type: 'coins', amount: 10 }
      expect(useGamificationStore.getState().activeQuests[0].xpReward).toBe(50);
    });

    it('handles error', async () => {
      mockGetActiveQuests.mockRejectedValueOnce(new Error('fail'));

      await useGamificationStore.getState().fetchQuests();

      expect(useGamificationStore.getState().isLoadingQuests).toBe(false);
    });
  });

  // ── claimDailyStreak ───────────────────────────────────────────────

  describe('claimDailyStreak', () => {
    it('claims streak and updates state', async () => {
      useGamificationStore.setState({ coins: 100, streak: 3 });
      mockClaimDailyStreak.mockResolvedValueOnce({ coins: 50, streak: 4 });

      const result = await useGamificationStore.getState().claimDailyStreak();

      expect(result).toEqual({ coins: 50, streak: 4 });
      expect(useGamificationStore.getState().streak).toBe(4);
      expect(useGamificationStore.getState().coins).toBe(150); // 100 + 50
    });

    it('returns null on error', async () => {
      mockClaimDailyStreak.mockRejectedValueOnce(new Error('fail'));

      const result = await useGamificationStore.getState().claimDailyStreak();

      expect(result).toBeNull();
    });
  });

  // ── equipTitle / unequipTitle ──────────────────────────────────────

  describe('equipTitle', () => {
    it('equips a title', async () => {
      mockEquipTitle.mockResolvedValueOnce(undefined);

      await useGamificationStore.getState().equipTitle('title-42');

      expect(mockEquipTitle).toHaveBeenCalledWith('title-42');
      expect(useGamificationStore.getState().equippedTitleId).toBe('title-42');
    });

    it('handles error silently', async () => {
      mockEquipTitle.mockRejectedValueOnce(new Error('fail'));

      await expect(
        useGamificationStore.getState().equipTitle('title-42')
      ).resolves.toBeUndefined();
    });
  });

  describe('unequipTitle', () => {
    it('unequips the current title', async () => {
      useGamificationStore.setState({ equippedTitleId: 'title-1', currentTitle: 'Explorer' });
      mockUnequipTitle.mockResolvedValueOnce(undefined);

      await useGamificationStore.getState().unequipTitle();

      expect(useGamificationStore.getState().equippedTitleId).toBeNull();
      expect(useGamificationStore.getState().currentTitle).toBeNull();
    });
  });

  // ── reset ──────────────────────────────────────────────────────────

  describe('reset', () => {
    it('resets to initial state', () => {
      useGamificationStore.setState({
        xp: 999,
        level: 10,
        coins: 500,
        streak: 20,
        achievements: MOCK_ACHIEVEMENTS as any,
      });

      useGamificationStore.getState().reset();

      const state = useGamificationStore.getState();
      expect(state.xp).toBe(0);
      expect(state.level).toBe(1);
      expect(state.coins).toBe(0);
      expect(state.streak).toBe(0);
      expect(state.achievements).toEqual([]);
    });
  });
});
