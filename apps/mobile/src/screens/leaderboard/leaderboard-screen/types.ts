/**
 * Leaderboard Types and Constants
 */

import { Ionicons } from '@expo/vector-icons';

// ============================================================================
// Types
// ============================================================================

export interface LeaderboardEntry {
  rank: number;
  previousRank: number;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  level: number;
  value: number;
  isOnline: boolean;
  isPremium: boolean;
  isVerified: boolean;
  title?: string;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  totalCount: number;
  userRank: LeaderboardEntry | null;
  lastUpdated: string;
}

export type LeaderboardCategory = 'xp' | 'karma' | 'streak' | 'messages' | 'posts' | 'friends';
export type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'alltime';

export interface CategoryConfig {
  id: LeaderboardCategory;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  colors: [string, string];
}

// ============================================================================
// Constants
// ============================================================================

export const CATEGORIES: CategoryConfig[] = [
  {
    id: 'xp',
    name: 'XP',
    icon: 'sparkles',
    description: 'Total XP earned',
    colors: ['#8b5cf6', '#ec4899'],
  },
  {
    id: 'karma',
    name: 'Karma',
    icon: 'trending-up',
    description: 'Forum reputation',
    colors: ['#3b82f6', '#06b6d4'],
  },
  {
    id: 'streak',
    name: 'Streak',
    icon: 'flame',
    description: 'Login streak days',
    colors: ['#f97316', '#ef4444'],
  },
  {
    id: 'messages',
    name: 'Messages',
    icon: 'chatbubbles',
    description: 'Total messages sent',
    colors: ['#10b981', '#059669'],
  },
  {
    id: 'posts',
    name: 'Posts',
    icon: 'document-text',
    description: 'Forum posts created',
    colors: ['#ec4899', '#f43f5e'],
  },
  {
    id: 'friends',
    name: 'Friends',
    icon: 'people',
    description: 'Friend connections',
    colors: ['#06b6d4', '#3b82f6'],
  },
];

export const TIME_PERIODS: { id: TimePeriod; name: string }[] = [
  { id: 'daily', name: 'Today' },
  { id: 'weekly', name: 'Week' },
  { id: 'monthly', name: 'Month' },
  { id: 'alltime', name: 'All Time' },
];

export const RANK_CONFIGS: Record<
  number,
  {
    colors: [string, string];
    medal: string;
    glow: string;
  }
> = {
  1: { colors: ['#fcd34d', '#f59e0b'], medal: '🥇', glow: '#fcd34d' },
  2: { colors: ['#d1d5db', '#9ca3af'], medal: '🥈', glow: '#d1d5db' },
  3: { colors: ['#f97316', '#ea580c'], medal: '🥉', glow: '#f97316' },
};

// ============================================================================
// Helper Functions
// ============================================================================

export function formatValue(value: number | undefined | null): string {
  const num = value ?? 0;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

// Fallback mock data generator (used when API fails or in development)
export function generateFallbackData(category: LeaderboardCategory, page: number): LeaderboardData {
  const mockNames = [
    'CryptoKing',
    'NodeMaster',
    'BlockchainQueen',
    'DeFiWizard',
    'TokenTrader',
    'SmartContract',
    'HashHero',
    'ChainChamp',
    'WalletWarrior',
    'GasGuru',
    'StakeKing',
    'YieldFarmer',
    'LiquidLord',
    'NFTNinja',
    'DAODragon',
    'MetaMogul',
    'EtherExpert',
    'SolidityPro',
    'RustRanger',
    'GoGopher',
  ];

  const titles = ['The Legendary', 'Champion', 'Elite', 'Master', 'Expert', 'Rising Star'];

  const entries: LeaderboardEntry[] = mockNames.map((name, i) => ({
    rank: (page - 1) * 20 + i + 1,
    previousRank: (page - 1) * 20 + i + 1 + Math.floor(Math.random() * 7) - 3,
    userId: `user_${(page - 1) * 20 + i}`,
    username: name.toLowerCase().replace(/\s/g, ''),
    displayName: name,
    avatarUrl: null,
    level: Math.max(1, 100 - i * 4 + Math.floor(Math.random() * 10)),
    value: Math.floor((100000 / ((page - 1) * 20 + i + 1)) * (1 + Math.random() * 0.3)),
    isOnline: Math.random() > 0.4,
    isPremium: i < 5 || Math.random() > 0.6,
    isVerified: i < 3,
    title: i < 6 ? titles[i] : undefined,
  }));

  return {
    entries,
    totalCount: 10000,
    userRank: {
      rank: 42,
      previousRank: 45,
      userId: 'current_user',
      username: 'you',
      displayName: 'You',
      avatarUrl: null,
      level: 15,
      value: 2500,
      isOnline: true,
      isPremium: false,
      isVerified: false,
      title: 'Rising Star',
    },
    lastUpdated: new Date().toISOString(),
  };
}

// Transform API response to LeaderboardData format
export function transformApiResponse(
  data: Record<string, unknown>,
  category: LeaderboardCategory
): LeaderboardData {
  const rawEntries = (data.entries || data.data || []) as Record<string, unknown>[];
  const entries: LeaderboardEntry[] = rawEntries.map((entry, index) => ({
    rank: (entry.rank as number) || index + 1,
    previousRank:
      (entry.previous_rank as number) ||
      (entry.previousRank as number) ||
      (entry.rank as number) ||
      index + 1,
    userId: String(entry.user_id || entry.userId || entry.id),
    username: String(entry.username || 'unknown'),
    displayName: (entry.display_name || entry.displayName || entry.username) as string | null,
    avatarUrl: (entry.avatar_url || entry.avatarUrl || null) as string | null,
    level: (entry.level as number) || 1,
    value:
      (entry.value as number) ||
      (entry[category] as number) ||
      (entry.xp as number) ||
      (entry.karma as number) ||
      0,
    isOnline: Boolean(entry.is_online || entry.isOnline || entry.status === 'online'),
    isPremium: Boolean(entry.is_premium || entry.isPremium),
    isVerified: Boolean(entry.is_verified || entry.isVerified),
    title: entry.title as string | undefined,
  }));

  const userRankData = (data.user_rank || data.userRank || data.current_user) as Record<
    string,
    unknown
  > | null;
  const userRank: LeaderboardEntry | null = userRankData
    ? {
        rank: (userRankData.rank as number) || 0,
        previousRank:
          (userRankData.previous_rank as number) ||
          (userRankData.previousRank as number) ||
          (userRankData.rank as number) ||
          0,
        userId: String(userRankData.user_id || userRankData.userId || userRankData.id),
        username: String(userRankData.username || 'you'),
        displayName: (userRankData.display_name || userRankData.displayName || 'You') as
          | string
          | null,
        avatarUrl: (userRankData.avatar_url || userRankData.avatarUrl || null) as string | null,
        level: (userRankData.level as number) || 1,
        value: (userRankData.value as number) || (userRankData[category] as number) || 0,
        isOnline: true,
        isPremium: Boolean(userRankData.is_premium || userRankData.isPremium),
        isVerified: Boolean(userRankData.is_verified || userRankData.isVerified),
        title: userRankData.title as string | undefined,
      }
    : null;

  return {
    entries,
    totalCount:
      (data.total_count as number) ||
      (data.totalCount as number) ||
      (data.total as number) ||
      entries.length,
    userRank,
    lastUpdated: String(data.last_updated || data.lastUpdated || new Date().toISOString()),
  };
}
