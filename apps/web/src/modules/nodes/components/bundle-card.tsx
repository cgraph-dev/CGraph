/**
 * Bundle card component — displays a node bundle for purchase.
 */
import { cn } from '@/lib/utils';
import type { NodeBundle } from '../types';

interface BundleCardProps {
  bundle: NodeBundle;
  onBuy: (bundleId: string) => void;
  isLoading?: boolean;
}

export function BundleCard({ bundle, onBuy, isLoading }: BundleCardProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col items-center rounded-xl border p-6 transition-all',
        bundle.popular
          ? 'border-purple-500 bg-purple-950/20 shadow-lg shadow-purple-500/10'
          : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700',
      )}
    >
      {bundle.popular && (
        <span className="absolute -top-3 rounded-full bg-purple-500 px-3 py-0.5 text-xs font-semibold text-white">
          Most Popular
        </span>
      )}

      <h3 className="mt-1 text-lg font-bold text-zinc-100">{bundle.name}</h3>

      <p className="mt-2 text-3xl font-extrabold text-zinc-50">
        {'\u2115'} {bundle.nodes.toLocaleString()}
      </p>

      {bundle.bonus_percent > 0 && (
        <span className="mt-1 rounded-full bg-green-900/50 px-2 py-0.5 text-xs font-medium text-green-400">
          +{bundle.bonus_percent}% bonus
        </span>
      )}

      <p className="mt-3 text-xl font-semibold text-zinc-300">
        €{bundle.price.toFixed(2)}
      </p>

      <button
        type="button"
        onClick={() => onBuy(bundle.id)}
        disabled={isLoading}
        className={cn(
          'mt-4 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors',
          bundle.popular
            ? 'bg-purple-600 text-white hover:bg-purple-500 disabled:bg-purple-800'
            : 'bg-zinc-700 text-zinc-100 hover:bg-zinc-600 disabled:bg-zinc-800',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        {isLoading ? 'Redirecting…' : 'Buy'}
      </button>
    </div>
  );
}
