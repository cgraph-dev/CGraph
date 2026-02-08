/**
 * Marketplace Store Actions
 *
 * All async API actions and synchronous helpers for the marketplace store.
 */

import { createLogger } from '@/lib/logger';
import { api } from '@/lib/api';
import type { StoreApi } from 'zustand';
import type {
  MarketplaceState,
  MarketplaceListing,
  PriceRecommendation,
  ListingStatus,
  ItemType,
  CurrencyType,
} from './marketplace-types';
import { DEFAULT_FILTERS, PRICE_RECOMMENDATIONS } from './marketplace-types';

const logger = createLogger('MarketplaceStore');

type SetState = StoreApi<MarketplaceState>['setState'];
type GetState = StoreApi<MarketplaceState>['getState'];

// ==================== FETCH ACTIONS ====================

export function createFetchListings(set: SetState, get: GetState) {
  return async (reset = false) => {
    const state = get();
    const offset = reset ? 0 : state.currentOffset;

    set({ isLoading: true });
    try {
      const params: Record<string, string | number | undefined> = {
        offset,
        limit: 20,
        sort: state.filters.sort,
      };

      if (state.filters.type) params.type = state.filters.type;
      if (state.filters.rarity) params.rarity = state.filters.rarity;
      if (state.filters.currency) params.currency = state.filters.currency;
      if (state.filters.minPrice) params.min_price = state.filters.minPrice;
      if (state.filters.maxPrice) params.max_price = state.filters.maxPrice;

      const response = await api.get('/api/v1/marketplace', { params });

      if (response.data) {
        const newListings = response.data.listings || [];
        set({
          listings: reset ? newListings : [...state.listings, ...newListings],
          stats: response.data.stats || state.stats,
          hasMore: response.data.pagination?.hasMore ?? false,
          currentOffset: offset + newListings.length,
          itemTypes: response.data.filters?.types ?? state.itemTypes,
          currencyTypes: response.data.filters?.currencies ?? state.currencyTypes,
        });
      }
    } catch (error: unknown) {
      logger.error('Failed to fetch marketplace listings:', error);
    } finally {
      set({ isLoading: false });
    }
  };
}

export function createFetchListing(set: SetState) {
  return async (listingId: string) => {
    set({ isLoading: true });
    try {
      const response = await api.get(`/api/v1/marketplace/${listingId}`);
      if (response.data) {
        set({
          selectedListing: response.data.listing,
          priceHistory: response.data.priceHistory || [],
          recommendedPrice: response.data.recommendedPrice,
        });
      }
    } catch (error: unknown) {
      logger.error('Failed to fetch listing details:', error);
    } finally {
      set({ isLoading: false });
    }
  };
}

export function createFetchMyListings(set: SetState) {
  return async (status: ListingStatus = 'active') => {
    try {
      const response = await api.get('/api/v1/marketplace/my-listings', {
        params: { status },
      });
      if (response.data?.listings) {
        set({ myListings: response.data.listings });
      }
    } catch (error: unknown) {
      logger.error('Failed to fetch my listings:', error);
    }
  };
}

export function createFetchHistory(set: SetState) {
  return async (type?: 'buys' | 'sells') => {
    try {
      const response = await api.get('/api/v1/marketplace/history', {
        params: { type },
      });
      if (response.data) {
        set({
          transactionHistory: response.data.transactions || [],
          userTotals: response.data.totals,
        });
      }
    } catch (error: unknown) {
      logger.error('Failed to fetch transaction history:', error);
    }
  };
}

// ==================== MUTATION ACTIONS ====================

export function createCreateListing(set: SetState, get: GetState) {
  return async (params: {
    itemType: ItemType;
    itemId: string;
    price: number;
    currency?: CurrencyType;
    acceptsTrades?: boolean;
  }): Promise<{ success: boolean; listing?: MarketplaceListing; listingFee?: number }> => {
    set({ isCreating: true });
    try {
      const response = await api.post('/api/v1/marketplace', {
        item_type: params.itemType,
        item_id: params.itemId,
        price: params.price,
        currency: params.currency ?? 'coins',
        accepts_trades: params.acceptsTrades ?? false,
      });

      if (response.data?.success) {
        // Refresh my listings
        await get().fetchMyListings();

        return {
          success: true,
          listing: response.data.listing,
          listingFee: response.data.listingFee,
        };
      }
      return { success: false };
    } catch (error: unknown) {
      logger.error('Failed to create listing:', error);
      return { success: false };
    } finally {
      set({ isCreating: false });
    }
  };
}

export function createUpdateListing(set: SetState) {
  return async (listingId: string, price: number): Promise<{ success: boolean }> => {
    try {
      const response = await api.put(`/api/v1/marketplace/${listingId}`, { price });
      if (response.data?.success) {
        // Update local state
        set((state) => ({
          myListings: state.myListings.map((l) => (l.id === listingId ? { ...l, price } : l)),
        }));
        return { success: true };
      }
      return { success: false };
    } catch (error: unknown) {
      logger.error('Failed to update listing:', error);
      return { success: false };
    }
  };
}

export function createCancelListing(set: SetState) {
  return async (listingId: string): Promise<{ success: boolean }> => {
    try {
      const response = await api.delete(`/api/v1/marketplace/${listingId}`);
      if (response.data?.success) {
        // Remove from local state
        set((state) => ({
          myListings: state.myListings.filter((l) => l.id !== listingId),
        }));
        return { success: true };
      }
      return { success: false };
    } catch (error: unknown) {
      logger.error('Failed to cancel listing:', error);
      return { success: false };
    }
  };
}

export function createPurchaseListing(set: SetState) {
  return async (
    listingId: string
  ): Promise<{ success: boolean; fee?: number; sellerReceived?: number }> => {
    set({ isPurchasing: true });
    try {
      const response = await api.post(`/api/v1/marketplace/${listingId}/buy`);
      if (response.data?.success) {
        // Remove from listings
        set((state) => ({
          listings: state.listings.filter((l) => l.id !== listingId),
          selectedListing: null,
        }));

        return {
          success: true,
          fee: response.data.fee,
          sellerReceived: response.data.sellerReceived,
        };
      }
      return { success: false };
    } catch (error: unknown) {
      logger.error('Failed to purchase listing:', error);
      return { success: false };
    } finally {
      set({ isPurchasing: false });
    }
  };
}

// ==================== FILTER ACTIONS ====================

export function createSetFilters(set: SetState, get: GetState) {
  return (newFilters: Partial<MarketplaceState['filters']>) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
    // Refresh listings with new filters
    get().fetchListings(true);
  };
}

export function createClearFilters(set: SetState, get: GetState) {
  return () => {
    set({ filters: DEFAULT_FILTERS });
    get().fetchListings(true);
  };
}

// ==================== HELPERS ====================

export function getPriceRecommendation(rarity: string): PriceRecommendation {
  return PRICE_RECOMMENDATIONS[rarity.toLowerCase()] ?? PRICE_RECOMMENDATIONS['common']!;
}
