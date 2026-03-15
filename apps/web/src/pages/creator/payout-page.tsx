import React, { useEffect, useState } from 'react';
import { useCreatorDashboard } from '@/modules/creator/hooks/useCreatorDashboard';

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

interface PayoutDisplay {
  id: string;
  amount_cents: number;
  amountCents: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requested_at: string;
  requestedAt: string;
  completed_at: string | null;
  completedAt: string | null;
  failure_reason: string | null;
  failureReason: string | null;
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

/** Description. */
/** Payout Page component. */
export function PayoutPage(): React.ReactElement {
  const {
    balance,
    payouts: rawPayouts,
    isLoadingBalance,
    isLoading: requesting,
    fetchBalance,
    fetchPayouts,
    requestPayout,
  } = useCreatorDashboard();
   
  const payouts = (rawPayouts ?? []) as unknown as PayoutDisplay[];
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchBalance();
    fetchPayouts();
  }, [fetchBalance, fetchPayouts]);

  const handleRequestPayout = async () => {
    setError(null);
    setSuccess(null);
    const result = await requestPayout();
    if (result) {
      setSuccess(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        `Payout of ${formatCents((result as any).amountCents || (result as any).amount_cents || 0)} initiated!`
      );
    } else {
      setError('Failed to request payout');
    }
  };

  const loading = isLoadingBalance && !balance;
  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const canPayout = balance && balance.availableBalanceCents >= MINIMUM_PAYOUT_CENTS;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white">Payouts</h1>

      {/* Payout request card */}
      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 dark:border-white/[0.08] dark:bg-[rgb(30,32,40)]">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Request Withdrawal
        </h2>

        <div className="mb-4 flex items-baseline gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Available:</span>
          <span className="text-3xl font-bold text-green-600 dark:text-green-400">
            {formatCents(balance?.availableBalanceCents ?? 0)}
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
          {requesting
            ? 'Processing…'
            : `Withdraw ${formatCents(balance?.availableBalanceCents ?? 0)}`}
        </button>

        {!canPayout && (
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Minimum withdrawal: {formatCents(MINIMUM_PAYOUT_CENTS)}. Your balance must reach this
            amount before you can request a payout.
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
      <div className="rounded-lg border border-gray-200 bg-white dark:border-white/[0.08] dark:bg-[rgb(30,32,40)]">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-white/[0.08]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">History</h2>
        </div>

        {payouts.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
            No payouts yet. Request your first withdrawal above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-white/[0.04]">
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
                  const statusCfg = (STATUS_CONFIG[payout.status] ?? STATUS_CONFIG.pending)!;
                  return (
                    <tr key={payout.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {formatDate(payout.requestedAt || payout.requested_at)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {formatCents(payout.amountCents || payout.amount_cents)}
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
                        {payout.completedAt || payout.completed_at
                          ? formatDate((payout.completedAt || payout.completed_at)!)
                          : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {payout.failureReason ?? payout.failure_reason ?? '—'}
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
}

PayoutPage.displayName = 'PayoutPage';

export default PayoutPage;
