/**
 * Progression customization category definitions.
 * @module
 */
import { TrophyIcon, SparklesIcon, ChartBarIcon, GiftIcon } from '@heroicons/react/24/outline';
import type { ProgressionCategory } from './types';

export interface CategoryConfig {
  id: ProgressionCategory;
  label: string;
  icon: typeof TrophyIcon;
  count: number;
}

/**
 * Retrieves category configs with live counts from API data.
 * @param achievementCount - Number of achievements loaded
 * @param leaderboardCount - Number of leaderboard entries loaded
 * @param activeQuestCount - Number of active (incomplete) quests
 * @returns The category configs.
 */
export function getCategoryConfigs(
  achievementCount = 0,
  leaderboardCount = 0,
  activeQuestCount = 0
): CategoryConfig[] {
  return [
    {
      id: 'achievements',
      label: 'Achievements',
      icon: TrophyIcon,
      count: achievementCount,
    },
    {
      id: 'leaderboards',
      label: 'Leaderboards',
      icon: ChartBarIcon,
      count: leaderboardCount,
    },
    {
      id: 'quests',
      label: 'Quests',
      icon: SparklesIcon,
      count: activeQuestCount,
    },
    {
      id: 'rewards',
      label: 'Daily Rewards',
      icon: GiftIcon,
      count: 7,
    },
  ];
}
