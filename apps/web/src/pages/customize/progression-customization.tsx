/**
 * ProgressionCustomization - Modularized
 *
 * This file has been refactored into smaller, focused modules.
 * See ./progression-customization/ for the individual components:
 *
 * - types.ts - Type definitions (Achievement, Quest, etc.)
 * - mock-data.ts - Deprecated (data now from API)
 * - categories.ts - Category configuration
 * - StatsOverview.tsx - Level/XP/Streak display
 * - AchievementsSection.tsx - Achievements grid
 * - LeaderboardsSection.tsx - Leaderboard list
 * - QuestsSection.tsx - Quests list
 * - DailyRewardsSection.tsx - Daily rewards calendar
 * - ProgressionCustomization.tsx - Main component
 *
 * @module customize/ProgressionCustomization
 */

export type {
  ProgressionCategory,
  Achievement,
  LeaderboardEntry,
  Quest,
  DailyReward,
  AchievementsSectionProps,
  LeaderboardsSectionProps,
  QuestsSectionProps,
  DailyRewardsSectionProps,
} from './progression-customization/index';

export {
  getCategoryConfigs,
  StatsOverview,
  AchievementsSection,
  LeaderboardsSection,
  QuestsSection,
  DailyRewardsSection,
  ProgressionCustomization,
} from './progression-customization/index';

export { default } from './progression-customization/index';
