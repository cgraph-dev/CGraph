import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

/**
 * Marketplace Store
 *
 * Manages the cosmetics marketplace with:
 * - Listing browsing and filtering
 * - Creating and managing listings
 * - Purchasing items
 * - Transaction history
 */

// ==================== TYPE DEFINITIONS ====================

export type ItemType = 'avatar_border' | 'profile_theme' | 'chat_effect' | 'title' | 'badge';
export type ListingStatus = 'active' | 'sold' | 'cancelled' | 'expired';
export type CurrencyType = 'coins' | 'gems';
export type SortOption = 'newest' | 'oldest' | 'price_low' | 'price_high' | 'rarity';

export interface MarketplaceSeller {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  avatarBorderId?: string | null;
  avatar_border_id?: string | null;
}

export interface MarketplaceListing {
  id: string;
  itemType: ItemType;
  itemId: string;
  status: ListingStatus;
  price: number;
  currency: CurrencyType;
  itemName: string;
  itemRarity: string;
  itemPreviewUrl?: string;
  acceptsTrades: boolean;
  listedAt: string;
  expiresAt: string;
  soldAt?: string;
  seller: MarketplaceSeller | null;
  buyer?: { id: string; username: string };
}

export interface MarketplaceStats {
  totalListings: number;
  totalSold: number;
  averagePrice: number;
}

export interface UserTotals {
  sells: {
    count: number;
    total: number;
    fees: number;
    proceeds: number;
  };
  buys: {
    count: number;
    total: number;
  };
}

export interface PriceRecommendation {
  min: number;
  max: number;
  suggested: number;
}

export interface MarketplaceFilters {
  type?: ItemType;
  rarity?: string;
  minPrice?: number;
  maxPrice?: number;
  currency?: CurrencyType;
  sort: SortOption;
}

// ==================== STATE INTERFACE ====================

export interface MarketplaceState {
  // Listings
  listings: MarketplaceListing[];
  selectedListing: MarketplaceListing | null;
  priceHistory: Array<{ price: number; soldAt: string }>;
  recommendedPrice: PriceRecommendation | null;

  // User's listings
  myListings: MarketplaceListing[];
  transactionHistory: Array<MarketplaceListing & { transactionType: 'buy' | 'sell' }>;
  userTotals: UserTotals | null;

  // Stats
  stats: MarketplaceStats | null;

  // Filters
  filters: MarketplaceFilters;

  // Pagination
  hasMore: boolean;
  currentOffset: number;

  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isPurchasing: boolean;

  // Available filter options
  itemTypes: ItemType[];
  currencyTypes: CurrencyType[];

  // Actions
  fetchListings: (reset?: boolean) => Promise<void>;
  fetchListing: (listingId: string) => Promise<void>;
  fetchMyListings: (status?: ListingStatus) => Promise<void>;
  fetchHistory: (type?: 'buys' | 'sells') => Promise<void>;

  createListing: (params: {
    itemType: ItemType;
    itemId: string;
    price: number;
    currency?: CurrencyType;
    acceptsTrades?: boolean;
  }) => Promise<{ success: boolean; listing?: MarketplaceListing; listingFee?: number }>;

  updateListing: (listingId: string, price: number) => Promise<{ success: boolean }>;
  cancelListing: (listingId: string) => Promise<{ success: boolean }>;
  purchaseListing: (
    listingId: string
  ) => Promise<{ success: boolean; fee?: number; sellerReceived?: number }>;

  // Filter actions
  setFilters: (filters: Partial<MarketplaceFilters>) => void;
  clearFilters: () => void;

  // Helpers
  getPriceRecommendation: (rarity: string) => PriceRecommendation;
}

// ==================== DEFAULT FILTERS ====================

const DEFAULT_FILTERS: MarketplaceFilters = {
  sort: 'newest',
};

// ==================== PRICE RECOMMENDATIONS ====================

const PRICE_RECOMMENDATIONS: Record<string, PriceRecommendation> = {
  common: { min: 100, max: 500, suggested: 250 },
  uncommon: { min: 300, max: 1500, suggested: 750 },
  rare: { min: 1000, max: 5000, suggested: 2500 },
  epic: { min: 3000, max: 15000, suggested: 7500 },
  legendary: { min: 10000, max: 50000, suggested: 25000 },
  mythic: { min: 25000, max: 150000, suggested: 75000 },
  unique: { min: 50000, max: 500000, suggested: 150000 },
};

// ==================== STORE IMPLEMENTATION ====================

export const useMarketplaceStore = create<MarketplaceState>()(
  persist(
    (set, get) => ({
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

      fetchListings: async (reset = false) => {
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
        } catch (error) {
          console.error('Failed to fetch marketplace listings:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      fetchListing: async (listingId: string) => {
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
        } catch (error) {
          console.error('Failed to fetch listing details:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      fetchMyListings: async (status = 'active') => {
        try {
          const response = await api.get('/api/v1/marketplace/my-listings', {
            params: { status },
          });
          if (response.data?.listings) {
            set({ myListings: response.data.listings });
          }
        } catch (error) {
          console.error('Failed to fetch my listings:', error);
        }
      },

      fetchHistory: async (type?: 'buys' | 'sells') => {
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
        } catch (error) {
          console.error('Failed to fetch transaction history:', error);
        }
      },

      createListing: async (params) => {
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
        } catch (error) {
          console.error('Failed to create listing:', error);
          return { success: false };
        } finally {
          set({ isCreating: false });
        }
      },

      updateListing: async (listingId: string, price: number) => {
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
        } catch (error) {
          console.error('Failed to update listing:', error);
          return { success: false };
        }
      },

      cancelListing: async (listingId: string) => {
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
        } catch (error) {
          console.error('Failed to cancel listing:', error);
          return { success: false };
        }
      },

      purchaseListing: async (listingId: string) => {
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
        } catch (error) {
          console.error('Failed to purchase listing:', error);
          return { success: false };
        } finally {
          set({ isPurchasing: false });
        }
      },

      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        }));
        // Refresh listings with new filters
        get().fetchListings(true);
      },

      clearFilters: () => {
        set({ filters: DEFAULT_FILTERS });
        get().fetchListings(true);
      },

      getPriceRecommendation: (rarity: string): PriceRecommendation => {
        return PRICE_RECOMMENDATIONS[rarity.toLowerCase()] ?? PRICE_RECOMMENDATIONS['common']!;
      },
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
