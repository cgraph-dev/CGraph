import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import {
  TrophyIcon,
  SparklesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import {
  TrophyIcon as TrophyIconSolid,
  CheckBadgeIcon,
} from '@heroicons/react/24/solid';
import { ErrorState, EmptyState } from '@/components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';

interface LeaderboardUser {
  rank: number;
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
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
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-500/30">
        <TrophyIconSolid className="h-5 w-5 text-white" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 shadow-lg shadow-gray-400/30">
        <span className="text-lg font-bold text-white">2</span>
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/30">
        <span className="text-lg font-bold text-white">3</span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-dark-600">
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
          className="relative overflow-hidden group"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none"
            transition={{ duration: 0.3 }}
          />
          <div className="flex items-center gap-4 p-4 relative z-10">
            {/* Rank Badge */}
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              {getRankBadge(user.rank)}
            </motion.div>

            {/* Avatar */}
            <Link to={`/u/${user.username}`} className="shrink-0" onClick={() => HapticFeedback.light()}>
              <motion.div whileHover={{ scale: 1.1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                {user.avatarUrl ? (
                  <div className={`p-0.5 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full ${isTopThree ? 'ring-2 ring-primary-500/50' : ''}`}>
                    <img
                      src={user.avatarUrl}
                      alt={user.displayName || user.username}
                      className={`rounded-full object-cover ${
                        isTopThree ? 'w-14 h-14' : 'w-12 h-12'
                      }`}
                    />
                  </div>
                ) : (
                  <div className={`flex items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white font-semibold ${
                    isTopThree ? 'w-14 h-14 text-xl' : 'w-12 h-12 text-lg'
                  }`}>
                    {(user.displayName || user.username || '?').charAt(0).toUpperCase()}
                  </div>
                )}
              </motion.div>
            </Link>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Link
                  to={`/u/${user.username}`}
                  className={`font-semibold truncate ${
                    isTopThree
                      ? 'text-lg bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-transparent'
                      : 'text-gray-200 hover:text-primary-400 transition-colors'
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
                    <CheckBadgeIcon className="h-5 w-5 text-primary-400 shrink-0" />
                  </motion.div>
                )}
              </div>
              <p className="text-sm text-gray-400 truncate">@{user.username}</p>
            </div>

            {/* Karma */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-600/50 backdrop-blur-sm">
              <SparklesIcon className={`h-5 w-5 ${
                isTopThree ? 'text-yellow-400' : 'text-primary-400'
              }`} />
              <span className={`font-bold ${
                isTopThree ? 'text-xl text-yellow-400' : 'text-lg text-white'
              }`}>
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
          className="animate-pulse bg-dark-700 rounded-xl h-20 flex items-center gap-4 p-4"
        >
          <div className="w-10 h-10 rounded-full bg-dark-600" />
          <div className="w-12 h-12 rounded-full bg-dark-600" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-dark-600 rounded w-32" />
            <div className="h-3 bg-dark-600 rounded w-20" />
          </div>
          <div className="h-8 bg-dark-600 rounded w-24" />
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
          params: { page, limit: 25 }
        });
        
        const data = response.data?.data || [];
        const metaData = response.data?.meta || {};
        
        setUsers(data.map((u: any) => ({
          rank: u.rank,
          id: u.id,
          username: u.username,
          displayName: u.display_name,
          avatarUrl: u.avatar_url,
          karma: u.karma,
          isVerified: u.is_verified,
        })));
        
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
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 relative">
      {/* Ambient particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-0.5 h-0.5 rounded-full bg-primary-400 pointer-events-none z-0"
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
      <div className="sticky top-0 z-10 bg-dark-900/50 backdrop-blur-xl border-b border-primary-500/20 px-4 py-4">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-transparent to-purple-500/5 pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-3xl mx-auto flex items-center gap-4 relative z-10"
        >
          <motion.div
            className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            <TrophyIconSolid className="h-8 w-8 text-yellow-500" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-transparent">
              Top Contributors
            </h1>
            <p className="text-gray-400">Users ranked by karma earned from community engagement</p>
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto p-4 space-y-4 relative z-10">
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
              <div className="grid grid-cols-3 gap-4 mb-6">
                {/* Second Place */}
                <div className="order-1 flex flex-col items-center p-4 pt-8">
                  <Link to={`/u/${users[1]?.username}`} className="group">
                    <div className="relative">
                      {users[1]?.avatarUrl ? (
                        <img 
                          src={users[1].avatarUrl} 
                          className="w-16 h-16 rounded-full ring-2 ring-gray-400 group-hover:ring-4 transition-all"
                          alt={users[1].username}
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-500 flex items-center justify-center text-2xl font-bold text-white ring-2 ring-gray-400">
                          {(users[1]?.displayName || users[1]?.username || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                        2
                      </div>
                    </div>
                    <p className="mt-3 text-center text-sm font-medium text-gray-300 group-hover:text-white truncate max-w-20">
                      {users[1]?.displayName || users[1]?.username || 'Unknown'}
                    </p>
                    <p className="text-center text-xs text-gray-500">{formatKarma(users[1]?.karma || 0)}</p>
                  </Link>
                </div>

                {/* First Place */}
                <div className="order-2 flex flex-col items-center p-4">
                  <Link to={`/u/${users[0]?.username}`} className="group">
                    <div className="relative">
                      {users[0]?.avatarUrl ? (
                        <img 
                          src={users[0].avatarUrl} 
                          className="w-20 h-20 rounded-full ring-4 ring-yellow-500 group-hover:ring-6 transition-all shadow-lg shadow-yellow-500/30"
                          alt={users[0].username}
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-3xl font-bold text-white ring-4 ring-yellow-500 shadow-lg shadow-yellow-500/30">
                          {(users[0]?.displayName || users[0]?.username || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center shadow-lg">
                        <TrophyIconSolid className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <p className="mt-3 text-center font-semibold text-white group-hover:text-yellow-400 truncate max-w-24">
                      {users[0]?.displayName || users[0]?.username || 'Unknown'}
                    </p>
                    <p className="text-center text-sm text-yellow-400 font-medium">{formatKarma(users[0]?.karma || 0)}</p>
                  </Link>
                </div>

                {/* Third Place */}
                <div className="order-3 flex flex-col items-center p-4 pt-10">
                  <Link to={`/u/${users[2]?.username}`} className="group">
                    <div className="relative">
                      {users[2]?.avatarUrl ? (
                        <img 
                          src={users[2].avatarUrl} 
                          className="w-14 h-14 rounded-full ring-2 ring-orange-500 group-hover:ring-4 transition-all"
                          alt={users[2].username}
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center text-xl font-bold text-white ring-2 ring-orange-500">
                          {(users[2]?.displayName || users[2]?.username || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                        3
                      </div>
                    </div>
                    <p className="mt-3 text-center text-sm font-medium text-gray-300 group-hover:text-white truncate max-w-16">
                      {users[2]?.displayName || users[2]?.username || 'Unknown'}
                    </p>
                    <p className="text-center text-xs text-gray-500">{formatKarma(users[2]?.karma || 0)}</p>
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
                      setPage(p => Math.max(1, p - 1));
                      HapticFeedback.light();
                    }}
                    disabled={page === 1}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-4 py-2 bg-dark-700/50 hover:bg-dark-600/50 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors backdrop-blur-sm border border-primary-500/20"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                    Previous
                  </motion.button>

                  <span className="text-gray-400">
                    Page {page} of {meta.totalPages}
                  </span>

                  <motion.button
                    onClick={() => {
                      setPage(p => Math.min(meta.totalPages, p + 1));
                      HapticFeedback.light();
                    }}
                    disabled={page === meta.totalPages}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-4 py-2 bg-dark-700/50 hover:bg-dark-600/50 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors backdrop-blur-sm border border-primary-500/20"
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
