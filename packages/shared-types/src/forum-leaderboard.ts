/**
 * Forum Leaderboard — Shared Types
 *
 * Types for the ranking engine, leaderboard, and gamification bridge.
 *
 * @module shared-types/forum-leaderboard
 */

// ── Period / Sorting ────────────────────────────────────────────────────

/** Time periods available for leaderboard filtering. */
export type LeaderboardPeriod = 'all_time' | 'monthly' | 'weekly' | 'daily';

/** Ordered constant for iterating UI tabs. */
export const LEADERBOARD_PERIODS: readonly LeaderboardPeriod[] = [
  'all_time',
  'monthly',
  'weekly',
  'daily',
] as const;

/** Human-readable labels for each period. */
export const LEADERBOARD_PERIOD_LABELS: Record<LeaderboardPeriod, string> = {
  all_time: 'All Time',
  monthly: 'Monthly',
  weekly: 'Weekly',
  daily: 'Daily',
};

// ── Forum Rank ──────────────────────────────────────────────────────────

/** A configured forum rank tier (maps score ranges ➜ badge/name). */
export interface ForumRank {
  id: string;
  forumId: string;
  name: string;
  minScore: number;
  maxScore: number | null;
  imageUrl: string | null;
  color: string;
  position: number;
  isDefault: boolean;
}

/** Default rank tiers seeded per forum. */
export const DEFAULT_RANKS: Pick<ForumRank, 'name' | 'minScore' | 'maxScore' | 'color' | 'position' | 'isDefault'>[] = [
  { name: 'Newcomer', minScore: 0, maxScore: 49, color: '#9CA3AF', position: 0, isDefault: true },
  { name: 'Regular', minScore: 50, maxScore: 199, color: '#60A5FA', position: 1, isDefault: false },
  { name: 'Veteran', minScore: 200, maxScore: 499, color: '#34D399', position: 2, isDefault: false },
  { name: 'Expert', minScore: 500, maxScore: 999, color: '#A78BFA', position: 3, isDefault: false },
  { name: 'Legend', minScore: 1000, maxScore: null, color: '#FBBF24', position: 4, isDefault: false },
];

// ── Score Change ────────────────────────────────────────────────────────

/** Direction of score/rank change since previous period. */
export type ScoreChangeDirection = 'up' | 'down' | 'same' | 'new';

export interface ScoreChange {
  direction: ScoreChangeDirection;
  amount: number;
  previousRank: number | null;
}

// ── Leaderboard Entry ───────────────────────────────────────────────────

/** Single entry on the leaderboard (user + score + rank info). */
export interface LeaderboardEntry {
  position: number;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    level: number;
    isVerified: boolean;
    isPremium: boolean;
  };
  score: number;
  forumKarma: number;
  xp: number;
  rank: ForumRank | null;
  change: ScoreChange;
}

// ── My Rank Response ────────────────────────────────────────────────────

export interface RankProgress {
  currentRank: ForumRank;
  nextRank: ForumRank | null;
  currentScore: number;
  scoreToNextRank: number | null;
  progressPercent: number;
}

export interface MyRankResponse {
  position: number;
  score: number;
  forumKarma: number;
  xp: number;
  rank: ForumRank | null;
  progress: RankProgress;
  change: ScoreChange;
}

// ── XP Grant Config ─────────────────────────────────────────────────────

/** Points awarded for each forum action (configurable per forum). */
export interface ForumXpConfig {
  threadCreated: number;
  postCreated: number;
  upvoteReceived: number;
  bestAnswer: number;
  dailyCap: number;
}

export const DEFAULT_FORUM_XP_CONFIG: ForumXpConfig = {
  threadCreated: 10,
  postCreated: 5,
  upvoteReceived: 2,
  bestAnswer: 20,
  dailyCap: 200,
};

// ── API Request/Response Shapes ─────────────────────────────────────────

export interface LeaderboardRequest {
  period?: LeaderboardPeriod;
  limit?: number;
  cursor?: string;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  myRank: MyRankResponse | null;
  meta: {
    period: LeaderboardPeriod;
    limit: number;
    hasMore: boolean;
    nextCursor: string | null;
    lastUpdated: string;
  };
}

export interface RanksResponse {
  ranks: ForumRank[];
  karmaLabel: string;
}
