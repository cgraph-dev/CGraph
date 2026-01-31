/**
 * Admin Shared Components
 * Reusable UI components for admin dashboard
 */

import { motion } from 'framer-motion';
import clsx from 'clsx';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import type { SystemMetrics } from '@/types/admin.types';

// ============================================================================
// Status Badge
// ============================================================================

export function StatusBadge({ status }: { status: string }) {
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

// ============================================================================
// Loading State
// ============================================================================

export function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
    </div>
  );
}

// ============================================================================
// Empty State
// ============================================================================

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-12 text-center text-gray-500 dark:text-gray-400">
      <ExclamationTriangleIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />
      <p>{message}</p>
    </div>
  );
}

// ============================================================================
// Progress Bar
// ============================================================================

export function ProgressBar({
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

// ============================================================================
// Metric Card
// ============================================================================

type ColorKey = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
type ChangeType = 'positive' | 'negative' | 'neutral';

export function MetricCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  change: string;
  changeType: ChangeType;
  icon: React.ComponentType<{ className?: string }>;
  color: ColorKey;
}) {
  const colors: Record<ColorKey, string> = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    indigo: 'from-indigo-500 to-indigo-600',
  };

  const changeColors: Record<ChangeType, string> = {
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

// ============================================================================
// Realtime Stat
// ============================================================================

export function RealtimeStat({
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

// ============================================================================
// Stats Card
// ============================================================================

export function StatsCard({
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

// ============================================================================
// System Health Card
// ============================================================================

export function SystemHealthCard({ metrics }: { metrics?: SystemMetrics }) {
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

// ============================================================================
// Jobs Status Card
// ============================================================================

export function JobsStatusCard({ jobs }: { jobs?: SystemMetrics['jobs'] }) {
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

// ============================================================================
// Setting Controls
// ============================================================================

export function SettingToggle({
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

export function SettingNumber({
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

// ============================================================================
// Utility Functions
// ============================================================================

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// Chat bubble icon placeholder
export function ChatBubbleIcon({ className }: { className?: string }) {
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
