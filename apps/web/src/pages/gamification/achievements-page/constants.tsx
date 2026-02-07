import {
  TrophyIcon,
  SparklesIcon,
  FireIcon,
  StarIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { TrophyIcon as TrophySolidIcon } from '@heroicons/react/24/solid';
import type { AchievementRarity } from '@/modules/gamification/store';
import type { CategoryFilter, RarityColors } from './types';

export const CATEGORIES: CategoryFilter[] = [
  {
    id: 'all',
    name: 'All',
    icon: <SparklesIcon className="h-4 w-4" />,
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'social',
    name: 'Social',
    icon: <TrophyIcon className="h-4 w-4" />,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'content',
    name: 'Content',
    icon: <StarIcon className="h-4 w-4" />,
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'exploration',
    name: 'Exploration',
    icon: <MagnifyingGlassIcon className="h-4 w-4" />,
    color: 'from-orange-500 to-yellow-500',
  },
  {
    id: 'mastery',
    name: 'Mastery',
    icon: <FireIcon className="h-4 w-4" />,
    color: 'from-red-500 to-orange-500',
  },
  {
    id: 'legendary',
    name: 'Legendary',
    icon: <TrophySolidIcon className="h-4 w-4" />,
    color: 'from-yellow-500 to-amber-500',
  },
  {
    id: 'secret',
    name: 'Secret',
    icon: <LockClosedIcon className="h-4 w-4" />,
    color: 'from-gray-500 to-gray-600',
  },
];

export const RARITY_COLORS: Record<AchievementRarity, RarityColors> = {
  common: {
    bg: 'bg-gray-500/20',
    border: 'border-gray-500/40',
    text: 'text-gray-400',
    glow: 'shadow-gray-500/20',
  },
  uncommon: {
    bg: 'bg-green-500/20',
    border: 'border-green-500/40',
    text: 'text-green-400',
    glow: 'shadow-green-500/30',
  },
  rare: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/40',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/30',
  },
  epic: {
    bg: 'bg-purple-500/20',
    border: 'border-purple-500/40',
    text: 'text-purple-400',
    glow: 'shadow-purple-500/40',
  },
  legendary: {
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/40',
    text: 'text-yellow-400',
    glow: 'shadow-yellow-500/50',
  },
  mythic: {
    bg: 'bg-pink-500/20',
    border: 'border-pink-500/40',
    text: 'text-pink-400',
    glow: 'shadow-pink-500/50',
  },
};

export const RARITY_ORDER: AchievementRarity[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'mythic',
];
