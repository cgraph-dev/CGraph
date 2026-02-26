/**
 * Hook for fetching online data
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { ensureArray } from '@/lib/apiUtils';
import { createLogger } from '@/lib/logger';
import { useAdaptiveInterval } from '@/hooks/useAdaptiveInterval';
import type { OnlineUser, OnlineStats, ActivityBreakdown } from './types';

const logger = createLogger('WhosOnline');

/**
 * unknown for the members module.
 */
/**
 * Hook for managing online data.
 *
 * @param autoRefresh - The auto refresh.
 */
export function useOnlineData(autoRefresh: boolean) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [stats, setStats] = useState<OnlineStats | null>(null);
  const [activityBreakdown, setActivityBreakdown] = useState<ActivityBreakdown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchOnlineData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/v1/presence/online');
      const data = response.data;

      // Online users
      const users = ensureArray<Record<string, unknown>>(data, 'users');
      setOnlineUsers(
        users.map((u) => ({
          id: u.id as string, // safe downcast – structural boundary
          username: (u.username as string) || 'Guest', // safe downcast – structural boundary
          displayName: (u.display_name as string) || null, // safe downcast – structural boundary
          avatarUrl: (u.avatar_url as string) || null, // safe downcast – structural boundary
          avatarBorderId: (u.avatar_border_id as string) || (u.avatarBorderId as string) || null, // safe downcast – structural boundary
          userGroup: (u.user_group as string) || 'Member', // safe downcast – structural boundary
          userGroupColor: (u.user_group_color as string) || null, // safe downcast – structural boundary
          currentLocation: (u.current_location as string) || 'Unknown', // safe downcast – structural boundary
          currentLocationUrl: (u.current_location_url as string) || null, // safe downcast – structural boundary
          device: (u.device as OnlineUser['device']) || 'unknown', // safe downcast – structural boundary
          ipHash: u.ip_hash as string | undefined, // safe downcast – structural boundary
          lastActivity: (u.last_activity as string) || new Date().toISOString(), // safe downcast – structural boundary
          invisible: (u.invisible as boolean) || false, // safe downcast – structural boundary
        }))
      );

      // Stats
      setStats({
        totalOnline: data.stats?.total_online || 0,
        members: data.stats?.members || 0,
        guests: data.stats?.guests || 0,
        bots: data.stats?.bots || 0,
        invisible: data.stats?.invisible || 0,
        recordOnline: data.stats?.record_online || 0,
        recordDate: data.stats?.record_date || new Date().toISOString(),
      });

      // Activity breakdown
      const breakdown = ensureArray<Record<string, unknown>>(data, 'activity_breakdown');
      setActivityBreakdown(
        breakdown.map((b) => ({
          location: (b.location as string) || 'Unknown', // safe downcast – structural boundary
          count: (b.count as number) || 0, // safe downcast – structural boundary
          percentage: (b.percentage as number) || 0, // safe downcast – structural boundary
        }))
      );

      setLastUpdated(new Date());
    } catch (err) {
      logger.error('[WhosOnline] Failed to fetch data:', err);
      setError('Failed to load online users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchOnlineData();
  }, [fetchOnlineData]);

  // Auto-refresh: 30s when active, 120s when tab hidden
  useAdaptiveInterval(fetchOnlineData, 30000, { enabled: autoRefresh });

  return {
    onlineUsers,
    stats,
    activityBreakdown,
    isLoading,
    error,
    lastUpdated,
    refetch: fetchOnlineData,
  };
}
