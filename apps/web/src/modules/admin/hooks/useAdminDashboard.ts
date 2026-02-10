/**
 * Admin Dashboard Hook
 *
 * Hook for admin dashboard state and navigation.
 *
 * @module modules/admin/hooks/useAdminDashboard
 */

import { useCallback, useEffect } from 'react';
import { useAdminStore } from '../store';
import { useAdaptiveInterval } from '@/hooks/useAdaptiveInterval';
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

  // Auto-refresh stats: 5 min when active, 20 min when tab hidden
  useAdaptiveInterval(refreshStats, 5 * 60 * 1000);

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
