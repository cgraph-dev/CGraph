/**
 * Transaction row component — displays a single node transaction.
 */
import { cn } from '@/lib/utils';
import type { NodeTransaction } from '../types';

const typeConfig: Record<string, { label: string; icon: string; colorClass: string }> = {
  purchase: { label: 'Purchase', icon: '💎', colorClass: 'text-green-500' },
  tip_sent: { label: 'Tip Sent', icon: '🎁', colorClass: 'text-red-500' },
  tip_received: { label: 'Tip Received', icon: '🎁', colorClass: 'text-green-500' },
  content_unlock: { label: 'Content Unlock', icon: '🔓', colorClass: 'text-red-500' },
  subscription_received: { label: 'Subscription', icon: '⭐', colorClass: 'text-green-500' },
  subscription_sent: { label: 'Subscription', icon: '⭐', colorClass: 'text-red-500' },
  withdrawal: { label: 'Withdrawal', icon: '💸', colorClass: 'text-red-500' },
  cosmetic_purchase: { label: 'Cosmetic', icon: '🎨', colorClass: 'text-red-500' },
};

const fallbackConfig = { label: 'Transaction', icon: '📝', colorClass: 'text-zinc-400' };

interface TransactionRowProps {
  transaction: NodeTransaction;
}

export function TransactionRow({ transaction }: TransactionRowProps) {
  const config = typeConfig[transaction.type] ?? fallbackConfig;
  const isPositive = transaction.amount > 0;
  const formattedDate = new Date(transaction.inserted_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-lg">{config.icon}</span>
        <div>
          <p className="text-sm font-medium text-zinc-100">{config.label}</p>
          <p className="text-xs text-zinc-500">{formattedDate}</p>
        </div>
      </div>
      <span
        className={cn(
          'text-sm font-semibold tabular-nums',
          isPositive ? 'text-green-500' : 'text-red-500',
        )}
      >
        {isPositive ? '+' : ''}
        {'\u2115'} {Math.abs(transaction.amount).toLocaleString()}
      </span>
    </div>
  );
}
