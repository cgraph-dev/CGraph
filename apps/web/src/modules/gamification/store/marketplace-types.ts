/**
 * Marketplace Type Definitions & Constants
 *
 * All shared types, interfaces, and constant values for the marketplace store.
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

  /** Reset store to initial state */
  reset: () => void;
}

// ==================== DEFAULT FILTERS ====================

export const DEFAULT_FILTERS: MarketplaceFilters = {
  sort: 'newest',
};

// ==================== PRICE RECOMMENDATIONS ====================

export const PRICE_RECOMMENDATIONS: Record<string, PriceRecommendation> = {
  common: { min: 100, max: 500, suggested: 250 },
  uncommon: { min: 300, max: 1500, suggested: 750 },
  rare: { min: 1000, max: 5000, suggested: 2500 },
  epic: { min: 3000, max: 15000, suggested: 7500 },
  legendary: { min: 10000, max: 50000, suggested: 25000 },
  mythic: { min: 25000, max: 150000, suggested: 75000 },
  unique: { min: 50000, max: 500000, suggested: 150000 },
};
