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
export { StatsOverview } from './StatsOverview';
export { AchievementsSection } from './AchievementsSection';
export { LeaderboardsSection } from './LeaderboardsSection';
export { QuestsSection } from './QuestsSection';
export { DailyRewardsSection } from './DailyRewardsSection';
export { default, ProgressionCustomization } from './ProgressionCustomization';
