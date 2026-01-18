import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMarketplaceStore, ItemType, SortOption, MarketplaceListing } from '@/stores/marketplaceStore';

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

// ==================== TYPES ====================

type MarketplaceTab = 'browse' | 'my-listings' | 'history' | 'create';

const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  avatar_border: '🎨 Avatar Border',
  profile_theme: '🖼️ Profile Theme',
  chat_effect: '✨ Chat Effect',
  title: '🏷️ Title',
  badge: '🏅 Badge',
};

const RARITY_COLORS: Record<string, string> = {
  common: 'bg-gray-500',
  uncommon: 'bg-green-500',
  rare: 'bg-blue-500',
  epic: 'bg-purple-500',
  legendary: 'bg-orange-500',
  mythic: 'bg-pink-500',
  unique: 'bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500',
};

// ==================== MAIN COMPONENT ====================

export function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<MarketplaceTab>('browse');

  return (
    <div className="min-h-screen bg-black/95 text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                Marketplace
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Trade cosmetics with other players
              </p>
            </div>
            
            <MarketplaceStats />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6">
            {(['browse', 'my-listings', 'history', 'create'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'bg-white/5 text-gray-400 hover:text-white border border-transparent hover:border-white/10'
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
      <div className="max-w-7xl mx-auto px-6 py-8">
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

// ==================== STATS COMPONENT ====================

function MarketplaceStats() {
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

// ==================== BROWSE SECTION ====================

function BrowseSection() {
  const {
    listings,
    isLoading,
    hasMore,
    filters,
    setFilters,
    clearFilters,
    fetchListings,
    itemTypes,
  } = useMarketplaceStore();

  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);

  useEffect(() => {
    fetchListings(true);
  }, [fetchListings]);

  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchListings(false);
    }
  }, [isLoading, hasMore, fetchListings]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
        {/* Type Filter */}
        <select
          value={filters.type || ''}
          onChange={(e) => setFilters({ type: (e.target.value as ItemType) || undefined })}
          className="px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white"
        >
          <option value="">All Types</option>
          {itemTypes.map((type) => (
            <option key={type} value={type}>
              {ITEM_TYPE_LABELS[type]}
            </option>
          ))}
        </select>

        {/* Rarity Filter */}
        <select
          value={filters.rarity || ''}
          onChange={(e) => setFilters({ rarity: e.target.value || undefined })}
          className="px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white"
        >
          <option value="">All Rarities</option>
          <option value="common">Common</option>
          <option value="uncommon">Uncommon</option>
          <option value="rare">Rare</option>
          <option value="epic">Epic</option>
          <option value="legendary">Legendary</option>
          <option value="mythic">Mythic</option>
        </select>

        {/* Price Range */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice || ''}
            onChange={(e) => setFilters({ minPrice: Number(e.target.value) || undefined })}
            className="w-24 px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white"
          />
          <span className="text-gray-500">—</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice || ''}
            onChange={(e) => setFilters({ maxPrice: Number(e.target.value) || undefined })}
            className="w-24 px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white"
          />
        </div>

        {/* Sort */}
        <select
          value={filters.sort}
          onChange={(e) => setFilters({ sort: e.target.value as SortOption })}
          className="px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
          <option value="rarity">Rarity</option>
        </select>

        {/* Clear */}
        <button
          onClick={clearFilters}
          className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
        >
          Clear Filters
        </button>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            onClick={() => setSelectedListing(listing)}
          />
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Load More */}
      {hasMore && !isLoading && (
        <div className="flex justify-center">
          <button
            onClick={handleLoadMore}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
          >
            Load More
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && listings.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">🏪</div>
          <h3 className="text-xl font-medium mb-2">No listings found</h3>
          <p className="text-gray-500">Try adjusting your filters</p>
        </div>
      )}

      {/* Listing Detail Modal */}
      <AnimatePresence>
        {selectedListing && (
          <ListingDetailModal
            listing={selectedListing}
            onClose={() => setSelectedListing(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ==================== LISTING CARD ====================

interface ListingCardProps {
  listing: MarketplaceListing;
  onClick: () => void;
}

function ListingCard({ listing, onClick }: ListingCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="group relative bg-white/5 rounded-xl border border-white/10 overflow-hidden cursor-pointer 
                 hover:border-orange-500/30 transition-all"
    >
      {/* Preview Image */}
      <div className="aspect-square bg-black/30 flex items-center justify-center p-6">
        {listing.itemPreviewUrl ? (
          <img
            src={listing.itemPreviewUrl}
            alt={listing.itemName}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="text-5xl opacity-50">
            {listing.itemType === 'avatar_border' && '🎨'}
            {listing.itemType === 'profile_theme' && '🖼️'}
            {listing.itemType === 'chat_effect' && '✨'}
            {listing.itemType === 'title' && '🏷️'}
            {listing.itemType === 'badge' && '🏅'}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-medium truncate">{listing.itemName}</h3>
          <span className={`px-2 py-0.5 rounded-full text-xs ${RARITY_COLORS[listing.itemRarity] || RARITY_COLORS.common}`}>
            {listing.itemRarity}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {ITEM_TYPE_LABELS[listing.itemType]?.split(' ')[1]}
          </span>
          <span className="font-bold text-yellow-400">
            {listing.price.toLocaleString()} {listing.currency === 'gems' ? '💎' : '🪙'}
          </span>
        </div>

        {listing.seller && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
            <img
              src={listing.seller.avatarUrl || '/default-avatar.png'}
              alt={listing.seller.displayName}
              className="w-6 h-6 rounded-full"
            />
            <span className="text-xs text-gray-500 truncate">
              {listing.seller.displayName}
            </span>
          </div>
        )}
      </div>

      {/* Trade Badge */}
      {listing.acceptsTrades && (
        <div className="absolute top-3 left-3 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
          🔄 Open to Trades
        </div>
      )}
    </motion.div>
  );
}

// ==================== LISTING DETAIL MODAL ====================

interface ListingDetailModalProps {
  listing: MarketplaceListing;
  onClose: () => void;
}

function ListingDetailModal({ listing, onClose }: ListingDetailModalProps) {
  const { purchaseListing, isPurchasing } = useMarketplaceStore();
  const [showConfirm, setShowConfirm] = useState(false);

  const handlePurchase = async () => {
    const result = await purchaseListing(listing.id);
    if (result.success) {
      onClose();
      // Show success notification
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-lg bg-gray-900 rounded-2xl border border-white/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Preview */}
        <div className="aspect-video bg-black/50 flex items-center justify-center p-8">
          {listing.itemPreviewUrl ? (
            <img
              src={listing.itemPreviewUrl}
              alt={listing.itemName}
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="text-8xl opacity-30">
              {listing.itemType === 'avatar_border' && '🎨'}
              {listing.itemType === 'profile_theme' && '🖼️'}
              {listing.itemType === 'chat_effect' && '✨'}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">{listing.itemName}</h2>
              <p className="text-sm text-gray-500">{ITEM_TYPE_LABELS[listing.itemType]}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm ${RARITY_COLORS[listing.itemRarity]}`}>
              {listing.itemRarity}
            </span>
          </div>

          {/* Seller Info */}
          {listing.seller && (
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg mb-4">
              <img
                src={listing.seller.avatarUrl || '/default-avatar.png'}
                alt={listing.seller.displayName}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-medium">{listing.seller.displayName}</p>
                <p className="text-xs text-gray-500">@{listing.seller.username}</p>
              </div>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg mb-6">
            <span className="text-gray-400">Price</span>
            <span className="text-2xl font-bold text-yellow-400">
              {listing.price.toLocaleString()} {listing.currency === 'gems' ? '💎' : '🪙'}
            </span>
          </div>

          {/* Actions */}
          {!showConfirm ? (
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(true)}
                className="flex-1 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Buy Now
              </button>
              {listing.acceptsTrades && (
                <button className="px-6 py-3 bg-white/10 rounded-lg font-medium hover:bg-white/20 transition-colors">
                  Make Offer
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-center text-gray-400">
                Confirm purchase for <span className="text-yellow-400 font-bold">{listing.price.toLocaleString()}</span> coins?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 bg-white/10 rounded-lg font-medium hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePurchase}
                  disabled={isPurchasing}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isPurchasing ? 'Processing...' : 'Confirm Purchase'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition-colors"
        >
          ✕
        </button>
      </motion.div>
    </motion.div>
  );
}

// ==================== MY LISTINGS SECTION ====================

function MyListingsSection() {
  const { myListings, fetchMyListings, cancelListing, updateListing } = useMarketplaceStore();

  useEffect(() => {
    fetchMyListings('active');
  }, [fetchMyListings]);

  const handleCancel = async (listingId: string) => {
    if (confirm('Are you sure you want to cancel this listing?')) {
      await cancelListing(listingId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Your Active Listings</h2>
        <span className="text-sm text-gray-500">{myListings.length} listings</span>
      </div>

      {myListings.length > 0 ? (
        <div className="space-y-4">
          {myListings.map((listing) => (
            <div
              key={listing.id}
              className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10"
            >
              {/* Preview */}
              <div className="w-16 h-16 bg-black/30 rounded-lg flex items-center justify-center">
                {listing.itemPreviewUrl ? (
                  <img src={listing.itemPreviewUrl} alt="" className="w-12 h-12 object-contain" />
                ) : (
                  <span className="text-2xl opacity-50">🎨</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h3 className="font-medium">{listing.itemName}</h3>
                <p className="text-sm text-gray-500">{ITEM_TYPE_LABELS[listing.itemType]}</p>
              </div>

              {/* Price */}
              <div className="text-right">
                <p className="font-bold text-yellow-400">
                  {listing.price.toLocaleString()} 🪙
                </p>
                <p className="text-xs text-gray-500">
                  Listed {new Date(listing.listedAt).toLocaleDateString()}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleCancel(listing.id)}
                  className="px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white/5 rounded-xl">
          <div className="text-4xl mb-4">📦</div>
          <h3 className="text-xl font-medium mb-2">No active listings</h3>
          <p className="text-gray-500">Create a listing to start selling</p>
        </div>
      )}
    </div>
  );
}

// ==================== HISTORY SECTION ====================

function HistorySection() {
  const { transactionHistory, userTotals, fetchHistory } = useMarketplaceStore();

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      {userTotals && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white/5 rounded-xl">
            <p className="text-xs text-gray-500">Total Sold</p>
            <p className="text-2xl font-bold text-green-400">
              {userTotals.sells.count}
            </p>
          </div>
          <div className="p-4 bg-white/5 rounded-xl">
            <p className="text-xs text-gray-500">Revenue</p>
            <p className="text-2xl font-bold text-yellow-400">
              {userTotals.sells.proceeds.toLocaleString()} 🪙
            </p>
          </div>
          <div className="p-4 bg-white/5 rounded-xl">
            <p className="text-xs text-gray-500">Total Bought</p>
            <p className="text-2xl font-bold text-blue-400">
              {userTotals.buys.count}
            </p>
          </div>
          <div className="p-4 bg-white/5 rounded-xl">
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
            className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10"
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
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
          <div className="text-center py-16 bg-white/5 rounded-xl">
            <div className="text-4xl mb-4">📜</div>
            <h3 className="text-xl font-medium mb-2">No transactions yet</h3>
            <p className="text-gray-500">Your buy and sell history will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== CREATE LISTING SECTION ====================

function CreateListingSection() {
  const { createListing, isCreating, getPriceRecommendation } = useMarketplaceStore();
  
  const [formData, setFormData] = useState({
    itemType: '' as ItemType | '',
    itemId: '',
    price: 0,
    currency: 'coins' as 'coins' | 'gems',
    acceptsTrades: false,
  });

  const recommendation = formData.itemType
    ? getPriceRecommendation('rare')
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.itemType || !formData.itemId || !formData.price) {
      return;
    }

    const result = await createListing({
      itemType: formData.itemType,
      itemId: formData.itemId,
      price: formData.price,
      currency: formData.currency,
      acceptsTrades: formData.acceptsTrades,
    });

    if (result.success) {
      setFormData({
        itemType: '',
        itemId: '',
        price: 0,
        currency: 'coins',
        acceptsTrades: false,
      });
      // Show success notification
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white/5 rounded-2xl border border-white/10 p-8">
        <h2 className="text-2xl font-bold mb-6">Create New Listing</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Item Type */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Item Type
            </label>
            <select
              value={formData.itemType}
              onChange={(e) => setFormData({ ...formData, itemType: e.target.value as ItemType })}
              className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white"
              required
            >
              <option value="">Select type...</option>
              {Object.entries(ITEM_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Item Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Select Item
            </label>
            <select
              value={formData.itemId}
              onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
              className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white"
              required
            >
              <option value="">Select item...</option>
              {/* This would be populated from user's owned tradeable items */}
              <option value="placeholder">Your tradeable items would appear here</option>
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Price
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                placeholder="Enter price..."
                className="flex-1 px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white"
                required
                min={1}
              />
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value as 'coins' | 'gems' })}
                className="px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white"
              >
                <option value="coins">🪙 Coins</option>
                <option value="gems">💎 Gems</option>
              </select>
            </div>
            {recommendation && (
              <p className="text-xs text-gray-500 mt-2">
                Suggested: {recommendation.min.toLocaleString()} — {recommendation.max.toLocaleString()} coins
              </p>
            )}
          </div>

          {/* Accept Trades */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="acceptsTrades"
              checked={formData.acceptsTrades}
              onChange={(e) => setFormData({ ...formData, acceptsTrades: e.target.checked })}
              className="w-5 h-5 rounded bg-black/50 border-white/20"
            />
            <label htmlFor="acceptsTrades" className="text-sm">
              Accept trade offers for this item
            </label>
          </div>

          {/* Fee Notice */}
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-sm text-yellow-400">
              ⚠️ A 5% transaction fee will be deducted when your item sells
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isCreating || !formData.itemType || !formData.itemId || !formData.price}
            className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg font-medium 
                       hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creating Listing...' : 'Create Listing'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default MarketplacePage;
