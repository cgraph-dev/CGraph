/**
 * Marketplace Facade
 *
 * Unified interface for economy and purchasable items.
 * Aggregates: marketplaceStore, avatarBorderStore
 *
 * @module stores/facades/marketplaceFacade
 */

import { useMarketplaceStore } from '../../modules/gamification/store';
import { useAvatarBorderStore } from '../avatarBorderStore';

/**
 * Unified marketplace and economy facade
 * Provides a single hook for all marketplace-related state and actions
 */
export function useMarketplaceFacade() {
  const marketplace = useMarketplaceStore();
  const borders = useAvatarBorderStore();

  return {
    // === Marketplace State ===
    listings: marketplace.listings,
    selectedListing: marketplace.selectedListing,
    myListings: marketplace.myListings,
    transactionHistory: marketplace.transactionHistory,
    marketplaceStats: marketplace.stats,
    userTotals: marketplace.userTotals,
    filters: marketplace.filters,
    hasMore: marketplace.hasMore,
    isLoading: marketplace.isLoading,
    isCreating: marketplace.isCreating,
    isPurchasing: marketplace.isPurchasing,

    // === Marketplace Actions ===
    fetchListings: marketplace.fetchListings,
    fetchListing: marketplace.fetchListing,
    fetchMyListings: marketplace.fetchMyListings,
    fetchHistory: marketplace.fetchHistory,
    createListing: marketplace.createListing,
    updateListing: marketplace.updateListing,
    cancelListing: marketplace.cancelListing,
    purchaseListing: marketplace.purchaseListing,
    setFilters: marketplace.setFilters,
    clearFilters: marketplace.clearFilters,
    getPriceRecommendation: marketplace.getPriceRecommendation,

    // === Avatar Borders State ===
    allBorders: borders.allBorders,
    unlockedBorders: borders.unlockedBorders,
    borderPreferences: borders.preferences,
    previewBorderId: borders.previewBorderId,
    bordersLoading: borders.isLoading,
    bordersError: borders.error,
    borderFilters: borders.filters,

    // === Avatar Borders Getters ===
    getEquippedBorder: borders.getEquippedBorder,
    getDisplayBorder: borders.getDisplayBorder,
    isBorderUnlocked: borders.isBorderUnlocked,
    getFilteredBorders: borders.getFilteredBorders,
    getBordersByTheme: borders.getBordersByTheme,
    getFreeBorders: borders.getFreeBorders,

    // === Avatar Borders Actions ===
    initializeBorders: borders.initialize,
    equipBorder: borders.equipBorder,
    setPreviewBorder: borders.setPreviewBorder,
    purchaseBorder: borders.purchaseBorder,
    updateBorderPreferences: borders.updatePreferences,
    setBorderFilters: borders.setFilters,
    syncBordersWithServer: borders.syncWithServer,

    // === Direct Store Access (for edge cases) ===
    _stores: { marketplace, borders },
  };
}

export type MarketplaceFacade = ReturnType<typeof useMarketplaceFacade>;
