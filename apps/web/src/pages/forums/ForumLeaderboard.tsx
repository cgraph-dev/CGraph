import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForumStore, Forum } from '@/stores/forumStore';
import { useAuthStore } from '@/stores/authStore';
import GlassCard from '@/components/ui/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  TrophyIcon,
  FireIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import {
  ArrowUpIcon as ArrowUpIconSolid,
  ArrowDownIcon as ArrowDownIconSolid,
  TrophyIcon as TrophyIconSolid,
} from '@heroicons/react/24/solid';

type LeaderboardSort = 'hot' | 'top' | 'new' | 'rising' | 'weekly' | 'members';

const sortOptions = [
  { value: 'hot' as const, label: 'Hot', icon: FireIcon },
  { value: 'top' as const, label: 'Top All Time', icon: TrophyIcon },
  { value: 'weekly' as const, label: 'Weekly Best', icon: SparklesIcon },
  { value: 'rising' as const, label: 'Rising', icon: ArrowTrendingUpIcon },
  { value: 'new' as const, label: 'New', icon: ClockIcon },
  { value: 'members' as const, label: 'Most Members', icon: UsersIcon },
];

/**
 * Forum Leaderboard Component
 * Reddit-style competitive ranking of forums by upvotes
 */
export default function ForumLeaderboard() {
  const { isAuthenticated } = useAuthStore();
  const {
    leaderboard,
    leaderboardMeta,
    topForums,
    isLoadingLeaderboard,
    fetchLeaderboard,
    fetchTopForums,
    voteForum,
  } = useForumStore();

  const [sort, setSort] = useState<LeaderboardSort>('hot');
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    fetchLeaderboard(sort, 1);
    fetchTopForums(5, 'top');
  }, [sort, fetchLeaderboard, fetchTopForums]);

  const handleVote = async (forum: Forum, value: 1 | -1) => {
    if (!isAuthenticated) {
      // Could show login modal here
      return;
    }
    await voteForum(forum.id, value);
  };

  const loadMore = () => {
    if (leaderboardMeta && leaderboardMeta.page * leaderboardMeta.perPage < leaderboardMeta.total) {
      fetchLeaderboard(sort, leaderboardMeta.page + 1);
    }
  };

  const selectedSort = sortOptions.find((s) => s.value === sort) || sortOptions[0];
  const SortIcon = selectedSort!.icon;
  const sortLabel = selectedSort!.label;

  return (
    <div className="relative flex flex-1 overflow-hidden">
      {/* Gradient Background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950" />

      {/* Ambient Particles */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute h-1 w-1 rounded-full bg-yellow-500/30"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            scale: Math.random() * 0.5 + 0.5,
            opacity: 0,
          }}
          animate={{
            y: [null, Math.random() * window.innerHeight],
            x: [null, Math.random() * window.innerWidth],
            opacity: [0, 0.6, 0],
            scale: [null, Math.random() * 1.5 + 0.5],
          }}
          transition={{
            duration: Math.random() * 12 + 18,
            repeat: Infinity,
            delay: i * 0.7,
            ease: 'linear',
          }}
        />
      ))}

      {/* Main Leaderboard */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        {/* Header - Glassmorphic */}
        <div className="sticky top-0 z-10 border-b border-yellow-500/20 bg-dark-900/80 px-4 py-3 backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-orange-500/5 to-transparent" />

          <div className="relative z-10 flex items-center justify-between">
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
              >
                <TrophyIconSolid
                  className="h-8 w-8 text-yellow-500"
                  style={{
                    filter: 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.6))',
                  }}
                />
              </motion.div>
              <div>
                <h1 className="bg-gradient-to-r from-yellow-300 via-yellow-500 to-orange-500 bg-clip-text text-2xl font-bold text-transparent">
                  Forum Competition
                </h1>
                <p className="text-sm text-gray-400">Vote for your favorite forums!</p>
              </div>
            </motion.div>

            {/* Sort Dropdown - Enhanced */}
            <div className="relative">
              <motion.button
                onClick={() => {
                  HapticFeedback.light();
                  setShowSortMenu(!showSortMenu);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 rounded-lg bg-dark-700/80 px-4 py-2 text-white backdrop-blur-sm transition-all hover:bg-dark-600"
                style={{
                  boxShadow: '0 0 15px rgba(16, 185, 129, 0.1)',
                }}
              >
                <SortIcon className="h-5 w-5" />
                <span>{sortLabel}</span>
              </motion.button>

              <AnimatePresence>
                {showSortMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className="absolute right-0 z-20 mt-2 w-48"
                    >
                      <GlassCard variant="frosted" className="overflow-hidden p-1">
                        {sortOptions.map((option, index) => (
                          <motion.button
                            key={option.value}
                            onClick={() => {
                              HapticFeedback.light();
                              setSort(option.value);
                              setShowSortMenu(false);
                            }}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.02, x: 2 }}
                            className={`flex w-full items-center gap-3 rounded px-4 py-3 transition-all ${
                              sort === option.value
                                ? 'bg-gradient-to-r from-primary-500/20 to-purple-500/20 text-primary-400'
                                : 'text-gray-300 hover:bg-primary-500/10'
                            }`}
                          >
                            <option.icon className="h-5 w-5" />
                            <span>{option.label}</span>
                          </motion.button>
                        ))}
                      </GlassCard>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Leaderboard List - With staggered animations */}
        <div className="space-y-3 p-4">
          <AnimatePresence mode="popLayout">
            {isLoadingLeaderboard && leaderboard.length === 0 ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-24 animate-pulse rounded-lg bg-dark-700/50 backdrop-blur-sm"
                  />
                ))}
              </div>
            ) : (
              <>
                {leaderboard.map((forum, index) => (
                  <motion.div
                    key={forum.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 20,
                      delay: index * 0.05,
                    }}
                  >
                    <ForumLeaderboardCard
                      forum={forum}
                      rank={index + 1}
                      onVote={handleVote}
                      isAuthenticated={isAuthenticated}
                    />
                  </motion.div>
                ))}

                {/* Load More Button - Enhanced */}
                {leaderboardMeta &&
                  leaderboardMeta.page * leaderboardMeta.perPage < leaderboardMeta.total && (
                    <motion.button
                      onClick={() => {
                        HapticFeedback.light();
                        loadMore();
                      }}
                      disabled={isLoadingLeaderboard}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full rounded-lg bg-dark-700/80 py-3 font-medium text-gray-300 backdrop-blur-sm transition-all hover:bg-dark-600"
                      style={{
                        boxShadow: '0 0 15px rgba(16, 185, 129, 0.1)',
                      }}
                    >
                      {isLoadingLeaderboard ? (
                        <div className="flex items-center justify-center gap-2">
                          <motion.div
                            className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          />
                          <span>Loading...</span>
                        </div>
                      ) : (
                        'Load More Forums'
                      )}
                    </motion.button>
                  )}
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Sidebar - Top 5 All Time */}
      <div className="hidden w-80 overflow-y-auto border-l border-dark-600 lg:block">
        <div className="p-4">
          <div className="rounded-lg border border-yellow-500/30 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 p-4">
            <div className="mb-4 flex items-center gap-2">
              <TrophyIconSolid className="h-6 w-6 text-yellow-500" />
              <h3 className="font-bold text-white">Hall of Fame</h3>
            </div>

            <div className="space-y-3">
              {topForums.map((forum, index) => (
                <TopForumCard key={forum.id} forum={forum} rank={index + 1} />
              ))}
            </div>
          </div>

          {/* About Competition */}
          <div className="mt-4 rounded-lg bg-dark-700 p-4">
            <h3 className="mb-2 font-bold text-white">How It Works</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <ArrowUpIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                <span>Upvote forums you love to help them climb the ranks</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowDownIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                <span>Downvote low-quality forums</span>
              </li>
              <li className="flex items-start gap-2">
                <SparklesIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-500" />
                <span>Weekly scores reset every Monday</span>
              </li>
              <li className="flex items-start gap-2">
                <TrophyIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-500" />
                <span>Top forums get featured status</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ForumLeaderboardCardProps {
  forum: Forum;
  rank: number;
  onVote: (forum: Forum, value: 1 | -1) => void;
  isAuthenticated: boolean;
}

