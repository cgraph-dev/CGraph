/**
 * Nodes Shop Page — /nodes/shop
 *
 * Displays purchasable node bundles and current balance.
 */
import { Link } from 'react-router-dom';
import { useNodeWallet, useNodeBundles, useCreateCheckout } from '@/modules/nodes/hooks/useNodes';
import { BundleCard } from '@/modules/nodes/components/bundle-card';

export const NodesShopPage: React.FC = () => {
  const { data: wallet } = useNodeWallet();
  const { data: bundles, isLoading } = useNodeBundles();
  const checkout = useCreateCheckout();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Get Nodes</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Power tips, unlocks, and more with Nodes.
          </p>
        </div>
        <Link
          to="/nodes"
          className="text-sm text-purple-400 hover:text-purple-300"
        >
          ← Wallet
        </Link>
      </div>

      {/* Current Balance */}
      {wallet && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-center">
          <span className="text-sm text-zinc-400">Your balance: </span>
          <span className="font-bold text-zinc-100">
            {'\u2115'} {wallet.available_balance.toLocaleString()}
          </span>
        </div>
      )}

      {/* Bundle Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {bundles?.map((bundle) => (
          <BundleCard
            key={bundle.id}
            bundle={bundle}
            onBuy={(id) => checkout.mutate(id)}
            isLoading={checkout.isPending}
          />
        ))}
      </div>

      {/* Info */}
      <p className="text-center text-xs text-zinc-500">
        Payments are processed securely via Stripe. Nodes are non-refundable.
      </p>
    </div>
  );
};

NodesShopPage.displayName = 'NodesShopPage';
export default NodesShopPage;
