/**
 * Gamification Service
 *
 * Connects mobile gamification components to the backend API.
 * Handles XP, levels, achievements, quests, leaderboards, and streaks.
 *
 * @module services/gamificationService
 * @since v0.8.3
 */

import api from '../lib/api';

// ==================== TYPES ====================

export interface GamificationStats {
  xp: number;
  level: number;
  coins: number;
  streak: number;
  lastStreakClaim: string | null;
  levelProgress: number;
  xpForNextLevel: number;
  achievementsUnlocked: number;
  totalAchievements: number;
  questsCompleted: number;
  titles: string[];
  currentTitle: string | null;
  equippedTitleId: string | null;
}

export interface LevelInfo {
  level: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progress: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  category: string;
  xpReward: number;
  coinReward: number;
  requirement: number;
}

export interface AchievementWithProgress extends Achievement {
  progress: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'special';
  objectives: QuestObjective[];
  rewards: QuestReward[];
  expiresAt: string | null;
}

export interface QuestObjective {
  id: string;
  description: string;
  targetValue: number;
  currentValue: number;
  completed: boolean;
}

export interface QuestReward {
  type: 'xp' | 'coins' | 'item' | 'title';
  amount: number;
  itemId?: string;
}

export interface UserQuest {
  id: string;
  quest: Quest;
  accepted: boolean;
  progress: Record<string, number>;
  completed: boolean;
  claimed: boolean;
  acceptedAt: string;
  completedAt: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatar: string | null;
  value: number;
  level: number;
  title: string | null;
  isCurrentUser: boolean;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  category: string;
  userRank: LeaderboardEntry | null;
  totalEntries: number;
}

export interface XpTransaction {
  id: string;
  amount: number;
  totalAfter: number;
  levelAfter: number;
  source: string;
  description: string | null;
  multiplier: number;
  createdAt: string;
}

export interface StreakClaimResult {
  coins: number;
  streak: number;
  nextClaimAt: string;
}

// ==================== API FUNCTIONS ====================

/**
 * Get current user's gamification stats
 */
export async function getGamificationStats(): Promise<GamificationStats> {
  const response = await api.get('/api/v1/gamification/stats');
  return transformStats(response.data.data || response.data);
}

/**
 * Get level info for current user
 */
export async function getLevelInfo(): Promise<LevelInfo> {
  const response = await api.get('/api/v1/gamification/level-info');
  return transformLevelInfo(response.data.data || response.data);
}

/**
 * Get all achievements with user progress
 */
export async function getAchievements(category?: string): Promise<AchievementWithProgress[]> {
  const params = category ? { category } : {};
  const response = await api.get('/api/v1/gamification/achievements', { params });
  return (response.data.data || response.data.achievements || []).map(transformAchievement);
}

/**
 * Get a specific achievement with user progress
 */
export async function getAchievement(achievementId: string): Promise<AchievementWithProgress> {
  const response = await api.get(`/api/v1/gamification/achievements/${achievementId}`);
  return transformAchievement(response.data.data || response.data);
}

/**
 * Get leaderboard for a category
 */
export async function getLeaderboard(
  category: 'xp' | 'level' | 'coins' | 'streak' | 'messages' | 'posts',
  options?: { limit?: number; offset?: number }
): Promise<LeaderboardData> {
  const params = {
    limit: options?.limit || 50,
    offset: options?.offset || 0,
  };
  const response = await api.get(`/api/v1/gamification/leaderboard/${category}`, { params });
  return transformLeaderboard(response.data.data || response.data, category);
}

/**
 * Claim daily streak bonus
 */
export async function claimDailyStreak(): Promise<StreakClaimResult> {
  const response = await api.post('/api/v1/gamification/streak/claim');
  return transformStreakResult(response.data.data || response.data);
}

/**
 * Get XP transaction history
 */
export async function getXpHistory(options?: {
  limit?: number;
  offset?: number;
}): Promise<XpTransaction[]> {
  const params = {
    limit: options?.limit || 50,
    offset: options?.offset || 0,
  };
  const response = await api.get('/api/v1/gamification/xp/history', { params });
  return (response.data.data || response.data.transactions || []).map(transformXpTransaction);
}

