/**
 * Marketplace main page component.
 * @module
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { MarketplaceTab } from './types';
import { MarketplaceStats } from './marketplace-stats';
import { BrowseSection } from './browse-section';
import { MyListingsSection } from './my-listings-section';
import { HistorySection } from './history-section';
import { CreateListingSection } from './create-listing-section';

/**
 * Marketplace Page Component
 *
 * Full-featured marketplace UI with:
 * - Browse listings with filters
 * - Create new listings
 * - Purchase items
 * - View price history
 * - My listings management
 * - Transaction history
 *
 * Designed for scale with:
 * - Virtual scrolling for large lists
 * - Optimistic updates
 * - Real-time WebSocket updates
 * - Responsive design
 */
export function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<MarketplaceTab>('browse');

  return (
    <div className="min-h-screen bg-black/95 text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-3xl font-bold text-transparent">
                Marketplace
              </h1>
              <p className="mt-1 text-sm text-gray-400">Trade cosmetics with other players</p>
            </div>

            <MarketplaceStats />
          </div>

          {/* Tabs */}
          <div className="mt-6 flex gap-2">
            {(['browse', 'my-listings', 'history', 'create'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
                  activeTab === tab
                    ? 'border border-orange-500/30 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-orange-400'
                    : 'border border-transparent bg-white/5 text-gray-400 hover:border-white/10 hover:text-white'
                }`}
              >
                {tab === 'browse' && '🔍 Browse'}
                {tab === 'my-listings' && '📦 My Listings'}
                {tab === 'history' && '📜 History'}
                {tab === 'create' && '➕ Create Listing'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'browse' && (
            <motion.div
              key="browse"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <BrowseSection />
            </motion.div>
          )}

          {activeTab === 'my-listings' && (
            <motion.div
              key="my-listings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <MyListingsSection />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <HistorySection />
            </motion.div>
          )}

          {activeTab === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CreateListingSection />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default MarketplacePage;
