/**
 * Marketplace browse and filter section.
 * @module
 */
import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  useMarketplaceStore,
  type ItemType,
  type MarketplaceListing,
  type SortOption,
} from '@/modules/gamification/store';
import { ITEM_TYPE_LABELS } from './types';
import { ListingCard } from './listing-card';
import { ListingDetailModal } from './listing-detail-modal';

/**
 * unknown for the gamification module.
 */
/**
 * Browse Section section component.
 */
export function BrowseSection() {
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
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
        {/* Type Filter */}
        <select
          value={filters.type || ''}
           
          onChange={(e) => setFilters({ type: (e.target.value as ItemType) || undefined })} // type assertion: select value constrained to ItemType
          className="rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white"
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
          className="rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white"
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
            className="w-24 rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
          />
          <span className="text-gray-500">—</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice || ''}
            onChange={(e) => setFilters({ maxPrice: Number(e.target.value) || undefined })}
            className="w-24 rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-white"
          />
        </div>

        {/* Sort */}
        <select
          value={filters.sort}
           
          onChange={(e) => setFilters({ sort: e.target.value as SortOption })} // type assertion: select value constrained to SortOption
          className="rounded-lg border border-white/10 bg-black/50 px-4 py-2 text-white"
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
          className="px-4 py-2 text-gray-400 transition-colors hover:text-white"
        >
          Clear Filters
        </button>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
        </div>
      )}

      {/* Load More */}
      {hasMore && !isLoading && (
        <div className="flex justify-center">
          <button
            onClick={handleLoadMore}
            className="rounded-lg border border-white/10 bg-white/5 px-6 py-3 transition-colors hover:bg-white/10"
          >
            Load More
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && listings.length === 0 && (
        <div className="py-16 text-center">
          <div className="mb-4 text-4xl">🏪</div>
          <h3 className="mb-2 text-xl font-medium">No listings found</h3>
          <p className="text-gray-500">Try adjusting your filters</p>
        </div>
      )}

      {/* Listing Detail Modal */}
      <AnimatePresence>
        {selectedListing && (
          <ListingDetailModal listing={selectedListing} onClose={() => setSelectedListing(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
