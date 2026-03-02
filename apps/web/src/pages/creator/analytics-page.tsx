import React, { useEffect, useState } from 'react';

/**
 * AnalyticsPage — creator analytics dashboard.
 *
 * Shows subscriber count, MRR, churn rate, earnings over time, and top forums.
 * Route: /creator/analytics
 */

interface AnalyticsOverview {
  subscriber_count: number;
  mrr_cents: number;
  churn_rate: number;
  platform_fee_percent: number;
}

interface EarningMonth {
  month: string;
  net_cents: number;
}

interface TopForum {
  forum_id: string;
  name: string;
  subscribers: number;
  mrr_cents: number;
}

interface EarningsData {
  earnings_over_time: EarningMonth[];
  top_forums: TopForum[];
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatMonth(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

type Period = '7d' | '30d' | '90d';

export const AnalyticsPage: React.FC = () => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [period, setPeriod] = useState<Period>('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overviewRes, earningsRes] = await Promise.all([
        fetch(`/api/v1/creator/analytics/overview?period=${period}`).then((r) => r.json()),
        fetch(`/api/v1/creator/analytics/earnings?period=${period}`).then((r) => r.json()),
      ]);
      if (overviewRes.data) setOverview(overviewRes.data);
      if (earningsRes.data) setEarningsData(earningsRes.data);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

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
        <div className="flex gap-1 rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
          {(['7d', '30d', '90d'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                period === p
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
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
          value={overview?.subscriber_count?.toString() ?? '0'}
          description="Active paid subscribers"
        />
        <MetricCard
          label="MRR"
          value={formatCents(overview?.mrr_cents ?? 0)}
          description="Monthly recurring revenue"
        />
        <MetricCard
          label="Churn Rate"
          value={`${overview?.churn_rate?.toFixed(1) ?? '0.0'}%`}
          description="Cancellations in period"
        />
        <MetricCard
          label="Your Share"
          value={`${100 - (overview?.platform_fee_percent ?? 15)}%`}
          description={`CGraph takes ${overview?.platform_fee_percent ?? 15}% platform fee`}
        />
      </div>

      {/* Earnings over time — simple bar chart */}
      {earningsData?.earnings_over_time && earningsData.earnings_over_time.length > 0 && (
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Earnings Over Time
          </h2>
          <div className="flex items-end gap-2" style={{ height: 200 }}>
            {earningsData.earnings_over_time.map((m) => {
              const maxVal = Math.max(
                ...earningsData.earnings_over_time.map((e) => e.net_cents),
                1
              );
              const height = Math.max((m.net_cents / maxVal) * 100, 4);
              return (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs text-gray-500">{formatCents(m.net_cents)}</span>
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
      {earningsData?.top_forums && earningsData.top_forums.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top Performing Forums
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Forum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Subscribers</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">MRR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {earningsData.top_forums.map((f) => (
                  <tr key={f.forum_id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {f.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {f.subscribers}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {formatCents(f.mrr_cents)}
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
        CGraph takes {overview?.platform_fee_percent ?? 15}% platform fee. You keep{' '}
        {100 - (overview?.platform_fee_percent ?? 15)}%.
      </p>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: string;
  description: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, description }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{description}</p>
  </div>
);

AnalyticsPage.displayName = 'AnalyticsPage';

export default AnalyticsPage;
