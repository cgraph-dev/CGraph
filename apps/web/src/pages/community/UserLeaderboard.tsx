import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import {
  TrophyIcon,
  SparklesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { TrophyIcon as TrophyIconSolid, CheckBadgeIcon } from '@heroicons/react/24/solid';
import { ErrorState, EmptyState } from '@/components/ui';
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';

interface LeaderboardUser {
  rank: number;
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  avatarBorderId?: string | null;
  karma: number;
  isVerified: boolean;
}

interface LeaderboardMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

function getRankBadge(rank: number) {
  if (rank === 1) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-500/30">
        <TrophyIconSolid className="h-5 w-5 text-white" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gray-300 to-gray-500 shadow-lg shadow-gray-400/30">
        <span className="text-lg font-bold text-white">2</span>
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/30">
        <span className="text-lg font-bold text-white">3</span>
      </div>
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-dark-600">
      <span className="text-lg font-semibold text-gray-400">#{rank}</span>
    </div>
  );
}

function formatKarma(karma: number): string {
  if (karma >= 1000000) {
    return `${(karma / 1000000).toFixed(1)}M`;
  }
  if (karma >= 1000) {
    return `${(karma / 1000).toFixed(1)}K`;
  }
  return karma.toString();
}

function UserLeaderboardCard({ user, index }: { user: LeaderboardUser; index: number }) {
  const isTopThree = user.rank <= 3;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay: index * 0.03,
      }}
    >
      <motion.div whileHover={{ scale: 1.02, x: 4 }} whileTap={{ scale: 0.98 }}>
        <GlassCard
          variant={isTopThree ? 'holographic' : 'default'}
          glow={isTopThree}
          glowColor={isTopThree ? 'rgba(16, 185, 129, 0.3)' : undefined}
          className="group relative overflow-hidden"
        >
          <motion.div
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary-500/10 via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100"
            transition={{ duration: 0.3 }}
          />
          <div className="relative z-10 flex items-center gap-4 p-4">
            {/* Rank Badge */}
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              {getRankBadge(user.rank)}
            </motion.div>

            {/* Avatar */}
            <Link
              to={`/u/${user.username}`}
              className="shrink-0"
              onClick={() => HapticFeedback.light()}
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                {user.avatarUrl ? (
                  <div
                    className={`rounded-full bg-gradient-to-br from-primary-500 to-purple-600 p-0.5 ${
                      isTopThree ? 'ring-2 ring-primary-500/50' : ''
                    }`}
                  >
                    <ThemedAvatar
                      src={user.avatarUrl}
                      alt={user.displayName || user.username || 'User'}
                      size={isTopThree ? 'large' : 'medium'}
                      avatarBorderId={user.avatarBorderId}
                    />
                  </div>
                ) : (
                  <div
                    className={`flex items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 font-semibold text-white ${
                      isTopThree ? 'h-14 w-14 text-xl' : 'h-12 w-12 text-lg'
                    }`}
                  >
                    {(user.displayName || user.username || '?').charAt(0).toUpperCase()}
                  </div>
                )}
              </motion.div>
            </Link>

            {/* User Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Link
                  to={`/u/${user.username}`}
                  className={`truncate font-semibold ${
                    isTopThree
                      ? 'bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-lg text-transparent'
                      : 'text-gray-200 transition-colors hover:text-primary-400'
                  }`}
                  onClick={() => HapticFeedback.light()}
                >
                  {user.displayName || user.username || 'Unknown'}
                </Link>
                {user.isVerified && (
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 360 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  >
                    <CheckBadgeIcon className="h-5 w-5 shrink-0 text-primary-400" />
                  </motion.div>
                )}
              </div>
              <p className="truncate text-sm text-gray-400">@{user.username}</p>
            </div>

            {/* Karma */}
            <div className="flex items-center gap-2 rounded-lg bg-dark-600/50 px-4 py-2 backdrop-blur-sm">
              <SparklesIcon
                className={`h-5 w-5 ${isTopThree ? 'text-yellow-400' : 'text-primary-400'}`}
              />
              <span
                className={`font-bold ${
                  isTopThree ? 'text-xl text-yellow-400' : 'text-lg text-white'
                }`}
              >
                {formatKarma(user.karma)}
              </span>
              <span className="text-sm text-gray-400">karma</span>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="flex h-20 animate-pulse items-center gap-4 rounded-xl bg-dark-700 p-4"
        >
          <div className="h-10 w-10 rounded-full bg-dark-600" />
          <div className="h-12 w-12 rounded-full bg-dark-600" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 rounded bg-dark-600" />
            <div className="h-3 w-20 rounded bg-dark-600" />
          </div>
          <div className="h-8 w-24 rounded bg-dark-600" />
        </div>
      ))}
    </div>
  );
}