// ==================== QUEST FUNCTIONS ====================

/**
 * Get all available quests
 */
export async function getQuests(type?: 'daily' | 'weekly' | 'special'): Promise<Quest[]> {
  const params = type ? { type } : {};
  const response = await api.get('/api/v1/quests', { params });
  return (response.data.data || response.data.quests || []).map(transformQuest);
}

/**
 * Get user's active quests
 */
export async function getActiveQuests(includeCompleted = false): Promise<UserQuest[]> {
  const params = { include_completed: includeCompleted };
  const response = await api.get('/api/v1/quests/active', { params });
  return (response.data.data || response.data.user_quests || []).map(transformUserQuest);
}

/**
 * Get today's daily quests
 */
export async function getDailyQuests(): Promise<UserQuest[]> {
  const response = await api.get('/api/v1/quests/daily');
  return (response.data.data || response.data.quests || []).map(transformUserQuest);
}

/**
 * Get this week's weekly quests
 */
export async function getWeeklyQuests(): Promise<UserQuest[]> {
  const response = await api.get('/api/v1/quests/weekly');
  return (response.data.data || response.data.quests || []).map(transformUserQuest);
}

/**
 * Accept a quest
 */
export async function acceptQuest(questId: string): Promise<UserQuest> {
  const response = await api.post(`/api/v1/quests/${questId}/accept`);
  return transformUserQuest(response.data.data || response.data);
}

/**
 * Claim rewards for a completed quest
 */
export async function claimQuestRewards(userQuestId: string): Promise<QuestReward[]> {
  const response = await api.post(`/api/v1/quests/${userQuestId}/claim`);
  return response.data.rewards || [];
}

// ==================== TITLE FUNCTIONS ====================

/**
 * Get all user titles
 */
export async function getTitles(): Promise<any[]> {
  const response = await api.get('/api/v1/titles');
  return response.data.data || response.data.titles || [];
}

/**
 * Equip a title
 */
export async function equipTitle(titleId: string): Promise<void> {
  await api.post(`/api/v1/titles/${titleId}/equip`);
}

/**
 * Unequip current title
 */
export async function unequipTitle(): Promise<void> {
  await api.post('/api/v1/titles/unequip');
}

/**
 * Purchase a title from shop
 */
export async function purchaseTitle(titleId: string): Promise<void> {
  await api.post(`/api/v1/titles/${titleId}/purchase`);
}

// ==================== TRANSFORMERS ====================

/** API response type for transform functions */
type ApiData = Record<string, unknown>;

function transformStats(data: ApiData): GamificationStats {
  return {
    xp: data.xp || 0,
    level: data.level || 1,
    coins: data.coins || 0,
    streak: data.streak || data.login_streak || 0,
    lastStreakClaim: data.last_streak_claim || data.lastStreakClaim || null,
    levelProgress: data.level_progress || data.levelProgress || 0,
    xpForNextLevel: data.xp_for_next_level || data.xpForNextLevel || 0,
    achievementsUnlocked: data.achievements_unlocked || data.achievementsUnlocked || 0,
    totalAchievements: data.total_achievements || data.totalAchievements || 0,
    questsCompleted: data.quests_completed || data.questsCompleted || 0,
    titles: data.titles || [],
    currentTitle: data.current_title || data.currentTitle || null,
    equippedTitleId: data.equipped_title_id || data.equippedTitleId || null,
  };
}

function transformLevelInfo(data: ApiData): LevelInfo {
  return {
    level: data.level || 1,
    xpForCurrentLevel: data.xp_for_current_level || data.xpForCurrentLevel || 0,
    xpForNextLevel: data.xp_for_next_level || data.xpForNextLevel || 0,
    progress: data.progress || 0,
  };
}

