/**
 * Shared components for Admin Dashboard panels
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import type { ModerationItem } from './types';
import { RISK_COLORS } from './constants';
import { springs } from '@/lib/animation-presets';

/**
 * Stat card with optional trend indicator
 */
export function StatCard({
  title,
  value,
  icon,
  trend,
  variant = 'default',
}: {
  title: string;
  value: string | number;
  icon: string;
  trend?: { value: number; isPositive: boolean };
  variant?: 'default' | 'warning' | 'success' | 'error';
}) {
  const variantStyles = {
    default: 'border-white/10',
    warning: 'border-yellow-500/30 bg-yellow-500/5',
    success: 'border-green-500/30 bg-green-500/5',
    error: 'border-red-500/30 bg-red-500/5',
  };

  return (
    <div className={`rounded-xl border bg-white/5 p-6 ${variantStyles[variant]}`}>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span
            className={`text-sm font-medium ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}
          >
            {trend.isPositive ? '▲' : '▼'} {trend.value}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
    </div>
  );
}

/**
 * Quick action button with icon and label
 */
export function QuickActionButton({ icon, label }: { icon: string; label: string }) {
  return (
    <button className="flex flex-col items-center gap-2 rounded-xl bg-black/30 p-4 transition-colors hover:bg-white/10">
      <span className="text-2xl">{icon}</span>
      <span className="text-sm text-gray-400">{label}</span>
    </button>
  );
}

/**
 * Moderation queue item with risk level indicator
 */
export function ModerationQueueItem({ item }: { item: ModerationItem }) {
  return (
    <div className="flex cursor-pointer items-center gap-4 rounded-lg bg-black/20 p-3 transition-colors hover:bg-white/5">
      <span className={`rounded px-2 py-1 text-xs font-medium ${RISK_COLORS[item.riskLevel]}`}>
        {item.riskLevel.toUpperCase()}
      </span>
      <div className="flex-1">
        <p className="text-sm text-white">{item.summary}</p>
        <p className="text-xs text-gray-500">
          {item.type} • {item.createdAt.toLocaleTimeString()}
        </p>
      </div>
      <span className="text-gray-500">→</span>
    </div>
  );
}

/**
 * Reusable area chart panel for dashboard metrics
 */
export function DashboardChart({
  title,
  data,
  dataKey,
  color = '#8b5cf6',
  loading = false,
}: {
  title: string;
  data: Array<Record<string, unknown>>;
  dataKey: string;
  color?: string;
  loading?: boolean;
}) {
  const { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    React.useMemo(() => require('recharts'), []);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h3 className="mb-4 font-bold">{title}</h3>
      {loading ? (
        <div className="flex h-48 items-center justify-center text-gray-600">Loading…</div>
      ) : data.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-gray-600">No data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={192}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`fill-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="label"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: '#fff',
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              fill={`url(#fill-${dataKey})`}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

/**
 * Chart Placeholder component.
 *
 * @deprecated Use DashboardChart instead
 */
export function ChartPlaceholder({ title }: { title: string }) {
  return <DashboardChart title={title} data={[]} dataKey="value" />;
}

/**
 * Metric card with value and change indicator
 */
export function MetricCard({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change: string;
}) {
  const isPositive = change.startsWith('+');
  return (
    <div className="rounded-xl bg-black/20 p-4 text-center">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>{change}</p>
    </div>
  );
}

/**
 * Toggle switch component
 */
export function ToggleSwitch({ defaultChecked = false }: { defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <button
      onClick={() => setChecked(!checked)}
      className={`h-6 w-12 rounded-full transition-colors ${checked ? 'bg-purple-500' : 'bg-white/20'}`}
    >
      <motion.div
        className="h-5 w-5 rounded-full bg-white"
        animate={{ x: checked ? 26 : 2 }}
        transition={springs.snappy}
      />
    </button>
  );
}

/**
 * Settings section container
 */
export function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <div className="border-b border-white/10 p-4">
        <h2 className="font-bold">{title}</h2>
      </div>
      <div className="divide-y divide-white/5">{children}</div>
    </div>
  );
}

/**
 * Individual setting row
 */
export function SettingRow({
  label,
  description,
  value,
}: {
  label: string;
  description: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between p-4">
      <div>
        <p className="font-medium text-white">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      {value}
    </div>
  );
}
