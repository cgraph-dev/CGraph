/**
 * useAdminDashboard - Data fetching and state management for admin dashboard
 */

import { useState, useCallback, useEffect } from 'react';
import api from '../../../../lib/api';
import { FALLBACK_AUDIT, FALLBACK_RECENT_USERS, FALLBACK_REPORTS, FALLBACK_STATS } from '../types';
import type { AuditLog, DashboardStats, RecentUser, Report } from '../types';

export interface UseAdminDashboardReturn {
  stats: DashboardStats;
  recentUsers: RecentUser[];
  reports: Report[];
  auditLogs: AuditLog[];
  isLoading: boolean;
  isRefreshing: boolean;
  fetchDashboardData: () => Promise<void>;
  handleRefresh: () => Promise<void>;
  updateReportStatus: (id: string, status: 'resolved' | 'dismissed') => void;
}

/**
 * Hook for admin dashboard.
 *
 */
export function useAdminDashboard(): UseAdminDashboardReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [stats, setStats] = useState<DashboardStats>(FALLBACK_STATS);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>(FALLBACK_RECENT_USERS);
  const [reports, setReports] = useState<Report[]>(FALLBACK_REPORTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(FALLBACK_AUDIT);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);

      const [metricsRes, usersRes, reportsRes, auditRes] = await Promise.allSettled([
        api.get('/api/v1/admin/metrics'),
        api.get('/api/v1/admin/users', {
          params: { per_page: 10, sort: 'created_at', order: 'desc' },
        }),
        api.get('/api/v1/admin/reports'),
        api.get('/api/v1/admin/audit'),
      ]);

      if (metricsRes.status === 'fulfilled') {
        const data = metricsRes.value.data?.data || metricsRes.value.data;
        setStats({
          totalUsers: data.total_users || data.users?.total || 0,
          activeUsers: data.active_users || data.users?.active || 0,
          newUsersToday: data.new_users_today || data.users?.new_today || 0,
          totalPosts: data.total_posts || data.posts?.total || 0,
          postsToday: data.posts_today || data.posts?.today || 0,
          totalThreads: data.total_threads || data.threads?.total || 0,
          pendingReports: data.pending_reports || data.reports?.pending || 0,
          bannedUsers: data.banned_users || data.users?.banned || 0,
        });
      }

      if (usersRes.status === 'fulfilled') {
        const users =
          usersRes.value.data?.data || usersRes.value.data?.users || usersRes.value.data || [];
        setRecentUsers(
          Array.isArray(users)
            ? users.slice(0, 10).map((u: Record<string, unknown>) => ({
                id: String(u.id),
                username: String(u.username),
                email: String(u.email),
                createdAt: String(u.created_at || u.inserted_at),
                status: u.banned ? 'banned' : u.verified ? 'active' : 'pending',
              }))
            : []
        );
      }

      if (reportsRes.status === 'fulfilled') {
        const reportsData =
          reportsRes.value.data?.data ||
          reportsRes.value.data?.reports ||
          reportsRes.value.data ||
          [];
        setReports(
          Array.isArray(reportsData)
            ? reportsData.map((r: Record<string, unknown>) => ({
                id: String(r.id),

                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                type: (r.type || r.report_type || 'post') as 'post' | 'user' | 'thread',
                reason: String(r.reason || ''),
                reportedBy: String(
                  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                  r.reported_by || (r.reporter as { username?: string })?.username || 'Anonymous'
                ),
                targetId: String(r.target_id || r.content_id || ''),
                targetName: String(r.target_name || r.content_preview || 'Unknown'),

                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                status: (r.status || 'pending') as 'pending' | 'resolved' | 'dismissed',
                createdAt: String(r.created_at || r.inserted_at),
              }))
            : []
        );
      }

      if (auditRes.status === 'fulfilled') {
        const logs =
          auditRes.value.data?.data || auditRes.value.data?.logs || auditRes.value.data || [];
        setAuditLogs(
          Array.isArray(logs)
            ? logs.map((l: Record<string, unknown>) => ({
                id: String(l.id),
                action: String(l.action || ''),

                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                actor: String(l.actor || (l.user as { username?: string })?.username || 'System'),
                target: String(l.target || l.resource || ''),
                details: String(l.details || l.metadata || ''),
                timestamp: String(l.created_at || l.inserted_at),
              }))
            : []
        );
      }
    } catch (err) {
      console.error('[AdminDashboard] Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setIsRefreshing(false);
  }, [fetchDashboardData]);

  const updateReportStatus = useCallback((id: string, status: 'resolved' | 'dismissed') => {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    setStats((prev) => ({ ...prev, pendingReports: prev.pendingReports - 1 }));
  }, []);

  return {
    stats,
    recentUsers,
    reports,
    auditLogs,
    isLoading,
    isRefreshing,
    fetchDashboardData,
    handleRefresh,
    updateReportStatus,
  };
}
