// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/**
 * Marketplace Store Unit Tests
 *
 * Covers: initial state, fetchListings, fetchListing, fetchMyListings,
 * fetchHistory, createListing, updateListing, cancelListing,
 * purchaseListing, setFilters, clearFilters, getPriceRecommendation,
 * pagination, error handling, and edge cases.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useMarketplaceStore } from '../marketplaceSlice';
import type { MarketplaceListing, MarketplaceFilters } from '../marketplace-types';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from '@/lib/api';

const mockedApi = vi.mocked(api, { deep: true });

// ── Fixtures ──────────────────────────────────────────────────────────

const mockListing: MarketplaceListing = {
  id: 'listing-1',
  itemType: 'badge',
  itemId: 'badge-gold',
  status: 'active',
  price: 500,
  currency: 'coins',
  itemName: 'Gold Badge',
  itemRarity: 'rare',
  acceptsTrades: false,
  listedAt: '2026-01-01T00:00:00Z',
  expiresAt: '2026-02-01T00:00:00Z',
  seller: { id: 'u1', username: 'alice', displayName: 'Alice', avatarUrl: '' },
};

const mockListing2: MarketplaceListing = {
  id: 'listing-2',
  itemType: 'title',
  itemId: 'title-lord',
  status: 'active',
  price: 1200,
  currency: 'gems',
  itemName: 'Lord Title',
  itemRarity: 'epic',
  acceptsTrades: true,
  listedAt: '2026-01-05T00:00:00Z',
  expiresAt: '2026-02-05T00:00:00Z',
  seller: { id: 'u2', username: 'bob', displayName: 'Bob', avatarUrl: '' },
};

function resetStore() {
  useMarketplaceStore.setState({
    listings: [],
    selectedListing: null,
    priceHistory: [],
    recommendedPrice: null,
    myListings: [],
    transactionHistory: [],
    userTotals: null,
    stats: null,
    filters: { sort: 'newest' },
    hasMore: false,
    currentOffset: 0,
    isLoading: false,
    isCreating: false,
    isPurchasing: false,
    itemTypes: ['avatar_border', 'profile_theme', 'chat_effect', 'title', 'badge'],
    currencyTypes: ['coins', 'gems'],
  });
}

// ── Tests ──────────────────────────────────────────────────────────────

