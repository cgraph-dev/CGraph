import React, { useEffect } from 'react';
import { useCreator } from '@/modules/creator/hooks/useCreator';
import { useCreatorDashboard } from '@/modules/creator/hooks/useCreatorDashboard';

/**
 * CreatorDashboard — main landing page for creator monetization.
 *
 * Shows onboarding status, subscriber summary, balance, and quick actions.
 * Routes: /creator
 */

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Description. */
/** Creator Dashboard component. */
export function CreatorDashboard(): React.ReactElement {
  const {
    creatorStatus,
    isLoading: statusLoading,
    fetchStatus,
    startOnboarding,
    continueOnboarding,
  } = useCreator();
  const {
    balance,
    analyticsOverview: overview,
    fetchBalance,
    fetchAnalyticsOverview,
  } = useCreatorDashboard();

  useEffect(() => {
    fetchStatus();
    fetchBalance();
    fetchAnalyticsOverview();
  }, [fetchStatus, fetchBalance, fetchAnalyticsOverview]);

  const loading = statusLoading && !creatorStatus;

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  // ── Not a creator yet ──────────────────────────────────────────
  if (creatorStatus === 'none') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <div className="mb-6 text-6xl">🎨</div>
        <h1 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">Become a Creator</h1>
        <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
          Monetize your forums with paid subscriptions. Set your price, build your community, and
          earn revenue directly to your bank account.
        </p>
        <ul className="mb-8 space-y-3 text-left text-gray-600 dark:text-gray-400">
          <li className="flex items-start gap-3">
            <span className="mt-0.5 text-green-500">✓</span>
            Offer paid forum subscriptions at your chosen price
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 text-green-500">✓</span>
            Keep 85% of every subscription payment
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 text-green-500">✓</span>
            Withdraw earnings to your bank any time (min $10)
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 text-green-500">✓</span>
            Content gates keep exclusive content for subscribers only
          </li>
        </ul>
        <button
          onClick={startOnboarding}
          className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Start Creator Onboarding
        </button>
      </div>
    );
  }

  // ── Pending onboarding ─────────────────────────────────────────
  if (creatorStatus === 'pending') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <div className="mb-6 text-6xl">⏳</div>
        <h1 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
          Complete Your Setup
        </h1>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          Your Stripe Connect account has been created. Please complete the onboarding process to
          start accepting payments.
        </p>
        <button
          onClick={continueOnboarding}
          className="rounded-lg bg-amber-500 px-8 py-3 font-semibold text-white shadow-sm transition hover:bg-amber-600"
        >
          Continue Onboarding →
        </button>
      </div>
    );
  }

  // ── Active creator dashboard ───────────────────────────────────
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Creator Dashboard</h1>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Active
        </span>
      </div>

      {/* Stats cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Subscribers"
          value={overview?.subscriberCount?.toString() ?? '0'}
          icon="👥"
        />
        <StatCard label="Monthly Revenue" value={formatCents(overview?.mrrCents ?? 0)} icon="📈" />
        <StatCard
          label="Available Balance"
          value={formatCents(balance?.availableBalanceCents ?? 0)}
          icon="💰"
        />
        <StatCard
          label="Churn Rate"
          value={`${overview?.churnRate?.toFixed(1) ?? '0.0'}%`}
          icon="📉"
        />
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <QuickAction
          title="Earnings"
          description="View detailed earnings breakdown"
          href="/creator/earnings"
          icon="💵"
        />
        <QuickAction
          title="Analytics"
          description="Subscriber trends and content performance"
          href="/creator/analytics"
          icon="📊"
        />
        <QuickAction
          title="Payouts"
          description="Request withdrawals and view history"
          href="/creator/payouts"
          icon="🏦"
        />
      </div>

      {/* Fee transparency notice */}
      <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        CGraph takes a {overview?.platformFeePercent ?? 15}% platform fee. You keep{' '}
        {100 - (overview?.platformFeePercent ?? 15)}% of every payment.
      </p>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
}

function StatCard({ label, value, icon }: StatCardProps): React.ReactElement {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-white/[0.08] dark:bg-[rgb(30,32,40)]">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

interface QuickActionProps {
  title: string;
  description: string;
  href: string;
  icon: string;
}

function QuickAction({ title, description, href, icon }: QuickActionProps): React.ReactElement {
  return (
    <a
      href={href}
      className="group rounded-lg border border-gray-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm dark:border-white/[0.08] dark:bg-[rgb(30,32,40)] dark:hover:border-blue-600"
    >
      <div className="mb-2 text-2xl">{icon}</div>
      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
        {title}
      </h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </a>
  );
}

CreatorDashboard.displayName = 'CreatorDashboard';

export default CreatorDashboard;
