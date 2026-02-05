/**
 * ProgressionCustomization - Modularized
 *
 * This file has been refactored into smaller, focused modules.
 * See ./progression-customization/ for the individual components:
 *
 * - types.ts - Type definitions (Achievement, Quest, etc.)
 * - mock-data.ts - Mock data for development
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
} from './progression-customization';

export {
  MOCK_ACHIEVEMENTS,
  MOCK_LEADERBOARD,
  MOCK_QUESTS,
  MOCK_DAILY_REWARDS,
  getCategoryConfigs,
  StatsOverview,
  AchievementsSection,
  LeaderboardsSection,
  QuestsSection,
  DailyRewardsSection,
  ProgressionCustomization,
} from './progression-customization';

export { default } from './progression-customization';
