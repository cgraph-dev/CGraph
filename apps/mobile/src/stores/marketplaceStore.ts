/**
 * Mobile Marketplace Store
 *
 * Real Zustand store replacing the useMarketplaceFacade stub.
 * Handles cosmetics marketplace: browsing, purchasing, listing management.
 *
 * @module stores/marketplaceStore
 * @since v0.9.31
 */

import { create } from 'zustand';
import api from '../lib/api';

// ── Types ──────────────────────────────────────────────────────────────

export type ItemType = 'avatar_border' | 'profile_theme' | 'chat_effect' | 'title' | 'badge';
export type ListingStatus = 'active' | 'sold' | 'cancelled' | 'expired';
export type CurrencyType = 'coins' | 'gems';
export type SortOption = 'newest' | 'oldest' | 'price_low' | 'price_high' | 'rarity';

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
  seller: { id: string; username: string; displayName: string; avatarUrl: string } | null;
  buyer?: { id: string; username: string };
}

export interface MarketplaceFilters {
  type?: ItemType;
  rarity?: string;
  minPrice?: number;
  maxPrice?: number;
  currency?: CurrencyType;
  sort: SortOption;
}

// ── Normalizer ─────────────────────────────────────────────────────────

function normalizeListing(raw: Record<string, unknown>): MarketplaceListing {
  const seller = raw.seller as Record<string, unknown> | null;
  const buyer = raw.buyer as Record<string, unknown> | undefined;
  return {
    id: raw.id as string,
    itemType: (raw.item_type || raw.itemType || 'badge') as ItemType,
    itemId: (raw.item_id || raw.itemId || '') as string,
    status: (raw.status || 'active') as ListingStatus,
    price: (raw.price || 0) as number,
    currency: (raw.currency || 'coins') as CurrencyType,
    itemName: (raw.item_name || raw.itemName || '') as string,
    itemRarity: (raw.item_rarity || raw.itemRarity || 'common') as string,
    itemPreviewUrl: (raw.item_preview_url || raw.itemPreviewUrl) as string | undefined,
    acceptsTrades: (raw.accepts_trades ?? raw.acceptsTrades ?? false) as boolean,
    listedAt: (raw.listed_at || raw.listedAt || raw.inserted_at || '') as string,
    expiresAt: (raw.expires_at || raw.expiresAt || '') as string,
    soldAt: (raw.sold_at || raw.soldAt) as string | undefined,
    seller: seller
      ? {
          id: (seller.id || '') as string,
          username: (seller.username || '') as string,
          displayName: (seller.display_name || seller.displayName || '') as string,
          avatarUrl: (seller.avatar_url || seller.avatarUrl || '') as string,
        }
      : null,
    buyer: buyer
      ? {
          id: (buyer.id || '') as string,
          username: (buyer.username || '') as string,
        }
      : undefined,
  };
}

// ── Store Interface ────────────────────────────────────────────────────

const DEFAULT_FILTERS: MarketplaceFilters = { sort: 'newest' };

interface MarketplaceState {
  listings: MarketplaceListing[];
  myListings: MarketplaceListing[];
  selectedListing: MarketplaceListing | null;
  transactionHistory: MarketplaceListing[];
  filters: MarketplaceFilters;
  hasMore: boolean;
  currentOffset: number;
  isLoading: boolean;
  isCreating: boolean;
  isPurchasing: boolean;

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
  }) => Promise<{ success: boolean }>;
  purchaseListing: (listingId: string) => Promise<{ success: boolean }>;
  cancelListing: (listingId: string) => Promise<{ success: boolean }>;
  setFilters: (filters: Partial<MarketplaceFilters>) => void;
  clearFilters: () => void;
  reset: () => void;
}

// ── Store ──────────────────────────────────────────────────────────────

