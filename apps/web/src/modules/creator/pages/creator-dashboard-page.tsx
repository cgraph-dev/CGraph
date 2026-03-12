/**
 * Creator Dashboard Page
 *
 * Overview of creator earnings, subscribers, revenue, and
 * premium thread management.
 *
 * @module modules/creator/pages/creator-dashboard-page
 */

import { useEffect } from 'react';
import { useCreatorDashboard } from '../hooks/useCreatorDashboard';
import { EarningsChart } from '../components/earnings-chart';
import { PremiumThreadManager } from '../components/premium-thread-manager';

// ── Helpers ────────────────────────────────────────────────────────────

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────

export default function CreatorDashboardPage() {
  const {
    balance,
    analyticsOverview,
    earningsData,
    isLoadingBalance,
    isLoadingAnalytics,
    fetchBalance,
    fetchAllAnalytics,
  } = useCreatorDashboard();

  useEffect(() => {
    fetchBalance();
    fetchAllAnalytics();
  }, [fetchBalance, fetchAllAnalytics]);

  const isLoading = isLoadingBalance || isLoadingAnalytics;

  if (isLoading && !balance && !analyticsOverview) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Build chart data from earningsData
  const chartData =
    earningsData?.earningsOverTime?.map((e) => ({
      period: e.month,
      amount: e.netCents / 100,
    })) ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <h1 className="text-2xl font-bold">Creator Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Total Earnings"
          value={balance ? formatCents(balance.totalEarnedCents) : '—'}
        />
        <SummaryCard
          label="Active Subscribers"
          value={analyticsOverview?.subscriberCount ?? 0}
        />
        <SummaryCard
          label="Monthly Revenue"
          value={analyticsOverview ? formatCents(analyticsOverview.mrrCents) : '—'}
        />
      </div>

      {/* Revenue chart */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Revenue Over Time</h2>
        <EarningsChart data={chartData} period="monthly" />
      </section>

      {/* Premium threads */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Premium Threads</h2>
        <PremiumThreadManager />
      </section>
    </div>
  );
}
