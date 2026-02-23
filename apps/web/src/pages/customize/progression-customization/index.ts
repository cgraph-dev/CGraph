/**
 * Progression customization module exports.
 * @module
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
} from './types';

export { MOCK_ACHIEVEMENTS, MOCK_LEADERBOARD, MOCK_QUESTS, MOCK_DAILY_REWARDS } from './mock-data';

export { getCategoryConfigs, type CategoryConfig } from './categories';
export { StatsOverview } from './stats-overview';
export { AchievementsSection } from './achievements-section';
export { LeaderboardsSection } from './leaderboards-section';
export { QuestsSection } from './quests-section';
export { DailyRewardsSection } from './daily-rewards-section';
export { default, ProgressionCustomization } from './progression-customization';