describe('marketplaceStore', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  // ==================== INITIAL STATE ====================

  describe('initial state', () => {
    it('has empty listings', () => {
      expect(useMarketplaceStore.getState().listings).toEqual([]);
    });

    it('has default filters with newest sort', () => {
      expect(useMarketplaceStore.getState().filters.sort).toBe('newest');
    });

    it('has loading flags set to false', () => {
      const s = useMarketplaceStore.getState();
      expect(s.isLoading).toBe(false);
      expect(s.isCreating).toBe(false);
      expect(s.isPurchasing).toBe(false);
    });

    it('has null selectedListing and stats', () => {
      const s = useMarketplaceStore.getState();
      expect(s.selectedListing).toBeNull();
      expect(s.stats).toBeNull();
    });
  });

  // ==================== fetchListings ====================

  describe('fetchListings', () => {
    it('populates listings from API response', async () => {
      mockedApi.get.mockResolvedValueOnce({
        data: {
          listings: [mockListing, mockListing2],
          stats: { totalListings: 2, totalSold: 0, averagePrice: 850 },
          pagination: { hasMore: true },
        },
      });

      await useMarketplaceStore.getState().fetchListings(true);

      const s = useMarketplaceStore.getState();
      expect(s.listings).toHaveLength(2);
      expect(s.stats?.totalListings).toBe(2);
      expect(s.hasMore).toBe(true);
      expect(s.isLoading).toBe(false);
    });

    it('appends listings when reset=false', async () => {
      useMarketplaceStore.setState({ listings: [mockListing], currentOffset: 1 });
      mockedApi.get.mockResolvedValueOnce({
        data: { listings: [mockListing2], pagination: { hasMore: false } },
      });

      await useMarketplaceStore.getState().fetchListings(false);

      expect(useMarketplaceStore.getState().listings).toHaveLength(2);
    });

    it('resets listings when reset=true', async () => {
      useMarketplaceStore.setState({ listings: [mockListing], currentOffset: 1 });
      mockedApi.get.mockResolvedValueOnce({
        data: { listings: [mockListing2], pagination: { hasMore: false } },
      });

      await useMarketplaceStore.getState().fetchListings(true);

      expect(useMarketplaceStore.getState().listings).toEqual([mockListing2]);
      expect(useMarketplaceStore.getState().currentOffset).toBe(1);
    });

    it('handles API error gracefully', async () => {
      mockedApi.get.mockRejectedValueOnce(new Error('Network error'));
      await useMarketplaceStore.getState().fetchListings(true);
      expect(useMarketplaceStore.getState().isLoading).toBe(false);
    });
  });

  // ==================== fetchListing ====================

  describe('fetchListing', () => {
    it('sets selectedListing and priceHistory', async () => {
      mockedApi.get.mockResolvedValueOnce({
        data: {
          listing: mockListing,
          priceHistory: [{ price: 400, soldAt: '2026-01-01T00:00:00Z' }],
          recommendedPrice: { min: 300, max: 700, suggested: 500 },
        },
      });

      await useMarketplaceStore.getState().fetchListing('listing-1');

      const s = useMarketplaceStore.getState();
      expect(s.selectedListing?.id).toBe('listing-1');
      expect(s.priceHistory).toHaveLength(1);
      expect(s.recommendedPrice?.suggested).toBe(500);
    });

    it('handles error without crashing', async () => {
      mockedApi.get.mockRejectedValueOnce(new Error('Not found'));
      await useMarketplaceStore.getState().fetchListing('bad-id');
      expect(useMarketplaceStore.getState().isLoading).toBe(false);
    });
  });

  // ==================== fetchMyListings ====================

  describe('fetchMyListings', () => {
    it('populates myListings', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: { listings: [mockListing] } });
      await useMarketplaceStore.getState().fetchMyListings();
      expect(useMarketplaceStore.getState().myListings).toHaveLength(1);
    });

    it('passes status param', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: { listings: [] } });
      await useMarketplaceStore.getState().fetchMyListings('sold');
      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/marketplace/my-listings', {
        params: { status: 'sold' },
      });
    });
  });

  // ==================== fetchHistory ====================

  describe('fetchHistory', () => {
    it('populates transactionHistory and userTotals', async () => {
      const totals = {
        sells: { count: 5, total: 2500, fees: 250, proceeds: 2250 },
        buys: { count: 3, total: 1800 },
      };
      mockedApi.get.mockResolvedValueOnce({
        data: { transactions: [mockListing], totals },
      });

      await useMarketplaceStore.getState().fetchHistory();

      expect(useMarketplaceStore.getState().transactionHistory).toHaveLength(1);
      expect(useMarketplaceStore.getState().userTotals?.sells.count).toBe(5);
    });
  });

  // ==================== createListing ====================

  describe('createListing', () => {
    it('returns success and refreshes myListings', async () => {
      mockedApi.post.mockResolvedValueOnce({
        data: { success: true, listing: mockListing, listingFee: 50 },
      });
      mockedApi.get.mockResolvedValueOnce({ data: { listings: [mockListing] } });

      const result = await useMarketplaceStore.getState().createListing({
        itemType: 'badge',
        itemId: 'badge-gold',
        price: 500,
      });

      expect(result.success).toBe(true);
      expect(result.listingFee).toBe(50);
      expect(useMarketplaceStore.getState().isCreating).toBe(false);
    });

    it('returns { success: false } on API failure', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('Forbidden'));
      const result = await useMarketplaceStore.getState().createListing({
        itemType: 'badge',
        itemId: 'x',
        price: 1,
      });
      expect(result.success).toBe(false);
      expect(useMarketplaceStore.getState().isCreating).toBe(false);
    });

    it('returns { success: false } when API returns success=false', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: { success: false } });
      const result = await useMarketplaceStore.getState().createListing({
        itemType: 'badge',
        itemId: 'x',
        price: 1,
      });
      expect(result.success).toBe(false);
    });
  });

  // ==================== updateListing ====================

  describe('updateListing', () => {
    it('updates price in local state on success', async () => {
      useMarketplaceStore.setState({ myListings: [mockListing] });
      mockedApi.put.mockResolvedValueOnce({ data: { success: true } });

      const result = await useMarketplaceStore.getState().updateListing('listing-1', 999);

      expect(result.success).toBe(true);
      expect(useMarketplaceStore.getState().myListings[0].price).toBe(999);
    });

    it('returns failure without mutating state on error', async () => {
      useMarketplaceStore.setState({ myListings: [mockListing] });
      mockedApi.put.mockRejectedValueOnce(new Error('err'));

      const result = await useMarketplaceStore.getState().updateListing('listing-1', 999);
      expect(result.success).toBe(false);
      expect(useMarketplaceStore.getState().myListings[0].price).toBe(500);
    });
  });

  // ==================== cancelListing ====================

  describe('cancelListing', () => {
    it('removes listing from myListings on success', async () => {
      useMarketplaceStore.setState({ myListings: [mockListing, mockListing2] });
      mockedApi.delete.mockResolvedValueOnce({ data: { success: true } });

      const result = await useMarketplaceStore.getState().cancelListing('listing-1');
      expect(result.success).toBe(true);
      expect(useMarketplaceStore.getState().myListings).toHaveLength(1);
      expect(useMarketplaceStore.getState().myListings[0].id).toBe('listing-2');
    });

    it('keeps listings on failure', async () => {
      useMarketplaceStore.setState({ myListings: [mockListing] });
      mockedApi.delete.mockRejectedValueOnce(new Error('err'));

      const result = await useMarketplaceStore.getState().cancelListing('listing-1');
      expect(result.success).toBe(false);
      expect(useMarketplaceStore.getState().myListings).toHaveLength(1);
    });
  });

  // ==================== purchaseListing ====================

  describe('purchaseListing', () => {
    it('removes listing from listings on success', async () => {
      useMarketplaceStore.setState({ listings: [mockListing, mockListing2] });
      mockedApi.post.mockResolvedValueOnce({
        data: { success: true, fee: 25, sellerReceived: 475 },
      });

      const result = await useMarketplaceStore.getState().purchaseListing('listing-1');

      expect(result.success).toBe(true);
      expect(result.fee).toBe(25);
      expect(useMarketplaceStore.getState().listings).toHaveLength(1);
      expect(useMarketplaceStore.getState().isPurchasing).toBe(false);
    });

    it('clears selectedListing after purchase', async () => {
      useMarketplaceStore.setState({ listings: [mockListing], selectedListing: mockListing });
      mockedApi.post.mockResolvedValueOnce({ data: { success: true } });

      await useMarketplaceStore.getState().purchaseListing('listing-1');
      expect(useMarketplaceStore.getState().selectedListing).toBeNull();
    });

    it('returns failure on error', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('Insufficient funds'));
      const result = await useMarketplaceStore.getState().purchaseListing('listing-1');
      expect(result.success).toBe(false);
      expect(useMarketplaceStore.getState().isPurchasing).toBe(false);
    });
  });

  // ==================== Filters ====================

  describe('setFilters / clearFilters', () => {
    it('merges partial filter updates', () => {
      // setFilters triggers fetchListings which calls api.get
      mockedApi.get.mockResolvedValue({ data: { listings: [] } });
      useMarketplaceStore.getState().setFilters({ type: 'badge', rarity: 'rare' });

      const f = useMarketplaceStore.getState().filters;
      expect(f.type).toBe('badge');
      expect(f.rarity).toBe('rare');
      expect(f.sort).toBe('newest'); // preserved
    });

    it('clearFilters resets to defaults', () => {
      mockedApi.get.mockResolvedValue({ data: { listings: [] } });
      useMarketplaceStore.setState({
        filters: { sort: 'price_high', type: 'title', rarity: 'epic' },
      });

      useMarketplaceStore.getState().clearFilters();
      expect(useMarketplaceStore.getState().filters).toEqual({ sort: 'newest' });
    });
  });

  // ==================== getPriceRecommendation ====================

  describe('getPriceRecommendation', () => {
    it('returns correct recommendation for known rarity', () => {
      const rec = useMarketplaceStore.getState().getPriceRecommendation('rare');
      expect(rec).toEqual({ min: 1000, max: 5000, suggested: 2500 });
    });

    it('falls back to common for unknown rarity', () => {
      const rec = useMarketplaceStore.getState().getPriceRecommendation('nonexistent');
      expect(rec).toEqual({ min: 100, max: 500, suggested: 250 });
    });

    it('handles case-insensitive rarity', () => {
      const rec = useMarketplaceStore.getState().getPriceRecommendation('LEGENDARY');
      expect(rec).toEqual({ min: 10000, max: 50000, suggested: 25000 });
    });
  });
});
