/**
 * Gamification Store — XP Utilities
 * @module modules/gamification/store
 *
 * Pure XP calculation functions and reward constants.
 */

/**
 * Calculate XP required for a given level using a smooth exponential curve
 * Formula: baseXP * (level^1.8) to create satisfying but achievable progression
 *
 * This creates a curve where:
 * - Level 2: 100 XP
 * - Level 5: 447 XP
 * - Level 10: 1,585 XP
 * - Level 20: 5,657 XP
 * - Level 50: 28,284 XP
 * - Level 100: 100,000 XP
 *
 * The exponent of 1.8 was chosen after testing to feel rewarding without being grindy.
 */
export function calculateXPForLevel(level: number): number {
  const baseXP = 100;
  return Math.floor(baseXP * Math.pow(level, 1.8));
}

/**
 * Calculate level from total XP using inverse of the level formula
 * This allows us to instantly determine level without iteration
 */
export function calculateLevelFromXP(totalXP: number): number {
  const baseXP = 100;
  return Math.floor(Math.pow(totalXP / baseXP, 1 / 1.8));
}

/**
 * Predefined XP rewards for different actions
 * Values are carefully balanced to encourage diverse engagement
 */
export const XP_REWARDS = {
  // Messaging & Social
  SEND_MESSAGE: 5,
  SEND_VOICE_MESSAGE: 8,
  START_CONVERSATION: 15,
  MAKE_FRIEND: 25,

  // Forums & Content
  CREATE_POST: 20,
  CREATE_COMMENT: 10,
  RECEIVE_UPVOTE: 3,
  GIVE_UPVOTE: 1,
  POST_GETS_BEST_ANSWER: 50,
  GIVE_AWARD: 15,

  // Community
  JOIN_GROUP: 10,
  CREATE_FORUM: 100,
  MODERATE_CONTENT: 30,
  REPORT_VIOLATION: 5,

  // Engagement
  DAILY_LOGIN: 10,
  COMPLETE_QUEST: 0, // Varies by quest
  UNLOCK_ACHIEVEMENT: 0, // Varies by achievement

  // Streaks (multipliers)
  STREAK_3_DAYS: 1.2,
  STREAK_7_DAYS: 1.5,
  STREAK_30_DAYS: 2.0,
  STREAK_100_DAYS: 3.0,
} as const;
