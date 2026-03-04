/**
 * Utility functions for LeaderboardPage
 * @module pages/leaderboard
 */

import { motion } from 'motion/react';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon } from '@heroicons/react/24/outline';

import type { LeaderboardEntry, LeaderboardData, RankConfig } from './types';
import { RANK_CONFIGS, DEFAULT_RANK_CONFIG, PAGE_SIZE } from './constants';

/**
 * Format large numbers with K/M suffixes
 */
export function formatValue(value: number | undefined | null): string {
  const num = value ?? 0;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

/**
 * Get rank change indicator component
 */
export function getRankChange(current: number, previous: number) {
  const diff = previous - current;
  if (diff > 0) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-green-400"
      >
        <ArrowTrendingUpIcon className="h-3.5 w-3.5" />
        <span className="text-xs font-bold">+{diff}</span>
      </motion.div>
    );
  } else if (diff < 0) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-red-400"
      >
        <ArrowTrendingDownIcon className="h-3.5 w-3.5" />
        <span className="text-xs font-bold">{diff}</span>
      </motion.div>
    );
  }
  return (
    <div className="flex items-center gap-1 rounded-full bg-gray-500/10 px-2 py-0.5 text-gray-500">
      <MinusIcon className="h-3.5 w-3.5" />
    </div>
  );
}

/**
 * Get rank styling config
 */
export function getRankConfig(rank: number): RankConfig {
  return RANK_CONFIGS[rank] ?? DEFAULT_RANK_CONFIG;
}

/**
 * Generate mock data for demo/development
 */
export function generateMockData(
  page: number,
  user: {
    id: string;
    username?: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  } | null
): LeaderboardData {
  const mockNames = [
    'CryptoKing',
    'NodeMaster',
    'BlockchainQueen',
    'DeFiWizard',
    'TokenTrader',
    'SmartContractor',
    'HashHero',
    'ChainChampion',
    'WalletWarrior',
    'GasGuru',
    'StakeKing',
    'YieldFarmer',
    'LiquidityLord',
    'NFTNinja',
    'DAODragon',
    'MetaMogul',
    'EtherExpert',
    'SolidityPro',
    'RustRanger',
    'GoGopher',
    'WebDevWizard',
    'ReactRuler',
    'TypeScriptTitan',
    'PythonPro',
    'RustRookie',
  ];

  const titles = [
    'The Legendary',
    'Champion',
    'Elite',
    'Master',
    'Expert',
    'Rising Star',
    'Newcomer',
  ];

  const entries: LeaderboardEntry[] = mockNames.slice(0, 20).map((name, i) => ({
    rank: (page - 1) * PAGE_SIZE + i + 1,
    previousRank: (page - 1) * PAGE_SIZE + i + 1 + Math.floor(Math.random() * 7) - 3,
    userId: `user_${(page - 1) * PAGE_SIZE + i}`,
    username: name.toLowerCase().replace(/\s/g, ''),
    displayName: name,
    avatarUrl: null,
    level: Math.max(1, 100 - i * 4 + Math.floor(Math.random() * 10)),
    value: Math.floor((100000 / ((page - 1) * PAGE_SIZE + i + 1)) * (1 + Math.random() * 0.3)),
    isOnline: Math.random() > 0.4,
    isPremium: i < 5 || Math.random() > 0.6,
    isVerified: i < 3,
    title: i < 7 ? titles[i] : undefined,
  }));

  // Add current user if not in top
  const userRank: LeaderboardEntry | null = user
    ? {
        rank: 42,
        previousRank: 45,
        userId: user.id,
        username: user.username || 'user',
        displayName: user.displayName ?? null,
        avatarUrl: user.avatarUrl ?? null,
        level: 15,
        value: 2500,
        isOnline: true,
        isPremium: false,
        isVerified: false,
        title: 'Rising Star',
      }
    : null;

  return {
    entries,
    totalCount: 10000,
    userRank,
    lastUpdated: new Date().toISOString(),
  };
}