export const useMarketplaceStore = create<MarketplaceState>((set, get) => ({
  listings: [],
  myListings: [],
  selectedListing: null,
  transactionHistory: [],
  filters: DEFAULT_FILTERS,
  hasMore: false,
  currentOffset: 0,
  isLoading: false,
  isCreating: false,
  isPurchasing: false,

  fetchListings: async (reset = false) => {
    const { filters, currentOffset } = get();
    const offset = reset ? 0 : currentOffset;

    set({ isLoading: true });
    try {
      const params: Record<string, unknown> = {
        offset,
        limit: 20,
        sort: filters.sort,
      };
      if (filters.type) params.type = filters.type;
      if (filters.rarity) params.rarity = filters.rarity;
      if (filters.minPrice) params.min_price = filters.minPrice;
      if (filters.maxPrice) params.max_price = filters.maxPrice;
      if (filters.currency) params.currency = filters.currency;

      const response = await api.get('/api/v1/marketplace', { params });
      const raw = response.data?.listings || response.data?.data || response.data || [];
      const newListings = (Array.isArray(raw) ? raw : []).map((l: Record<string, unknown>) =>
        normalizeListing(l)
      );
      const hasMore = newListings.length === 20;

      set((state) => ({
        listings: reset ? newListings : [...state.listings, ...newListings].slice(-200),
        hasMore,
        currentOffset: offset + newListings.length,
        isLoading: false,
      }));
    } catch {
      set({ isLoading: false });
    }
  },

  fetchListing: async (listingId: string) => {
    try {
      const response = await api.get(`/api/v1/marketplace/${listingId}`);
      const raw = response.data?.listing || response.data?.data || response.data;
      if (raw) {
        set({ selectedListing: normalizeListing(raw as Record<string, unknown>) });
      }
    } catch {
      // silently fail
    }
  },

  fetchMyListings: async (status?: ListingStatus) => {
    try {
      const params = status ? { status } : {};
      const response = await api.get('/api/v1/marketplace/my-listings', { params });
      const raw = response.data?.listings || response.data?.data || response.data || [];
      const listings = (Array.isArray(raw) ? raw : []).map((l: Record<string, unknown>) =>
        normalizeListing(l)
      );
      set({ myListings: listings });
    } catch {
      // silently fail
    }
  },

  fetchHistory: async (type?: 'buys' | 'sells') => {
    try {
      const params = type ? { type } : {};
      const response = await api.get('/api/v1/marketplace/history', { params });
      const raw = response.data?.transactions || response.data?.data || response.data || [];
      const history = (Array.isArray(raw) ? raw : []).map((l: Record<string, unknown>) =>
        normalizeListing(l)
      );
      set({ transactionHistory: history });
    } catch {
      // silently fail
    }
  },

  createListing: async (params) => {
    set({ isCreating: true });
    try {
      await api.post('/api/v1/marketplace', {
        item_type: params.itemType,
        item_id: params.itemId,
        price: params.price,
        currency: params.currency || 'coins',
      });
      set({ isCreating: false });
      // Refresh listings
      get().fetchMyListings();
      return { success: true };
    } catch {
      set({ isCreating: false });
      return { success: false };
    }
  },

  purchaseListing: async (listingId: string) => {
    set({ isPurchasing: true });
    try {
      await api.post(`/api/v1/marketplace/${listingId}/purchase`);
      set({ isPurchasing: false });
      // Remove from listings
      set((state) => ({
        listings: state.listings.filter((l) => l.id !== listingId),
      }));
      return { success: true };
    } catch {
      set({ isPurchasing: false });
      return { success: false };
    }
  },

  cancelListing: async (listingId: string) => {
    try {
      await api.delete(`/api/v1/marketplace/${listingId}`);
      set((state) => ({
        myListings: state.myListings.filter((l) => l.id !== listingId),
      }));
      return { success: true };
    } catch {
      return { success: false };
    }
  },

  setFilters: (newFilters: Partial<MarketplaceFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
    get().fetchListings(true);
  },

  clearFilters: () => {
    set({ filters: DEFAULT_FILTERS });
    get().fetchListings(true);
  },
  reset: () => set({
    listings: [],
    myListings: [],
    selectedListing: null,
    transactionHistory: [],
    filters: DEFAULT_FILTERS,
    hasMore: false,
    currentOffset: 0,
    isLoading: false,
    isCreating: false,
    isPurchasing: false,
  }),
}));

// ── Selector hooks ───────────────────────────────────────────────────

export const useMarketplaceListings = () =>
  useMarketplaceStore((s) => ({
    listings: s.listings,
    hasMore: s.hasMore,
    isLoading: s.isLoading,
  }));

export const useMyListings = () =>
  useMarketplaceStore((s) => ({
    listings: s.myListings,
    fetchMyListings: s.fetchMyListings,
    cancelListing: s.cancelListing,
  }));

export default useMarketplaceStore;
