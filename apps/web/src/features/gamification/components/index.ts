/**
 * Gamification Components
 *
 * Re-exports gamification components from the module structure.
 * This file maintains backward compatibility for existing imports.
 *
 * @deprecated Import from '@/modules/gamification/components' instead
 */

// Re-export from modules location
export {
  AchievementNotification,
  AchievementDisplay,
  LevelProgress,
  LevelUpModal,
  QuestPanel,
  TitleBadge,
  LeaderboardWidget,
  StreakTracker,
  DailyRewards,
  UserStars,
  UserStarsBadge,
  UserStarsTierList,
  getTierForPostCount,
  getProgressToNextTier,
  getPostsToNextTier,
  USER_TIERS,
} from '@/modules/gamification/components';

// Re-export types
export type {
  TitleBadgeProps,
  AchievementNotificationData,
  UserStarsProps,
  UserStarsTier,
} from '@/modules/gamification/components';
