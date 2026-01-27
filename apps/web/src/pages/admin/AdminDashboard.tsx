import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChartBarIcon,
  UsersIcon,
  ShieldExclamationIcon,
  CogIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ServerIcon,
  CpuChipIcon,
  CircleStackIcon,
  SignalIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { adminApi } from '@/lib/api/admin';
import { format } from 'date-fns';
import { formatTimeAgo } from '@/lib/utils';
import clsx from 'clsx';
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';

// ============================================================================
// Types
// ============================================================================

interface SystemMetrics {
  users: {
    total: number;
    newToday: number;
    active24h: number;
    premium: number;
    banned: number;
  };
  messages: {
    total: number;
    today: number;
    voiceMessages: number;
  };
  groups: {
    total: number;
    public: number;
    private: number;
  };
  system: {
    uptimeSeconds: number;
    memoryUsageMb: number;
    cpuUsagePercent: number;
    dbConnections: number;
  };
  jobs: {
    pending: number;
    executing: number;
    failed: number;
    completed24h: number;
  };
  collectedAt: string;
}

// RealtimeStats type - defined in admin API

interface AdminUser {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  avatarBorderId?: string | null;
  avatar_border_id?: string | null;
  status: 'active' | 'banned' | 'deleted';
  insertedAt: string;
  lastSeenAt: string | null;
  isPremium: boolean;
  bannedAt: string | null;
  banReason: string | null;
}

interface Report {
  id: string;
  type: 'spam' | 'harassment' | 'hate_speech' | 'illegal' | 'other';
  status: 'pending' | 'resolved' | 'dismissed';
  contentType: 'message' | 'post' | 'user' | 'group';
  contentId: string;
  reporterId: string;
  reporterUsername: string;
  reason: string;
  insertedAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
}

interface AuditEntry {
  id: string;
  category: string;
  action: string;
  actorId: string;
  actorUsername: string;
  targetId: string | null;
  metadata: Record<string, unknown>;
  ipAddress: string;
  timestamp: string;
}

type TabId = 'overview' | 'users' | 'reports' | 'audit' | 'settings';

// ============================================================================
// Main Admin Dashboard Component
// ============================================================================

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const queryClient = useQueryClient();

  const tabs = [
    { id: 'overview' as TabId, name: 'Overview', icon: ChartBarIcon },
    { id: 'users' as TabId, name: 'Users', icon: UsersIcon },
    { id: 'reports' as TabId, name: 'Reports', icon: ShieldExclamationIcon },
    { id: 'audit' as TabId, name: 'Audit Log', icon: ClockIcon },
    { id: 'settings' as TabId, name: 'Settings', icon: CogIcon },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
    >
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                <ShieldExclamationIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">CGraph Administration</p>
              </div>
            </div>

            <button
              onClick={() => queryClient.invalidateQueries()}
              className="flex items-center space-x-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              <ArrowPathIcon className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'flex items-center space-x-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
                  activeTab === tab.id
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                )}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && <OverviewTab key="overview" />}
          {activeTab === 'users' && <UsersTab key="users" />}
          {activeTab === 'reports' && <ReportsTab key="reports" />}
          {activeTab === 'audit' && <AuditTab key="audit" />}
          {activeTab === 'settings' && <SettingsTab key="settings" />}
        </AnimatePresence>
      </main>
    </motion.div>
  );
}

// ============================================================================
// Overview Tab
// ============================================================================

