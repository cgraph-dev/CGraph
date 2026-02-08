/**
 * Marketplace Facade Hook
 *
 * Discord-style composition hook that aggregates marketplace listings,
 * avatar borders, and economy state into a single commerce interface.
 *
 * @example
 * ```tsx
 * const {
 *   listings, selectedListing,
 *   availableBorders, equippedBorder,
 *   purchaseListing, equipBorder,
 * } = useMarketplaceFacade();
 * ```
 *
 * @module hooks/facades/useMarketplaceFacade
 */

import { useMemo } from 'react';
import {
  useMarketplaceStore,
  useAvatarBorderStore,
  type MarketplaceListing,
  type MarketplaceFilters,
  type MarketplaceStats,
} from '@/modules/gamification/store';
import type { AvatarBorderConfig } from '@/types/avatar-borders';

export interface MarketplaceFacade {
  // Listings
  listings: MarketplaceListing[];
  selectedListing: MarketplaceListing | null;
  filters: MarketplaceFilters;
  stats: MarketplaceStats | null;
  isLoadingListings: boolean;
  isPurchasing: boolean;

  // Avatar borders
  allBorders: AvatarBorderConfig[];
  equippedBorder: AvatarBorderConfig | undefined;
  isLoadingBorders: boolean;

  // Listing actions
  fetchListings: (reset?: boolean) => Promise<void>;
  purchaseListing: (
    listingId: string
  ) => Promise<{ success: boolean; fee?: number; sellerReceived?: number }>;
  setFilters: (filters: Partial<MarketplaceFilters>) => void;
  clearFilters: () => void;

  // Border actions
  initializeBorders: () => Promise<void>;
  equipBorder: (borderId: string) => Promise<void>;
  purchaseBorder: (borderId: string) => Promise<boolean>;
}

/**
 * Composes marketplace and avatar border state.
 */
export function useMarketplaceFacade(): MarketplaceFacade {
  // Marketplace store
  const listings = useMarketplaceStore((s) => s.listings);
  const selectedListing = useMarketplaceStore((s) => s.selectedListing);
  const filters = useMarketplaceStore((s) => s.filters);
  const stats = useMarketplaceStore((s) => s.stats);
  const isLoadingListings = useMarketplaceStore((s) => s.isLoading);
  const isPurchasing = useMarketplaceStore((s) => s.isPurchasing);
  const fetchListings = useMarketplaceStore((s) => s.fetchListings);
  const purchaseListing = useMarketplaceStore((s) => s.purchaseListing);
  const setFilters = useMarketplaceStore((s) => s.setFilters);
  const clearFilters = useMarketplaceStore((s) => s.clearFilters);

  // Avatar border store
  const allBorders = useAvatarBorderStore((s) => s.allBorders);
  const equippedBorder = useAvatarBorderStore((s) => s.getEquippedBorder());
  const isLoadingBorders = useAvatarBorderStore((s) => s.isLoading);
  const initializeBorders = useAvatarBorderStore((s) => s.initialize);
  const equipBorder = useAvatarBorderStore((s) => s.equipBorder);
  const purchaseBorder = useAvatarBorderStore((s) => s.purchaseBorder);

  return useMemo(
    () => ({
      listings,
      selectedListing,
      filters,
      stats,
      isLoadingListings,
      isPurchasing,
      allBorders,
      equippedBorder,
      isLoadingBorders,
      fetchListings,
      purchaseListing,
      setFilters,
      clearFilters,
      initializeBorders,
      equipBorder,
      purchaseBorder,
    }),
    [
      listings,
      selectedListing,
      filters,
      stats,
      isLoadingListings,
      isPurchasing,
      allBorders,
      equippedBorder,
      isLoadingBorders,
      fetchListings,
      purchaseListing,
      setFilters,
      clearFilters,
      initializeBorders,
      equipBorder,
      purchaseBorder,
    ]
  );
}
