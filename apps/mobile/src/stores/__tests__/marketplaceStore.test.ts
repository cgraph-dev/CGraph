/**
 * Tests for marketplaceStore
 * @module stores/__tests__/marketplaceStore
 */

import type { MarketplaceListing, useMarketplaceStore } from '../marketplaceStore';

// ── Mocks ──────────────────────────────────────────────────────────────

jest.mock('../../lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

import api from '../../lib/api';

const mockApi = api as jest.Mocked<typeof api>;

// ── Helpers ────────────────────────────────────────────────────────────

function resetStore() {
  useMarketplaceStore.setState({
    listings: [],
    myListings: [],
    selectedListing: null,
    transactionHistory: [],
    filters: { sort: 'newest' },
    hasMore: false,
    currentOffset: 0,
    isLoading: false,
    isCreating: false,
    isPurchasing: false,
  });
}

function makeListing(overrides: Partial<MarketplaceListing> = {}): MarketplaceListing {
  return {
    id: 'l1',
    itemType: 'badge',
    itemId: 'item-1',
    status: 'active',
    price: 100,
    currency: 'coins',
    itemName: 'Cool Badge',
    itemRarity: 'rare',
    acceptsTrades: false,
    listedAt: '2024-01-01T00:00:00Z',
    expiresAt: '2024-02-01T00:00:00Z',
    seller: { id: 'u1', username: 'alice', displayName: 'Alice', avatarUrl: '/a.jpg' },
    ...overrides,
  };
}

const RAW_LISTING = {
  id: 'l1',
  item_type: 'avatar_border',
  item_id: 'item-1',
  status: 'active',
  price: 50,
  currency: 'gems',
  item_name: 'Fire Border',
  item_rarity: 'epic',
  item_preview_url: '/preview.png',
  accepts_trades: true,
  listed_at: '2024-01-01T00:00:00Z',
  expires_at: '2024-02-01T00:00:00Z',
  inserted_at: '2024-01-01T00:00:00Z',
  seller: { id: 'u1', username: 'alice', display_name: 'Alice', avatar_url: '/a.jpg' },
  buyer: { id: 'u2', username: 'bob' },
};

// ── Tests ──────────────────────────────────────────────────────────────

describe('marketplaceStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
  });

  describe('initial state', () => {
    it('has empty listings', () => {
      const state = useMarketplaceStore.getState();
      expect(state.listings).toEqual([]);
      expect(state.myListings).toEqual([]);
      expect(state.selectedListing).toBeNull();
      expect(state.filters.sort).toBe('newest');
      expect(state.isLoading).toBe(false);
    });
  });

  // ── fetchListings ──────────────────────────────────────────────────

  describe('fetchListings', () => {
    it('fetches and normalizes listings', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: { listings: [RAW_LISTING] },
      });

      await useMarketplaceStore.getState().fetchListings(true);

      const state = useMarketplaceStore.getState();
      expect(state.listings).toHaveLength(1);
      const l = state.listings[0];
      expect(l.itemType).toBe('avatar_border');
      expect(l.itemName).toBe('Fire Border');
      expect(l.itemRarity).toBe('epic');
      expect(l.currency).toBe('gems');
      expect(l.acceptsTrades).toBe(true);
      expect(l.itemPreviewUrl).toBe('/preview.png');
      expect(l.seller?.username).toBe('alice');
      expect(l.buyer?.username).toBe('bob');
      expect(state.isLoading).toBe(false);
    });

    it('appends when reset=false', async () => {
      useMarketplaceStore.setState({
        listings: [makeListing({ id: 'l0' })],
        currentOffset: 1,
      });

      mockApi.get.mockResolvedValueOnce({
        data: { listings: [RAW_LISTING] },
      });

      await useMarketplaceStore.getState().fetchListings(false);

      expect(useMarketplaceStore.getState().listings).toHaveLength(2);
    });

    it('resets when reset=true', async () => {
      useMarketplaceStore.setState({
        listings: [makeListing({ id: 'l0' })],
        currentOffset: 5,
      });

      mockApi.get.mockResolvedValueOnce({
        data: { listings: [RAW_LISTING] },
      });

      await useMarketplaceStore.getState().fetchListings(true);

      expect(useMarketplaceStore.getState().listings).toHaveLength(1);
      expect(useMarketplaceStore.getState().currentOffset).toBe(1);
    });

    it('passes filter params to API', async () => {
      useMarketplaceStore.setState({
        filters: {
          sort: 'price_low',
          type: 'badge',
          rarity: 'rare',
          minPrice: 10,
          maxPrice: 500,
          currency: 'coins',
        },
      });

      mockApi.get.mockResolvedValueOnce({ data: { listings: [] } });

      await useMarketplaceStore.getState().fetchListings(true);

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/marketplace', {
        params: expect.objectContaining({
          sort: 'price_low',
          type: 'badge',
          rarity: 'rare',
          min_price: 10,
          max_price: 500,
          currency: 'coins',
        }),
      });
    });

    it('sets hasMore true when 20 results', async () => {
      const items = Array.from({ length: 20 }, (_, i) => ({ ...RAW_LISTING, id: `l${i}` }));
      mockApi.get.mockResolvedValueOnce({ data: { listings: items } });

      await useMarketplaceStore.getState().fetchListings(true);

      expect(useMarketplaceStore.getState().hasMore).toBe(true);
    });

    it('sets hasMore false when fewer than 20', async () => {
      mockApi.get.mockResolvedValueOnce({ data: { listings: [RAW_LISTING] } });

      await useMarketplaceStore.getState().fetchListings(true);

      expect(useMarketplaceStore.getState().hasMore).toBe(false);
    });

    it('handles error', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('fail'));

      await useMarketplaceStore.getState().fetchListings(true);

      expect(useMarketplaceStore.getState().isLoading).toBe(false);
    });
  });

  // ── fetchListing ───────────────────────────────────────────────────

  describe('fetchListing', () => {
    it('fetches a single listing', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: { listing: RAW_LISTING },
      });

      await useMarketplaceStore.getState().fetchListing('l1');

      const selected = useMarketplaceStore.getState().selectedListing;
      expect(selected).not.toBeNull();
      expect(selected!.id).toBe('l1');
      expect(selected!.itemType).toBe('avatar_border');
    });
  });

  // ── fetchMyListings ────────────────────────────────────────────────

  describe('fetchMyListings', () => {
    it('fetches user listings', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: { listings: [RAW_LISTING] },
      });

      await useMarketplaceStore.getState().fetchMyListings();

      expect(useMarketplaceStore.getState().myListings).toHaveLength(1);
      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/marketplace/my-listings', { params: {} });
    });

    it('passes status filter', async () => {
      mockApi.get.mockResolvedValueOnce({ data: { listings: [] } });

      await useMarketplaceStore.getState().fetchMyListings('active');

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/marketplace/my-listings', {
        params: { status: 'active' },
      });
    });
  });

  // ── fetchHistory ───────────────────────────────────────────────────

  describe('fetchHistory', () => {
    it('fetches transaction history', async () => {
      mockApi.get.mockResolvedValueOnce({
        data: { transactions: [RAW_LISTING] },
      });

      await useMarketplaceStore.getState().fetchHistory();

      expect(useMarketplaceStore.getState().transactionHistory).toHaveLength(1);
    });

    it('passes type filter', async () => {
      mockApi.get.mockResolvedValueOnce({ data: { transactions: [] } });

      await useMarketplaceStore.getState().fetchHistory('buys');

      expect(mockApi.get).toHaveBeenCalledWith('/api/v1/marketplace/history', {
        params: { type: 'buys' },
      });
    });
  });

  // ── createListing ──────────────────────────────────────────────────

  describe('createListing', () => {
    it('creates a listing successfully', async () => {
      mockApi.post.mockResolvedValueOnce({});
      // fetchMyListings called internally
      mockApi.get.mockResolvedValueOnce({ data: { listings: [] } });

      const result = await useMarketplaceStore.getState().createListing({
        itemType: 'badge',
        itemId: 'item-1',
        price: 100,
        currency: 'gems',
      });

      expect(result).toEqual({ success: true });
      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/marketplace', {
        item_type: 'badge',
        item_id: 'item-1',
        price: 100,
        currency: 'gems',
      });
      expect(useMarketplaceStore.getState().isCreating).toBe(false);
    });

    it('defaults currency to coins', async () => {
      mockApi.post.mockResolvedValueOnce({});
      mockApi.get.mockResolvedValueOnce({ data: { listings: [] } });

      await useMarketplaceStore.getState().createListing({
        itemType: 'badge',
        itemId: 'item-1',
        price: 100,
      });

      expect(mockApi.post).toHaveBeenCalledWith('/api/v1/marketplace', {
        item_type: 'badge',
        item_id: 'item-1',
        price: 100,
        currency: 'coins',
      });
    });

    it('returns failure on error', async () => {
      mockApi.post.mockRejectedValueOnce(new Error('fail'));

      const result = await useMarketplaceStore.getState().createListing({
        itemType: 'badge',
        itemId: 'item-1',
        price: 100,
      });

      expect(result).toEqual({ success: false });
      expect(useMarketplaceStore.getState().isCreating).toBe(false);
    });
  });

  // ── purchaseListing ────────────────────────────────────────────────

  describe('purchaseListing', () => {
    it('purchases and removes from listings', async () => {
      useMarketplaceStore.setState({
        listings: [makeListing({ id: 'l1' }), makeListing({ id: 'l2' })],
      });
      mockApi.post.mockResolvedValueOnce({});

      const result = await useMarketplaceStore.getState().purchaseListing('l1');

      expect(result).toEqual({ success: true });
      expect(useMarketplaceStore.getState().listings).toHaveLength(1);
      expect(useMarketplaceStore.getState().listings[0].id).toBe('l2');
      expect(useMarketplaceStore.getState().isPurchasing).toBe(false);
    });

    it('returns failure on error', async () => {
      mockApi.post.mockRejectedValueOnce(new Error('fail'));

      const result = await useMarketplaceStore.getState().purchaseListing('l1');

      expect(result).toEqual({ success: false });
      expect(useMarketplaceStore.getState().isPurchasing).toBe(false);
    });
  });

  // ── cancelListing ──────────────────────────────────────────────────

  describe('cancelListing', () => {
    it('cancels and removes from myListings', async () => {
      useMarketplaceStore.setState({
        myListings: [makeListing({ id: 'l1' }), makeListing({ id: 'l2' })],
      });
      mockApi.delete.mockResolvedValueOnce({});

      const result = await useMarketplaceStore.getState().cancelListing('l1');

      expect(result).toEqual({ success: true });
      expect(useMarketplaceStore.getState().myListings).toHaveLength(1);
    });

    it('returns failure on error', async () => {
      mockApi.delete.mockRejectedValueOnce(new Error('fail'));

      const result = await useMarketplaceStore.getState().cancelListing('l1');

      expect(result).toEqual({ success: false });
    });
  });

  // ── setFilters / clearFilters ──────────────────────────────────────

  describe('setFilters', () => {
    it('merges filters and refetches', async () => {
      mockApi.get.mockResolvedValueOnce({ data: { listings: [] } });

      useMarketplaceStore.getState().setFilters({ type: 'badge', sort: 'price_high' });

      const state = useMarketplaceStore.getState();
      expect(state.filters.type).toBe('badge');
      expect(state.filters.sort).toBe('price_high');
      // fetchListings(true) was called
      expect(mockApi.get).toHaveBeenCalled();
    });
  });

  describe('clearFilters', () => {
    it('resets to default filters', async () => {
      useMarketplaceStore.setState({
        filters: { sort: 'price_low', type: 'badge', rarity: 'epic' },
      });
      mockApi.get.mockResolvedValueOnce({ data: { listings: [] } });

      useMarketplaceStore.getState().clearFilters();

      expect(useMarketplaceStore.getState().filters).toEqual({ sort: 'newest' });
    });
  });
});