function OverviewTab() {
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

// ============================================================================
// Users Tab
// ============================================================================

function UsersTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin', 'users', { search: searchTerm, status: statusFilter, page }],
    queryFn: () =>
      adminApi.listUsers({ search: searchTerm, status: statusFilter, page, perPage: 20 }),
  });

  const banMutation = useMutation({
    mutationFn: ({
      userId,
      reason,
      duration,
    }: {
      userId: string;
      reason: string;
      duration?: number;
    }) => adminApi.banUser(userId, reason, duration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  const unbanMutation = useMutation({
    mutationFn: (userId: string) => adminApi.unbanUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Search and Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {isLoading ? (
          <LoadingState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Last Seen
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {usersData?.users.map((user: AdminUser) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onBan={(reason, duration) =>
                      banMutation.mutate({ userId: user.id, reason, duration })
                    }
                    onUnban={() => unbanMutation.mutate(user.id)}
                    isBanning={banMutation.isPending}
                    isUnbanning={unbanMutation.isPending}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {usersData && (
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, usersData.totalCount)} of{' '}
              {usersData.totalCount} users
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm disabled:opacity-50 dark:bg-gray-700"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 20 >= usersData.totalCount}
                className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm disabled:opacity-50 dark:bg-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function UserRow({
  user,
  onBan,
  onUnban,
  isBanning,
  isUnbanning,
}: {
  user: AdminUser;
  onBan: (reason: string, duration?: number) => void;
  onUnban: () => void;
  isBanning: boolean;
  isUnbanning: boolean;
}) {
  const [showBanModal, setShowBanModal] = useState(false);

  return (
    <>
      <tr className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50">
        <td className="whitespace-nowrap px-6 py-4">
          <div className="flex items-center space-x-3">
            <ThemedAvatar
              src={
                user.avatarUrl ||
                `https://ui-avatars.com/api/?name=${user.username}&background=random`
              }
              alt={user.username}
              size="small"
              className="h-10 w-10"
              avatarBorderId={user.avatarBorderId ?? user.avatar_border_id ?? null}
            />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {user.displayName || user.username}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                @{user.username} • {user.email}
              </p>
            </div>
          </div>
        </td>
        <td className="whitespace-nowrap px-6 py-4">
          <StatusBadge status={user.status} />
          {user.isPremium && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              Premium
            </span>
          )}
        </td>
        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
          {format(new Date(user.insertedAt), 'MMM d, yyyy')}
        </td>
        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
          {user.lastSeenAt ? formatTimeAgo(user.lastSeenAt) : 'Never'}
        </td>
        <td className="whitespace-nowrap px-6 py-4 text-right">
          {user.status === 'banned' ? (
            <button
              onClick={onUnban}
              disabled={isUnbanning}
              className="rounded-lg bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700 transition-colors hover:bg-green-200 disabled:opacity-50"
            >
              {isUnbanning ? 'Unbanning...' : 'Unban'}
            </button>
          ) : (
            <button
              onClick={() => setShowBanModal(true)}
              disabled={isBanning}
              className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-200 disabled:opacity-50"
            >
              Ban
            </button>
          )}
        </td>
      </tr>

      {showBanModal && (
        <BanUserModal
          user={user}
          onConfirm={(reason, duration) => {
            onBan(reason, duration);
            setShowBanModal(false);
          }}
          onClose={() => setShowBanModal(false)}
        />
      )}
    </>
  );
}

// ============================================================================
// Reports Tab
// ============================================================================

function ReportsTab() {
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const queryClient = useQueryClient();

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['admin', 'reports', { status: statusFilter }],
    queryFn: () => adminApi.listReports({ status: statusFilter }),
  });

  const resolveMutation = useMutation({
    mutationFn: ({
      reportId,
      action,
      note,
    }: {
      reportId: string;
      action: 'resolve' | 'dismiss';
      note?: string;
    }) => adminApi.resolveReport(reportId, action, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex space-x-2">
          {['pending', 'resolved', 'dismissed', 'all'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={clsx(
                'rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors',
                statusFilter === status
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {isLoading ? (
          <LoadingState />
        ) : reportsData?.reports.length === 0 ? (
          <EmptyState message="No reports found" />
        ) : (
          reportsData?.reports.map((report: Report) => (
            <ReportCard
              key={report.id}
              report={report}
              onResolve={(action, note) =>
                resolveMutation.mutate({ reportId: report.id, action, note })
              }
              isResolving={resolveMutation.isPending}
            />
          ))
        )}
      </div>
    </motion.div>
  );
}

function ReportCard({
  report,
  onResolve,
  isResolving,
}: {
  report: Report;
  onResolve: (action: 'resolve' | 'dismiss', note?: string) => void;
  isResolving: boolean;
}) {
  const typeColors: Record<string, string> = {
    spam: 'bg-yellow-100 text-yellow-700',
    harassment: 'bg-red-100 text-red-700',
    hate_speech: 'bg-red-100 text-red-700',
    illegal: 'bg-purple-100 text-purple-700',
    other: 'bg-gray-100 text-gray-700',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center space-x-3">
            <span
              className={clsx(
                'rounded-full px-2 py-1 text-xs font-medium',
                typeColors[report.type]
              )}
            >
              {report.type.replace('_', ' ')}
            </span>
            <StatusBadge status={report.status} />
            <span className="text-sm text-gray-500 dark:text-gray-400">{report.contentType}</span>
          </div>

          <p className="mb-2 text-gray-900 dark:text-white">{report.reason}</p>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Reported by <span className="font-medium">@{report.reporterUsername}</span>
            {' • '}
            {formatTimeAgo(report.insertedAt)}
          </p>
        </div>

        {report.status === 'pending' && (
          <div className="ml-4 flex space-x-2">
            <button
              onClick={() => onResolve('resolve')}
              disabled={isResolving}
              className="flex items-center space-x-1 rounded-lg bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-200 disabled:opacity-50"
            >
              <CheckCircleIcon className="h-4 w-4" />
              <span>Resolve</span>
            </button>
            <button
              onClick={() => onResolve('dismiss')}
              disabled={isResolving}
              className="flex items-center space-x-1 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              <XCircleIcon className="h-4 w-4" />
              <span>Dismiss</span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// Audit Log Tab
// ============================================================================

function AuditTab() {
  const [page] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const { data: auditData, isLoading } = useQuery({
    queryKey: ['admin', 'audit', { category: categoryFilter, page }],
    queryFn: () => adminApi.getAuditLog({ category: categoryFilter, page, perPage: 50 }),
  });

  const categories = ['all', 'auth', 'user', 'admin', 'data', 'security'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex space-x-2 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setCategoryFilter(category)}
              className={clsx(
                'whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors',
                categoryFilter === category
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {isLoading ? (
          <LoadingState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Actor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {auditData?.entries.map((entry: AuditEntry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(new Date(entry.timestamp), 'MMM d, HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        {entry.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {entry.action}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">@{entry.actorUsername}</td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-500">{entry.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// Settings Tab
// ============================================================================

function SettingsTab() {
  const { data: config, isLoading } = useQuery({
    queryKey: ['admin', 'config'],
    queryFn: () => adminApi.getConfig(),
  });

  const updateConfigMutation = useMutation({
    mutationFn: (updates: Record<string, unknown>) => adminApi.updateConfig(updates),
  });

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
          System Configuration
        </h2>

        <div className="space-y-6">
          <SettingToggle
            label="Registration Enabled"
            description="Allow new users to register"
            value={config?.registrationEnabled ?? true}
            onChange={(value) => updateConfigMutation.mutate({ registrationEnabled: value })}
          />

          <SettingToggle
            label="Email Verification Required"
            description="Require email verification for new accounts"
            value={config?.emailVerificationRequired ?? true}
            onChange={(value) => updateConfigMutation.mutate({ emailVerificationRequired: value })}
          />

          <SettingToggle
            label="Maintenance Mode"
            description="Put the application in maintenance mode"
            value={config?.maintenanceMode ?? false}
            onChange={(value) => updateConfigMutation.mutate({ maintenanceMode: value })}
          />

          <SettingNumber
            label="Max Message Length"
            description="Maximum characters per message"
            value={config?.maxMessageLength ?? 4000}
            onChange={(value) => updateConfigMutation.mutate({ maxMessageLength: value })}
          />

          <SettingNumber
            label="Max File Upload Size (MB)"
            description="Maximum file upload size in megabytes"
            value={config?.maxFileUploadMb ?? 50}
            onChange={(value) => updateConfigMutation.mutate({ maxFileUploadMb: value })}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

function MetricCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  color,
}: {
  title: string;
  value: number | string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
  };

  const changeColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-500',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="mb-4 flex items-center justify-between">
        <div
          className={clsx(
            'flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br',
            colors[color]
          )}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      <h3 className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        {(value ?? 0).toLocaleString()}
      </p>
      <p className={clsx('mt-1 text-sm', changeColors[changeType])}>{change}</p>
    </motion.div>
  );
}

function RealtimeStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center space-x-3">
      <Icon className="h-5 w-5 opacity-80" />
      <div>
        <p className="text-xs opacity-80">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    banned: 'bg-red-100 text-red-700',
    deleted: 'bg-gray-100 text-gray-700',
    pending: 'bg-yellow-100 text-yellow-700',
    resolved: 'bg-green-100 text-green-700',
    dismissed: 'bg-gray-100 text-gray-700',
  };

  return (
    <span
      className={clsx(
        'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
        colors[status] || colors.active
      )}
    >
      {status}
    </span>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-12 text-center text-gray-500 dark:text-gray-400">
      <ExclamationTriangleIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />
      <p>{message}</p>
    </div>
  );
}

function SystemHealthCard({ metrics }: { metrics?: SystemMetrics }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">System Health</h3>
      <div className="space-y-4">
        <ProgressBar
          label="Memory Usage"
          value={metrics?.system.memoryUsageMb || 0}
          max={1024}
          unit="MB"
        />
        <ProgressBar
          label="CPU Usage"
          value={metrics?.system.cpuUsagePercent || 0}
          max={100}
          unit="%"
        />
        <ProgressBar
          label="DB Connections"
          value={metrics?.system.dbConnections || 0}
          max={100}
          unit=""
        />
      </div>
    </div>
  );
}

function JobsStatusCard({ jobs }: { jobs?: SystemMetrics['jobs'] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Background Jobs</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
          <p className="text-2xl font-bold text-yellow-600">{jobs?.pending || 0}</p>
          <p className="text-sm text-yellow-600">Pending</p>
        </div>
        <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
          <p className="text-2xl font-bold text-blue-600">{jobs?.executing || 0}</p>
          <p className="text-sm text-blue-600">Executing</p>
        </div>
        <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
          <p className="text-2xl font-bold text-red-600">{jobs?.failed || 0}</p>
          <p className="text-sm text-red-600">Failed</p>
        </div>
        <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
          <p className="text-2xl font-bold text-green-600">{jobs?.completed24h || 0}</p>
          <p className="text-sm text-green-600">Completed (24h)</p>
        </div>
      </div>
    </div>
  );
}

function StatsCard({
  title,
  stats,
}: {
  title: string;
  stats: Array<{ label: string; value: string | number; highlight?: string }>;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <div className="space-y-3">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</span>
            <span
              className={clsx(
                'font-semibold',
                stat.highlight === 'red' ? 'text-red-600' : 'text-gray-900 dark:text-white'
              )}
            >
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressBar({
  label,
  value,
  max,
  unit,
}: {
  label: string;
  value: number;
  max: number;
  unit: string;
}) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-gray-500 dark:text-gray-400">{label}</span>
        <span className="font-medium text-gray-900 dark:text-white">
          {value}
          {unit}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={clsx(
            'h-2 rounded-full transition-all',
            percentage > 80 ? 'bg-red-500' : percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function SettingToggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={clsx(
          'relative h-6 w-12 rounded-full transition-colors',
          value ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
        )}
      >
        <span
          className={clsx(
            'absolute top-1 h-4 w-4 rounded-full bg-white transition-transform',
            value ? 'left-7' : 'left-1'
          )}
        />
      </button>
    </div>
  );
}

function SettingNumber({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-24 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-right dark:border-gray-600 dark:bg-gray-700"
      />
    </div>
  );
}

function BanUserModal({
  user,
  onConfirm,
  onClose,
}: {
  user: AdminUser;
  onConfirm: (reason: string, duration?: number) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState<string>('permanent');

  const handleConfirm = () => {
    const durationSeconds = duration === 'permanent' ? undefined : parseInt(duration, 10);
    onConfirm(reason, durationSeconds);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800"
      >
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Ban User: @{user.username}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for ban..."
              className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
              rows={3}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
            >
              <option value="permanent">Permanent</option>
              <option value="86400">1 Day</option>
              <option value="604800">1 Week</option>
              <option value="2592000">30 Days</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!reason}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            Ban User
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// Utility function
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// Missing icon placeholder
function ChatBubbleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}
