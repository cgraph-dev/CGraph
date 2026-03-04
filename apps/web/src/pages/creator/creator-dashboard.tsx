import React, { useEffect, useState } from 'react';

/**
 * CreatorDashboard — main landing page for creator monetization.
 *
 * Shows onboarding status, subscriber summary, balance, and quick actions.
 * Routes: /creator
 */

interface CreatorStatus {
  creator_status: 'none' | 'pending' | 'active' | 'suspended';
  stripe_connect_id: boolean;
  onboarded_at: string | null;
}

interface CreatorBalance {
  total_earned_cents: number;
  total_paid_out_cents: number;
  available_balance_cents: number;
}

interface OverviewStats {
  subscriber_count: number;
  mrr_cents: number;
  churn_rate: number;
  platform_fee_percent: number;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export const CreatorDashboard: React.FC = () => {
  const [status, setStatus] = useState<CreatorStatus | null>(null);
  const [balance, setBalance] = useState<CreatorBalance | null>(null);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statusRes, balanceRes, overviewRes] = await Promise.all([
        fetch('/api/v1/creator/status').then((r) => r.json()),
        fetch('/api/v1/creator/balance').then((r) => r.json()).catch(() => null),
        fetch('/api/v1/creator/analytics/overview').then((r) => r.json()).catch(() => null),
      ]);
      setStatus(statusRes.data);
      if (balanceRes?.data) setBalance(balanceRes.data);
      if (overviewRes?.data) setOverview(overviewRes.data);
    } catch {
      // Silently handle initial load errors
    } finally {
      setLoading(false);
    }
  };

  const handleStartOnboarding = async () => {
    try {
      const res = await fetch('/api/v1/creator/onboard', { method: 'POST' });
      const data = await res.json();
      if (data.data?.onboarding_url) {
        setOnboardingUrl(data.data.onboarding_url);
        window.location.href = data.data.onboarding_url;
      }
    } catch {
      // Handle error
    }
  };

  const handleRefreshOnboarding = async () => {
    try {
      const res = await fetch('/api/v1/creator/onboard/refresh', { method: 'POST' });
      const data = await res.json();
      if (data.data?.onboarding_url) {
        window.location.href = data.data.onboarding_url;
      }
    } catch {
      // Handle error
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  // ── Not a creator yet ──────────────────────────────────────────
  if (!status || status.creator_status === 'none') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <div className="mb-6 text-6xl">🎨</div>
        <h1 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">
          Become a Creator
        </h1>
        <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
          Monetize your forums with paid subscriptions. Set your price,
          build your community, and earn revenue directly to your bank account.
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
          onClick={handleStartOnboarding}
          className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Start Creator Onboarding
        </button>
      </div>
    );
  }

  // ── Pending onboarding ─────────────────────────────────────────
  if (status.creator_status === 'pending') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <div className="mb-6 text-6xl">⏳</div>
        <h1 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
          Complete Your Setup
        </h1>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          Your Stripe Connect account has been created. Please complete the
          onboarding process to start accepting payments.
        </p>
        <button
          onClick={handleRefreshOnboarding}
          className="rounded-lg bg-amber-500 px-8 py-3 font-semibold text-white shadow-sm transition hover:bg-amber-600"
        >
          Continue Onboarding →
        </button>
        {onboardingUrl && (
          <p className="mt-4 text-sm text-gray-500">
            Redirecting to Stripe...
          </p>
        )}
      </div>
    );
  }

  // ── Active creator dashboard ───────────────────────────────────
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Creator Dashboard
        </h1>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Active
        </span>
      </div>

      {/* Stats cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Subscribers"
          value={overview?.subscriber_count?.toString() ?? '0'}
          icon="👥"
        />
        <StatCard
          label="Monthly Revenue"
          value={formatCents(overview?.mrr_cents ?? 0)}
          icon="📈"
        />
        <StatCard
          label="Available Balance"
          value={formatCents(balance?.available_balance_cents ?? 0)}
          icon="💰"
        />
        <StatCard
          label="Churn Rate"
          value={`${overview?.churn_rate?.toFixed(1) ?? '0.0'}%`}
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
        CGraph takes a {overview?.platform_fee_percent ?? 15}% platform fee.
        You keep {100 - (overview?.platform_fee_percent ?? 15)}% of every payment.
      </p>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-white/[0.08] dark:bg-[rgb(30,32,40)]">
    <div className="mb-2 flex items-center justify-between">
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-xl">{icon}</span>
    </div>
    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
  </div>
);

interface QuickActionProps {
  title: string;
  description: string;
  href: string;
  icon: string;
}

const QuickAction: React.FC<QuickActionProps> = ({ title, description, href, icon }) => (
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

CreatorDashboard.displayName = 'CreatorDashboard';

export default CreatorDashboard;
