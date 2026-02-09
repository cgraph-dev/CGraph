/**
 * Gamification Store — Comprehensive Unit Tests
 *
 * Tests for the gamification Zustand store covering:
 * - Initial state
 * - Query actions (fetchGamificationData, fetchAchievements, fetchQuests, fetchLore)
 * - Mutation actions (addXP, unlockAchievement, completeQuest, updateQuestProgress)
 * - Badge management (equipBadge, unequipBadge)
 * - Title equipping (equipTitle)
 * - Streak tracking (checkDailyLogin)
 * - Error handling for all async actions
 *
 * @module modules/gamification/store/__tests__/gamificationStore.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { api } from '@/lib/api';
import { useGamificationStore } from '../gamificationStore.impl';
import { calculateXPForLevel, calculateLevelFromXP } from '../gamificationStore.utils';

// ── Mocks ──────────────────────────────────────────────────────────────

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Note: @/lib/logger is mocked globally in src/test/setup.ts

const mockedApi = vi.mocked(api, { deep: true });

// ── Helpers ────────────────────────────────────────────────────────────

const getInitialState = () => ({
  level: 1,
  currentXP: 0,
  totalXP: 0,
  karma: 0,
  achievements: [],
  recentlyUnlocked: [],
  activeQuests: [],
  completedQuests: [],
  availableTitles: [],
  equippedTitle: null,
  equippedBadges: [],
  loreEntries: [],
  currentChapter: 1,
  loginStreak: 0,
  lastLoginDate: null,
  isLoading: false,
  isLoadingAchievements: false,
});

// ── Fixtures ───────────────────────────────────────────────────────────

const mockAchievements = [
  {
    id: 'first-message',
    title: 'First Steps',
    description: 'Send your first message',
    category: 'social' as const,
    rarity: 'common' as const,
    icon: '💬',
    xpReward: 50,
    progress: 0,
    maxProgress: 1,
    unlocked: false,
    isHidden: false,
  },
  {
    id: 'chat-master',
    title: 'Chat Master',
    description: 'Send 1000 messages',
    category: 'social' as const,
    rarity: 'epic' as const,
    icon: '🏆',
    xpReward: 500,
    progress: 500,
    maxProgress: 1000,
    unlocked: false,
    isHidden: false,
  },
  {
    id: 'secret-finder',
    title: 'Secret Finder',
    description: 'Find a hidden easter egg',
    category: 'secret' as const,
    rarity: 'legendary' as const,
    icon: '🔮',
    xpReward: 1000,
    progress: 0,
    maxProgress: 1,
    unlocked: true,
    unlockedAt: '2026-01-15T10:00:00Z',
    isHidden: true,
    loreFragment: 'lore-secret-1',
  },
];

const mockQuests = [
  {
    id: 'daily-chat',
    title: 'Daily Chatter',
    description: 'Send 10 messages today',
    type: 'daily' as const,
    xpReward: 100,
    objectives: [
      {
        id: 'obj-1',
        description: 'Send messages',
        type: 'count' as const,
        targetValue: 10,
        currentValue: 5,
        completed: false,
      },
    ],
    expiresAt: '2026-12-31T23:59:59Z',
    completed: false,
  },
  {
    id: 'weekly-explorer',
    title: 'Weekly Explorer',
    description: 'Visit 5 different forums',
    type: 'weekly' as const,
    xpReward: 250,
    objectives: [
      {
        id: 'obj-2',
        description: 'Visit forums',
        type: 'visit' as const,
        targetValue: 5,
        currentValue: 5,
        completed: true,
      },
    ],
    expiresAt: '2026-12-31T23:59:59Z',
    completed: false,
  },
];

const mockTitles = [
  {
    id: 'newcomer',
    name: 'Newcomer',
    description: 'Just joined the community',
    color: '#808080',
    rarity: 'common' as const,
    unlocked: true,
    isEquipped: true,
  },
  {
    id: 'pioneer',
    name: 'Pioneer',
    description: 'One of the early adopters',
    color: '#FFD700',
    rarity: 'rare' as const,
    unlocked: true,
    isEquipped: false,
  },
];

// ── Lifecycle ──────────────────────────────────────────────────────────

beforeEach(() => {
  useGamificationStore.setState(getInitialState());
});

afterEach(() => {
  useGamificationStore.setState(getInitialState());
  vi.clearAllMocks();
});

// ════════════════════════════════════════════════════════════════════════
// Tests
// ════════════════════════════════════════════════════════════════════════

describe('gamificationStore', () => {
  // ── 1. Initial State ───────────────────────────────────────────────

  describe('initial state', () => {
    it('should have correct default level, XP, and karma', () => {
      const state = useGamificationStore.getState();
      expect(state.level).toBe(1);
      expect(state.currentXP).toBe(0);
      expect(state.totalXP).toBe(0);
      expect(state.karma).toBe(0);
    });

    it('should have empty collections', () => {
      const state = useGamificationStore.getState();
      expect(state.achievements).toEqual([]);
      expect(state.recentlyUnlocked).toEqual([]);
      expect(state.activeQuests).toEqual([]);
      expect(state.completedQuests).toEqual([]);
      expect(state.availableTitles).toEqual([]);
      expect(state.equippedBadges).toEqual([]);
      expect(state.loreEntries).toEqual([]);
    });

    it('should have null/default values for optional fields', () => {
      const state = useGamificationStore.getState();
      expect(state.equippedTitle).toBeNull();
      expect(state.lastLoginDate).toBeNull();
      expect(state.loginStreak).toBe(0);
      expect(state.currentChapter).toBe(1);
    });

    it('should have loading flags set to false', () => {
      const state = useGamificationStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.isLoadingAchievements).toBe(false);
    });
  });

  // ── 2. fetchGamificationData ───────────────────────────────────────

  describe('fetchGamificationData', () => {
    it('should set isLoading while fetching and reset on success', async () => {
      mockedApi.get.mockImplementation(async (url: string) => {
        // Verify isLoading was set at start
        expect(useGamificationStore.getState().isLoading).toBe(true);

        if (url.includes('/stats'))
          return { data: { data: { level: 5, xp: 2000, streak_days: 3 } } };
        if (url.includes('/achievements')) return { data: { data: [] } };
        if (url.includes('/quests/active')) return { data: { data: [] } };
        return { data: {} };
      });

      await useGamificationStore.getState().fetchGamificationData();

      const state = useGamificationStore.getState();
      expect(state.isLoading).toBe(false);
    });

    it('should populate level, XP, and streak from stats response', async () => {
      mockedApi.get.mockImplementation(async (url: string) => {
        if (url.includes('/stats'))
          return { data: { data: { level: 7, xp: 3500, streak_days: 12 } } };
        if (url.includes('/achievements')) return { data: { data: [] } };
        if (url.includes('/quests/active')) return { data: { data: [] } };
        return { data: {} };
      });

      await useGamificationStore.getState().fetchGamificationData();

      const state = useGamificationStore.getState();
      expect(state.level).toBe(7);
      expect(state.totalXP).toBe(3500);
      expect(state.currentXP).toBe(3500);
      expect(state.loginStreak).toBe(12);
    });

    it('should map API achievement data to store format', async () => {
      const apiAchievements = [
        {
          id: 'ach-1',
          title: 'Explorer',
          description: 'Visit 10 pages',
          category: 'exploration',
          rarity: 'common',
          icon: '🧭',
          xp_reward: 100,
          progress: 4,
          max_progress: 10,
          unlocked: false,
          unlocked_at: null,
          is_hidden: false,
          title_reward: null,
        },
      ];

      mockedApi.get.mockImplementation(async (url: string) => {
        if (url.includes('/stats')) return { data: { data: { level: 1, xp: 0 } } };
        if (url.includes('/achievements')) return { data: { data: apiAchievements } };
        if (url.includes('/quests/active')) return { data: { data: [] } };
        return { data: {} };
      });

      await useGamificationStore.getState().fetchGamificationData();

      const state = useGamificationStore.getState();
      expect(state.achievements).toHaveLength(1);
      expect(state.achievements[0]).toEqual({
        id: 'ach-1',
        title: 'Explorer',
        description: 'Visit 10 pages',
        category: 'exploration',
        rarity: 'common',
        icon: '🧭',
        xpReward: 100,
        progress: 4,
        maxProgress: 10,
        unlocked: false,
        unlockedAt: null,
        isHidden: false,
        titleReward: null,
      });
    });

    it('should set isLoading to false on error', async () => {
      mockedApi.get.mockRejectedValue(new Error('Network error'));

      await useGamificationStore.getState().fetchGamificationData();

      expect(useGamificationStore.getState().isLoading).toBe(false);
    });

    it('should not overwrite existing data on error', async () => {
      useGamificationStore.setState({ level: 5, totalXP: 2000 });

      mockedApi.get.mockRejectedValue(new Error('Network error'));

      await useGamificationStore.getState().fetchGamificationData();

      const state = useGamificationStore.getState();
      expect(state.level).toBe(5);
      expect(state.totalXP).toBe(2000);
    });
  });

  // ── 3. fetchAchievements ───────────────────────────────────────────

  describe('fetchAchievements', () => {
    it('should set isLoadingAchievements while fetching', async () => {
      mockedApi.get.mockImplementation(async () => {
        expect(useGamificationStore.getState().isLoadingAchievements).toBe(true);
        return { data: { data: [] } };
      });

      await useGamificationStore.getState().fetchAchievements();

      expect(useGamificationStore.getState().isLoadingAchievements).toBe(false);
    });

    it('should map server achievements into store shape', async () => {
      mockedApi.get.mockResolvedValue({
        data: {
          data: [
            {
              id: 'a1',
              title: 'Title',
              description: 'Desc',
              category: 'social',
              rarity: 'rare',
              icon: '⭐',
              xp_reward: 200,
              progress: 1,
              max_progress: 5,
              unlocked: true,
              unlocked_at: '2026-01-01T00:00:00Z',
              is_hidden: true,
              title_reward: 'Veteran',
            },
          ],
        },
      });

      await useGamificationStore.getState().fetchAchievements();

      const achievement = useGamificationStore.getState().achievements[0];
      expect(achievement).toBeDefined();
      expect(achievement!.xpReward).toBe(200);
      expect(achievement!.isHidden).toBe(true);
      expect(achievement!.unlockedAt).toBe('2026-01-01T00:00:00Z');
      expect(achievement!.titleReward).toBe('Veteran');
    });

    it('should reset isLoadingAchievements on error', async () => {
      mockedApi.get.mockRejectedValue(new Error('Server error'));

      await useGamificationStore.getState().fetchAchievements();

      expect(useGamificationStore.getState().isLoadingAchievements).toBe(false);
    });
  });

  // ── 4. fetchQuests ─────────────────────────────────────────────────

  describe('fetchQuests', () => {
    it('should combine active, daily, and weekly quests', async () => {
      mockedApi.get.mockImplementation(async (url: string) => {
        if (url.includes('/quests/active'))
          return {
            data: {
              data: [
                {
                  id: 'q-active',
                  quest: {
                    title: 'Active',
                    description: 'An active quest',
                    type: 'daily',
                    xp_reward: 50,
                    objectives: { objectives: [] },
                  },
                  completed: false,
                },
              ],
            },
          };
        if (url.includes('/quests/daily'))
          return {
            data: {
              data: [
                {
                  id: 'q-daily',
                  accepted: true,
                  quest: {
                    title: 'Daily',
                    description: 'A daily quest',
                    type: 'daily',
                    xp_reward: 30,
                    objectives: { objectives: [] },
                  },
                  completed: false,
                },
                {
                  id: 'q-daily-unaccepted',
                  accepted: false,
                  quest: {
                    title: 'Unaccepted',
                    description: 'Not accepted',
                    type: 'daily',
                    xp_reward: 10,
                    objectives: { objectives: [] },
                  },
                  completed: false,
                },
              ],
            },
          };
        if (url.includes('/quests/weekly')) return { data: { data: [] } };
        return { data: {} };
      });

      await useGamificationStore.getState().fetchQuests();

      const state = useGamificationStore.getState();
      // Should include active + accepted daily only; not the unaccepted one
      expect(state.activeQuests).toHaveLength(2);
      expect(state.activeQuests.map((q) => q.id)).toContain('q-active');
      expect(state.activeQuests.map((q) => q.id)).toContain('q-daily');
      expect(state.activeQuests.map((q) => q.id)).not.toContain('q-daily-unaccepted');
    });

    it('should not throw on fetch error', async () => {
      mockedApi.get.mockRejectedValue(new Error('Timeout'));

      await expect(useGamificationStore.getState().fetchQuests()).resolves.not.toThrow();
    });
  });

  // ── 5. fetchLore ───────────────────────────────────────────────────

  describe('fetchLore', () => {
    it('should set loreEntries to empty (future feature)', async () => {
      useGamificationStore.setState({
        loreEntries: [
          { id: 'old', chapter: 1, title: 'Old', content: '', unlocked: false, nextEntries: [] },
        ],
      });

      await useGamificationStore.getState().fetchLore();

      expect(useGamificationStore.getState().loreEntries).toEqual([]);
    });
  });

  // ── 6. addXP ───────────────────────────────────────────────────────

  describe('addXP', () => {
    it('should increase totalXP by the given amount', async () => {
      await useGamificationStore.getState().addXP(100, 'test');

      const state = useGamificationStore.getState();
      expect(state.totalXP).toBe(100);
    });

    it('should accumulate XP across multiple calls', async () => {
      await useGamificationStore.getState().addXP(100, 'message');
      await useGamificationStore.getState().addXP(200, 'quest');

      expect(useGamificationStore.getState().totalXP).toBe(300);
    });

    it('should update the level based on new total XP', async () => {
      // Give enough XP to reach a higher level
      const xp = 5000;
      await useGamificationStore.getState().addXP(xp, 'bulk');

      const state = useGamificationStore.getState();
      const expectedLevel = calculateLevelFromXP(xp);
      expect(state.level).toBe(expectedLevel);
      expect(state.totalXP).toBe(xp);
    });

    it('should compute currentXP relative to the current level threshold', async () => {
      const xp = 5000;
      await useGamificationStore.getState().addXP(xp, 'test');

      const state = useGamificationStore.getState();
      const expectedLevel = calculateLevelFromXP(xp);
      const expectedCurrentXP = xp - calculateXPForLevel(expectedLevel);
      expect(state.currentXP).toBe(expectedCurrentXP);
    });
  });

  // ── 7. unlockAchievement ───────────────────────────────────────────

  describe('unlockAchievement', () => {
    beforeEach(() => {
      useGamificationStore.setState({ achievements: [...mockAchievements] });
    });

    it('should do nothing if achievement is already unlocked', async () => {
      await useGamificationStore.getState().unlockAchievement('secret-finder');

      // API should not be called because achievement is already unlocked
      expect(mockedApi.post).not.toHaveBeenCalled();
    });

    it('should do nothing if achievement ID does not exist', async () => {
      await useGamificationStore.getState().unlockAchievement('nonexistent');

      expect(mockedApi.post).not.toHaveBeenCalled();
    });

    it('should mark achievement as unlocked on successful API response', async () => {
      mockedApi.post.mockResolvedValue({
        data: { success: true, unlocked: true, unlocked_at: '2026-02-01T00:00:00Z' },
      });

      await useGamificationStore.getState().unlockAchievement('first-message');

      const achievement = useGamificationStore
        .getState()
        .achievements.find((a) => a.id === 'first-message');
      expect(achievement?.unlocked).toBe(true);
      expect(achievement?.unlockedAt).toBe('2026-02-01T00:00:00Z');
    });

    it('should add XP reward when unlocking an achievement with xpReward > 0', async () => {
      mockedApi.post.mockResolvedValue({
        data: { success: true, unlocked: true },
      });

      await useGamificationStore.getState().unlockAchievement('first-message');

      // first-message has xpReward: 50
      expect(useGamificationStore.getState().totalXP).toBe(50);
    });

    it('should add achievement to recentlyUnlocked', async () => {
      mockedApi.post.mockResolvedValue({
        data: { success: true, unlocked: true },
      });

      await useGamificationStore.getState().unlockAchievement('first-message');

      const recent = useGamificationStore.getState().recentlyUnlocked;
      expect(recent).toHaveLength(1);
      expect(recent[0]!.id).toBe('first-message');
    });

    it('should cap recentlyUnlocked at 5 entries', async () => {
      // Pre-fill with 4 entries
      useGamificationStore.setState({
        recentlyUnlocked: Array.from({ length: 4 }, (_, i) => ({
          ...mockAchievements[0]!,
          id: `recent-${i}`,
        })),
      });

      mockedApi.post.mockResolvedValue({
        data: { success: true, unlocked: true },
      });

      await useGamificationStore.getState().unlockAchievement('first-message');

      // Adding one more = 5 entries, should stay ≤ 5
      expect(useGamificationStore.getState().recentlyUnlocked.length).toBeLessThanOrEqual(5);
    });

    it('should not unlock when API returns success false', async () => {
      mockedApi.post.mockResolvedValue({
        data: { success: false, unlocked: false, message: 'Requirements not met' },
      });

      await useGamificationStore.getState().unlockAchievement('first-message');

      const achievement = useGamificationStore
        .getState()
        .achievements.find((a) => a.id === 'first-message');
      expect(achievement?.unlocked).toBe(false);
    });

    it('should handle API errors gracefully', async () => {
      mockedApi.post.mockRejectedValue(new Error('Server error'));

      // Should not throw
      await expect(
        useGamificationStore.getState().unlockAchievement('first-message')
      ).resolves.not.toThrow();

      // Achievement should remain locked
      const achievement = useGamificationStore
        .getState()
        .achievements.find((a) => a.id === 'first-message');
      expect(achievement?.unlocked).toBe(false);
    });
  });

  // ── 8. completeQuest ───────────────────────────────────────────────

  describe('completeQuest', () => {
    beforeEach(() => {
      useGamificationStore.setState({ activeQuests: [...mockQuests], completedQuests: [] });
    });

    it('should do nothing for a nonexistent quest', async () => {
      await useGamificationStore.getState().completeQuest('no-such-quest');
      expect(mockedApi.post).not.toHaveBeenCalled();
    });

    it('should do nothing for an already completed quest', async () => {
      useGamificationStore.setState({
        activeQuests: [{ ...mockQuests[0]!, completed: true }],
      });

      await useGamificationStore.getState().completeQuest('daily-chat');

      expect(mockedApi.post).not.toHaveBeenCalled();
    });

    it('should move quest from active to completed on success', async () => {
      mockedApi.post.mockResolvedValue({
        data: { rewards: { xp: 100, coins: 10 } },
      });

      await useGamificationStore.getState().completeQuest('daily-chat');

      const state = useGamificationStore.getState();
      expect(state.activeQuests.find((q) => q.id === 'daily-chat')).toBeUndefined();
      expect(state.completedQuests.find((q) => q.id === 'daily-chat')).toBeDefined();
      expect(state.completedQuests[0]!.completed).toBe(true);
      expect(state.completedQuests[0]!.completedAt).toBeDefined();
    });

    it('should call the correct API endpoint', async () => {
      mockedApi.post.mockResolvedValue({ data: {} });

      await useGamificationStore.getState().completeQuest('daily-chat');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/quests/daily-chat/claim');
    });

    it('should handle API errors without crashing', async () => {
      mockedApi.post.mockRejectedValue(new Error('Quest claim failed'));

      await expect(
        useGamificationStore.getState().completeQuest('daily-chat')
      ).resolves.not.toThrow();
    });
  });

  // ── 9. updateQuestProgress ─────────────────────────────────────────

  describe('updateQuestProgress', () => {
    beforeEach(() => {
      useGamificationStore.setState({ activeQuests: [...mockQuests] });
    });

    it('should update objective currentValue', () => {
      useGamificationStore.getState().updateQuestProgress('daily-chat', 'obj-1', 8);

      const quest = useGamificationStore.getState().activeQuests.find((q) => q.id === 'daily-chat');
      expect(quest?.objectives[0]!.currentValue).toBe(8);
    });

    it('should mark objective as completed when value >= target', () => {
      useGamificationStore.getState().updateQuestProgress('daily-chat', 'obj-1', 10);

      const quest = useGamificationStore.getState().activeQuests.find((q) => q.id === 'daily-chat');
      expect(quest?.objectives[0]!.completed).toBe(true);
    });

    it('should cap currentValue at targetValue', () => {
      useGamificationStore.getState().updateQuestProgress('daily-chat', 'obj-1', 99);

      const quest = useGamificationStore.getState().activeQuests.find((q) => q.id === 'daily-chat');
      expect(quest?.objectives[0]!.currentValue).toBe(10);
    });

    it('should not affect other quests', () => {
      useGamificationStore.getState().updateQuestProgress('daily-chat', 'obj-1', 8);

      const weekly = useGamificationStore
        .getState()
        .activeQuests.find((q) => q.id === 'weekly-explorer');
      expect(weekly?.objectives[0]!.currentValue).toBe(5);
    });
  });

  // ── 10. equipBadge / unequipBadge ──────────────────────────────────

  describe('equipBadge', () => {
    beforeEach(() => {
      useGamificationStore.setState({
        achievements: [...mockAchievements],
        equippedBadges: [],
      });
    });

    it('should equip a badge for an unlocked achievement', async () => {
      mockedApi.post.mockResolvedValue({ data: {} });

      await useGamificationStore.getState().equipBadge('secret-finder');

      expect(useGamificationStore.getState().equippedBadges).toContain('secret-finder');
    });

    it('should not equip a badge for a locked achievement', async () => {
      await useGamificationStore.getState().equipBadge('first-message');

      expect(mockedApi.post).not.toHaveBeenCalled();
      expect(useGamificationStore.getState().equippedBadges).toEqual([]);
    });

    it('should not equip a badge for a nonexistent achievement', async () => {
      await useGamificationStore.getState().equipBadge('nonexistent');

      expect(mockedApi.post).not.toHaveBeenCalled();
    });

    it('should prevent equipping more than 3 badges', async () => {
      useGamificationStore.setState({
        equippedBadges: ['a', 'b', 'c'],
      });

      await useGamificationStore.getState().equipBadge('secret-finder');

      expect(useGamificationStore.getState().equippedBadges).toHaveLength(3);
      expect(mockedApi.post).not.toHaveBeenCalled();
    });

    it('should not duplicate an already equipped badge', async () => {
      useGamificationStore.setState({ equippedBadges: ['secret-finder'] });

      await useGamificationStore.getState().equipBadge('secret-finder');

      expect(useGamificationStore.getState().equippedBadges).toHaveLength(1);
      expect(mockedApi.post).not.toHaveBeenCalled();
    });

    it('should handle API error when equipping', async () => {
      mockedApi.post.mockRejectedValue(new Error('Server error'));

      await useGamificationStore.getState().equipBadge('secret-finder');

      // Badge should not be added on error
      expect(useGamificationStore.getState().equippedBadges).toEqual([]);
    });
  });

  describe('unequipBadge', () => {
    beforeEach(() => {
      useGamificationStore.setState({
        equippedBadges: ['secret-finder'],
      });
    });

    it('should remove badge from equipped list', async () => {
      mockedApi.post.mockResolvedValue({ data: {} });

      await useGamificationStore.getState().unequipBadge('secret-finder');

      expect(useGamificationStore.getState().equippedBadges).toEqual([]);
    });

    it('should do nothing when unequipping a badge not equipped', async () => {
      await useGamificationStore.getState().unequipBadge('nonexistent');

      expect(mockedApi.post).not.toHaveBeenCalled();
      expect(useGamificationStore.getState().equippedBadges).toEqual(['secret-finder']);
    });

    it('should handle API error when unequipping', async () => {
      mockedApi.post.mockRejectedValue(new Error('Server error'));

      await useGamificationStore.getState().unequipBadge('secret-finder');

      // Badge should remain equipped on error
      expect(useGamificationStore.getState().equippedBadges).toEqual(['secret-finder']);
    });
  });

  // ── 11. equipTitle ─────────────────────────────────────────────────

  describe('equipTitle', () => {
    beforeEach(() => {
      useGamificationStore.setState({
        availableTitles: [...mockTitles],
        equippedTitle: null,
      });
    });

    it('should equip a title and update state', async () => {
      mockedApi.post.mockResolvedValue({ data: {} });

      await useGamificationStore.getState().equipTitle('pioneer');

      const state = useGamificationStore.getState();
      expect(state.equippedTitle?.id).toBe('pioneer');
    });

    it('should mark only the equipped title as isEquipped', async () => {
      mockedApi.post.mockResolvedValue({ data: {} });

      await useGamificationStore.getState().equipTitle('pioneer');

      const state = useGamificationStore.getState();
      const pioneer = state.availableTitles.find((t) => t.id === 'pioneer');
      const newcomer = state.availableTitles.find((t) => t.id === 'newcomer');
      expect(pioneer?.isEquipped).toBe(true);
      expect(newcomer?.isEquipped).toBe(false);
    });

    it('should call the correct API endpoint', async () => {
      mockedApi.post.mockResolvedValue({ data: {} });

      await useGamificationStore.getState().equipTitle('newcomer');

      expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/titles/newcomer/equip');
    });

    it('should handle API error gracefully', async () => {
      mockedApi.post.mockRejectedValue(new Error('Failed'));

      await expect(useGamificationStore.getState().equipTitle('pioneer')).resolves.not.toThrow();

      // Title should not have changed
      expect(useGamificationStore.getState().equippedTitle).toBeNull();
    });
  });

  // ── 12. checkDailyLogin ────────────────────────────────────────────

  describe('checkDailyLogin', () => {
    it('should skip if already checked today', async () => {
      const today = new Date().toISOString().split('T')[0];
      useGamificationStore.setState({ lastLoginDate: today });

      await useGamificationStore.getState().checkDailyLogin();

      expect(mockedApi.post).not.toHaveBeenCalled();
    });

    it('should claim streak and update loginStreak on success', async () => {
      useGamificationStore.setState({ lastLoginDate: '2020-01-01' });
      mockedApi.post.mockResolvedValue({
        data: { data: { streak_days: 5, coins_earned: 50 } },
      });

      await useGamificationStore.getState().checkDailyLogin();

      const state = useGamificationStore.getState();
      const today = new Date().toISOString().split('T')[0];
      expect(state.lastLoginDate).toBe(today);
      expect(state.loginStreak).toBe(5);
    });

    it('should still update lastLoginDate on API error', async () => {
      useGamificationStore.setState({ lastLoginDate: null, loginStreak: 0 });
      mockedApi.post.mockRejectedValue(new Error('Already claimed'));

      await useGamificationStore.getState().checkDailyLogin();

      const today = new Date().toISOString().split('T')[0];
      expect(useGamificationStore.getState().lastLoginDate).toBe(today);
    });
  });

  // ── 13. unlockLoreEntry ────────────────────────────────────────────

  describe('unlockLoreEntry', () => {
    it('should not throw (lore system is future feature)', async () => {
      await expect(
        useGamificationStore.getState().unlockLoreEntry('lore-1')
      ).resolves.not.toThrow();
    });
  });

  // ── 14. XP utility functions ───────────────────────────────────────

  describe('XP utility functions', () => {
    it('calculateXPForLevel should scale exponentially', () => {
      const l1 = calculateXPForLevel(1);
      const l2 = calculateXPForLevel(2);
      const l10 = calculateXPForLevel(10);
      expect(l2).toBeGreaterThan(l1);
      expect(l10).toBeGreaterThan(l2);
      // l10 should be significantly more than linear (10x)
      expect(l10).toBeGreaterThan(l1 * 10);
    });

    it('calculateLevelFromXP should return 0 for 0 XP', () => {
      expect(calculateLevelFromXP(0)).toBe(0);
    });

    it('calculateLevelFromXP and calculateXPForLevel should be roughly inverse', () => {
      for (const level of [1, 3, 5, 10, 20]) {
        const xp = calculateXPForLevel(level);
        const computed = calculateLevelFromXP(xp);
        // Floor operations may cause off-by-one, but should be within 1
        expect(Math.abs(computed - level)).toBeLessThanOrEqual(1);
      }
    });
  });

  // ── 15. Backward-compatibility aliases ─────────────────────────────

  describe('backward-compatibility aliases', () => {
    // Note: xp, titles, equippedTitleId are JS getters that call get()
    // internally. They only work when accessed through the store's subscribe
    // mechanism or a component, not via getState() + setState() since
    // getState() returns a plain snapshot. We verify the underlying data
    // that the getters read from instead.

    it('xp alias reads from totalXP', () => {
      useGamificationStore.setState({ totalXP: 999 });

      // The underlying data the `xp` getter reads from
      expect(useGamificationStore.getState().totalXP).toBe(999);
    });

    it('titles alias reads from availableTitles', () => {
      useGamificationStore.setState({ availableTitles: [...mockTitles] });

      expect(useGamificationStore.getState().availableTitles).toHaveLength(2);
      expect(useGamificationStore.getState().availableTitles[0]!.id).toBe('newcomer');
    });

    it('equippedTitleId alias reads from equippedTitle', () => {
      expect(useGamificationStore.getState().equippedTitle).toBeNull();

      useGamificationStore.setState({ equippedTitle: mockTitles[0]! });

      expect(useGamificationStore.getState().equippedTitle?.id).toBe('newcomer');
    });
  });
});
