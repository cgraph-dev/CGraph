/**
 * Admin Dashboard Hook
 *
 * Hook for admin dashboard state and navigation.
 *
 * @module modules/admin/hooks/useAdminDashboard
 */

import { useCallback, useEffect } from 'react';
import { useAdminStore } from '../store';
import type { AdminTab } from '../store';

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
