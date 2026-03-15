 
import React, { useEffect, useState } from 'react';
import { useCreatorDashboard } from '@/modules/creator/hooks/useCreatorDashboard';

/**
 * AnalyticsPage — creator analytics dashboard.
 *
 * Shows subscriber count, MRR, churn rate, earnings over time, and top forums.
 * Route: /creator/analytics
 */

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatMonth(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

type Period = '7d' | '30d' | '90d';

/** Description. */
/** Analytics Page component. */
export function AnalyticsPage(): React.ReactElement {
  const {
    analyticsOverview: overview,
    earningsData,
    isLoadingAnalytics,
    fetchAnalyticsOverview,
    fetchAnalyticsEarnings,
  } = useCreatorDashboard();
  const [period, setPeriod] = useState<Period>('30d');

  useEffect(() => {
    fetchAnalyticsOverview({ period });
    fetchAnalyticsEarnings({ period });
  }, [period, fetchAnalyticsOverview, fetchAnalyticsEarnings]);

  const loading = isLoadingAnalytics;

  if (loading && !overview) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        {/* Period selector */}
        <div className="flex gap-1 rounded-lg border border-gray-200 p-0.5 dark:border-white/[0.08]">
          {(['7d', '30d', '90d'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                period === p
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.04]'
              }`}
            >
              {p === '7d' ? '7 days' : p === '30d' ? '30 days' : '90 days'}
            </button>
          ))}
        </div>
      </div>

      {/* Overview cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Subscribers"
          value={overview?.subscriberCount?.toString() ?? '0'}
          description="Active paid subscribers"
        />
        <MetricCard
          label="MRR"
          value={formatCents(overview?.mrrCents ?? 0)}
          description="Monthly recurring revenue"
        />
        <MetricCard
          label="Churn Rate"
          value={`${overview?.churnRate?.toFixed(1) ?? '0.0'}%`}
          description="Cancellations in period"
        />
        <MetricCard
          label="Your Share"
          value={`${100 - (overview?.platformFeePercent ?? 15)}%`}
          description={`CGraph takes ${overview?.platformFeePercent ?? 15}% platform fee`}
        />
      </div>

      {/* Earnings over time — simple bar chart */}
      {earningsData?.earningsOverTime && earningsData.earningsOverTime.length > 0 && (
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 dark:border-white/[0.08] dark:bg-[rgb(30,32,40)]">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Earnings Over Time
          </h2>
          <div className="flex items-end gap-2" style={{ height: 200 }}>
            {earningsData.earningsOverTime.map((m) => {
              const maxVal = Math.max(...earningsData.earningsOverTime.map((e) => e.netCents), 1);
              const height = Math.max((m.netCents / maxVal) * 100, 4);
              return (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs text-gray-500">{formatCents(m.netCents)}</span>
                  <div
                    className="w-full rounded-t bg-blue-500 transition-all"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs text-gray-400">{formatMonth(m.month)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top performing forums */}
      {earningsData?.topForums && earningsData.topForums.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white dark:border-white/[0.08] dark:bg-[rgb(30,32,40)]">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-white/[0.08]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top Performing Forums
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-white/[0.04]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Forum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Subscribers
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    MRR
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {earningsData.topForums.map((f) => (
                  <tr key={f.forumId}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {f.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {f.subscribers}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {formatCents(f.mrrCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fee transparency */}
      <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        CGraph takes {overview?.platformFeePercent ?? 15}% platform fee. You keep{' '}
        {100 - (overview?.platformFeePercent ?? 15)}%.
      </p>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: string;
  description: string;
}

function MetricCard({ label, value, description }: MetricCardProps): React.ReactElement {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-white/[0.08] dark:bg-[rgb(30,32,40)]">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{description}</p>
    </div>
  );
}

AnalyticsPage.displayName = 'AnalyticsPage';

export default AnalyticsPage;
