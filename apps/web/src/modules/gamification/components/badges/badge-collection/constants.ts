/**
 * Constants for BadgeCollection module
 */

import {
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  AcademicCapIcon,
  TrophyIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import type { AchievementCategory, AchievementRarity } from '@/stores/gamificationStore';

export const CATEGORY_ICONS: Record<
  AchievementCategory,
  React.ComponentType<{ className?: string }>
> = {
  social: ChatBubbleLeftRightIcon,
  content: DocumentTextIcon,
  exploration: GlobeAltIcon,
  mastery: AcademicCapIcon,
  legendary: TrophyIcon,
  secret: QuestionMarkCircleIcon,
};

export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  social: 'Social',
  content: 'Content',
  exploration: 'Exploration',
  mastery: 'Mastery',
  legendary: 'Legendary',
  secret: 'Secret',
};

export const RARITY_ORDER: AchievementRarity[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'mythic',
];

export const INITIAL_FILTER_STATE = {
  category: 'all' as const,
  rarity: 'all' as const,
  status: 'all' as const,
  sort: 'rarity' as const,
  search: '',
};
