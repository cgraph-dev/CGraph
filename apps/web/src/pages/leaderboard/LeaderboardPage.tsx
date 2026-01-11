import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  TrophyIcon,
  FireIcon,
  ChartBarIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  ClockIcon,
  GlobeAltIcon,
  StarIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import GlassCard from '@/components/ui/GlassCard';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import AnimatedAvatar from '@/components/ui/AnimatedAvatar';

/**
 * Leaderboard Page
 *
 * Displays global rankings with multiple categories and time periods.
 * Features:
 * - Multiple ranking categories (XP, Karma, Streak, etc.)
 * - Time period filters (Daily, Weekly, Monthly, All-time)
 * - Animated rank changes
 * - User highlighting
 * - Real-time updates
 * - Pagination for large lists
 */

interface LeaderboardEntry {
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
}

interface LeaderboardData {
  entries: LeaderboardEntry[];
  totalCount: number;
  userRank: LeaderboardEntry | null;
  lastUpdated: string;
}

type LeaderboardCategory = 'xp' | 'karma' | 'streak' | 'messages' | 'posts' | 'friends';
type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'alltime';

const CATEGORIES: { id: LeaderboardCategory; name: string; icon: React.ReactNode; description: string }[] = [
  { id: 'xp', name: 'Experience', icon: <SparklesIcon className="h-5 w-5" />, description: 'Total XP earned' },
  { id: 'karma', name: 'Karma', icon: <ArrowTrendingUpIcon className="h-5 w-5" />, description: 'Forum reputation' },
  { id: 'streak', name: 'Streak', icon: <FireIcon className="h-5 w-5" />, description: 'Consecutive login days' },
  { id: 'messages', name: 'Messages', icon: <ChatBubbleLeftRightIcon className="h-5 w-5" />, description: 'Total messages sent' },
  { id: 'posts', name: 'Posts', icon: <ChartBarIcon className="h-5 w-5" />, description: 'Forum posts created' },
  { id: 'friends', name: 'Connections', icon: <UserGroupIcon className="h-5 w-5" />, description: 'Friend connections' },
];

const TIME_PERIODS: { id: TimePeriod; name: string }[] = [
  { id: 'daily', name: 'Today' },
  { id: 'weekly', name: 'This Week' },
  { id: 'monthly', name: 'This Month' },
  { id: 'alltime', name: 'All Time' },
];

const DEFAULT_RANK_COLOR = { bg: 'bg-dark-700', border: 'border-dark-600', text: 'text-gray-400', glow: 'transparent' };

