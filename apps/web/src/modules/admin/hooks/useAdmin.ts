/**
 * Admin Hooks
 *
 * Custom React hooks for admin functionality.
 * Provides convenient access to admin store state and actions.
 *
 * @module modules/admin/hooks
 * @version 1.0.0
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useAdminStore } from '../store';
import type { AdminTab, ModerationStatus, RiskLevel, EventStatus, AdminUser } from '../store';

/**
 * Hook for admin dashboard state and navigation
 */
export function useAdminDashboard() {
  const {
    activeTab,
    sidebarCollapsed,
    stats,
    statsLastUpdated,
    isLoading,
    error,
    setActiveTab,
    toggleSidebar,
    fetchStats,
    refreshStats,
    setError,
  } = useAdminStore();

  // Fetch stats on mount
  useEffect(() => {
    if (!stats) {
      fetchStats();
    }
  }, [stats, fetchStats]);

  // Auto-refresh stats every 5 minutes
  useEffect(() => {
    const interval = setInterval(refreshStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshStats]);

  const navigateToTab = useCallback(
    (tab: AdminTab) => {
      setActiveTab(tab);
    },
    [setActiveTab]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  return {
    activeTab,
    sidebarCollapsed,
    stats,
    statsLastUpdated,
    isLoading,
    error,
    navigateToTab,
    toggleSidebar,
    refreshStats,
    clearError,
  };
}

/**
 * Hook for moderation queue management
 */
export function useModerationQueue() {
  const {
    moderationQueue,
    moderationFilters,
    isLoading,
    error,
    fetchModerationQueue,
    setModerationFilters,
    reviewModerationItem,
    assignModerationItem,
  } = useAdminStore();

  // Fetch queue on mount
  useEffect(() => {
    if (moderationQueue.length === 0) {
      fetchModerationQueue();
    }
  }, [moderationQueue.length, fetchModerationQueue]);

  // Filter queue based on current filters
  const filteredQueue = useMemo(() => {
    return moderationQueue.filter((item) => {
      if (moderationFilters.status !== 'all' && item.status !== moderationFilters.status) {
        return false;
      }
      if (moderationFilters.riskLevel !== 'all' && item.riskLevel !== moderationFilters.riskLevel) {
        return false;
      }
      if (moderationFilters.type !== 'all' && item.type !== moderationFilters.type) {
        return false;
      }
      return true;
    });
  }, [moderationQueue, moderationFilters]);

  // Queue stats
  const queueStats = useMemo(
    () => ({
      total: moderationQueue.length,
      pending: moderationQueue.filter((i) => i.status === 'pending').length,
      critical: moderationQueue.filter((i) => i.riskLevel === 'critical').length,
      escalated: moderationQueue.filter((i) => i.status === 'escalated').length,
    }),
    [moderationQueue]
  );

  const filterByStatus = useCallback(
    (status: ModerationStatus | 'all') => {
      setModerationFilters({ status });
    },
    [setModerationFilters]
  );

  const filterByRisk = useCallback(
    (riskLevel: RiskLevel | 'all') => {
      setModerationFilters({ riskLevel });
    },
    [setModerationFilters]
  );

  const approveItem = useCallback(
    async (id: string, notes?: string) => {
      await reviewModerationItem(id, 'approve', notes);
    },
    [reviewModerationItem]
  );

  const rejectItem = useCallback(
    async (id: string, notes?: string) => {
      await reviewModerationItem(id, 'reject', notes);
    },
    [reviewModerationItem]
  );

  const escalateItem = useCallback(
    async (id: string, notes?: string) => {
      await reviewModerationItem(id, 'escalate', notes);
    },
    [reviewModerationItem]
  );

  return {
    queue: filteredQueue,
    allItems: moderationQueue,
    filters: moderationFilters,
    stats: queueStats,
    isLoading,
    error,
    refresh: fetchModerationQueue,
    filterByStatus,
    filterByRisk,
    setFilters: setModerationFilters,
    approveItem,
    rejectItem,
    escalateItem,
    assignItem: assignModerationItem,
  };
}

/**
 * Hook for admin event management
 */
export function useAdminEvents() {
  const {
    events,
    eventFilters,
    isLoading,
    error,
    fetchEvents,
    setEventFilters,
    createEvent,
    updateEvent,
    deleteEvent,
    changeEventStatus,
  } = useAdminStore();

  // Fetch events on mount
  useEffect(() => {
    if (events.length === 0) {
      fetchEvents();
    }
  }, [events.length, fetchEvents]);

  // Filter events based on current filters
  const filteredEvents = useMemo(() => {
    if (eventFilters.status === 'all') return events;
    return events.filter((event) => event.status === eventFilters.status);
  }, [events, eventFilters]);

  // Event stats
  const eventStats = useMemo(
    () => ({
      total: events.length,
      active: events.filter((e) => e.status === 'active').length,
      scheduled: events.filter((e) => e.status === 'scheduled').length,
      draft: events.filter((e) => e.status === 'draft').length,
      totalParticipants: events.reduce((sum, e) => sum + e.participants, 0),
    }),
    [events]
  );

  const filterByStatus = useCallback(
    (status: EventStatus | 'all') => {
      setEventFilters({ status });
    },
    [setEventFilters]
  );

  const startEvent = useCallback(
    async (id: string) => {
      await changeEventStatus(id, 'active');
    },
    [changeEventStatus]
  );

  const pauseEvent = useCallback(
    async (id: string) => {
      await changeEventStatus(id, 'paused');
    },
    [changeEventStatus]
  );

  const endEvent = useCallback(
    async (id: string) => {
      await changeEventStatus(id, 'ended');
    },
    [changeEventStatus]
  );

  return {
    events: filteredEvents,
    allEvents: events,
    filters: eventFilters,
    stats: eventStats,
    isLoading,
    error,
    refresh: fetchEvents,
    filterByStatus,
    create: createEvent,
    update: updateEvent,
    remove: deleteEvent,
    start: startEvent,
    pause: pauseEvent,
    end: endEvent,
  };
}

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

/**
 * Hook for system settings management
 */
export function useAdminSettings() {
  const { systemSettings, isLoading, error, fetchSettings, updateSetting } = useAdminStore();

  // Fetch settings on mount
  useEffect(() => {
    if (systemSettings.length === 0) {
      fetchSettings();
    }
  }, [systemSettings.length, fetchSettings]);

  // Group settings by category
  const settingsByCategory = useMemo(() => {
    return systemSettings.reduce(
      (acc, setting) => {
        const category = setting.category ?? 'uncategorized';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(setting);
        return acc;
      },
      {} as Record<string, typeof systemSettings>
    );
  }, [systemSettings]);

  const categories = useMemo(() => Object.keys(settingsByCategory), [settingsByCategory]);

  const getSetting = useCallback(
    (key: string) => {
      return systemSettings.find((s) => s.key === key);
    },
    [systemSettings]
  );

  const update = useCallback(
    async (key: string, value: string | number | boolean) => {
      await updateSetting(key, value);
    },
    [updateSetting]
  );

  return {
    settings: systemSettings,
    settingsByCategory,
    categories,
    isLoading,
    error,
    refresh: fetchSettings,
    getSetting,
    update,
  };
}

/**
 * Hook for keyboard shortcuts in admin panel
 */
export function useAdminKeyboardShortcuts() {
  const { setActiveTab, toggleSidebar } = useAdminStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger with Cmd/Ctrl
      if (!(e.metaKey || e.ctrlKey)) return;

      switch (e.key) {
        case '1':
          e.preventDefault();
          setActiveTab('dashboard');
          break;
        case '2':
          e.preventDefault();
          setActiveTab('events');
          break;
        case '3':
          e.preventDefault();
          setActiveTab('marketplace');
          break;
        case '4':
          e.preventDefault();
          setActiveTab('users');
          break;
        case '5':
          e.preventDefault();
          setActiveTab('analytics');
          break;
        case '6':
          e.preventDefault();
          setActiveTab('settings');
          break;
        case 'b':
          e.preventDefault();
          toggleSidebar();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab, toggleSidebar]);
}
