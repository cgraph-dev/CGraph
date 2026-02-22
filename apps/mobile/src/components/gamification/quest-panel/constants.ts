/**
 * QuestPanel Constants
 */

import { QuestType } from './types';

export const QUEST_TYPE_CONFIG: Record<
  QuestType,
  {
    label: string;
    icon: string;
    colors: readonly [string, string];
    bgColor: string;
  }
> = {
  daily: {
    label: 'Daily',
    icon: 'sunny',
    colors: ['#f59e0b', '#d97706'] as const,
    bgColor: 'rgba(245, 158, 11, 0.15)',
  },
  weekly: {
    label: 'Weekly',
    icon: 'calendar',
    colors: ['#3b82f6', '#2563eb'] as const,
    bgColor: 'rgba(59, 130, 246, 0.15)',
  },
  special: {
    label: 'Special',
    icon: 'star',
    colors: ['#8b5cf6', '#7c3aed'] as const,
    bgColor: 'rgba(139, 92, 246, 0.15)',
  },
  story: {
    label: 'Story',
    icon: 'book',
    colors: ['#ec4899', '#db2777'] as const,
    bgColor: 'rgba(236, 72, 153, 0.15)',
  },
};

export const REWARD_ICONS: Record<string, string> = {
  xp: 'sparkles',
  coins: 'logo-bitcoin',
  badge: 'medal',
  title: 'ribbon',
  item: 'gift',
};
