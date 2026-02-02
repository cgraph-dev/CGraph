import { useState, useEffect, useCallback, useMemo } from 'react';
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
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { GlassCard, AnimatedAvatar } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';

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
 * - Enhanced animations and effects
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
  title?: string;
}

interface LeaderboardData {
  entries: LeaderboardEntry[];
  totalCount: number;
  userRank: LeaderboardEntry | null;
  lastUpdated: string;
}

type LeaderboardCategory = 'xp' | 'karma' | 'streak' | 'messages' | 'posts' | 'friends';
type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'alltime';

interface CategoryConfig {
  id: LeaderboardCategory;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  gradient: string;
}

const CATEGORIES: CategoryConfig[] = [
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

const TIME_PERIODS: { id: TimePeriod; name: string; icon: React.ReactNode }[] = [
  { id: 'daily', name: 'Today', icon: <ClockIcon className="h-4 w-4" /> },
  { id: 'weekly', name: 'This Week', icon: <ChartBarIcon className="h-4 w-4" /> },
  { id: 'monthly', name: 'This Month', icon: <FireIcon className="h-4 w-4" /> },
  { id: 'alltime', name: 'All Time', icon: <TrophyIcon className="h-4 w-4" /> },
];

const RANK_CONFIGS = {
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

const DEFAULT_RANK_CONFIG = {
  bg: 'bg-dark-800/50',
  border: 'border-dark-600',
  text: 'text-gray-400',
  glow: '',
  glowColor: 'transparent',
  medal: '',
  crown: false,
};

// Confetti particle component
function ConfettiParticle({ delay, color }: { delay: number; color: string }) {
  const randomX = Math.random() * 100;
  const randomRotation = Math.random() * 360;
  const duration = 3 + Math.random() * 2;

  return (
    <motion.div
      className="pointer-events-none absolute h-2 w-2 rounded-sm"
      style={{
        left: `${randomX}%`,
        top: '-10px',
        backgroundColor: color,
        rotate: randomRotation,
      }}
      initial={{ y: -20, opacity: 1 }}
      animate={{
        y: ['0%', '100vh'],
        rotate: [randomRotation, randomRotation + 360],
        opacity: [1, 1, 0],
      }}
      transition={{
        duration,
        delay,
        ease: 'linear',
        repeat: Infinity,
        repeatDelay: Math.random() * 5,
      }}
    />
  );
}

// Floating particles background
function FloatingParticles() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {[...Array(25)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 4 + 2,
            height: Math.random() * 4 + 2,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: `radial-gradient(circle, ${
              ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'][Math.floor(Math.random() * 5)]
            }aa 0%, transparent 70%)`,
          }}
          animate={{
            y: [0, -50, 0],
            x: [0, Math.random() * 30 - 15, 0],
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 5 + Math.random() * 5,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [category, setCategory] = useState<LeaderboardCategory>('xp');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('weekly');
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const pageSize = 25;

  const currentCategory = useMemo(
    () => CATEGORIES.find((c) => c.id === category) ?? CATEGORIES[0]!,
    [category]
  );

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(
    async (showRefreshIndicator = false) => {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

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
        if (page === 1) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        }
      } catch {
        // Mock data for demo
        setLeaderboard(generateMockData());
        if (page === 1) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [category, timePeriod, page]
  );

  useEffect(() => {
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, timePeriod, page]);

  // Generate mock data for demo
  function generateMockData(): LeaderboardData {
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
      rank: (page - 1) * pageSize + i + 1,
      previousRank: (page - 1) * pageSize + i + 1 + Math.floor(Math.random() * 7) - 3,
      userId: `user_${(page - 1) * pageSize + i}`,
      username: name.toLowerCase().replace(/\s/g, ''),
      displayName: name,
      avatarUrl: null,
      level: Math.max(1, 100 - i * 4 + Math.floor(Math.random() * 10)),
      value: Math.floor((100000 / ((page - 1) * pageSize + i + 1)) * (1 + Math.random() * 0.3)),
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
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
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

  // Format value based on category
  const formatValue = (value: number | undefined | null): string => {
    const num = value ?? 0;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  // Get rank change indicator
  const getRankChange = (current: number, previous: number) => {
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
  };

  // Get rank config
  const getRankConfig = (rank: number) => {
    return RANK_CONFIGS[rank as keyof typeof RANK_CONFIGS] ?? DEFAULT_RANK_CONFIG;
  };

  // Filter entries by search
  const filteredEntries = useMemo(() => {
    const entries = leaderboard?.entries ?? [];
    if (!leaderboard || !searchQuery.trim()) return entries;
    const query = searchQuery.toLowerCase();
    return entries.filter(
      (entry) =>
        entry.username.toLowerCase().includes(query) ||
        entry.displayName?.toLowerCase().includes(query)
    );
  }, [leaderboard, searchQuery]);

  const totalPages = leaderboard?.totalCount ? Math.ceil(leaderboard.totalCount / pageSize) : 0;

  return (
    <div className="relative flex h-full max-h-screen flex-1 flex-col overflow-hidden bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Background Effects */}
      <FloatingParticles />

      {/* Confetti for top ranks */}
      {showConfetti && page === 1 && (
        <div className="pointer-events-none fixed inset-0 z-50">
          {[...Array(30)].map((_, i) => {
            const colors = ['#FFD700', '#C0C0C0', '#CD7F32', '#8B5CF6', '#EC4899'];
            return <ConfettiParticle key={i} delay={i * 0.1} color={colors[i % colors.length]!} />;
          })}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            {/* Trophy Badge */}
            <motion.div
              className="mb-6 inline-flex items-center gap-3 rounded-2xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-orange-500/20 px-6 py-3 backdrop-blur-sm"
              whileHover={{ scale: 1.02 }}
              animate={{
                boxShadow: [
                  '0 0 20px rgba(250, 204, 21, 0.2)',
                  '0 0 40px rgba(250, 204, 21, 0.3)',
                  '0 0 20px rgba(250, 204, 21, 0.2)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <TrophyIcon className="h-7 w-7 text-yellow-400" />
              </motion.div>
              <span className="text-lg font-bold text-yellow-400">Global Rankings</span>
              <motion.span
                className="text-2xl"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                🏆
              </motion.span>
            </motion.div>

            <h1 className="mb-4 text-4xl font-black sm:text-5xl md:text-6xl">
              <span className="bg-gradient-to-r from-white via-yellow-200 to-orange-300 bg-clip-text text-transparent">
                Leaderboard
              </span>
            </h1>
            <p className="mx-auto max-w-xl text-lg text-gray-400">
              Compete with the community, earn achievements, and climb to the top
            </p>
          </motion.div>

          {/* Category Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="scrollbar-hide mb-6 overflow-x-auto pb-2"
          >
            <div className="flex min-w-max justify-center gap-2 px-4">
              {CATEGORIES.map((cat, index) => (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  onClick={() => {
                    setCategory(cat.id);
                    setPage(1);
                    HapticFeedback.light();
                  }}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                    category === cat.id
                      ? `bg-gradient-to-r ${cat.gradient} text-white shadow-lg`
                      : 'border border-dark-700 bg-dark-800/80 text-gray-400 hover:bg-dark-700 hover:text-white'
                  }`}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className={category === cat.id ? 'text-white' : cat.color}>{cat.icon}</span>
                  <span>{cat.name}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Time Period & Search Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row"
          >
            {/* Time Period Tabs */}
            <div className="flex items-center gap-1 rounded-2xl border border-dark-700 bg-dark-800/80 p-1.5 backdrop-blur-sm">
              {TIME_PERIODS.map((period) => (
                <motion.button
                  key={period.id}
                  onClick={() => {
                    setTimePeriod(period.id);
                    setPage(1);
                    HapticFeedback.light();
                  }}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                    timePeriod === period.id
                      ? `bg-gradient-to-r ${currentCategory.gradient} text-white shadow-md`
                      : 'text-gray-400 hover:bg-dark-700/50 hover:text-white'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {period.icon}
                  <span className="hidden sm:inline">{period.name}</span>
                </motion.button>
              ))}
            </div>

            {/* Search & Refresh */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 rounded-xl border border-dark-700 bg-dark-800/80 py-2 pl-9 pr-4 text-white placeholder-gray-500 transition-all focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 sm:w-64"
                />
              </div>
              <motion.button
                onClick={() => fetchLeaderboard(true)}
                disabled={isRefreshing}
                className="rounded-xl border border-dark-700 bg-dark-800/80 p-2.5 text-gray-400 transition-all hover:bg-dark-700 hover:text-white disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowPathIcon className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </motion.button>
            </div>
          </motion.div>

          {/* Current User's Rank Card (if not in top) */}
          {leaderboard?.userRank && leaderboard.userRank.rank > pageSize && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <GlassCard variant="neon" glow className="relative overflow-hidden p-5">
                {/* Animated background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${currentCategory.gradient} opacity-5`}
                />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                />

                <div className="relative flex flex-col items-center justify-between gap-4 sm:flex-row">
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl border border-primary-500/30 bg-primary-500/20 px-4 py-2 text-center">
                      <p className="mb-0.5 text-xs text-primary-300">Your Rank</p>
                      <p className="text-3xl font-black text-primary-400">
                        #{leaderboard.userRank.rank}
                      </p>
                    </div>
                    <div className="hidden h-14 w-px bg-gradient-to-b from-transparent via-dark-600 to-transparent sm:block" />
                    <div className="flex items-center gap-3">
                      <AnimatedAvatar
                        src={leaderboard.userRank.avatarUrl}
                        alt={leaderboard.userRank.displayName || leaderboard.userRank.username}
                        size="lg"
                        showStatus={true}
                        statusType="online"
                      />
                      <div>
                        <p className="text-lg font-bold text-white">
                          {leaderboard.userRank.displayName || leaderboard.userRank.username}
                        </p>
                        <p className="text-sm text-gray-400">@{leaderboard.userRank.username}</p>
                        {leaderboard.userRank.title && (
                          <span className="text-xs font-medium text-primary-400">
                            {leaderboard.userRank.title}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    {getRankChange(leaderboard.userRank.rank, leaderboard.userRank.previousRank)}
                    <div className="text-center sm:text-right">
                      <p className="mb-1 text-xs text-gray-400">{currentCategory.description}</p>
                      <p
                        className={`bg-gradient-to-r text-2xl font-black ${currentCategory.gradient} bg-clip-text text-transparent`}
                      >
                        {formatValue(leaderboard.userRank.value)}
                      </p>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Main Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <GlassCard variant="frosted" className="overflow-hidden">
              {/* Header */}
              <div className="flex flex-col items-center justify-between border-b border-dark-700/50 bg-dark-900/50 p-4 sm:flex-row">
                <div className="mb-2 flex items-center gap-3 text-gray-400 sm:mb-0">
                  <GlobeAltIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    {(leaderboard?.totalCount ?? 0).toLocaleString()} participants competing
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <ClockIcon className="h-4 w-4" />
                  <span className="text-xs">
                    Updated{' '}
                    {leaderboard?.lastUpdated
                      ? new Date(leaderboard.lastUpdated).toLocaleTimeString()
                      : 'now'}
                  </span>
                </div>
              </div>

              {/* Loading State */}
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <motion.div
                    className={`h-16 w-16 rounded-full border-4 border-t-transparent bg-gradient-to-r ${currentCategory.gradient}`}
                    style={{ borderColor: 'currentColor', borderTopColor: 'transparent' }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  <p className="mt-4 text-gray-400">Loading rankings...</p>
                </div>
              ) : (
                <>
                  {/* Top 3 Podium */}
                  {page === 1 && leaderboard && (leaderboard.entries?.length ?? 0) >= 3 && (
                    <div className="relative border-b border-dark-700/50 bg-gradient-to-b from-dark-800/50 to-transparent px-4 py-8">
                      {/* Spotlights */}
                      <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-yellow-500/10 blur-3xl" />
                      </div>

                      <div className="relative flex items-end justify-center gap-4 sm:gap-8">
                        {[1, 0, 2].map((index) => {
                          const entry = leaderboard.entries?.[index];
                          if (!entry) return null;
                          const config = getRankConfig(entry.rank);
                          const isFirst = entry.rank === 1;
                          const podiumHeight = isFirst
                            ? 'h-36'
                            : entry.rank === 2
                              ? 'h-28'
                              : 'h-20';

                          return (
                            <motion.div
                              key={entry.userId}
                              initial={{ opacity: 0, y: 50, scale: 0.8 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{
                                delay: 0.3 + index * 0.15,
                                type: 'spring',
                                stiffness: 100,
                              }}
                              whileHover={{ y: -8, scale: 1.02 }}
                              onClick={() => navigate(`/profile/${entry.userId}`)}
                              className={`flex cursor-pointer flex-col items-center text-center ${
                                isFirst ? 'order-2' : index === 0 ? 'order-1' : 'order-3'
                              }`}
                            >
                              {/* Avatar Section */}
                              <div className="relative mb-2">
                                {/* Crown for #1 */}
                                {config.crown && (
                                  <motion.div
                                    className="absolute -top-8 left-1/2 z-10 -translate-x-1/2"
                                    animate={{
                                      y: [0, -5, 0],
                                      rotate: [0, 5, -5, 0],
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                  >
                                    <span className="text-3xl drop-shadow-lg">👑</span>
                                  </motion.div>
                                )}

                                {/* Glow Effect */}
                                <motion.div
                                  className={`absolute inset-0 rounded-full blur-xl ${config.bg}`}
                                  animate={{
                                    opacity: [0.5, 0.8, 0.5],
                                    scale: [1, 1.1, 1],
                                  }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                  style={{ boxShadow: `0 0 40px ${config.glowColor}` }}
                                />

                                <div
                                  className={`relative rounded-full p-1 ${config.bg} border-2 ${config.border}`}
                                  style={{ boxShadow: `0 0 30px ${config.glowColor}` }}
                                >
                                  <AnimatedAvatar
                                    src={entry.avatarUrl}
                                    alt={entry.displayName || entry.username}
                                    size={isFirst ? '2xl' : 'xl'}
                                    showStatus={entry.isOnline}
                                    statusType={entry.isOnline ? 'online' : 'offline'}
                                  />
                                </div>

                                {/* Medal Badge */}
                                <motion.div
                                  className={`absolute -bottom-1 left-1/2 -translate-x-1/2 text-2xl drop-shadow-lg`}
                                  animate={{ scale: [1, 1.1, 1] }}
                                  transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                  {config.medal}
                                </motion.div>
                              </div>

                              {/* User Info */}
                              <div className="mt-4">
                                <div className="mb-1 flex items-center justify-center gap-1">
                                  <p
                                    className={`max-w-[80px] truncate font-bold sm:max-w-[120px] ${config.text}`}
                                  >
                                    {entry.displayName || entry.username}
                                  </p>
                                  {entry.isPremium && (
                                    <BoltIcon className="h-4 w-4 text-yellow-400" />
                                  )}
                                  {entry.isVerified && (
                                    <StarIcon className="h-4 w-4 text-primary-400" />
                                  )}
                                </div>
                                {entry.title && (
                                  <p className="mb-1 text-xs font-medium text-primary-400">
                                    {entry.title}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500">Level {entry.level}</p>
                                <p className={`text-lg font-black ${config.text} mt-1`}>
                                  {formatValue(entry.value)}
                                </p>
                              </div>

                              {/* Podium */}
                              <motion.div
                                className={`${podiumHeight} mt-3 w-20 rounded-t-lg sm:w-28 ${config.bg} border-x-2 border-t-2 ${config.border} flex items-start justify-center pt-2`}
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
                              >
                                <span className={`text-3xl font-black ${config.text}`}>
                                  #{entry.rank}
                                </span>
                              </motion.div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Rest of Rankings */}
                  <div className="divide-y divide-dark-800/50">
                    <AnimatePresence mode="popLayout">
                      {filteredEntries.slice(page === 1 ? 3 : 0).map((entry, index) => {
                        const isCurrentUser = user?.id === entry.userId;
                        const config = getRankConfig(entry.rank);

                        return (
                          <motion.div
                            key={entry.userId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.02 }}
                            onClick={() => navigate(`/profile/${entry.userId}`)}
                            className={`group flex cursor-pointer items-center gap-3 p-4 transition-all hover:bg-dark-800/50 sm:gap-4 ${
                              isCurrentUser
                                ? `border-l-4 border-primary-500 bg-gradient-to-r from-primary-500/10 to-transparent`
                                : ''
                            }`}
                          >
                            {/* Rank */}
                            <div className="w-10 shrink-0 text-center sm:w-14">
                              <span
                                className={`text-base font-bold sm:text-lg ${entry.rank <= 3 ? config.text : 'text-gray-400'}`}
                              >
                                #{entry.rank}
                              </span>
                            </div>

                            {/* Rank Change */}
                            <div className="w-14 shrink-0 sm:w-16">
                              {getRankChange(entry.rank, entry.previousRank)}
                            </div>

                            {/* Avatar */}
                            <div className="shrink-0">
                              <AnimatedAvatar
                                src={entry.avatarUrl}
                                alt={entry.displayName || entry.username}
                                size="md"
                                showStatus={entry.isOnline}
                                statusType={entry.isOnline ? 'online' : 'offline'}
                              />
                            </div>

                            {/* User Info */}
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`truncate font-semibold ${isCurrentUser ? 'text-primary-400' : 'text-white transition-colors group-hover:text-primary-300'}`}
                                >
                                  {entry.displayName || entry.username}
                                </span>
                                {entry.isPremium && (
                                  <BoltIcon className="h-4 w-4 shrink-0 text-yellow-400" />
                                )}
                                {entry.isVerified && (
                                  <StarIcon className="h-4 w-4 shrink-0 text-primary-400" />
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>Level {entry.level}</span>
                                {entry.title && (
                                  <>
                                    <span>•</span>
                                    <span className="text-primary-400/70">{entry.title}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Value */}
                            <div className="shrink-0 text-right">
                              <p
                                className={`bg-gradient-to-r text-base font-bold sm:text-lg ${currentCategory.gradient} bg-clip-text text-transparent`}
                              >
                                {formatValue(entry.value)}
                              </p>
                              <p className="hidden text-xs text-gray-500 sm:block">
                                {currentCategory.description}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    {/* Empty State */}
                    {filteredEntries.length === 0 && (
                      <div className="py-16 text-center">
                        <MagnifyingGlassIcon className="mx-auto mb-4 h-12 w-12 text-gray-600" />
                        <p className="text-gray-400">No users found matching "{searchQuery}"</p>
                      </div>
                    )}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 border-t border-dark-700/50 bg-dark-900/30 p-4">
                      <motion.button
                        onClick={() => setPage(1)}
                        disabled={page === 1}
                        className="rounded-lg bg-dark-700/50 p-2 text-gray-400 transition-all hover:bg-dark-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ChevronLeftIcon className="h-4 w-4" />
                        <ChevronLeftIcon className="-ml-3 h-4 w-4" />
                      </motion.button>
                      <motion.button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="rounded-lg bg-dark-700/50 p-2 text-gray-400 transition-all hover:bg-dark-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ChevronLeftIcon className="h-4 w-4" />
                      </motion.button>

                      <div className="flex items-center gap-1 px-2">
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                          let pageNum: number;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }

                          return (
                            <motion.button
                              key={i}
                              onClick={() => setPage(pageNum)}
                              className={`h-8 w-8 rounded-lg text-sm font-medium transition-all ${
                                page === pageNum
                                  ? `bg-gradient-to-r ${currentCategory.gradient} text-white`
                                  : 'bg-dark-700/50 text-gray-400 hover:bg-dark-600 hover:text-white'
                              }`}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              {pageNum}
                            </motion.button>
                          );
                        })}
                      </div>

                      <motion.button
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page >= totalPages}
                        className="rounded-lg bg-dark-700/50 p-2 text-gray-400 transition-all hover:bg-dark-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ChevronRightIcon className="h-4 w-4" />
                      </motion.button>
                      <motion.button
                        onClick={() => setPage(totalPages)}
                        disabled={page >= totalPages}
                        className="rounded-lg bg-dark-700/50 p-2 text-gray-400 transition-all hover:bg-dark-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ChevronRightIcon className="h-4 w-4" />
                        <ChevronRightIcon className="-ml-3 h-4 w-4" />
                      </motion.button>

                      <span className="ml-2 hidden text-sm text-gray-500 sm:inline">
                        of {totalPages.toLocaleString()} pages
                      </span>
                    </div>
                  )}
                </>
              )}
            </GlassCard>
          </motion.div>

          {/* Stats Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {[
              {
                label: 'Total Users',
                value: (leaderboard?.totalCount ?? 0).toLocaleString(),
                icon: <UserGroupIcon className="h-5 w-5" />,
              },
              {
                label: 'Active Today',
                value: Math.floor((leaderboard?.totalCount ?? 0) * 0.15).toLocaleString(),
                icon: <BoltIcon className="h-5 w-5" />,
              },
              {
                label: 'Your Percentile',
                value: leaderboard?.userRank
                  ? `Top ${Math.ceil((leaderboard.userRank.rank / (leaderboard?.totalCount || 1)) * 100)}%`
                  : 'N/A',
                icon: <ChartBarIcon className="h-5 w-5" />,
              },
              { label: 'Next Update', value: '5 min', icon: <ClockIcon className="h-5 w-5" /> },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                className="rounded-xl border border-dark-700/50 bg-dark-800/50 p-4 text-center"
              >
                <div
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${currentCategory.gradient} mb-2 bg-opacity-20`}
                >
                  <span className={currentCategory.color}>{stat.icon}</span>
                </div>
                <p className="text-lg font-bold text-white">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
