import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForumStore, Forum } from '@/stores/forumStore';
import { useAuthStore } from '@/stores/authStore';
import { GlassCard } from '@/components/ui/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';
import { HapticFeedback } from '@/lib/haptics';
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
    <div className="flex-1 flex overflow-hidden relative">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950 pointer-events-none" />

      {/* Ambient Particles */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-yellow-500/30 rounded-full pointer-events-none"
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
      <div className="flex-1 overflow-y-auto relative z-10">
        {/* Header - Glassmorphic */}
        <div className="sticky top-0 z-10 bg-dark-900/80 backdrop-blur-xl border-b border-yellow-500/20 px-4 py-3">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-orange-500/5 to-transparent pointer-events-none" />

          <div className="flex items-center justify-between relative z-10">
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
                <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-300 via-yellow-500 to-orange-500 bg-clip-text text-transparent">
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
                className="flex items-center gap-2 px-4 py-2 bg-dark-700/80 backdrop-blur-sm hover:bg-dark-600 rounded-lg text-white transition-all"
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
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowSortMenu(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className="absolute right-0 mt-2 w-48 z-20"
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
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded transition-all ${
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
        <div className="p-4 space-y-3">
          <AnimatePresence mode="popLayout">
            {isLoadingLeaderboard && leaderboard.length === 0 ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-dark-700/50 backdrop-blur-sm rounded-lg h-24" />
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
                      className="w-full py-3 bg-dark-700/80 backdrop-blur-sm hover:bg-dark-600 text-gray-300 rounded-lg transition-all font-medium"
                      style={{
                        boxShadow: '0 0 15px rgba(16, 185, 129, 0.1)',
                      }}
                    >
                      {isLoadingLeaderboard ? (
                        <div className="flex items-center justify-center gap-2">
                          <motion.div
                            className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
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
      <div className="hidden lg:block w-80 border-l border-dark-600 overflow-y-auto">
        <div className="p-4">
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg p-4 border border-yellow-500/30">
            <div className="flex items-center gap-2 mb-4">
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
          <div className="mt-4 bg-dark-700 rounded-lg p-4">
            <h3 className="font-bold text-white mb-2">How It Works</h3>
            <ul className="text-sm text-gray-400 space-y-2">
              <li className="flex items-start gap-2">
                <ArrowUpIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Upvote forums you love to help them climb the ranks</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowDownIcon className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span>Downvote low-quality forums</span>
              </li>
              <li className="flex items-start gap-2">
                <SparklesIcon className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <span>Weekly scores reset every Monday</span>
              </li>
              <li className="flex items-start gap-2">
                <TrophyIcon className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
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
    if (rank === 1) return { bg: 'bg-gradient-to-br from-yellow-400 to-yellow-600', text: 'text-yellow-900', emoji: '🥇', glow: '0 0 20px rgba(245, 158, 11, 0.5)' };
    if (rank === 2) return { bg: 'bg-gradient-to-br from-gray-300 to-gray-400', text: 'text-gray-900', emoji: '🥈', glow: '0 0 15px rgba(156, 163, 175, 0.4)' };
    if (rank === 3) return { bg: 'bg-gradient-to-br from-orange-400 to-orange-500', text: 'text-orange-900', emoji: '🥉', glow: '0 0 15px rgba(251, 146, 60, 0.4)' };
    return { bg: 'bg-dark-600', text: 'text-gray-300', emoji: null, glow: 'none' };
  };

  const badge = getRankBadge(rank);

  return (
    <GlassCard
      variant="crystal"
      className="group relative overflow-hidden"
    >
      {/* Hover gradient glow */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none"
        transition={{ duration: 0.3 }}
      />

      <div className="flex relative z-10">
      {/* Voting Column - Enhanced */}
      <div className="flex flex-col items-center justify-center w-16 bg-dark-800/50 backdrop-blur-sm p-2 gap-1">
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
          className={`p-1 rounded transition-colors ${
            forum.userVote === 1
              ? 'text-orange-500'
              : 'text-gray-500 hover:text-orange-400'
          } ${!isAuthenticated ? 'cursor-not-allowed opacity-50' : ''}`}
          style={{
            filter: forum.userVote === 1 ? 'drop-shadow(0 0 6px rgba(249, 115, 22, 0.6))' : 'none',
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
          className={`font-bold text-lg ${
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
          className={`p-1 rounded transition-colors ${
            forum.userVote === -1
              ? 'text-blue-500'
              : 'text-gray-500 hover:text-blue-400'
          } ${!isAuthenticated ? 'cursor-not-allowed opacity-50' : ''}`}
          style={{
            filter: forum.userVote === -1 ? 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.6))' : 'none',
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
          className={`w-10 h-10 rounded-full ${badge.bg} flex items-center justify-center`}
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
        <Link 
          to={`/forums/${forum.slug}`}
          className="flex items-center gap-3"
        >
          {/* Forum Icon */}
          <div className="h-12 w-12 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {forum.iconUrl ? (
              <img src={forum.iconUrl} alt={forum.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-white">{forum.name?.[0]?.toUpperCase() ?? 'F'}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors">
                f/{forum.name}
              </h3>
              {forum.featured && (
                <SparklesIcon className="h-4 w-4 text-yellow-500" title="Featured Forum" />
              )}
            </div>
            <p className="text-sm text-gray-400 truncate">{forum.description || 'No description'}</p>
            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <UsersIcon className="h-3.5 w-3.5" />
                {(forum.memberCount ?? 0).toLocaleString()} members
              </span>
              <span className="flex items-center gap-1">
                <ChatBubbleLeftRightIcon className="h-3.5 w-3.5" />
                {(forum as any).post_count?.toLocaleString() || '0'} posts
              </span>
              <span title="Weekly score">
                📈 {forum.weeklyScore > 0 ? '+' : ''}{forum.weeklyScore} this week
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Stats Column */}
      <div className="hidden md:flex flex-col items-end justify-center px-4 text-sm text-gray-400">
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
      className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-600/50 transition-colors"
    >
      <span className={`font-bold text-lg w-6 ${getRankColor(rank)}`}>#{rank}</span>
      
      <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center overflow-hidden">
        {forum.iconUrl ? (
          <img src={forum.iconUrl} alt={forum.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm font-bold text-white">{forum.name?.[0]?.toUpperCase() ?? 'F'}</span>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate text-sm">f/{forum.name}</p>
        <p className="text-xs text-gray-400">{(forum.score ?? 0).toLocaleString()} points</p>
      </div>
    </Link>
  );
}
