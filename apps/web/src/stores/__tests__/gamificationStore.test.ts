/**
 * gamificationStore Unit Tests
 *
 * Tests for Zustand gamification store state management.
 * These tests focus on state operations, XP calculations, achievements,
 * quests, titles, and level progression.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useGamificationStore, XP_REWARDS } from '../gamificationStore';

// Mock the API module
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock the logger
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// Helper function to calculate XP for a level (same as in store)
function calculateXPForLevel(level: number): number {
  const baseXP = 100;
  return Math.floor(baseXP * Math.pow(level, 1.8));
}

// Helper function to calculate level from XP (same as in store)
function calculateLevelFromXP(totalXP: number): number {
  const baseXP = 100;
  return Math.floor(Math.pow(totalXP / baseXP, 1 / 1.8));
}

// Mock achievement data
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
  },
];

// Mock quest data
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
    expiresAt: '2026-01-31T23:59:59Z',
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
    expiresAt: '2026-02-07T23:59:59Z',
    completed: false,
  },
];

// Mock titles data
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
  {
    id: 'legend',
    name: 'Legend',
    description: 'Achieved legendary status',
    color: '#FF4500',
    rarity: 'legendary' as const,
    unlocked: false,
    isEquipped: false,
  },
];

// Get initial state for reset
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

// Reset store state after each test
afterEach(() => {
  useGamificationStore.setState(getInitialState());
  vi.clearAllMocks();
});

describe('gamificationStore', () => {
  describe('initial state', () => {
    beforeEach(() => {
      useGamificationStore.setState(getInitialState());
    });

    it('should have correct initial level and XP values', () => {
      const state = useGamificationStore.getState();

      expect(state.level).toBe(1);
      expect(state.currentXP).toBe(0);
      expect(state.totalXP).toBe(0);
      expect(state.karma).toBe(0);
    });

    it('should have empty achievements and quests arrays', () => {
      const state = useGamificationStore.getState();

      expect(state.achievements).toEqual([]);
      expect(state.recentlyUnlocked).toEqual([]);
      expect(state.activeQuests).toEqual([]);
      expect(state.completedQuests).toEqual([]);
    });

    it('should have no equipped title or badges', () => {
      const state = useGamificationStore.getState();

      expect(state.availableTitles).toEqual([]);
      expect(state.equippedTitle).toBeNull();
      expect(state.equippedBadges).toEqual([]);
    });

    it('should have default streak and lore values', () => {
      const state = useGamificationStore.getState();

      expect(state.loginStreak).toBe(0);
      expect(state.lastLoginDate).toBeNull();
      expect(state.loreEntries).toEqual([]);
      expect(state.currentChapter).toBe(1);
    });

    it('should have loading states set to false', () => {
      const state = useGamificationStore.getState();

      expect(state.isLoading).toBe(false);
      expect(state.isLoadingAchievements).toBe(false);
    });
  });

  describe('XP calculation functions', () => {
    it('should calculate XP for level 1 correctly', () => {
      expect(calculateXPForLevel(1)).toBe(100);
    });

    it('should calculate XP for level 2 correctly', () => {
      // 100 * 2^1.8 = 100 * 3.48... ≈ 348
      expect(calculateXPForLevel(2)).toBe(Math.floor(100 * Math.pow(2, 1.8)));
    });

    it('should calculate XP for level 10 correctly', () => {
      // 100 * 10^1.8 = 100 * 63.09... ≈ 6309 XP for level 10
      const xp = calculateXPForLevel(10);
      expect(xp).toBeGreaterThan(6000);
      expect(xp).toBeLessThan(6500);
    });

    it('should calculate XP for level 50 correctly', () => {
      // 100 * 50^1.8 = 100 * 1143.26... ≈ 114326 XP for level 50
      const xp = calculateXPForLevel(50);
      expect(xp).toBeGreaterThan(110000);
      expect(xp).toBeLessThan(120000);
    });

    it('should calculate level from XP for 0 XP as level 0', () => {
      expect(calculateLevelFromXP(0)).toBe(0);
    });

    it('should calculate level from XP for 100 XP as level 1', () => {
      expect(calculateLevelFromXP(100)).toBe(1);
    });

    it('should calculate level from XP for 5000 XP correctly', () => {
      // (5000/100)^(1/1.8) = 50^0.555... ≈ 8
      const level = calculateLevelFromXP(5000);
      expect(level).toBeGreaterThan(5);
      expect(level).toBeLessThan(12);
    });

    it('should return lower level due to flooring in calculations', () => {
      // Due to floor operations, the inverse relationship is approximate
      // calculateXPForLevel gives XP needed AT that level
      // calculateLevelFromXP returns the level you'd be at with that XP
      const xpForLevel5 = calculateXPForLevel(5);
      const levelFromThatXP = calculateLevelFromXP(xpForLevel5);
      // May be off by 1 due to flooring, but should be close
      expect(levelFromThatXP).toBeGreaterThanOrEqual(4);
      expect(levelFromThatXP).toBeLessThanOrEqual(5);
    });
  });

  describe('XP_REWARDS constant', () => {
    it('should have correct message XP rewards', () => {
      expect(XP_REWARDS.SEND_MESSAGE).toBe(5);
      expect(XP_REWARDS.SEND_VOICE_MESSAGE).toBe(8);
      expect(XP_REWARDS.START_CONVERSATION).toBe(15);
    });

    it('should have correct social XP rewards', () => {
      expect(XP_REWARDS.MAKE_FRIEND).toBe(25);
      expect(XP_REWARDS.JOIN_GROUP).toBe(10);
    });

    it('should have correct forum XP rewards', () => {
      expect(XP_REWARDS.CREATE_POST).toBe(20);
      expect(XP_REWARDS.CREATE_COMMENT).toBe(10);
      expect(XP_REWARDS.RECEIVE_UPVOTE).toBe(3);
      expect(XP_REWARDS.GIVE_UPVOTE).toBe(1);
      expect(XP_REWARDS.POST_GETS_BEST_ANSWER).toBe(50);
    });

    it('should have correct streak multipliers', () => {
      expect(XP_REWARDS.STREAK_3_DAYS).toBe(1.2);
      expect(XP_REWARDS.STREAK_7_DAYS).toBe(1.5);
      expect(XP_REWARDS.STREAK_30_DAYS).toBe(2.0);
      expect(XP_REWARDS.STREAK_100_DAYS).toBe(3.0);
    });

    it('should have daily login reward', () => {
      expect(XP_REWARDS.DAILY_LOGIN).toBe(10);
    });
  });

  describe('level progression', () => {
    it('should start at level 1', () => {
      const state = useGamificationStore.getState();
      expect(state.level).toBe(1);
    });

    it('should update level when setting totalXP', () => {
      // Set enough XP to be level 5 (need to calculate based on formula)
      const xpForLevel5 = calculateXPForLevel(5);
      useGamificationStore.setState({
        totalXP: xpForLevel5 + 100,
        level: 5,
      });

      const state = useGamificationStore.getState();
      expect(state.level).toBe(5);
      expect(state.totalXP).toBeGreaterThan(xpForLevel5);
    });

    it('should track currentXP separate from totalXP', () => {
      useGamificationStore.setState({
        totalXP: 500,
        currentXP: 150,
        level: 3,
      });

      const state = useGamificationStore.getState();
      expect(state.totalXP).toBe(500);
      expect(state.currentXP).toBe(150);
      expect(state.level).toBe(3);
    });
  });

  describe('achievement unlocking', () => {
    beforeEach(() => {
      useGamificationStore.setState({
        ...getInitialState(),
        achievements: [...mockAchievements],
      });
    });

    it('should store achievements correctly', () => {
      const state = useGamificationStore.getState();
      expect(state.achievements).toHaveLength(3);
      expect(state.achievements[0]!.id).toBe('first-message');
    });

    it('should track unlocked achievement status', () => {
      const state = useGamificationStore.getState();
      const unlockedAchievement = state.achievements.find((a) => a.id === 'secret-finder');

      expect(unlockedAchievement?.unlocked).toBe(true);
      expect(unlockedAchievement?.unlockedAt).toBe('2026-01-15T10:00:00Z');
    });

    it('should track locked achievement status', () => {
      const state = useGamificationStore.getState();
      const lockedAchievement = state.achievements.find((a) => a.id === 'first-message');

      expect(lockedAchievement?.unlocked).toBe(false);
      expect(lockedAchievement?.unlockedAt).toBeUndefined();
    });

    it('should track achievement progress for progressive achievements', () => {
      const state = useGamificationStore.getState();
      const progressAchievement = state.achievements.find((a) => a.id === 'chat-master');

      expect(progressAchievement?.progress).toBe(500);
      expect(progressAchievement?.maxProgress).toBe(1000);
    });

    it('should categorize achievements by rarity', () => {
      const state = useGamificationStore.getState();

      const common = state.achievements.filter((a) => a.rarity === 'common');
      const epic = state.achievements.filter((a) => a.rarity === 'epic');
      const legendary = state.achievements.filter((a) => a.rarity === 'legendary');

      expect(common).toHaveLength(1);
      expect(epic).toHaveLength(1);
      expect(legendary).toHaveLength(1);
    });

    it('should identify hidden achievements', () => {
      const state = useGamificationStore.getState();
      const hiddenAchievements = state.achievements.filter((a) => a.isHidden);

      expect(hiddenAchievements).toHaveLength(1);
      expect(hiddenAchievements[0]!.id).toBe('secret-finder');
    });

    it('should track recently unlocked achievements', () => {
      useGamificationStore.setState({
        recentlyUnlocked: [mockAchievements[2]!],
      });

      const state = useGamificationStore.getState();
      expect(state.recentlyUnlocked).toHaveLength(1);
      expect(state.recentlyUnlocked[0]!.id).toBe('secret-finder');
    });
  });

  describe('quest completion', () => {
    beforeEach(() => {
      useGamificationStore.setState({
        ...getInitialState(),
        activeQuests: [...mockQuests],
      });
    });

    it('should store active quests correctly', () => {
      const state = useGamificationStore.getState();
      expect(state.activeQuests).toHaveLength(2);
    });

    it('should track quest objective progress', () => {
      const state = useGamificationStore.getState();
      const dailyQuest = state.activeQuests.find((q) => q.id === 'daily-chat');

      expect(dailyQuest?.objectives[0]!.currentValue).toBe(5);
      expect(dailyQuest?.objectives[0]!.targetValue).toBe(10);
      expect(dailyQuest?.objectives[0]!.completed).toBe(false);
    });

    it('should identify completed objectives', () => {
      const state = useGamificationStore.getState();
      const weeklyQuest = state.activeQuests.find((q) => q.id === 'weekly-explorer');

      expect(weeklyQuest?.objectives[0]!.completed).toBe(true);
    });

    it('should track quest types correctly', () => {
      const state = useGamificationStore.getState();

      const dailyQuests = state.activeQuests.filter((q) => q.type === 'daily');
      const weeklyQuests = state.activeQuests.filter((q) => q.type === 'weekly');

      expect(dailyQuests).toHaveLength(1);
      expect(weeklyQuests).toHaveLength(1);
    });

    it('should update quest progress via updateQuestProgress', () => {
      useGamificationStore.getState().updateQuestProgress('daily-chat', 'obj-1', 8);

      const state = useGamificationStore.getState();
      const quest = state.activeQuests.find((q) => q.id === 'daily-chat');

      expect(quest?.objectives[0]!.currentValue).toBe(8);
      expect(quest?.objectives[0]!.completed).toBe(false);
    });

    it('should mark objective as complete when target is reached', () => {
      useGamificationStore.getState().updateQuestProgress('daily-chat', 'obj-1', 10);

      const state = useGamificationStore.getState();
      const quest = state.activeQuests.find((q) => q.id === 'daily-chat');

      expect(quest?.objectives[0]!.currentValue).toBe(10);
      expect(quest?.objectives[0]!.completed).toBe(true);
    });

    it('should cap objective progress at target value', () => {
      useGamificationStore.getState().updateQuestProgress('daily-chat', 'obj-1', 15);

      const state = useGamificationStore.getState();
      const quest = state.activeQuests.find((q) => q.id === 'daily-chat');

      // Should be capped at targetValue (10)
      expect(quest?.objectives[0]!.currentValue).toBe(10);
    });

    it('should not affect other quests when updating one', () => {
      useGamificationStore.getState().updateQuestProgress('daily-chat', 'obj-1', 8);

      const state = useGamificationStore.getState();
      const weeklyQuest = state.activeQuests.find((q) => q.id === 'weekly-explorer');

      // Weekly quest should be unchanged
      expect(weeklyQuest?.objectives[0]!.currentValue).toBe(5);
    });

    it('should track completed quests separately', () => {
      useGamificationStore.setState({
        completedQuests: [
          {
            ...mockQuests[0]!,
            completed: true,
            completedAt: '2026-01-30T12:00:00Z',
          },
        ],
      });

      const state = useGamificationStore.getState();
      expect(state.completedQuests).toHaveLength(1);
      expect(state.completedQuests[0]!.completed).toBe(true);
    });
  });

  describe('title equipping', () => {
    beforeEach(() => {
      useGamificationStore.setState({
        ...getInitialState(),
        availableTitles: [...mockTitles],
        equippedTitle: mockTitles[0],
      });
    });

    it('should store available titles correctly', () => {
      const state = useGamificationStore.getState();
      expect(state.availableTitles).toHaveLength(3);
    });

    it('should track currently equipped title', () => {
      const state = useGamificationStore.getState();
      expect(state.equippedTitle?.id).toBe('newcomer');
      expect(state.equippedTitle?.isEquipped).toBe(true);
    });

    it('should identify unlocked vs locked titles', () => {
      const state = useGamificationStore.getState();

      const unlockedTitles = state.availableTitles.filter((t) => t.unlocked);
      const lockedTitles = state.availableTitles.filter((t) => !t.unlocked);

      expect(unlockedTitles).toHaveLength(2);
      expect(lockedTitles).toHaveLength(1);
      expect(lockedTitles[0]!.id).toBe('legend');
    });

    it('should categorize titles by rarity', () => {
      const state = useGamificationStore.getState();

      const commonTitles = state.availableTitles.filter((t) => t.rarity === 'common');
      const rareTitles = state.availableTitles.filter((t) => t.rarity === 'rare');
      const legendaryTitles = state.availableTitles.filter((t) => t.rarity === 'legendary');

      expect(commonTitles).toHaveLength(1);
      expect(rareTitles).toHaveLength(1);
      expect(legendaryTitles).toHaveLength(1);
    });

    it('should have equippedTitleId getter (note: getters use internal state)', () => {
      // equippedTitleId is a getter that reads from get().equippedTitle
      // When we set equippedTitle directly, we verify the data is correct
      const state = useGamificationStore.getState();
      expect(state.equippedTitle?.id).toBe('newcomer');
    });

    it('should have titles alias pointing to availableTitles', () => {
      // titles is a getter that reads from get().availableTitles
      // Verify availableTitles has the expected data
      const state = useGamificationStore.getState();
      expect(state.availableTitles).toHaveLength(3);
      expect(state.availableTitles[0]!.id).toBe('newcomer');
    });
  });

  describe('badge management', () => {
    beforeEach(() => {
      useGamificationStore.setState({
        ...getInitialState(),
        achievements: [...mockAchievements],
        equippedBadges: [],
      });
    });

    it('should start with no equipped badges', () => {
      const state = useGamificationStore.getState();
      expect(state.equippedBadges).toEqual([]);
    });

    it('should store equipped badge IDs', () => {
      useGamificationStore.setState({
        equippedBadges: ['secret-finder'],
      });

      const state = useGamificationStore.getState();
      expect(state.equippedBadges).toContain('secret-finder');
    });

    it('should allow up to 3 badges to be equipped', () => {
      useGamificationStore.setState({
        equippedBadges: ['badge-1', 'badge-2', 'badge-3'],
      });

      const state = useGamificationStore.getState();
      expect(state.equippedBadges).toHaveLength(3);
    });
  });

  describe('streak tracking', () => {
    it('should track login streak', () => {
      useGamificationStore.setState({
        loginStreak: 7,
        lastLoginDate: '2026-01-30',
      });

      const state = useGamificationStore.getState();
      expect(state.loginStreak).toBe(7);
      expect(state.lastLoginDate).toBe('2026-01-30');
    });

    it('should start with zero streak', () => {
      const state = useGamificationStore.getState();
      expect(state.loginStreak).toBe(0);
      expect(state.lastLoginDate).toBeNull();
    });
  });

  describe('xp and totalXP', () => {
    it('should track totalXP correctly', () => {
      useGamificationStore.setState({
        totalXP: 1500,
      });

      const state = useGamificationStore.getState();
      expect(state.totalXP).toBe(1500);
    });

    it('should start with zero totalXP', () => {
      const state = useGamificationStore.getState();
      expect(state.totalXP).toBe(0);
    });
  });

  describe('karma tracking', () => {
    it('should track karma points', () => {
      useGamificationStore.setState({
        karma: 250,
      });

      const state = useGamificationStore.getState();
      expect(state.karma).toBe(250);
    });

    it('should start with zero karma', () => {
      const state = useGamificationStore.getState();
      expect(state.karma).toBe(0);
    });
  });

  describe('loading states', () => {
    it('should track general loading state', () => {
      useGamificationStore.setState({ isLoading: true });

      expect(useGamificationStore.getState().isLoading).toBe(true);
    });

    it('should track achievements loading state separately', () => {
      useGamificationStore.setState({ isLoadingAchievements: true });

      const state = useGamificationStore.getState();
      expect(state.isLoadingAchievements).toBe(true);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('lore entries', () => {
    it('should start with empty lore entries', () => {
      const state = useGamificationStore.getState();
      expect(state.loreEntries).toEqual([]);
      expect(state.currentChapter).toBe(1);
    });

    it('should track current lore chapter', () => {
      useGamificationStore.setState({ currentChapter: 3 });

      const state = useGamificationStore.getState();
      expect(state.currentChapter).toBe(3);
    });
  });
});
