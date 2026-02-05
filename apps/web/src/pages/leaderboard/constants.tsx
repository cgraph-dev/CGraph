/**
 * Constants for LeaderboardPage
 * @module pages/leaderboard
 */

import {
  TrophyIcon,
  FireIcon,
  ChartBarIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

import type { CategoryConfig, TimePeriodConfig, RankConfig } from './types';

export const CATEGORIES: CategoryConfig[] = [
  {
    id: 'xp',
    name: 'Experience',
    icon: <SparklesIcon className="h-5 w-5" />,
    description: 'Total XP earned',
    color: 'text-purple-400',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    id: 'karma',
    name: 'Karma',
    icon: <ArrowTrendingUpIcon className="h-5 w-5" />,
    description: 'Forum reputation',
    color: 'text-blue-400',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'streak',
    name: 'Streak',
    icon: <FireIcon className="h-5 w-5" />,
    description: 'Consecutive login days',
    color: 'text-orange-400',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    id: 'messages',
    name: 'Messages',
    icon: <ChatBubbleLeftRightIcon className="h-5 w-5" />,
    description: 'Total messages sent',
    color: 'text-green-400',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    id: 'posts',
    name: 'Posts',
    icon: <ChartBarIcon className="h-5 w-5" />,
    description: 'Forum posts created',
    color: 'text-pink-400',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    id: 'friends',
    name: 'Connections',
    icon: <UserGroupIcon className="h-5 w-5" />,
    description: 'Friend connections',
    color: 'text-cyan-400',
    gradient: 'from-cyan-500 to-blue-500',
  },
];

export const TIME_PERIODS: TimePeriodConfig[] = [
  { id: 'daily', name: 'Today', icon: <ClockIcon className="h-4 w-4" /> },
  { id: 'weekly', name: 'This Week', icon: <ChartBarIcon className="h-4 w-4" /> },
  { id: 'monthly', name: 'This Month', icon: <FireIcon className="h-4 w-4" /> },
  { id: 'alltime', name: 'All Time', icon: <TrophyIcon className="h-4 w-4" /> },
];

export const RANK_CONFIGS: Record<number, RankConfig> = {
  1: {
    bg: 'bg-gradient-to-br from-yellow-400/30 to-amber-600/20',
    border: 'border-yellow-400/60',
    text: 'text-yellow-400',
    glow: 'shadow-yellow-400/40',
    glowColor: 'rgba(250, 204, 21, 0.4)',
    medal: '🥇',
    crown: true,
  },
  2: {
    bg: 'bg-gradient-to-br from-gray-300/30 to-slate-400/20',
    border: 'border-gray-300/60',
    text: 'text-gray-300',
    glow: 'shadow-gray-300/30',
    glowColor: 'rgba(209, 213, 219, 0.3)',
    medal: '🥈',
    crown: false,
  },
  3: {
    bg: 'bg-gradient-to-br from-orange-400/30 to-amber-700/20',
    border: 'border-orange-400/60',
    text: 'text-orange-400',
    glow: 'shadow-orange-400/30',
    glowColor: 'rgba(251, 146, 60, 0.3)',
    medal: '🥉',
    crown: false,
  },
};

export const DEFAULT_RANK_CONFIG: RankConfig = {
  bg: 'bg-dark-800/50',
  border: 'border-dark-600',
  text: 'text-gray-400',
  glow: '',
  glowColor: 'transparent',
  medal: '',
  crown: false,
};

export const PAGE_SIZE = 25;
