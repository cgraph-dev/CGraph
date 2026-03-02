import React, { useEffect, useState } from 'react';

/**
 * PayoutPage — payout request and history.
 *
 * Shows:
 * - Payout request form (full balance withdrawal)
 * - History with status badges
 * - Link to Stripe Express dashboard for bank account management
 *
 * Route: /creator/payouts
 */

interface Balance {
  total_earned_cents: number;
  total_paid_out_cents: number;
  available_balance_cents: number;
}

interface Payout {
  id: string;
  amount_cents: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requested_at: string;
  completed_at: string | null;
  failure_reason: string | null;
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

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    icon: '⏳',
  },
  processing: {
    label: 'Processing',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    icon: '🔄',
  },
  completed: {
    label: 'Completed',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    icon: '✅',
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    icon: '❌',
  },
};

const MINIMUM_PAYOUT_CENTS = 1000;

export const PayoutPage: React.FC = () => {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      setError('Failed to load payout data');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    setRequesting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/v1/creator/payout', { method: 'POST' });
      const data = await res.json();

      if (res.ok && data.data) {
        setSuccess(`Payout of ${formatCents(data.data.amount_cents)} initiated!`);
        await fetchData();
      } else {
        setError(data.error?.message ?? 'Failed to request payout');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const canPayout = balance && balance.available_balance_cents >= MINIMUM_PAYOUT_CENTS;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white">Payouts</h1>

      {/* Payout request card */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Request Withdrawal
        </h2>

        <div className="mb-4 flex items-baseline gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Available:</span>
          <span className="text-3xl font-bold text-green-600 dark:text-green-400">
            {formatCents(balance?.available_balance_cents ?? 0)}
          </span>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">
            {success}
          </div>
        )}

        <button
          onClick={handleRequestPayout}
          disabled={!canPayout || requesting}
          className="w-full rounded-lg bg-green-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {requesting ? 'Processing…' : `Withdraw ${formatCents(balance?.available_balance_cents ?? 0)}`}
        </button>

        {!canPayout && (
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Minimum withdrawal: {formatCents(MINIMUM_PAYOUT_CENTS)}. Your balance must reach
            this amount before you can request a payout.
          </p>
        )}

        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
          Funds are transferred to your bank account via Stripe. Processing typically takes 2-7
          business days.{' '}
          <a
            href="https://dashboard.stripe.com/express"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Manage bank account →
          </a>
        </p>
      </div>

      {/* Payout history */}
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">History</h2>
        </div>

        {payouts.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
            No payouts yet. Request your first withdrawal above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Requested
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Completed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {payouts.map((payout) => {
                  const statusCfg = STATUS_CONFIG[payout.status] ?? STATUS_CONFIG.pending;
                  return (
                    <tr key={payout.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {formatDate(payout.requested_at)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {formatCents(payout.amount_cents)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.className}`}
                        >
                          <span>{statusCfg.icon}</span>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {payout.completed_at ? formatDate(payout.completed_at) : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {payout.failure_reason ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

PayoutPage.displayName = 'PayoutPage';

export default PayoutPage;
