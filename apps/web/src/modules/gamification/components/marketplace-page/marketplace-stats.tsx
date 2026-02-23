/**
 * Marketplace statistics display.
 * @module
 */
import { useMarketplaceStore } from '@/modules/gamification/store';

export function MarketplaceStats() {
  const stats = useMarketplaceStore((state) => state.stats);

  return (
    <div className="flex gap-6">
      <div className="text-right">
        <p className="text-xs text-gray-500">Active Listings</p>
        <p className="text-xl font-bold text-white">
          {stats?.totalListings?.toLocaleString() || '—'}
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs text-gray-500">24h Volume</p>
        <p className="text-xl font-bold text-yellow-400">
          {stats?.averagePrice ? `${Math.floor(stats.averagePrice).toLocaleString()} coins` : '—'}
        </p>
      </div>
    </div>
  );
}
