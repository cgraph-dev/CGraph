/**
 * Dashboard Overview Panel
 * Main admin dashboard overview with stats and moderation queue
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import type { AdminStats, ModerationItem } from './types';
import { StatCard, QuickActionButton, ModerationQueueItem } from './shared-components';

export function DashboardOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [moderationQueue, setModerationQueue] = useState<ModerationItem[]>([]);

  useEffect(() => {
    setStats({
      activeUsers: 12847,
      activeEvents: 3,
      pendingModeration: 47,
      revenue24h: 284750,
      transactionsToday: 1893,
      disputeRate: 0.8,
    });

    setModerationQueue([
      {
        id: '1',
        type: 'listing',
        status: 'pending',
        riskLevel: 'high',
        createdAt: new Date(),
        summary: 'Suspicious pricing on rare item',
      },
      {
        id: '2',
        type: 'transaction',
        status: 'escalated',
        riskLevel: 'critical',
        createdAt: new Date(),
        summary: 'Potential fraud detection',
      },
    ]);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8"
    >
      <h1 className="mb-8 text-3xl font-bold">Dashboard Overview</h1>

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
    </motion.div>
  );
}
