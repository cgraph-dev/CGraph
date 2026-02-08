/**
 * Marketplace Store
 *
 * Manages the cosmetics marketplace with:
 * - Listing browsing and filtering
 * - Creating and managing listings
 * - Purchasing items
 * - Transaction history
 *
 * Split into submodules:
 * - marketplace-types.ts: Type definitions & constants
 * - marketplace-actions.ts: API actions & helpers
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Re-export all types & constants from submodules
export type {
  ItemType,
  ListingStatus,
  CurrencyType,
  SortOption,
  MarketplaceSeller,
  MarketplaceListing,
  MarketplaceStats,
  UserTotals,
  PriceRecommendation,
  MarketplaceFilters,
  MarketplaceState,
} from './marketplace-types';

import type { MarketplaceState } from './marketplace-types';
import { DEFAULT_FILTERS } from './marketplace-types';

import {
  createFetchListings,
  createFetchListing,
  createFetchMyListings,
  createFetchHistory,
  createCreateListing,
  createUpdateListing,
  createCancelListing,
  createPurchaseListing,
  createSetFilters,
  createClearFilters,
  getPriceRecommendation,
} from './marketplace-actions';

// ==================== STORE IMPLEMENTATION ====================

export const useMarketplaceStore = create<MarketplaceState>()(
  persist(
    (set, get) => ({
      // Initial state
      listings: [],
      selectedListing: null,
      priceHistory: [],
      recommendedPrice: null,
      myListings: [],
      transactionHistory: [],
      userTotals: null,
      stats: null,
      filters: DEFAULT_FILTERS,
      hasMore: false,
      currentOffset: 0,
      isLoading: false,
      isCreating: false,
      isPurchasing: false,
      itemTypes: ['avatar_border', 'profile_theme', 'chat_effect', 'title', 'badge'],
      currencyTypes: ['coins', 'gems'],

      // Actions (delegated to marketplace-actions)
      fetchListings: createFetchListings(set, get),
      fetchListing: createFetchListing(set),
      fetchMyListings: createFetchMyListings(set),
      fetchHistory: createFetchHistory(set),
      createListing: createCreateListing(set, get),
      updateListing: createUpdateListing(set),
      cancelListing: createCancelListing(set),
      purchaseListing: createPurchaseListing(set),
      setFilters: createSetFilters(set, get),
      clearFilters: createClearFilters(set, get),
      getPriceRecommendation,
    }),
    {
      name: 'cgraph-marketplace',
      partialize: (state) => ({
        filters: state.filters,
      }),
    }
  )
);

// ==================== SELECTOR HOOKS ====================

export const useMarketplaceListings = () =>
  useMarketplaceStore((state) => ({
    listings: state.listings,
    hasMore: state.hasMore,
    isLoading: state.isLoading,
    stats: state.stats,
  }));

export const useMarketplaceFilters = () =>
  useMarketplaceStore((state) => ({
    filters: state.filters,
    setFilters: state.setFilters,
    clearFilters: state.clearFilters,
    itemTypes: state.itemTypes,
    currencyTypes: state.currencyTypes,
  }));

export const useMyListings = () =>
  useMarketplaceStore((state) => ({
    listings: state.myListings,
    fetchMyListings: state.fetchMyListings,
    cancelListing: state.cancelListing,
    updateListing: state.updateListing,
  }));

export const useTransactionHistory = () =>
  useMarketplaceStore((state) => ({
    transactions: state.transactionHistory,
    totals: state.userTotals,
    fetchHistory: state.fetchHistory,
  }));

export default useMarketplaceStore;
