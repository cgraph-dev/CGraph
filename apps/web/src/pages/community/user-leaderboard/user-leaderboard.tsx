/**
 * UserLeaderboard Page Component
 *
 * Main leaderboard page with top users by karma.
 */

import { useEffect, useState } from 'react';
import { TrophyIcon } from '@heroicons/react/24/outline';
import { api } from '@/lib/api';
import { Top3Spotlight } from './top3-spotlight';
import { UserLeaderboardCard } from './user-leaderboard-card';
import { LoadingSkeleton } from './loading-skeleton';
import { Pagination } from './pagination';
import { transformApiUser } from './utils';
import type { LeaderboardUser, LeaderboardMeta, LeaderboardApiUser } from './types';

/**
 * User Leaderboard component.
 */
export default function UserLeaderboard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [meta, setMeta] = useState<LeaderboardMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get<{
          data: LeaderboardApiUser[];
          meta: LeaderboardMeta;
        }>(`/leaderboard/users?page=${currentPage}&limit=50`);

        const transformedUsers = response.data.data.map((user: LeaderboardApiUser, index: number) =>
          transformApiUser(user, index, currentPage)
        );

        setUsers(transformedUsers);
        setMeta(response.data.meta);
      } catch {
        setError('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen bg-dark-900 pb-12">
      {/* Ambient background particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse rounded-full bg-purple-500/10"
            style={{
              width: `${Math.random() * 100 + 50}px`,
              height: `${Math.random() * 100 + 50}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${Math.random() * 3 + 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-4xl px-4 pt-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <TrophyIcon className="h-10 w-10 text-yellow-500" />
            <h1 className="text-3xl font-bold text-white">Top Users</h1>
          </div>
          <p className="text-gray-400">The most engaged members of our community</p>
          {meta && (
            <p className="mt-2 text-sm text-gray-500">{meta.total.toLocaleString()} total users</p>
          )}
        </div>

        {/* Loading State */}
        {loading && <LoadingSkeleton />}

        {/* Error State */}
        {error && (
          <div className="rounded-lg bg-red-500/10 p-6 text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => setCurrentPage(1)}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && users.length === 0 && (
          <div className="rounded-lg bg-dark-800 p-12 text-center">
            <TrophyIcon className="mx-auto h-16 w-16 text-gray-600" />
            <h2 className="mt-4 text-xl font-semibold text-gray-300">No users yet</h2>
            <p className="mt-2 text-gray-500">Be the first to join the leaderboard!</p>
          </div>
        )}

        {/* Leaderboard Content */}
        {!loading && !error && users.length > 0 && (
          <>
            {/* Top 3 Spotlight */}
            {currentPage === 1 && <Top3Spotlight users={users.slice(0, 3)} />}

            {/* Full List */}
            <div className="space-y-2">
              {users.map((user, idx) => (
                <UserLeaderboardCard key={user.id} user={user} index={idx} />
              ))}
            </div>

            {/* Pagination */}
            {meta && (
              <Pagination
                currentPage={currentPage}
                totalPages={meta.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
