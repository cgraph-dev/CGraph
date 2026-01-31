import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { adminApi } from '@/lib/api/admin';
import { format } from 'date-fns';
import { formatTimeAgo } from '@/lib/utils';
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';
import type { AdminUser } from '@/types/admin.types';
import { StatusBadge, LoadingState } from '@/components/admin';

// ============================================================================
// Users Tab - User management with search, ban/unban functionality
// ============================================================================

export function UsersTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin', 'users', { search: searchTerm, status: statusFilter, page }],
    queryFn: () =>
      adminApi.listUsers({ search: searchTerm, status: statusFilter, page, perPage: 20 }),
  });

  const banMutation = useMutation({
    mutationFn: ({
      userId,
      reason,
      duration,
    }: {
      userId: string;
      reason: string;
      duration?: number;
    }) => adminApi.banUser(userId, reason, duration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  const unbanMutation = useMutation({
    mutationFn: (userId: string) => adminApi.unbanUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Search and Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {isLoading ? (
          <LoadingState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Last Seen
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {usersData?.users.map((user: AdminUser) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onBan={(reason, duration) =>
                      banMutation.mutate({ userId: user.id, reason, duration })
                    }
                    onUnban={() => unbanMutation.mutate(user.id)}
                    isBanning={banMutation.isPending}
                    isUnbanning={unbanMutation.isPending}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {usersData && (
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, usersData.totalCount)} of{' '}
              {usersData.totalCount} users
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm disabled:opacity-50 dark:bg-gray-700"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 20 >= usersData.totalCount}
                className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm disabled:opacity-50 dark:bg-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// UserRow - Individual user row with ban/unban actions
// ============================================================================

function UserRow({
  user,
  onBan,
  onUnban,
  isBanning,
  isUnbanning,
}: {
  user: AdminUser;
  onBan: (reason: string, duration?: number) => void;
  onUnban: () => void;
  isBanning: boolean;
  isUnbanning: boolean;
}) {
  const [showBanModal, setShowBanModal] = useState(false);

  return (
    <>
      <tr className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50">
        <td className="whitespace-nowrap px-6 py-4">
          <div className="flex items-center space-x-3">
            <ThemedAvatar
              src={
                user.avatarUrl ||
                `https://ui-avatars.com/api/?name=${user.username}&background=random`
              }
              alt={user.username}
              size="small"
              className="h-10 w-10"
              avatarBorderId={user.avatarBorderId ?? user.avatar_border_id ?? null}
            />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {user.displayName || user.username}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                @{user.username} • {user.email}
              </p>
            </div>
          </div>
        </td>
        <td className="whitespace-nowrap px-6 py-4">
          <StatusBadge status={user.status} />
          {user.isPremium && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              Premium
            </span>
          )}
        </td>
        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
          {format(new Date(user.insertedAt), 'MMM d, yyyy')}
        </td>
        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
          {user.lastSeenAt ? formatTimeAgo(user.lastSeenAt) : 'Never'}
        </td>
        <td className="whitespace-nowrap px-6 py-4 text-right">
          {user.status === 'banned' ? (
            <button
              onClick={onUnban}
              disabled={isUnbanning}
              className="rounded-lg bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700 transition-colors hover:bg-green-200 disabled:opacity-50"
            >
              {isUnbanning ? 'Unbanning...' : 'Unban'}
            </button>
          ) : (
            <button
              onClick={() => setShowBanModal(true)}
              disabled={isBanning}
              className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-200 disabled:opacity-50"
            >
              Ban
            </button>
          )}
        </td>
      </tr>

      {showBanModal && (
        <BanUserModal
          user={user}
          onConfirm={(reason, duration) => {
            onBan(reason, duration);
            setShowBanModal(false);
          }}
          onClose={() => setShowBanModal(false)}
        />
      )}
    </>
  );
}

// ============================================================================
// BanUserModal - Modal for banning users with reason and duration
// ============================================================================

function BanUserModal({
  user,
  onConfirm,
  onClose,
}: {
  user: AdminUser;
  onConfirm: (reason: string, duration?: number) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState<string>('permanent');

  const handleConfirm = () => {
    const durationSeconds = duration === 'permanent' ? undefined : parseInt(duration, 10);
    onConfirm(reason, durationSeconds);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800"
      >
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Ban User: @{user.username}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for ban..."
              className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
              rows={3}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
            >
              <option value="permanent">Permanent</option>
              <option value="86400">1 Day</option>
              <option value="604800">1 Week</option>
              <option value="2592000">30 Days</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!reason}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            Ban User
          </button>
        </div>
      </motion.div>
    </div>
  );
}
