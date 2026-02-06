/**
 * Forum Leaderboard - Main Component
 *
 * Reddit-style competitive ranking of forums by upvotes.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForumStore, Forum } from '@/stores/forumStore';
import { useAuthStore } from '@/stores/authStore';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import { TrophyIcon as TrophyIconSolid } from '@heroicons/react/24/solid';

import type { LeaderboardSort } from './types';
import { SORT_OPTIONS } from './constants';
import { ForumLeaderboardCard } from './ForumLeaderboardCard';
import { LeaderboardSidebar } from './LeaderboardSidebar';

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

  const selectedSort = SORT_OPTIONS.find((s) => s.value === sort) || SORT_OPTIONS[0];
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
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
            scale: Math.random() * 0.5 + 0.5,
            opacity: 0,
          }}
          animate={{
            y: [null, Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800)],
            x: [null, Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000)],
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
                        {SORT_OPTIONS.map((option, index) => (
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
      <LeaderboardSidebar topForums={topForums} />
    </div>
  );
}
