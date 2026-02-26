/**
 * Marketplace Moderation Panel
 * Handle flagged listings, disputes, and user reports
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

import { marketplaceApi, type FlaggedListing } from '../../api/marketplaceApi';
import { RISK_COLORS } from './constants';

type TabId = 'flagged' | 'disputes' | 'reports' | 'banned';

/**
 * unknown for the admin module.
 */
/**
 * Marketplace Moderation component.
 */
export function MarketplaceModeration() {
  const [activeTab, setActiveTab] = useState<TabId>('flagged');
  const [listings, setListings] = useState<FlaggedListing[]>([]);
  const [counts, setCounts] = useState({ flagged: 0, disputes: 0, reports: 0, banned: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [flaggedResult, analytics] = await Promise.all([
        marketplaceApi.getFlaggedListings({ perPage: 20 }),
        marketplaceApi.getAnalytics(),
      ]);

      setListings(flaggedResult.listings);
      setCounts({
        flagged: analytics.flaggedCount,
        disputes: analytics.disputeCount,
        reports: 0,
        banned: analytics.bannedItemCount,
      });
    } catch (err) {
      console.error('Failed to fetch marketplace data:', err);
      setError('Failed to load marketplace data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (id: string) => {
    try {
      await marketplaceApi.approveListing(id);
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error('Failed to approve listing:', err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await marketplaceApi.rejectListing(id);
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error('Failed to reject listing:', err);
    }
  };

  const handleBulkApprove = async () => {
    if (selected.size === 0) return;
    try {
      await marketplaceApi.bulkApprove(Array.from(selected));
      setListings((prev) => prev.filter((l) => !selected.has(l.id)));
      setSelected(new Set());
    } catch (err) {
      console.error('Bulk approve failed:', err);
    }
  };

  const handleBulkReject = async () => {
    if (selected.size === 0) return;
    try {
      await marketplaceApi.bulkReject(Array.from(selected));
      setListings((prev) => prev.filter((l) => !selected.has(l.id)));
      setSelected(new Set());
    } catch (err) {
      console.error('Bulk reject failed:', err);
    }
  };

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const tabs: Array<{ id: TabId; label: string; countKey: keyof typeof counts }> = [
    { id: 'flagged', label: 'Flagged Listings', countKey: 'flagged' },
    { id: 'disputes', label: 'Disputes', countKey: 'disputes' },
    { id: 'reports', label: 'User Reports', countKey: 'reports' },
    { id: 'banned', label: 'Banned Items', countKey: 'banned' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8"
    >
      <h1 className="mb-8 text-3xl font-bold">Marketplace Moderation</h1>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          {error}
          <button onClick={fetchData} className="ml-4 underline hover:no-underline">
            Retry
          </button>
        </div>
      )}

      <div className="mb-6 flex gap-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors ${
              activeTab === tab.id ? 'bg-white/10 text-white' : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            {tab.label}
            {counts[tab.countKey] > 0 && (
              <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
                {counts[tab.countKey]}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <h2 className="font-bold">Flagged Listings</h2>
          <div className="flex gap-2">
            <button
              onClick={handleBulkApprove}
              disabled={selected.size === 0}
              className="rounded-lg bg-green-500/20 px-3 py-1 text-sm text-green-400 disabled:opacity-50"
            >
              Bulk Approve ({selected.size})
            </button>
            <button
              onClick={handleBulkReject}
              disabled={selected.size === 0}
              className="rounded-lg bg-red-500/20 px-3 py-1 text-sm text-red-400 disabled:opacity-50"
            >
              Bulk Reject ({selected.size})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            Loading marketplace data...
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {listings.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No flagged listings</div>
            ) : (
              listings.map((listing) => (
                <div
                  key={listing.id}
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-white/5"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(listing.id)}
                    onChange={() => toggleSelected(listing.id)}
                    className="h-5 w-5 rounded bg-black/50"
                  />
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-black/30">
                    🎨
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{listing.title}</p>
                    <p className="text-sm text-gray-500">
                      Listed by @{listing.sellerUsername} • {listing.price.toLocaleString()} coins
                    </p>
                  </div>
                  <span
                    className={`rounded px-2 py-1 text-xs ${RISK_COLORS[listing.riskLevel] || 'bg-gray-500/20 text-gray-400'}`}
                  >
                    {listing.riskLevel}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(listing.id)}
                      className="rounded-lg bg-green-500/20 px-3 py-1 text-sm text-green-400"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(listing.id)}
                      className="rounded-lg bg-red-500/20 px-3 py-1 text-sm text-red-400"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
