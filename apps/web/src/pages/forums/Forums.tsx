import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForumStore, Post } from '@/stores/forumStore';
import { useAuthStore } from '@/stores/authStore';
import { formatTimeAgo } from '@/lib/utils';
import { PostCardSkeleton } from '@/components';
import { LeaderboardSidebar } from '@/components/forums/LeaderboardWidget';
import { GlassCard } from '@/shared/components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import ThreadPrefix from '@/components/forums/ThreadPrefix';
import ThreadRating from '@/components/forums/ThreadRating';
import {
  PlusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  BookmarkIcon,
  FireIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ChevronDownIcon,
  TrophyIcon,
  SparklesIcon,
  LockClosedIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import {
  ArrowUpIcon as ArrowUpIconSolid,
  ArrowDownIcon as ArrowDownIconSolid,
} from '@heroicons/react/24/solid';

const sortOptions = [
  { value: 'hot', label: 'Hot', icon: FireIcon },
  { value: 'new', label: 'New', icon: ClockIcon },
  { value: 'top', label: 'Top', icon: ArrowTrendingUpIcon },
] as const;

const timeRangeOptions = [
  { value: 'hour', label: 'Past Hour' },
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
] as const;

/**
 * Get CSS class for vote score display based on user's vote.
 */
function getVoteScoreClass(vote: 1 | -1 | null): string {
  switch (vote) {
    case 1:
      return 'text-orange-500 bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent';
    case -1:
      return 'text-blue-500 bg-gradient-to-r from-blue-500 to-blue-400 bg-clip-text text-transparent';
    default:
      return 'text-white';
  }
}

export default function Forums() {
  const { forumSlug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const {
    forums,
    posts,
    isLoadingForums,
    isLoadingPosts,
    hasMorePosts,
    sortBy,
    timeRange,
    fetchForums,
    fetchForum,
    fetchPosts,
    vote,
    subscribe,
    unsubscribe,
    setSortBy,
    setTimeRange,
  } = useForumStore();

  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showTimeMenu, setShowTimeMenu] = useState(false);
  const [page, setPage] = useState(1);

  const activeForum = forumSlug ? forums.find((f) => f.slug === forumSlug) : null;

  useEffect(() => {
    fetchForums();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (forumSlug) {
      fetchForum(forumSlug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forumSlug]);

  useEffect(() => {
    setPage(1);
    fetchPosts(forumSlug, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forumSlug, sortBy, timeRange]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(forumSlug, nextPage);
  };

  const handleVote = async (postId: string, value: 1 | -1, currentVote: 1 | -1 | null) => {
    const newValue = currentVote === value ? null : value;
    await vote('post', postId, newValue);
  };

  const handleSubscribe = async (forumId: string, isSubscribed: boolean) => {
    if (isSubscribed) {
      await unsubscribe(forumId);
    } else {
      await subscribe(forumId);
    }
  };

  return (
    <div className="relative flex flex-1 overflow-hidden">
      {/* Gradient Background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950" />

      {/* Ambient Particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute h-1 w-1 rounded-full bg-primary-500/30"
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
            duration: Math.random() * 10 + 15,
            repeat: Infinity,
            delay: i * 0.8,
            ease: 'linear',
          }}
        />
      ))}

      {/* Main Content */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        {/* Forum Header (if viewing specific forum) */}
        {activeForum && (
          <div className="relative">
            {/* Banner with Gradient Overlay */}
            <div className="relative h-32 overflow-hidden bg-gradient-to-r from-primary-600 to-primary-800">
              {activeForum.bannerUrl && (
                <img src={activeForum.bannerUrl} alt="" className="h-full w-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-dark-900/80" />
            </div>

            {/* Forum Info - Glassmorphic */}
            <div className="border-b border-primary-500/20 bg-dark-900/50 backdrop-blur-xl">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary-500/5 via-transparent to-purple-500/5" />

              <div className="relative z-10 mx-auto max-w-4xl px-4 py-4">
                <motion.div
                  className="flex items-start gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <motion.div
                    className="relative -mt-10 h-20 w-20 overflow-hidden rounded-full border-4 border-dark-800 bg-gradient-to-br from-primary-500/20 to-purple-500/20"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    {/* Gradient border pulse */}
                    <motion.div
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-400 to-purple-600 opacity-50"
                      animate={{
                        boxShadow: [
                          '0 0 0 0 rgba(16, 185, 129, 0.7)',
                          '0 0 0 6px rgba(16, 185, 129, 0)',
                        ],
                      }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                    />
                    {activeForum.iconUrl ? (
                      <img
                        src={activeForum.iconUrl}
                        alt={activeForum.name}
                        className="relative z-10 h-full w-full object-cover"
                      />
                    ) : (
                      <div className="relative z-10 flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-400 to-purple-600 bg-clip-text text-3xl font-bold text-transparent">
                        {activeForum.name.charAt(0)}
                      </div>
                    )}
                  </motion.div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="bg-gradient-to-r from-white via-primary-100 to-purple-200 bg-clip-text text-2xl font-bold text-transparent">
                          {activeForum.name}
                        </h1>
                        <p className="text-gray-400">c/{activeForum.slug}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Admin Button - Only for owners/moderators */}
                        {(activeForum.ownerId === user?.id ||
                          activeForum.moderators?.some(
                            (m: { id: string }) => m.id === user?.id
                          )) && (
                          <motion.button
                            onClick={() => {
                              HapticFeedback.light();
                              navigate(`/forums/${activeForum.slug}/admin`);
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="rounded-full bg-dark-700/80 p-2 text-gray-400 backdrop-blur-sm transition-colors hover:bg-dark-600 hover:text-white"
                            title="Forum Settings"
                          >
                            <Cog6ToothIcon className="h-5 w-5" />
                          </motion.button>
                        )}

                        <motion.button
                          onClick={() => {
                            HapticFeedback.light();
                            handleSubscribe(activeForum.id, activeForum.isSubscribed);
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`rounded-full px-4 py-2 font-medium transition-all ${
                            activeForum.isSubscribed
                              ? 'bg-dark-700/80 text-white backdrop-blur-sm hover:bg-dark-600'
                              : 'bg-gradient-to-r from-primary-600 to-purple-600 text-white hover:from-primary-500 hover:to-purple-500'
                          }`}
                          style={{
                            boxShadow: activeForum.isSubscribed
                              ? 'none'
                              : '0 0 20px rgba(16, 185, 129, 0.3)',
                          }}
                        >
                          {activeForum.isSubscribed ? 'Joined' : 'Join'}
                        </motion.button>
                      </div>
                    </div>

                    {activeForum.description && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mt-2 text-gray-300"
                      >
                        {activeForum.description}
                      </motion.p>
                    )}

                    <p className="mt-2 text-sm text-gray-500">
                      {(activeForum.memberCount ?? 0).toLocaleString()} members
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        )}

        {/* Sort Controls - Glassmorphic */}
        <div className="sticky top-0 z-10 border-b border-primary-500/20 bg-dark-900/80 px-4 py-3 backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary-500/5 via-transparent to-purple-500/5" />

          <div className="relative z-10 mx-auto flex max-w-4xl items-center gap-4">
            {/* Quick Actions */}
            <div className="mr-auto flex items-center gap-2">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/forums/leaderboard"
                  onClick={() => HapticFeedback.light()}
                  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-600/80 to-orange-600/80 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-all hover:from-yellow-500 hover:to-orange-500 hover:shadow-yellow-500/20"
                  style={{ boxShadow: '0 0 15px rgba(245, 158, 11, 0.2)' }}
                >
                  <TrophyIcon className="h-4 w-4" />
                  Competition
                </Link>
              </motion.div>

              {isAuthenticated && (
                <motion.button
                  onClick={() => {
                    HapticFeedback.light();
                    navigate('/forums/create');
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-600 to-purple-600 px-3 py-1.5 text-sm font-medium text-white transition-all hover:from-primary-500 hover:to-purple-500"
                  style={{ boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)' }}
                >
                  <SparklesIcon className="h-4 w-4" />
                  Create Forum
                </motion.button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 rounded-full bg-dark-800 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-dark-700"
              >
                {sortOptions.find((s) => s.value === sortBy)?.icon && (
                  <span className="h-4 w-4">
                    {(() => {
                      const Icon = sortOptions.find((s) => s.value === sortBy)!.icon;
                      return <Icon className="h-4 w-4" />;
                    })()}
                  </span>
                )}
                {sortOptions.find((s) => s.value === sortBy)?.label}
                <ChevronDownIcon className="h-4 w-4" />
              </button>

              {showSortMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                  <div className="absolute left-0 top-full z-20 mt-1 rounded-lg border border-dark-700 bg-dark-800 py-1 shadow-lg">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setShowSortMenu(false);
                        }}
                        className={`flex w-full items-center gap-2 px-4 py-2 transition-colors hover:bg-dark-700 ${
                          sortBy === option.value ? 'text-primary-400' : 'text-white'
                        }`}
                      >
                        <option.icon className="h-4 w-4" />
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Time Range (only for Top) */}
            {sortBy === 'top' && (
              <div className="relative">
                <button
                  onClick={() => setShowTimeMenu(!showTimeMenu)}
                  className="flex items-center gap-2 rounded-full bg-dark-800 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-dark-700"
                >
                  {timeRangeOptions.find((t) => t.value === timeRange)?.label}
                  <ChevronDownIcon className="h-4 w-4" />
                </button>

                {showTimeMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowTimeMenu(false)} />
                    <div className="absolute left-0 top-full z-20 mt-1 rounded-lg border border-dark-700 bg-dark-800 py-1 shadow-lg">
                      {timeRangeOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setTimeRange(option.value);
                            setShowTimeMenu(false);
                          }}
                          className={`w-full px-4 py-2 text-left transition-colors hover:bg-dark-700 ${
                            timeRange === option.value ? 'text-primary-400' : 'text-white'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Posts - With staggered animations */}
        <div className="mx-auto max-w-4xl space-y-3 py-4">
          <AnimatePresence mode="popLayout">
            {isLoadingPosts && posts.length === 0 ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <PostCardSkeleton key={i} />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="py-12 text-center"
              >
                <GlassCard variant="holographic" className="p-8">
                  <SparklesIcon className="mx-auto mb-4 h-16 w-16 text-primary-400 opacity-50" />
                  <p className="mb-4 text-lg text-gray-400">No posts yet</p>
                  {activeForum && (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Link
                        to={`/forums/${activeForum.slug}/create-post`}
                        onClick={() => HapticFeedback.light()}
                        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary-600 to-purple-600 px-6 py-3 font-medium text-white transition-all hover:from-primary-500 hover:to-purple-500"
                        style={{ boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)' }}
                      >
                        <PlusIcon className="h-5 w-5" />
                        Create First Post
                      </Link>
                    </motion.div>
                  )}
                </GlassCard>
              </motion.div>
            ) : (
              posts.map((post, index) => (
                <motion.div
                  key={post.id}
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
                  <PostCard
                    post={post}
                    onVote={(value) => handleVote(post.id, value, post.myVote)}
                  />
                </motion.div>
              ))
            )}
          </AnimatePresence>

          {/* Load More - Enhanced */}
          {hasMorePosts && posts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-4 text-center"
            >
              <motion.button
                onClick={() => {
                  HapticFeedback.light();
                  handleLoadMore();
                }}
                disabled={isLoadingPosts}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-full bg-dark-800/80 px-6 py-3 font-medium text-white backdrop-blur-sm transition-all hover:bg-dark-700 disabled:opacity-50"
                style={{
                  boxShadow: '0 0 15px rgba(16, 185, 129, 0.1)',
                }}
              >
                {isLoadingPosts ? (
                  <div className="flex items-center gap-2">
                    <motion.div
                      className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <span>Loading...</span>
                  </div>
                ) : (
                  'Load More Posts'
                )}
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Sidebar - Glassmorphic */}
      <div className="relative z-10 hidden w-80 overflow-y-auto border-l border-primary-500/20 bg-dark-900/50 p-4 backdrop-blur-xl lg:block">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary-500/5 via-transparent to-purple-500/5" />

        <div className="relative z-10 space-y-4">
          {/* Create Post - Enhanced */}
          {activeForum ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                to={`/forums/${activeForum.slug}/create-post`}
                onClick={() => HapticFeedback.light()}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary-600 to-purple-600 py-3 font-medium text-white transition-all hover:from-primary-500 hover:to-purple-500"
                style={{ boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)' }}
              >
                <PlusIcon className="h-5 w-5" />
                Create Post
              </Link>
            </motion.div>
          ) : (
            <GlassCard variant="crystal" className="p-3">
              <p className="text-center text-sm text-gray-400">Select a forum to create a post</p>
            </GlassCard>
          )}

          {/* About Community (if viewing forum) */}
          {activeForum && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <GlassCard variant="frosted" className="p-4">
                <h3 className="mb-2 bg-gradient-to-r from-white to-primary-200 bg-clip-text font-semibold text-transparent">
                  About Community
                </h3>
                <p className="mb-4 text-sm text-gray-400">
                  {activeForum.description || 'No description available.'}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Members</span>
                    <span className="bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text font-medium text-transparent text-white">
                      {(activeForum.memberCount ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Created</span>
                    <span className="font-medium text-white">
                      {formatTimeAgo(activeForum.createdAt)}
                    </span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Leaderboard Widget - Forum-specific or Global */}
          <div className="mb-4">
            <LeaderboardSidebar forumId={activeForum?.id} forumSlug={activeForum?.slug} />
          </div>

          {/* Popular Communities - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard variant="frosted" className="p-4">
              <h3 className="mb-3 bg-gradient-to-r from-white to-primary-200 bg-clip-text font-semibold text-transparent">
                Popular Communities
              </h3>
              <div className="space-y-2">
                {isLoadingForums ? (
                  // Skeleton loading for communities
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="-mx-2 flex animate-pulse items-center gap-3 p-2">
                      <div className="h-8 w-8 rounded-full bg-dark-600/50" />
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 h-4 w-24 rounded bg-dark-600/50" />
                        <div className="h-3 w-16 rounded bg-dark-600/50" />
                      </div>
                    </div>
                  ))
                ) : forums.length === 0 ? (
                  <p className="py-4 text-center text-sm text-gray-500">No communities found</p>
                ) : (
                  forums.slice(0, 5).map((forum, index) => (
                    <motion.div
                      key={forum.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: index * 0.05,
                        type: 'spring',
                        stiffness: 300,
                        damping: 20,
                      }}
                    >
                      <Link
                        to={`/forums/${forum.slug}`}
                        onClick={() => HapticFeedback.light()}
                        className="group -mx-2 flex items-center gap-3 rounded p-2 transition-all duration-200 hover:bg-primary-500/10"
                      >
                        <motion.div
                          className="relative h-8 w-8 overflow-hidden rounded-full bg-gradient-to-br from-primary-500/20 to-purple-500/20"
                          whileHover={{ scale: 1.1 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        >
                          {forum.iconUrl ? (
                            <img
                              src={forum.iconUrl}
                              alt={forum.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-400 to-purple-600 bg-clip-text text-sm font-bold text-transparent">
                              {forum.name.charAt(0)}
                            </div>
                          )}
                        </motion.div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-sm font-medium text-white transition-colors group-hover:text-primary-400">
                              c/{forum.slug}
                            </p>
                            {!forum.isPublic && (
                              <LockClosedIcon className="h-3 w-3 flex-shrink-0 text-yellow-500" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            {(forum.memberCount ?? 0).toLocaleString()} members
                          </p>
                        </div>
                      </Link>
                    </motion.div>
                  ))
                )}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Post card component with glassmorphic design
function PostCard({ post, onVote }: { post: Post; onVote: (value: 1 | -1) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <GlassCard variant="crystal" className="group relative overflow-hidden">
        {/* Hover gradient glow */}
        <motion.div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary-500/10 via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100"
          transition={{ duration: 0.3 }}
        />

        <div className="relative z-10 flex">
          {/* Vote sidebar - Enhanced */}
          <div className="flex flex-col items-center gap-1 rounded-l-lg bg-dark-700/50 p-3 backdrop-blur-sm">
            <motion.button
              onClick={() => {
                HapticFeedback.light();
                onVote(1);
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`rounded p-1 transition-colors ${
                post.myVote === 1 ? 'text-orange-500' : 'text-gray-400 hover:text-orange-500'
              }`}
              style={{
                filter: post.myVote === 1 ? 'drop-shadow(0 0 6px rgba(249, 115, 22, 0.6))' : 'none',
              }}
            >
              {post.myVote === 1 ? (
                <ArrowUpIconSolid className="h-5 w-5" />
              ) : (
                <ArrowUpIcon className="h-5 w-5" />
              )}
            </motion.button>
            <motion.span
              key={post.score}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-sm font-bold ${getVoteScoreClass(post.myVote)}`}
            >
              {post.score}
            </motion.span>
            <motion.button
              onClick={() => {
                HapticFeedback.light();
                onVote(-1);
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`rounded p-1 transition-colors ${
                post.myVote === -1 ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'
              }`}
              style={{
                filter:
                  post.myVote === -1 ? 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.6))' : 'none',
              }}
            >
              {post.myVote === -1 ? (
                <ArrowDownIconSolid className="h-5 w-5" />
              ) : (
                <ArrowDownIcon className="h-5 w-5" />
              )}
            </motion.button>
          </div>

          {/* Content */}
          <div className="flex-1 p-3">
            {/* Meta */}
            <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
              <Link
                to={`/forums/${post.forum.slug}`}
                className="flex items-center gap-1 hover:underline"
              >
                <div className="h-5 w-5 overflow-hidden rounded-full bg-dark-600">
                  {post.forum.iconUrl ? (
                    <img src={post.forum.iconUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[10px]">{post.forum.name.charAt(0)}</span>
                  )}
                </div>
                <span className="font-medium text-gray-300">c/{post.forum.slug}</span>
              </Link>
              <span>•</span>
              <span>
                Posted by{' '}
                <Link
                  to={post.author.username ? `/u/${post.author.username}` : '#'}
                  className="hover:underline"
                >
                  u/{post.author.username || post.author.displayName || 'unknown'}
                </Link>
              </span>
              <span>•</span>
              <span>{formatTimeAgo(post.createdAt)}</span>
            </div>

            {/* Title */}
            <Link to={`/forums/${post.forum.slug}/post/${post.id}`}>
              <div className="mb-2">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  {post.isPinned && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-green-600 px-1.5 py-0.5 text-xs">
                      📌 Pinned
                    </span>
                  )}
                  {post.isLocked && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-yellow-600 px-1.5 py-0.5 text-xs">
                      <LockClosedIcon className="h-3 w-3" /> Locked
                    </span>
                  )}
                  {post.isNsfw && (
                    <span className="inline-block rounded bg-red-600 px-1.5 py-0.5 text-xs">
                      NSFW
                    </span>
                  )}
                  {post.category && (
                    <span
                      className="inline-block rounded px-1.5 py-0.5 text-xs"
                      style={{ backgroundColor: post.category.color }}
                    >
                      {post.category.name}
                    </span>
                  )}
                  {post.prefix && <ThreadPrefix prefix={post.prefix} size="sm" />}
                </div>
                <h2 className="text-lg font-medium text-white transition-colors hover:text-primary-400">
                  {post.title}
                </h2>
              </div>
            </Link>

            {/* Preview content */}
            {post.postType === 'text' && post.content && (
              <p className="mb-3 line-clamp-3 text-sm text-gray-400">{post.content}</p>
            )}

            {post.postType === 'link' && post.linkUrl && (
              <a
                href={post.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-3 block truncate text-sm text-primary-400 hover:underline"
              >
                {post.linkUrl}
              </a>
            )}

            {post.postType === 'image' && post.mediaUrls?.[0] && (
              <div className="mb-3 max-h-96 overflow-hidden rounded-lg">
                <img src={post.mediaUrls[0]} alt="" className="h-auto max-w-full object-contain" />
              </div>
            )}

            {/* Thread Rating */}
            {(post.rating !== undefined || post.ratingCount !== undefined) && (
              <div className="mb-3">
                <ThreadRating
                  threadId={post.id}
                  rating={post.rating}
                  ratingCount={post.ratingCount}
                  myRating={post.myRating}
                  size="sm"
                  interactive={false}
                />
              </div>
            )}

            {/* Actions - Enhanced */}
            <div className="flex items-center gap-4 text-gray-400">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to={`/forums/${post.forum.slug}/post/${post.id}`}
                  onClick={() => HapticFeedback.light()}
                  className="flex items-center gap-1.5 rounded px-2 py-1 text-sm transition-all hover:bg-dark-700/80 hover:text-primary-400"
                  style={{
                    boxShadow: '0 0 0 rgba(16, 185, 129, 0)',
                    transition: 'box-shadow 0.3s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 0 rgba(16, 185, 129, 0)';
                  }}
                >
                  <ChatBubbleLeftIcon className="h-4 w-4" />
                  <span>{post.commentCount} Comments</span>
                </Link>
              </motion.div>

              <motion.button
                onClick={() => HapticFeedback.light()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 rounded px-2 py-1 text-sm transition-all hover:bg-dark-700/80 hover:text-purple-400"
              >
                <ShareIcon className="h-4 w-4" />
                <span>Share</span>
              </motion.button>

              <motion.button
                onClick={() => HapticFeedback.light()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 rounded px-2 py-1 text-sm transition-all hover:bg-dark-700/80 hover:text-yellow-400"
              >
                <BookmarkIcon className="h-4 w-4" />
                <span>Save</span>
              </motion.button>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