const RANK_COLORS: Record<number, { bg: string; border: string; text: string; glow: string }> = {
  1: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400', glow: 'rgba(234, 179, 8, 0.4)' },
  2: { bg: 'bg-gray-300/20', border: 'border-gray-300/50', text: 'text-gray-300', glow: 'rgba(209, 213, 219, 0.3)' },
  3: { bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-400', glow: 'rgba(249, 115, 22, 0.3)' },
};

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [category, setCategory] = useState<LeaderboardCategory>('xp');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('weekly');
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/v1/leaderboard', {
        params: {
          category,
          period: timePeriod,
          page,
          page_size: pageSize,
        },
      });

      setLeaderboard(response.data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      // Mock data for demo
      setLeaderboard(generateMockData());
    } finally {
      setIsLoading(false);
    }
  }, [category, timePeriod, page]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Generate mock data for demo
  function generateMockData(): LeaderboardData {
    const mockNames = [
      'CryptoKing', 'NodeMaster', 'BlockchainQueen', 'DeFiWizard', 'TokenTrader',
      'SmartContractor', 'HashHero', 'ChainChampion', 'WalletWarrior', 'GasGuru',
      'StakeKing', 'YieldFarmer', 'LiquidityLord', 'NFTNinja', 'DAODragon',
      'MetaMogul', 'EtherExpert', 'SolidityPro', 'RustRanger', 'GoGopher',
    ];

    const entries: LeaderboardEntry[] = mockNames.slice(0, 20).map((name, i) => ({
      rank: i + 1,
      previousRank: i + 1 + Math.floor(Math.random() * 5) - 2,
      userId: `user_${i}`,
      username: name.toLowerCase(),
      displayName: name,
      avatarUrl: null,
      level: Math.max(1, 50 - i * 2 + Math.floor(Math.random() * 5)),
      value: Math.floor(10000 / (i + 1) * (1 + Math.random() * 0.3)),
      isOnline: Math.random() > 0.5,
      isPremium: i < 5 || Math.random() > 0.7,
      isVerified: i < 3,
    }));

    // Add current user if not in top 20
    const userRank: LeaderboardEntry | null = user ? {
      rank: 42,
      previousRank: 45,
      userId: user.id,
      username: user.username || 'user',
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      level: 15,
      value: 2500,
      isOnline: true,
      isPremium: false,
      isVerified: false,
    } : null;

    return {
      entries,
      totalCount: 1000,
      userRank,
      lastUpdated: new Date().toISOString(),
    };
  }

  // Format value based on category
  const formatValue = (value: number, _cat: LeaderboardCategory): string => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString();
  };

  // Get rank change indicator
  const getRankChange = (current: number, previous: number) => {
    const diff = previous - current;
    if (diff > 0) {
      return (
        <div className="flex items-center gap-1 text-green-400">
          <ArrowTrendingUpIcon className="h-4 w-4" />
          <span className="text-xs font-semibold">+{diff}</span>
        </div>
      );
    } else if (diff < 0) {
      return (
        <div className="flex items-center gap-1 text-red-400">
          <ArrowTrendingDownIcon className="h-4 w-4" />
          <span className="text-xs font-semibold">{diff}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-gray-500">
        <MinusIcon className="h-4 w-4" />
      </div>
    );
  };

  const currentCategory = CATEGORIES.find(c => c.id === category);

  return (
    <div className="flex-1 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 overflow-y-auto">
      {/* Ambient particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="fixed w-1 h-1 rounded-full bg-primary-400 pointer-events-none"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: 0.1,
          }}
          animate={{
            y: [0, -40, 0],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 4,
          }}
        />
      ))}

      <div className="max-w-5xl mx-auto px-6 py-12 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/20 border border-yellow-500/30 mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <TrophyIcon className="h-5 w-5 text-yellow-400" />
            <span className="text-yellow-400 font-semibold">Global Rankings</span>
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-yellow-200 to-orange-200 bg-clip-text text-transparent mb-4">
            Leaderboard
          </h1>
          <p className="text-gray-400 text-lg">
            Compete with the community and climb the ranks
          </p>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((cat) => (
              <motion.button
                key={cat.id}
                onClick={() => {
                  setCategory(cat.id);
                  setPage(1);
                  HapticFeedback.light();
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  category === cat.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-800 text-gray-400 hover:text-white hover:bg-dark-700'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {cat.icon}
                {cat.name}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Time Period Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-dark-800 border border-dark-700">
            {TIME_PERIODS.map((period) => (
              <button
                key={period.id}
                onClick={() => {
                  setTimePeriod(period.id);
                  setPage(1);
                  HapticFeedback.light();
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  timePeriod === period.id
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {period.name}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Current User's Rank (if not in top) */}
        {leaderboard?.userRank && leaderboard.userRank.rank > pageSize && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <GlassCard variant="neon" glow className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-1">Your Rank</p>
                    <p className="text-2xl font-bold text-primary-400">#{leaderboard.userRank.rank}</p>
                  </div>
                  <div className="h-12 w-px bg-dark-700" />
                  <AnimatedAvatar
                    src={leaderboard.userRank.avatarUrl}
                    alt={leaderboard.userRank.displayName || leaderboard.userRank.username}
                    size="lg"
                    showStatus={true}
                    statusType="online"
                  />
                  <div>
                    <p className="font-semibold text-white">{leaderboard.userRank.displayName || leaderboard.userRank.username}</p>
                    <p className="text-sm text-gray-400">@{leaderboard.userRank.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {getRankChange(leaderboard.userRank.rank, leaderboard.userRank.previousRank)}
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{currentCategory?.description}</p>
                    <p className="text-xl font-bold text-white">{formatValue(leaderboard.userRank.value, category)}</p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Leaderboard Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <GlassCard variant="frosted" className="overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-dark-700">
              <div className="flex items-center gap-2 text-gray-400">
                <GlobeAltIcon className="h-5 w-5" />
                <span className="text-sm">
                  {leaderboard?.totalCount.toLocaleString() || 0} participants
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <ClockIcon className="h-4 w-4" />
                <span className="text-xs">
                  Updated {leaderboard?.lastUpdated ? new Date(leaderboard.lastUpdated).toLocaleTimeString() : 'now'}
                </span>
              </div>
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <motion.div
                  className="h-10 w-10 rounded-full border-2 border-primary-500 border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              </div>
            ) : (
              <>
                {/* Top 3 Podium */}
                {page === 1 && leaderboard && leaderboard.entries.length >= 3 && (
                  <div className="flex items-end justify-center gap-4 p-6 border-b border-dark-700">
                    {[1, 0, 2].map((index) => {
                      const entry = leaderboard.entries[index];
                      if (!entry) return null;
                      const colors = RANK_COLORS[entry.rank] ?? DEFAULT_RANK_COLOR;
                      const isFirst = entry.rank === 1;

                      return (
                        <motion.div
                          key={entry.userId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + index * 0.1 }}
                          whileHover={{ y: -5 }}
                          onClick={() => navigate(`/profile/${entry.userId}`)}
                          className={`cursor-pointer text-center ${isFirst ? 'order-2' : index === 0 ? 'order-1' : 'order-3'}`}
                        >
                          <div className={`relative ${isFirst ? 'mb-4' : 'mb-2'}`}>
                            {/* Crown for #1 */}
                            {isFirst && (
                              <motion.div
                                className="absolute -top-6 left-1/2 -translate-x-1/2"
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              >
                                <span className="text-2xl">👑</span>
                              </motion.div>
                            )}

                            <div className={`p-1 rounded-full ${colors.bg} border-2 ${colors.border}`}
                              style={{ boxShadow: `0 0 20px ${colors.glow}` }}
                            >
                              <AnimatedAvatar
                                src={entry.avatarUrl}
                                alt={entry.displayName || entry.username}
                                size={isFirst ? '2xl' : 'xl'}
                                showStatus={entry.isOnline}
                                statusType={entry.isOnline ? 'online' : 'offline'}
                              />
                            </div>

                            {/* Rank Badge */}
                            <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 h-8 w-8 rounded-full ${colors.bg} border-2 ${colors.border} flex items-center justify-center`}>
                              <span className={`font-bold ${colors.text}`}>{entry.rank}</span>
                            </div>
                          </div>

                          <p className="font-semibold text-white mt-4 truncate max-w-[100px]">
                            {entry.displayName || entry.username}
                          </p>
                          <p className="text-sm text-gray-400">Lvl {entry.level}</p>
                          <p className={`text-lg font-bold ${colors.text}`}>
                            {formatValue(entry.value, category)}
                          </p>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Rest of Rankings */}
                <div className="divide-y divide-dark-800">
                  <AnimatePresence mode="popLayout">
                    {leaderboard?.entries.slice(page === 1 ? 3 : 0).map((entry, index) => {
                      const isCurrentUser = user?.id === entry.userId;
                      const colors = RANK_COLORS[entry.rank] ?? DEFAULT_RANK_COLOR;

                      return (
                        <motion.div
                          key={entry.userId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() => navigate(`/profile/${entry.userId}`)}
                          className={`flex items-center gap-4 p-4 cursor-pointer transition-all hover:bg-dark-800/50 ${
                            isCurrentUser ? 'bg-primary-500/10 border-l-2 border-primary-500' : ''
                          }`}
                        >
                          {/* Rank */}
                          <div className={`w-12 text-center ${colors?.text || 'text-gray-400'}`}>
                            <span className="text-lg font-bold">#{entry.rank}</span>
                          </div>

                          {/* Rank Change */}
                          <div className="w-12">
                            {getRankChange(entry.rank, entry.previousRank)}
                          </div>

                          {/* Avatar */}
                          <AnimatedAvatar
                            src={entry.avatarUrl}
                            alt={entry.displayName || entry.username}
                            size="md"
                            showStatus={entry.isOnline}
                            statusType={entry.isOnline ? 'online' : 'offline'}
                          />

                          {/* User Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold truncate ${isCurrentUser ? 'text-primary-400' : 'text-white'}`}>
                                {entry.displayName || entry.username}
                              </span>
                              {entry.isPremium && (
                                <BoltIcon className="h-4 w-4 text-yellow-400" />
                              )}
                              {entry.isVerified && (
                                <StarIcon className="h-4 w-4 text-primary-400" />
                              )}
                            </div>
                            <p className="text-sm text-gray-400">Level {entry.level}</p>
                          </div>

                          {/* Value */}
                          <div className="text-right">
                            <p className="text-lg font-bold text-white">{formatValue(entry.value, category)}</p>
                            <p className="text-xs text-gray-500">{currentCategory?.description}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Pagination */}
                {leaderboard && leaderboard.totalCount > pageSize && (
                  <div className="flex items-center justify-center gap-4 p-4 border-t border-dark-700">
                    <motion.button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 rounded-lg bg-dark-700 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-600 hover:text-white transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Previous
                    </motion.button>
                    <span className="text-gray-400">
                      Page {page} of {Math.ceil(leaderboard.totalCount / pageSize)}
                    </span>
                    <motion.button
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= Math.ceil(leaderboard.totalCount / pageSize)}
                      className="px-4 py-2 rounded-lg bg-dark-700 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-600 hover:text-white transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Next
                    </motion.button>
                  </div>
                )}
              </>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
