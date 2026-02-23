/**
 * Progression customization category definitions.
 * @module
 */
import { TrophyIcon, SparklesIcon, ChartBarIcon, GiftIcon } from '@heroicons/react/24/outline';
import type { ProgressionCategory } from './types';
import { MOCK_ACHIEVEMENTS, MOCK_LEADERBOARD, MOCK_QUESTS } from './mock-data';

export interface CategoryConfig {
  id: ProgressionCategory;
  label: string;
  icon: typeof TrophyIcon;
  count: number;
}

export function getCategoryConfigs(): CategoryConfig[] {
  return [
    {
      id: 'achievements',
      label: 'Achievements',
      icon: TrophyIcon,
      count: MOCK_ACHIEVEMENTS.length,
    },
    {
      id: 'leaderboards',
      label: 'Leaderboards',
      icon: ChartBarIcon,
      count: MOCK_LEADERBOARD.length,
    },
    {
      id: 'quests',
      label: 'Quests',
      icon: SparklesIcon,
      count: MOCK_QUESTS.filter((q) => !q.completed).length,
    },
    {
      id: 'rewards',
      label: 'Daily Rewards',
      icon: GiftIcon,
      count: 7,
    },
  ];
}
