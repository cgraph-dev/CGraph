/**
 * Admin Overview Tab
 *
 * Dashboard overview with metrics, real-time stats, and system health.
 *
 * @module pages/admin/tabs/OverviewTab
 */

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  UsersIcon,
  ClockIcon,
  ServerIcon,
  CpuChipIcon,
  CircleStackIcon,
  SignalIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { adminApi } from '@/modules/admin/api';
import {
  LoadingState,
  MetricCard,
  RealtimeStat,
  StatsCard,
  SystemHealthCard,
  JobsStatusCard,
  formatUptime,
  ChatBubbleIcon,
} from '@/modules/admin/components';

export function OverviewTab() {
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['admin', 'metrics'],
    queryFn: () => adminApi.getMetrics(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: realtime } = useQuery({
    queryKey: ['admin', 'realtime'],
    queryFn: () => adminApi.getRealtimeStats(),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  if (metricsLoading) {
    return <LoadingState />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Real-time Stats Bar */}
      {realtime && (
        <div className="rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <RealtimeStat
              icon={SignalIcon}
              label="Active Connections"
              value={realtime.activeConnections}
            />
            <RealtimeStat icon={BoltIcon} label="Requests/min" value={realtime.requestsPerMinute} />
            <RealtimeStat
              icon={CircleStackIcon}
              label="DB Latency"
              value={`${realtime.databaseLatencyMs}ms`}
            />
            <RealtimeStat
              icon={CpuChipIcon}
              label="Cache Hit Rate"
              value={`${(realtime.cacheHitRate * 100).toFixed(1)}%`}
            />
            <RealtimeStat icon={ServerIcon} label="Memory" value={`${realtime.memoryUsageMb}MB`} />
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Users"
          value={metrics?.users.total || 0}
          change={`+${metrics?.users.newToday || 0} today`}
          changeType="positive"
          icon={UsersIcon}
          color="blue"
        />
        <MetricCard
          title="Active Users (24h)"
          value={metrics?.users.active24h || 0}
          change={`${(((metrics?.users.active24h || 0) / (metrics?.users.total || 1)) * 100).toFixed(1)}%`}
          changeType="neutral"
          icon={SignalIcon}
          color="green"
        />
        <MetricCard
          title="Messages Today"
          value={metrics?.messages.today || 0}
          change={`${metrics?.messages.total || 0} total`}
          changeType="neutral"
          icon={ChatBubbleIcon}
          color="purple"
        />
        <MetricCard
          title="Pending Jobs"
          value={metrics?.jobs.pending || 0}
          change={`${metrics?.jobs.failed || 0} failed`}
          changeType={metrics?.jobs.failed ? 'negative' : 'neutral'}
          icon={ClockIcon}
          color="orange"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SystemHealthCard metrics={metrics} />
        <JobsStatusCard jobs={metrics?.jobs} />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <StatsCard
          title="Groups"
          stats={[
            { label: 'Total', value: metrics?.groups.total || 0 },
            { label: 'Public', value: metrics?.groups.public || 0 },
            { label: 'Private', value: metrics?.groups.private || 0 },
          ]}
        />
        <StatsCard
          title="Users Status"
          stats={[
            { label: 'Premium', value: metrics?.users.premium || 0 },
            { label: 'Banned', value: metrics?.users.banned || 0, highlight: 'red' },
          ]}
        />
        <StatsCard
          title="System"
          stats={[
            { label: 'Uptime', value: formatUptime(metrics?.system.uptimeSeconds || 0) },
            { label: 'DB Connections', value: metrics?.system.dbConnections || 0 },
          ]}
        />
      </div>
    </motion.div>
  );
}
