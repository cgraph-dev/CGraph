/**
 * Gamification Components
 *
 * Export all gamification-related UI components for easy importing.
 */

// Core Progress Components
export { default as LevelProgress } from './level-progress';
export { default as LevelUpModal } from './level-up-modal';

// Achievement System
export { default as AchievementNotification } from './achievement-notification';
export {
  default as AchievementDisplay,
  AchievementDisplay as AchievementDisplayComponent,
} from './achievement-display';

// Quest System
export { default as QuestPanel } from './quest-panel';

// Leaderboard
export {
  LeaderboardWidget,
  LeaderboardWidget as LeaderboardFullWidget,
} from './leaderboard-full-widget';

// Streaks & Daily Rewards
export { default as StreakTracker, StreakTracker as StreakTrackerComponent } from './streak-tracker';
export { default as DailyRewards, DailyRewards as DailyRewardsComponent } from './daily-rewards';

// Titles & Badges
export { TitleBadge, type TitleBadgeProps } from './title-badge';

// User Stars (Post Count Indicators)
export {
  UserStars,
  UserStarsBadge,
  UserStarsTierList,
  getTierForPostCount,
  getProgressToNextTier,
  getPostsToNextTier,
  USER_TIERS,
  type UserStarsProps,
  type UserStarsTier,
} from './user-stars';

// Re-export types
export type { AchievementNotificationData } from './achievement-notification';
