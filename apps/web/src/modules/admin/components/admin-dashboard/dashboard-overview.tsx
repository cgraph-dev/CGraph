/**
 * Dashboard Overview Panel
 * Main admin dashboard overview with stats and moderation queue
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

import { metricsApi } from '../../api/metricsApi';
import { moderationApi } from '../../api/moderationApi';
import type { AdminStats, ModerationItem } from './types';
import { StatCard, QuickActionButton, ModerationQueueItem } from './shared-components';

/**
 * unknown for the admin module.
 */
/**
 * Dashboard Overview component.
 */
export function DashboardOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [moderationQueue, setModerationQueue] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [metrics, reports] = await Promise.all([
        metricsApi.getMetrics(),
        moderationApi.listReports({ status: 'pending', perPage: 5 }),
      ]);

      setStats({
        activeUsers: metrics.users.active24h,
        activeEvents: metrics.groups.total,
        pendingModeration: reports.totalCount,
        revenue24h: 0,
        transactionsToday: metrics.messages.today,
        disputeRate: 0,
      });

      setModerationQueue(
        reports.reports.map((r) => ({
          id: r.id,
          // type assertion: API response field maps to known union type
          type: r.contentType as ModerationItem['type'],
          // type assertion: API response field maps to known union type
          status: r.status as ModerationItem['status'],
          riskLevel: 'medium' as const,
          createdAt: new Date(r.insertedAt),
          summary: r.reason,
        }))
      );
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8"
    >
      <h1 className="mb-8 text-3xl font-bold">Dashboard Overview</h1>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          {error}
          <button onClick={fetchData} className="ml-4 underline hover:no-underline">
            Retry
          </button>
        </div>
      )}

      {loading && !stats ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          Loading dashboard data...
        </div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Active Users"
              value={stats?.activeUsers.toLocaleString() || '—'}
              icon="👥"
              trend={{ value: 12.5, isPositive: true }}
            />
            <StatCard title="Active Events" value={stats?.activeEvents || '—'} icon="🎉" />
            <StatCard
              title="Pending Moderation"
              value={stats?.pendingModeration || '—'}
              icon="⚠️"
              variant="warning"
            />
            <StatCard
              title="24h Revenue"
              value={`${stats?.revenue24h?.toLocaleString() || '—'} 🪙`}
              icon="💰"
              trend={{ value: 8.3, isPositive: true }}
            />
            <StatCard
              title="Transactions Today"
              value={stats?.transactionsToday?.toLocaleString() || '—'}
              icon="📦"
            />
            <StatCard
              title="Dispute Rate"
              value={`${stats?.disputeRate || '—'}%`}
              icon="⚖️"
              trend={{ value: 0.2, isPositive: false }}
            />
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-4 text-xl font-bold">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                <QuickActionButton icon="🎉" label="Create Event" />
                <QuickActionButton icon="📢" label="Send Announcement" />
                <QuickActionButton icon="🎁" label="Grant Rewards" />
                <QuickActionButton icon="📊" label="Export Report" />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">Moderation Queue</h2>
                <span className="rounded-full bg-red-500/20 px-3 py-1 text-sm text-red-400">
                  {moderationQueue.length} pending
                </span>
              </div>
              <div className="space-y-3">
                {moderationQueue.map((item) => (
                  <ModerationQueueItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
