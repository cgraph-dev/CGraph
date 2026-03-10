/**
 * Withdrawal confirmation modal.
 */
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useRequestWithdrawal } from '../../hooks/useNodes';
import toast from 'react-hot-toast';

interface WithdrawalModalProps {
  availableBalance: number;
  isOpen: boolean;
  onClose: () => void;
}

const MIN_WITHDRAWAL = 1000;
const EUR_PER_NODE = 0.008;

export function WithdrawalModal({ availableBalance, isOpen, onClose }: WithdrawalModalProps) {
  const [amount, setAmount] = useState(MIN_WITHDRAWAL);
  const mutation = useRequestWithdrawal();

  if (!isOpen) return null;

  const eurAmount = (amount * EUR_PER_NODE).toFixed(2);
  const canWithdraw = amount >= MIN_WITHDRAWAL && amount <= availableBalance;

  const handleSubmit = () => {
    mutation.mutate(amount, {
      onSuccess: () => {
        toast.success(`Withdrawal requested: €${eurAmount}`);
        onClose();
      },
      onError: () => {
        toast.error('Withdrawal failed. Please try again.');
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
        <h2 className="text-lg font-bold text-zinc-100">Request Withdrawal</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Minimum {MIN_WITHDRAWAL.toLocaleString()} nodes. Conversion: €0.80 per 100 nodes.
        </p>

        <div className="mt-4">
          <label htmlFor="withdraw-amount" className="text-sm font-medium text-zinc-300">
            Amount (nodes)
          </label>
          <input
            id="withdraw-amount"
            type="number"
            min={MIN_WITHDRAWAL}
            max={availableBalance}
            step={100}
            value={amount}
            onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 focus:border-purple-500 focus:outline-none"
          />
          <p className="mt-1.5 text-sm text-zinc-400">
            You'll receive: <strong className="text-zinc-200">€{eurAmount}</strong>
          </p>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canWithdraw || mutation.isPending}
            className={cn(
              'flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors',
              'bg-purple-600 hover:bg-purple-500 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500',
            )}
          >
            {mutation.isPending ? 'Processing…' : 'Withdraw'}
          </button>
        </div>
      </div>
    </div>
  );
}
