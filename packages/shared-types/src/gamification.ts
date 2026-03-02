/**
 * Shared Gamification Types
 *
 * Type definitions shared between web, mobile, and backend for the
 * gamification system: XP events, coin events, leaderboards, daily caps,
 * achievements, quests, and levels.
 *
 * @module @cgraph/shared-types/gamification
 */

// ── XP Source Types ────────────────────────────────────────────────────

/**
 * All XP source types matching backend XpTransaction source field.
 * These correspond to the 17 valid sources in xp_transactions schema.
 */
export type XpSource =
  | 'message'
  | 'post'
  | 'comment'
  | 'achievement'
  | 'quest'
  | 'daily_login'
  | 'streak'
  | 'forum_join'
  | 'vote'
  | 'received_vote'
  | 'profile_complete'
  | 'friend_added'
  | 'admin'
  | 'forum_thread_created'
  | 'forum_post_created'
  | 'forum_upvote_received'
  | 'forum_best_answer';

/** Sources eligible for the XP event pipeline (user-initiated actions). */
export type XpPipelineSource =
  | 'message'
  | 'forum_thread_created'
  | 'forum_post_created'
  | 'forum_upvote_received'
  | 'friend_added'
  | 'profile_complete'
  | 'vote'
  | 'daily_login';

// ── XP Event ───────────────────────────────────────────────────────────

/** Payload for real-time XP award notifications. */
export interface XpEvent {
  userId: string;
  amount: number;
  source: XpSource;
  multiplier: number;
  totalAfter: number;
  levelAfter: number;
  levelUp: boolean;
  levelProgress: number;
  timestamp: string;
  dailyCapStatus?: DailyCapStatus;
}

// ── Coin Event ─────────────────────────────────────────────────────────

/** Payload for real-time coin award notifications. */
export interface CoinEvent {
  userId: string;
  amount: number;
  type: string;
  balanceAfter: number;
  timestamp: string;
}

// ── Gamification Stats ─────────────────────────────────────────────────

/** Complete gamification stats for a user. */
export interface GamificationStats {
  xp: number;
  level: number;
  levelProgress: number;
  xpToNextLevel: number;
  coins: number;
  streakDays: number;
  streakLongest: number;
  achievementsUnlocked: number;
  achievementsTotal: number;
  activeQuests: number;
  equippedTitleId: string | null;
  subscriptionTier: string;
}

// ── Level System ───────────────────────────────────────────────────────

/** Level threshold definition. */
export interface Level {
  level: number;
  xpRequired: number;
  xpForNext: number;
}

// ── Achievement Types ──────────────────────────────────────────────────

export type AchievementCategory =
  | 'social'
  | 'content'
  | 'exploration'
  | 'mastery'
  | 'legendary'
  | 'secret';

export type AchievementRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythic';

// ── Quest Types ────────────────────────────────────────────────────────

export type QuestType = 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'special';

// ── Leaderboard Types ──────────────────────────────────────────────────

/** A single gamification leaderboard entry (global/scoped). */
export interface GamificationLeaderboardEntry {
  userId: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  score: number;
  rank: number;
  level: number;
  equippedTitleId?: string | null;
  equippedBorderId?: string | null;
  isPremium?: boolean;
  isVerified?: boolean;
}

/** Gamification leaderboard time period filter. */
export type GamificationLeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'all_time';

/** Leaderboard category. */
export type LeaderboardCategory =
  | 'xp'
  | 'level'
  | 'karma'
  | 'streak'
  | 'messages'
  | 'posts'
  | 'friends';

/** Scoped leaderboard scope types. */
export type LeaderboardScope = 'board' | 'forum' | 'group' | 'global';

// ── Daily Cap Types ────────────────────────────────────────────────────

/** Daily cap status for a source type. */
export interface DailyCapStatus {
  source: XpSource;
  used: number;
  limit: number;
  remaining: number;
  diminishingActive: boolean;
}

// ── Level Up Event ─────────────────────────────────────────────────────

/** Payload for level-up channel events. */
export interface LevelUpEvent {
  userId: string;
  oldLevel: number;
  newLevel: number;
  rewards: Array<{ type: string; id: string; name: string }>;
}

// ── Cap Reached Event ──────────────────────────────────────────────────

/** Payload for daily cap reached channel events. */
export interface CapReachedEvent {
  source: XpSource;
  dailyUsed: number;
  dailyLimit: number;
}

// ── Feature Gate Types (Progressive Disclosure) ────────────────────────

/** All feature gate keys matching backend FeatureGates module. */
export type FeatureGateKey =
  | 'xp_system'
  | 'streaks'
  | 'achievements'
  | 'quests'
  | 'daily_rewards'
  | 'leaderboard'
  | 'shop'
  | 'cosmetics'
  | 'titles'
  | 'animated_borders'
  | 'marketplace'
  | 'battle_pass'
  | 'events'
  | 'trading'
  | 'prestige';

/**
 * Feature → required level map.
 * Must stay in sync with backend CGraph.Gamification.FeatureGates.
 */
export const FEATURE_REQUIREMENTS: Record<FeatureGateKey, number> = {
  xp_system: 1,
  streaks: 1,
  achievements: 1,
  quests: 3,
  daily_rewards: 3,
  leaderboard: 5,
  shop: 8,
  cosmetics: 10,
  titles: 12,
  animated_borders: 15,
  marketplace: 15,
  battle_pass: 18,
  events: 20,
  trading: 20,
  prestige: 25,
};

/** Status of a single feature gate for a user. */
export interface FeatureGateStatus {
  unlocked: boolean;
  required_level: number;
  current_level: number;
}

/** Full feature gates response from GET /gamification/feature-gates. */
export type FeatureGatesMap = Record<FeatureGateKey, FeatureGateStatus>;

/** Human-readable display names for feature gates. */
export const FEATURE_DISPLAY_NAMES: Record<FeatureGateKey, string> = {
  xp_system: 'XP System',
  streaks: 'Streaks',
  achievements: 'Achievements',
  quests: 'Quests',
  daily_rewards: 'Daily Rewards',
  leaderboard: 'Leaderboard',
  shop: 'Shop',
  cosmetics: 'Cosmetics',
  titles: 'Titles',
  animated_borders: 'Animated Borders',
  marketplace: 'Marketplace',
  battle_pass: 'Battle Pass',
  events: 'Events',
  trading: 'Trading',
  prestige: 'Prestige',
};