function transformAchievement(data: ApiData): AchievementWithProgress {
  const achievement = data.achievement || data;
  return {
    id: achievement.id,
    name: achievement.name,
    description: achievement.description,
    icon: achievement.icon || '🏆',
    rarity: achievement.rarity || 'common',
    category: achievement.category || 'general',
    xpReward: achievement.xp_reward || achievement.xpReward || 0,
    coinReward: achievement.coin_reward || achievement.coinReward || 0,
    requirement: achievement.requirement || 1,
    progress: data.progress || 0,
    unlocked: data.unlocked || false,
    unlockedAt: data.unlocked_at || data.unlockedAt || null,
  };
}

function transformLeaderboard(data: ApiData, category: string): LeaderboardData {
  const entries = ((data.entries as ApiData[]) || []).map((entry: ApiData, index: number) => ({
    rank: entry.rank || index + 1,
    userId: entry.user_id || entry.userId || entry.id,
    username: entry.username,
    displayName: entry.display_name || entry.displayName || entry.username,
    avatar: entry.avatar || entry.avatar_url || null,
    value: entry.value || entry[category] || 0,
    level: entry.level || 1,
    title: entry.title || null,
    isCurrentUser: entry.is_current_user || entry.isCurrentUser || false,
  }));

  const userRank = data.user_rank || data.userRank;

  return {
    entries,
    category,
    userRank: userRank
      ? {
          rank: userRank.rank,
          userId: userRank.user_id || userRank.userId,
          username: userRank.username,
          displayName: userRank.display_name || userRank.displayName || userRank.username,
          avatar: userRank.avatar || null,
          value: userRank.value || 0,
          level: userRank.level || 1,
          title: userRank.title || null,
          isCurrentUser: true,
        }
      : null,
    totalEntries: data.total_entries || data.totalEntries || entries.length,
  };
}

function transformStreakResult(data: ApiData): StreakClaimResult {
  return {
    coins: data.coins || 0,
    streak: data.streak || 0,
    nextClaimAt: data.next_claim_at || data.nextClaimAt || '',
  };
}

function transformXpTransaction(data: ApiData): XpTransaction {
  return {
    id: data.id,
    amount: data.amount || 0,
    totalAfter: data.total_after || data.totalAfter || 0,
    levelAfter: data.level_after || data.levelAfter || 1,
    source: data.source || 'unknown',
    description: data.description || null,
    multiplier: parseFloat(data.multiplier) || 1.0,
    createdAt: data.inserted_at || data.created_at || data.createdAt || '',
  };
}

function transformQuest(data: ApiData): Quest {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    type: data.type || 'daily',
    objectives: ((data.objectives as ApiData[]) || []).map((obj: ApiData) => ({
      id: obj.id,
      description: obj.description,
      targetValue: obj.target_value || obj.targetValue || 1,
      currentValue: obj.current_value || obj.currentValue || 0,
      completed: obj.completed || false,
    })),
    rewards: ((data.rewards as ApiData[]) || []).map((reward: ApiData) => ({
      type: reward.type || 'xp',
      amount: reward.amount || 0,
      itemId: reward.item_id || reward.itemId,
    })),
    expiresAt: data.expires_at || data.expiresAt || null,
  };
}

function transformUserQuest(data: ApiData): UserQuest {
  const quest = data.quest || data;
  return {
    id: data.id || quest.id,
    quest: transformQuest(quest),
    accepted: data.accepted !== false,
    progress: data.progress || {},
    completed: data.completed || false,
    claimed: data.claimed || false,
    acceptedAt: data.accepted_at || data.acceptedAt || '',
    completedAt: data.completed_at || data.completedAt || null,
  };
}

// ==================== DEFAULT EXPORT ====================

const gamificationService = {
  // Stats & Level
  getGamificationStats,
  getLevelInfo,

  // Achievements
  getAchievements,
  getAchievement,

  // Leaderboard
  getLeaderboard,

  // Streaks
  claimDailyStreak,

  // XP History
  getXpHistory,

  // Quests
  getQuests,
  getActiveQuests,
  getDailyQuests,
  getWeeklyQuests,
  acceptQuest,
  claimQuestRewards,

  // Titles
  getTitles,
  equipTitle,
  unequipTitle,
  purchaseTitle,
};

export default gamificationService;
