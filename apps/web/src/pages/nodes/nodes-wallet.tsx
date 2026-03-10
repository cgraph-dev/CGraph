/**
 * Nodes Wallet Page — /nodes
 *
 * Shows balance, transaction history, and withdrawal.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNodeWallet, useNodeTransactions } from '@/modules/nodes/hooks/useNodes';
import { TransactionRow } from '@/modules/nodes/components/transaction-row';
import { WithdrawalModal } from '@/modules/nodes/components/withdrawal-modal';
import { cn } from '@/lib/utils';
import type { TransactionType } from '@/modules/nodes/types';

const filterTabs: Array<{ label: string; value: TransactionType | undefined }> = [
  { label: 'All', value: undefined },
  { label: 'Purchases', value: 'purchase' },
  { label: 'Tips', value: 'tip_sent' },
  { label: 'Received', value: 'tip_received' },
  { label: 'Unlocks', value: 'content_unlock' },
  { label: 'Withdrawals', value: 'withdrawal' },
];

export const NodesWalletPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<TransactionType | undefined>(undefined);
  const [showWithdrawal, setShowWithdrawal] = useState(false);

  const { data: wallet, isLoading: walletLoading } = useNodeWallet();
  const { data: transactions, isLoading: txLoading } = useNodeTransactions(activeFilter);

  if (walletLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  const available = wallet?.available_balance ?? 0;
  const pending = wallet?.pending_balance ?? 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      {/* Balance Card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 text-center">
        <p className="text-sm font-medium text-zinc-400">Available Balance</p>
        <p className="mt-1 text-4xl font-extrabold text-zinc-50">
          {'\u2115'} {available.toLocaleString()}
        </p>
        {pending > 0 && (
          <p className="mt-1 text-sm text-zinc-500">
            Pending: {'\u2115'} {pending.toLocaleString()}
          </p>
        )}

        <div className="mt-4 flex items-center justify-center gap-3">
          <Link
            to="/nodes/shop"
            className="rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-500"
          >
            Get Nodes
          </Link>
          {available >= 1000 && (
            <button
              type="button"
              onClick={() => setShowWithdrawal(true)}
              className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
            >
              Withdraw
            </button>
          )}
        </div>
      </div>

      {/* Lifetime Stats */}
      {wallet && (
        <div className="flex justify-center gap-6 text-xs text-zinc-500">
          <span>
            Earned: {'\u2115'} {wallet.lifetime_earned.toLocaleString()}
          </span>
          <span>·</span>
          <span>
            Spent: {'\u2115'} {wallet.lifetime_spent.toLocaleString()}
          </span>
        </div>
      )}

      {/* Transaction History */}
      <div>
        <h2 className="text-lg font-bold text-zinc-100">Transaction History</h2>

        {/* Filter Tabs */}
        <div className="mt-3 flex flex-wrap gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => setActiveFilter(tab.value)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                activeFilter === tab.value
                  ? 'bg-purple-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Transaction List */}
        <div className="mt-4 space-y-2">
          {txLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
            </div>
          ) : !transactions?.length ? (
            <p className="py-8 text-center text-sm text-zinc-500">No transactions yet</p>
          ) : (
            transactions.map((tx) => <TransactionRow key={tx.id} transaction={tx} />)
          )}
        </div>
      </div>

      {/* Withdrawal Modal */}
      <WithdrawalModal
        availableBalance={available}
        isOpen={showWithdrawal}
        onClose={() => setShowWithdrawal(false)}
      />
    </div>
  );
};

NodesWalletPage.displayName = 'NodesWalletPage';
export default NodesWalletPage;
