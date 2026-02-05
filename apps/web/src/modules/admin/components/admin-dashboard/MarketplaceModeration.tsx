/**
 * Marketplace Moderation Panel
 * Handle flagged listings, disputes, and user reports
 */

import { motion } from 'framer-motion';

export function MarketplaceModeration() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8"
    >
      <h1 className="mb-8 text-3xl font-bold">Marketplace Moderation</h1>

      <div className="mb-6 flex gap-4">
        {[
          { id: 'flagged', label: 'Flagged Listings', count: 23 },
          { id: 'disputes', label: 'Disputes', count: 5 },
          { id: 'reports', label: 'User Reports', count: 12 },
          { id: 'banned', label: 'Banned Items', count: 8 },
        ].map((tab) => (
          <button
            key={tab.id}
            className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm transition-colors hover:bg-white/10"
          >
            {tab.label}
            <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <h2 className="font-bold">Flagged Listings</h2>
          <div className="flex gap-2">
            <button className="rounded-lg bg-green-500/20 px-3 py-1 text-sm text-green-400">
              Bulk Approve
            </button>
            <button className="rounded-lg bg-red-500/20 px-3 py-1 text-sm text-red-400">
              Bulk Reject
            </button>
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 transition-colors hover:bg-white/5">
              <input type="checkbox" className="h-5 w-5 rounded bg-black/50" />
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-black/30">
                🎨
              </div>
              <div className="flex-1">
                <p className="font-medium">Suspicious Listing #{i}</p>
                <p className="text-sm text-gray-500">
                  Listed by @user{i} • {Math.floor(Math.random() * 10000)} coins
                </p>
              </div>
              <span className="rounded bg-orange-500/20 px-2 py-1 text-xs text-orange-400">
                High Risk
              </span>
              <div className="flex gap-2">
                <button className="rounded-lg bg-green-500/20 px-3 py-1 text-sm text-green-400">
                  Approve
                </button>
                <button className="rounded-lg bg-red-500/20 px-3 py-1 text-sm text-red-400">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
