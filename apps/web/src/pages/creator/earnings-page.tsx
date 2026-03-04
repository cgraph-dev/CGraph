import React, { useEffect, useState } from 'react';

/**
 * EarningsPage — detailed earnings breakdown and payout requests.
 *
 * Shows:
 * - Earnings table (date, subscriber, forum, gross, fee, net)
 * - Current balance
 * - Request Payout button
 * - Payout history section
 *
 * Route: /creator/earnings
 */

interface Earning {
  id: string;
  forum_name?: string;
  subscriber_name?: string;
  gross_amount_cents: number;
  platform_fee_cents: number;
  net_amount_cents: number;
  period_start: string;
  period_end: string;
  inserted_at: string;
}

interface Balance {
  total_earned_cents: number;
  total_paid_out_cents: number;
  available_balance_cents: number;
}

interface Payout {
  id: string;
  amount_cents: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requested_at: string;
  completed_at: string | null;
  failure_reason?: string | null;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const MINIMUM_PAYOUT_CENTS = 1000; // $10

export const EarningsPage: React.FC = () => {
  const [_earnings, _setEarnings] = useState<Earning[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutLoading, setPayoutLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [balanceRes, payoutsRes] = await Promise.all([
        fetch('/api/v1/creator/balance').then((r) => r.json()),
        fetch('/api/v1/creator/payouts').then((r) => r.json()),
      ]);
      if (balanceRes.data) setBalance(balanceRes.data);
      if (payoutsRes.data) setPayouts(payoutsRes.data);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    setPayoutLoading(true);
    try {
      const res = await fetch('/api/v1/creator/payout', { method: 'POST' });
      const data = await res.json();
      if (data.data) {
        await fetchData(); // Refresh
      }
    } catch {
      // Handle error
    } finally {
      setPayoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const canPayout =
    balance && balance.available_balance_cents >= MINIMUM_PAYOUT_CENTS;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white">
        Earnings
      </h1>

      {/* Balance summary */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-white/[0.08] dark:bg-[rgb(30,32,40)]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Earned</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCents(balance?.total_earned_cents ?? 0)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-white/[0.08] dark:bg-[rgb(30,32,40)]">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Paid Out</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCents(balance?.total_paid_out_cents ?? 0)}
          </p>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-5 dark:border-green-800 dark:bg-green-900/20">
          <p className="text-sm text-green-600 dark:text-green-400">Available Balance</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
            {formatCents(balance?.available_balance_cents ?? 0)}
          </p>
          <button
            onClick={handleRequestPayout}
            disabled={!canPayout || payoutLoading}
            className="mt-3 w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {payoutLoading ? 'Processing…' : 'Request Payout'}
          </button>
          {!canPayout && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Minimum payout: {formatCents(MINIMUM_PAYOUT_CENTS)}
            </p>
          )}
        </div>
      </div>

      {/* Payout history */}
      {payouts.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Payout History
          </h2>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-white/[0.08]">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-white/[0.04]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-[rgb(30,32,40)]">
                {payouts.map((p) => (
                  <tr key={p.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {formatDate(p.requested_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {formatCents(p.amount_cents)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[p.status] ?? ''}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {p.completed_at ? formatDate(p.completed_at) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

EarningsPage.displayName = 'EarningsPage';

export default EarningsPage;
