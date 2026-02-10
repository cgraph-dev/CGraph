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
      const users = ensureArray(data, 'users') as Record<string, unknown>[];
      setOnlineUsers(
        users.map((u) => ({
          id: u.id as string,
          username: (u.username as string) || 'Guest',
          displayName: (u.display_name as string) || null,
          avatarUrl: (u.avatar_url as string) || null,
          avatarBorderId: (u.avatar_border_id as string) || (u.avatarBorderId as string) || null,
          userGroup: (u.user_group as string) || 'Member',
          userGroupColor: (u.user_group_color as string) || null,
          currentLocation: (u.current_location as string) || 'Unknown',
          currentLocationUrl: (u.current_location_url as string) || null,
          device: (u.device as OnlineUser['device']) || 'unknown',
          ipHash: u.ip_hash as string | undefined,
          lastActivity: (u.last_activity as string) || new Date().toISOString(),
          invisible: (u.invisible as boolean) || false,
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
      const breakdown = ensureArray(data, 'activity_breakdown') as Record<string, unknown>[];
      setActivityBreakdown(
        breakdown.map((b) => ({
          location: (b.location as string) || 'Unknown',
          count: (b.count as number) || 0,
          percentage: (b.percentage as number) || 0,
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
