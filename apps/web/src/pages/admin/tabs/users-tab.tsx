/**
 * Admin users management tab.
 * @module
 */
import { motion } from 'motion/react';
import { LoadingState } from '@/modules/admin/components';
import { useUsersTab } from '@/pages/admin/tabs/users/useUsersTab';
import { UserSearchBar } from '@/pages/admin/tabs/users/user-search-bar';
import { UserRow } from '@/pages/admin/tabs/users/user-row';
import { UsersPagination } from '@/pages/admin/tabs/users/users-pagination';
import type { AdminUser } from '@/types/admin.types';

// ============================================================================
// Users Tab - User management with search, ban/unban functionality
// ============================================================================

/**
 * unknown for the admin module.
 */
/**
 * Users Tab component.
 */
export function UsersTab() {
  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    usersData,
    isLoading,
    banMutation,
    unbanMutation,
    perPage,
  } = useUsersTab();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <UserSearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />

      {/* Users Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04]">
        {isLoading ? (
          <LoadingState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-white/[0.06]">
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

        {usersData && (
          <UsersPagination
            page={page}
            perPage={perPage}
            totalCount={usersData.totalCount}
            onPageChange={setPage}
          />
        )}
      </div>
    </motion.div>
  );
}
