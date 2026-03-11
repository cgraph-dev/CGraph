/**
 * Tip modal — send nodes to another user.
 *
 * Shows preset amounts, custom input, 20% platform fee disclosure,
 * and balance check.
 */
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useSendTip, useNodeWallet } from '../hooks/useNodes';
import { MIN_TIP } from '@cgraph/shared-types/nodes';
import toast from 'react-hot-toast';

interface TipModalProps {
  recipientId: string;
  recipientName: string;
  isOpen: boolean;
  onClose: () => void;
  /** Source context where the tip was initiated */
  context?: 'dm' | 'profile' | 'forum';
}

const PRESETS = [10, 50, 100, 500] as const;

/** Tip modal — lets the user send Nodes to another user. */
export function TipModal({
  recipientId,
  recipientName,
  isOpen,
  onClose,
  context: _context,
}: TipModalProps) {
  const [amount, setAmount] = useState<number>(PRESETS[0]);
  const [customMode, setCustomMode] = useState(false);
  const { data: wallet } = useNodeWallet();
  const tipMutation = useSendTip();

  if (!isOpen) return null;

  const available = wallet?.available_balance ?? 0;
  const belowMinimum = amount < MIN_TIP;
  const canTip = amount >= MIN_TIP && amount <= available;
  const creatorReceives = Math.floor(amount * 0.8);

  const handleSend = () => {
    tipMutation.mutate(
      { recipientId, amount },
      {
        onSuccess: () => {
          toast.success(`Tipped \u2115 ${amount} to @${recipientName}`);
          onClose();
        },
        onError: () => {
          toast.error('Tip failed. Please try again.');
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xs rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-xl">
        <h3 className="text-base font-bold text-zinc-100">Tip @{recipientName}</h3>

        {/* Preset Amounts */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setAmount(preset);
                setCustomMode(false);
              }}
              className={cn(
                'rounded-lg py-2 text-sm font-medium transition-colors',
                !customMode && amount === preset
                  ? 'bg-purple-600 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              )}
            >
              {'\u2115'} {preset}
            </button>
          ))}
        </div>

        {/* Custom Amount */}
        <button
          type="button"
          onClick={() => setCustomMode(true)}
          className={cn(
            'mt-2 w-full rounded-lg py-2 text-sm font-medium transition-colors',
            customMode ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          )}
        >
          Custom Amount
        </button>

        {customMode && (
          <input
            type="number"
            min={1}
            max={available}
            value={amount}
            onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-purple-500 focus:outline-none"
            placeholder="Enter amount"
            autoFocus
          />
        )}

        {/* Info */}
        <div className="mt-3 space-y-1 text-xs text-zinc-500">
          <p>
            Creator receives {'\u2115'} {creatorReceives} (80%)
          </p>
          {belowMinimum && <p className="text-red-400">Minimum tip is {MIN_TIP} Nodes</p>}
          <p>
            Your balance: {'\u2115'} {available.toLocaleString()}
            {!canTip && amount >= MIN_TIP && (
              <span className="ml-1 text-red-400">— insufficient</span>
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={!canTip || tipMutation.isPending}
            className={cn(
              'flex-1 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors',
              'hover:bg-purple-500 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500'
            )}
          >
            {tipMutation.isPending ? 'Sending…' : `Send \u2115 ${amount}`}
          </button>
        </div>
      </div>
    </div>
  );
}
