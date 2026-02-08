/**
 * Admin Users Hook
 *
 * Hook for admin user management.
 *
 * @module modules/admin/hooks/useAdminUsers
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useAdminStore } from '../store';
import type { AdminUser } from '../store';

/**
 * Hook for admin user management
 */
export function useAdminUsers() {
  const {
    users,
    userFilters,
    selectedUserIds,
    isLoading,
    error,
    fetchUsers,
    setUserFilters,
    selectUser,
    deselectUser,
    selectAllUsers,
    clearUserSelection,
    banUser,
    suspendUser,
    warnUser,
    unbanUser,
    changeUserRole,
    batchAction,
  } = useAdminStore();

  // Fetch users on mount
  useEffect(() => {
    if (users.length === 0) {
      fetchUsers();
    }
  }, [users.length, fetchUsers]);

  // Filter users based on current filters
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (userFilters.status !== 'all' && user.status !== userFilters.status) {
        return false;
      }
      if (userFilters.role !== 'all' && user.role !== userFilters.role) {
        return false;
      }
      return true;
    });
  }, [users, userFilters]);

  // User stats
  const userStats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((u) => u.status === 'active').length,
      suspended: users.filter((u) => u.status === 'suspended').length,
      banned: users.filter((u) => u.status === 'banned').length,
      moderators: users.filter((u) => u.role === 'moderator').length,
      admins: users.filter((u) => u.role === 'admin' || u.role === 'super_admin').length,
    }),
    [users]
  );

  // Selection helpers
  const selectedUsers = useMemo(() => {
    return users.filter((user) => selectedUserIds.includes(user.id));
  }, [users, selectedUserIds]);

  const isAllSelected = useMemo(() => {
    return users.length > 0 && selectedUserIds.length === users.length;
  }, [users, selectedUserIds]);

  const toggleUserSelection = useCallback(
    (id: string) => {
      if (selectedUserIds.includes(id)) {
        deselectUser(id);
      } else {
        selectUser(id);
      }
    },
    [selectedUserIds, selectUser, deselectUser]
  );

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      clearUserSelection();
    } else {
      selectAllUsers();
    }
  }, [isAllSelected, selectAllUsers, clearUserSelection]);

  // User actions
  const ban = useCallback(
    async (id: string, reason: string, duration?: number) => {
      await banUser(id, reason, duration);
    },
    [banUser]
  );

  const suspend = useCallback(
    async (id: string, reason: string, duration: number) => {
      await suspendUser(id, reason, duration);
    },
    [suspendUser]
  );

  const warn = useCallback(
    async (id: string, reason: string) => {
      await warnUser(id, reason);
    },
    [warnUser]
  );

  const unban = useCallback(
    async (id: string) => {
      await unbanUser(id);
    },
    [unbanUser]
  );

  const changeRole = useCallback(
    async (id: string, role: AdminUser['role']) => {
      await changeUserRole(id, role);
    },
    [changeUserRole]
  );

  // Batch actions
  const batchBan = useCallback(
    async (reason: string) => {
      await batchAction('ban', selectedUserIds, { reason });
    },
    [batchAction, selectedUserIds]
  );

  const batchSuspend = useCallback(
    async (reason: string, duration: number) => {
      await batchAction('suspend', selectedUserIds, { reason, duration });
    },
    [batchAction, selectedUserIds]
  );

  const batchWarn = useCallback(
    async (reason: string) => {
      await batchAction('warn', selectedUserIds, { reason });
    },
    [batchAction, selectedUserIds]
  );

  return {
    users: filteredUsers,
    allUsers: users,
    filters: userFilters,
    stats: userStats,
    selectedIds: selectedUserIds,
    selectedUsers,
    isAllSelected,
    isLoading,
    error,
    refresh: fetchUsers,
    setFilters: setUserFilters,
    toggleSelection: toggleUserSelection,
    toggleSelectAll,
    clearSelection: clearUserSelection,
    ban,
    suspend,
    warn,
    unban,
    changeRole,
    batchBan,
    batchSuspend,
    batchWarn,
  };
}