function ForumLeaderboardCard({ forum, rank, onVote, isAuthenticated }: ForumLeaderboardCardProps) {
  const getRankBadge = (rank: number) => {
    if (rank === 1)
      return {
        bg: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
        text: 'text-yellow-900',
        emoji: '🥇',
        glow: '0 0 20px rgba(245, 158, 11, 0.5)',
      };
    if (rank === 2)
      return {
        bg: 'bg-gradient-to-br from-gray-300 to-gray-400',
        text: 'text-gray-900',
        emoji: '🥈',
        glow: '0 0 15px rgba(156, 163, 175, 0.4)',
      };
    if (rank === 3)
      return {
        bg: 'bg-gradient-to-br from-orange-400 to-orange-500',
        text: 'text-orange-900',
        emoji: '🥉',
        glow: '0 0 15px rgba(251, 146, 60, 0.4)',
      };
    return { bg: 'bg-dark-600', text: 'text-gray-300', emoji: null, glow: 'none' };
  };

  const badge = getRankBadge(rank);

  return (
    <GlassCard variant="crystal" className="group relative overflow-hidden">
      {/* Hover gradient glow */}
      <motion.div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-transparent opacity-0 group-hover:opacity-100"
        transition={{ duration: 0.3 }}
      />

      <div className="relative z-10 flex">
        {/* Voting Column - Enhanced */}
        <div className="flex w-16 flex-col items-center justify-center gap-1 bg-dark-800/50 p-2 backdrop-blur-sm">
          <motion.button
            onClick={() => {
              if (isAuthenticated) {
                HapticFeedback.light();
                onVote(forum, 1);
              }
            }}
            disabled={!isAuthenticated}
            whileHover={isAuthenticated ? { scale: 1.1 } : {}}
            whileTap={isAuthenticated ? { scale: 0.9 } : {}}
            className={`rounded p-1 transition-colors ${
              forum.userVote === 1 ? 'text-orange-500' : 'text-gray-500 hover:text-orange-400'
            } ${!isAuthenticated ? 'cursor-not-allowed opacity-50' : ''}`}
            style={{
              filter:
                forum.userVote === 1 ? 'drop-shadow(0 0 6px rgba(249, 115, 22, 0.6))' : 'none',
            }}
            title={isAuthenticated ? 'Upvote' : 'Login to vote'}
          >
            {forum.userVote === 1 ? (
              <ArrowUpIconSolid className="h-6 w-6" />
            ) : (
              <ArrowUpIcon className="h-6 w-6" />
            )}
          </motion.button>

          <motion.span
            key={forum.score}
            initial={{ scale: 1.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-lg font-bold ${
              forum.score > 0
                ? 'bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent'
                : forum.score < 0
                  ? 'bg-gradient-to-r from-blue-500 to-blue-400 bg-clip-text text-transparent'
                  : 'text-gray-400'
            }`}
          >
            {forum.score}
          </motion.span>

          <motion.button
            onClick={() => {
              if (isAuthenticated) {
                HapticFeedback.light();
                onVote(forum, -1);
              }
            }}
            disabled={!isAuthenticated}
            whileHover={isAuthenticated ? { scale: 1.1 } : {}}
            whileTap={isAuthenticated ? { scale: 0.9 } : {}}
            className={`rounded p-1 transition-colors ${
              forum.userVote === -1 ? 'text-blue-500' : 'text-gray-500 hover:text-blue-400'
            } ${!isAuthenticated ? 'cursor-not-allowed opacity-50' : ''}`}
            style={{
              filter:
                forum.userVote === -1 ? 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.6))' : 'none',
            }}
            title={isAuthenticated ? 'Downvote' : 'Login to vote'}
          >
            {forum.userVote === -1 ? (
              <ArrowDownIconSolid className="h-6 w-6" />
            ) : (
              <ArrowDownIcon className="h-6 w-6" />
            )}
          </motion.button>
        </div>

        {/* Rank Badge - Enhanced */}
        <div className="flex items-center px-3">
          <motion.div
            className={`h-10 w-10 rounded-full ${badge.bg} flex items-center justify-center`}
            style={{ boxShadow: badge.glow }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            {badge.emoji ? (
              <span className="text-xl">{badge.emoji}</span>
            ) : (
              <span className={`font-bold ${badge.text}`}>{rank}</span>
            )}
          </motion.div>
        </div>

        {/* Forum Info */}
        <div className="flex-1 p-3">
          <Link to={`/forums/${forum.slug}`} className="flex items-center gap-3">
            {/* Forum Icon */}
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-600">
              {forum.iconUrl ? (
                <img src={forum.iconUrl} alt={forum.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-white">
                  {forum.name?.[0]?.toUpperCase() ?? 'F'}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white transition-colors group-hover:text-primary-400">
                  f/{forum.name}
                </h3>
                {forum.featured && (
                  <SparklesIcon className="h-4 w-4 text-yellow-500" title="Featured Forum" />
                )}
              </div>
              <p className="truncate text-sm text-gray-400">
                {forum.description || 'No description'}
              </p>
              <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <UsersIcon className="h-3.5 w-3.5" />
                  {(forum.memberCount ?? 0).toLocaleString()} members
                </span>
                <span className="flex items-center gap-1">
                  <ChatBubbleLeftRightIcon className="h-3.5 w-3.5" />
                  {(forum.postCount ?? 0).toLocaleString()} posts
                </span>
                <span title="Weekly score">
                  📈 {forum.weeklyScore > 0 ? '+' : ''}
                  {forum.weeklyScore} this week
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Stats Column */}
        <div className="hidden flex-col items-end justify-center px-4 text-sm text-gray-400 md:flex">
          <div className="flex items-center gap-1 text-green-400">
            <ArrowUpIcon className="h-4 w-4" />
            <span>{forum.upvotes}</span>
          </div>
          <div className="flex items-center gap-1 text-red-400">
            <ArrowDownIcon className="h-4 w-4" />
            <span>{forum.downvotes}</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

interface TopForumCardProps {
  forum: Forum;
  rank: number;
}

function TopForumCard({ forum, rank }: TopForumCardProps) {
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-orange-400';
    return 'text-gray-500';
  };

  return (
    <Link
      to={`/forums/${forum.slug}`}
      className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-dark-600/50"
    >
      <span className={`w-6 text-lg font-bold ${getRankColor(rank)}`}>#{rank}</span>

      <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary-600">
        {forum.iconUrl ? (
          <img src={forum.iconUrl} alt={forum.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm font-bold text-white">
            {forum.name?.[0]?.toUpperCase() ?? 'F'}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">f/{forum.name}</p>
        <p className="text-xs text-gray-400">{(forum.score ?? 0).toLocaleString()} points</p>
      </div>
    </Link>
  );
}
