import { useEffect } from 'react';
import { useMarketplaceStore } from '@/modules/gamification/store';

export function HistorySection() {
  const { transactionHistory, userTotals, fetchHistory } = useMarketplaceStore();

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      {userTotals && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-xs text-gray-500">Total Sold</p>
            <p className="text-2xl font-bold text-green-400">{userTotals.sells.count}</p>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-xs text-gray-500">Revenue</p>
            <p className="text-2xl font-bold text-yellow-400">
              {userTotals.sells.proceeds.toLocaleString()} 🪙
            </p>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-xs text-gray-500">Total Bought</p>
            <p className="text-2xl font-bold text-blue-400">{userTotals.buys.count}</p>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-xs text-gray-500">Spent</p>
            <p className="text-2xl font-bold text-red-400">
              {userTotals.buys.total.toLocaleString()} 🪙
            </p>
          </div>
        </div>
      )}

      {/* Transaction List */}
      <div className="space-y-3">
        {transactionHistory.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                tx.transactionType === 'sell' ? 'bg-green-500/20' : 'bg-blue-500/20'
              }`}
            >
              {tx.transactionType === 'sell' ? '📤' : '📥'}
            </div>

            <div className="flex-1">
              <h3 className="font-medium">{tx.itemName}</h3>
              <p className="text-sm text-gray-500">
                {tx.transactionType === 'sell' ? 'Sold' : 'Purchased'} •{' '}
                {tx.soldAt && new Date(tx.soldAt).toLocaleDateString()}
              </p>
            </div>

            <p
              className={`font-bold ${
                tx.transactionType === 'sell' ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {tx.transactionType === 'sell' ? '+' : '-'}
              {tx.price.toLocaleString()} 🪙
            </p>
          </div>
        ))}

        {transactionHistory.length === 0 && (
          <div className="rounded-xl bg-white/5 py-16 text-center">
            <div className="mb-4 text-4xl">📜</div>
            <h3 className="mb-2 text-xl font-medium">No transactions yet</h3>
            <p className="text-gray-500">Your buy and sell history will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