export default function UserLeaderboard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [meta, setMeta] = useState<LeaderboardMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.get('/api/v1/users/leaderboard', {
          params: { page, limit: 25 },
        });

        const data = response.data?.data || [];
        const metaData = response.data?.meta || {};

        setUsers(
          data.map((u: any) => ({
            rank: u.rank,
            id: u.id,
            username: u.username,
            displayName: u.display_name,
            avatarUrl: u.avatar_url,
            avatarBorderId: u.avatar_border_id ?? u.avatarBorderId ?? null,
            karma: u.karma,
            isVerified: u.is_verified,
          }))
        );

        setMeta({
          page: metaData.page || page,
          perPage: metaData.per_page || 25,
          total: metaData.total || data.length,
          totalPages: metaData.total_pages || 1,
        });
      } catch (err: unknown) {
        console.error('Failed to fetch leaderboard:', err);
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [page]);

  return (
    <div className="relative flex-1 overflow-y-auto bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      {/* Ambient particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute z-0 h-0.5 w-0.5 rounded-full bg-primary-400"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.1, 0.4, 0.1],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 5 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-primary-500/20 bg-dark-900/50 px-4 py-4 backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary-500/5 via-transparent to-purple-500/5" />
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 mx-auto flex max-w-3xl items-center gap-4"
        >
          <motion.div
            className="rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 p-3"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            <TrophyIconSolid className="h-8 w-8 text-yellow-500" />
          </motion.div>
          <div>
            <h1 className="bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-2xl font-bold text-transparent">
              Top Contributors
            </h1>
            <p className="text-gray-400">Users ranked by karma earned from community engagement</p>
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-3xl space-y-4 p-4">
        <AnimatePresence mode="wait">
          {error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <ErrorState
                title="Failed to load leaderboard"
                message={error}
                onRetry={() => setPage(1)}
              />
            </motion.div>
          ) : isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LoadingSkeleton />
            </motion.div>
          ) : users.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <EmptyState
                icon={<TrophyIcon className="h-8 w-8 text-gray-500" />}
                title="No users on the leaderboard yet"
                message="Be the first to earn karma by creating posts and comments!"
              />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Top 3 Spotlight */}
              {page === 1 && users.length >= 3 && (
                <div className="mb-6 grid grid-cols-3 gap-4">
                  {/* Second Place */}
                  <div className="order-1 flex flex-col items-center p-4 pt-8">
                    <Link to={`/u/${users[1]?.username}`} className="group">
                      <div className="relative">
                        {users[1]?.avatarUrl ? (
                          <ThemedAvatar
                            src={users[1].avatarUrl}
                            alt={users[1].displayName || users[1].username || 'User'}
                            size="medium"
                            className="h-16 w-16 ring-2 ring-gray-400 transition-all group-hover:ring-4"
                            avatarBorderId={users[1].avatarBorderId}
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-500 text-2xl font-bold text-white ring-2 ring-gray-400">
                            {(users[1]?.displayName || users[1]?.username || '?')
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                        <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-gray-400 text-sm font-bold text-white shadow-lg">
                          2
                        </div>
                      </div>
                      <p className="mt-3 max-w-20 truncate text-center text-sm font-medium text-gray-300 group-hover:text-white">
                        {users[1]?.displayName || users[1]?.username || 'Unknown'}
                      </p>
                      <p className="text-center text-xs text-gray-500">
                        {formatKarma(users[1]?.karma || 0)}
                      </p>
                    </Link>
                  </div>

                  {/* First Place */}
                  <div className="order-2 flex flex-col items-center p-4">
                    <Link to={`/u/${users[0]?.username}`} className="group">
                      <div className="relative">
                        {users[0]?.avatarUrl ? (
                          <ThemedAvatar
                            src={users[0].avatarUrl}
                            alt={users[0].displayName || users[0].username || 'User'}
                            size="large"
                            className="group-hover:ring-6 h-20 w-20 shadow-lg shadow-yellow-500/30 ring-4 ring-yellow-500 transition-all"
                            avatarBorderId={users[0].avatarBorderId}
                          />
                        ) : (
                          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 text-3xl font-bold text-white shadow-lg shadow-yellow-500/30 ring-4 ring-yellow-500">
                            {(users[0]?.displayName || users[0]?.username || '?')
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                        <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500 shadow-lg">
                          <TrophyIconSolid className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <p className="mt-3 max-w-24 truncate text-center font-semibold text-white group-hover:text-yellow-400">
                        {users[0]?.displayName || users[0]?.username || 'Unknown'}
                      </p>
                      <p className="text-center text-sm font-medium text-yellow-400">
                        {formatKarma(users[0]?.karma || 0)}
                      </p>
                    </Link>
                  </div>

                  {/* Third Place */}
                  <div className="order-3 flex flex-col items-center p-4 pt-10">
                    <Link to={`/u/${users[2]?.username}`} className="group">
                      <div className="relative">
                        {users[2]?.avatarUrl ? (
                          <ThemedAvatar
                            src={users[2].avatarUrl}
                            alt={users[2].displayName || users[2].username || 'User'}
                            size="small"
                            className="h-14 w-14 ring-2 ring-orange-500 transition-all group-hover:ring-4"
                            avatarBorderId={users[2].avatarBorderId}
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-xl font-bold text-white ring-2 ring-orange-500">
                            {(users[2]?.displayName || users[2]?.username || '?')
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                        <div className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white shadow-lg">
                          3
                        </div>
                      </div>
                      <p className="mt-3 max-w-16 truncate text-center text-sm font-medium text-gray-300 group-hover:text-white">
                        {users[2]?.displayName || users[2]?.username || 'Unknown'}
                      </p>
                      <p className="text-center text-xs text-gray-500">
                        {formatKarma(users[2]?.karma || 0)}
                      </p>
                    </Link>
                  </div>
                </div>
              )}

              {/* Full List */}
              <div className="space-y-3">
                {users.map((user, index) => (
                  <UserLeaderboardCard key={user.id} user={user} index={index} />
                ))}
              </div>

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center justify-center gap-4 pt-4"
                >
                  <motion.button
                    onClick={() => {
                      setPage((p) => Math.max(1, p - 1));
                      HapticFeedback.light();
                    }}
                    disabled={page === 1}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 rounded-lg border border-primary-500/20 bg-dark-700/50 px-4 py-2 text-white backdrop-blur-sm transition-colors hover:bg-dark-600/50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                    Previous
                  </motion.button>

                  <span className="text-gray-400">
                    Page {page} of {meta.totalPages}
                  </span>

                  <motion.button
                    onClick={() => {
                      setPage((p) => Math.min(meta.totalPages, p + 1));
                      HapticFeedback.light();
                    }}
                    disabled={page === meta.totalPages}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 rounded-lg border border-primary-500/20 bg-dark-700/50 px-4 py-2 text-white backdrop-blur-sm transition-colors hover:bg-dark-600/50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                    <ChevronRightIcon className="h-5 w-5" />
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
