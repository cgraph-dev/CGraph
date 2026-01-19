/**
 * Gamification Components
 *
 * Export all gamification-related UI components for easy importing.
 */

// Core Progress Components
export { default as LevelProgress } from './LevelProgress';
export { default as LevelUpModal } from './LevelUpModal';

// Achievement System
export { default as AchievementNotification } from './AchievementNotification';
export {
  default as AchievementDisplay,
  AchievementDisplay as AchievementDisplayComponent,
} from './AchievementDisplay';

// Quest System
export { default as QuestPanel } from './QuestPanel';

// Leaderboard
export {
  LeaderboardWidget,
  LeaderboardWidget as LeaderboardFullWidget,
} from './LeaderboardFullWidget';

// Streaks & Daily Rewards
export { default as StreakTracker, StreakTracker as StreakTrackerComponent } from './StreakTracker';
export { default as DailyRewards, DailyRewards as DailyRewardsComponent } from './DailyRewards';

// Titles & Badges
export { TitleBadge, type TitleBadgeProps } from './TitleBadge';

// Re-export types
export type { AchievementNotificationData } from './AchievementNotification';
