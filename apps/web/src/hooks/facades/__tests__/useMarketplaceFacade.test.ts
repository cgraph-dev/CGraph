/**
 * useMarketplaceFacade Unit Tests
 *
 * Tests for the marketplace composition facade hook.
 * Validates aggregation of marketplace listings and avatar border stores.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMarketplaceFacade } from '../useMarketplaceFacade';

// ── Mock stores ────────────────────────────────────────────────────

const mockMarketplaceState: Record<string, unknown> = {
  listings: [
    { id: 'list-1', name: 'Rare Badge', price: 500, type: 'badge' },
    { id: 'list-2', name: 'Custom Border', price: 1000, type: 'border' },
  ],
  selectedListing: null,
  filters: { type: 'all', priceRange: [0, 10000], sortBy: 'newest' },
  stats: { totalListings: 42, totalSales: 128 },
  isLoading: false,
  isPurchasing: false,
  fetchListings: vi.fn(),
  purchaseListing: vi.fn(),
  setFilters: vi.fn(),
  clearFilters: vi.fn(),
};

const mockBorderState: Record<string, unknown> = {
  allBorders: [
    { id: 'b-1', name: 'Gold Ring', rarity: 'legendary' },
    { id: 'b-2', name: 'Silver Ring', rarity: 'rare' },
  ],
  getEquippedBorder: vi.fn(() => ({ id: 'b-1', name: 'Gold Ring', rarity: 'legendary' })),
  isLoading: false,
  initialize: vi.fn(),
  equipBorder: vi.fn(),
  purchaseBorder: vi.fn(),
};

vi.mock('@/modules/gamification/store', () => ({
  useMarketplaceStore: vi.fn((sel: (s: typeof mockMarketplaceState) => unknown) =>
    sel(mockMarketplaceState)
  ),
  useAvatarBorderStore: vi.fn((sel: (s: typeof mockBorderState) => unknown) =>
    sel(mockBorderState)
  ),
}));

function resetState() {
  mockMarketplaceState.listings = [
    { id: 'list-1', name: 'Rare Badge', price: 500, type: 'badge' },
    { id: 'list-2', name: 'Custom Border', price: 1000, type: 'border' },
  ];
  mockMarketplaceState.selectedListing = null;
  mockMarketplaceState.filters = { type: 'all', priceRange: [0, 10000], sortBy: 'newest' };
  mockMarketplaceState.stats = { totalListings: 42, totalSales: 128 };
  mockMarketplaceState.isLoading = false;
  mockMarketplaceState.isPurchasing = false;
  mockBorderState.allBorders = [
    { id: 'b-1', name: 'Gold Ring', rarity: 'legendary' },
    { id: 'b-2', name: 'Silver Ring', rarity: 'rare' },
  ];
  (mockBorderState.getEquippedBorder as ReturnType<typeof vi.fn>).mockReturnValue({
    id: 'b-1',
    name: 'Gold Ring',
    rarity: 'legendary',
  });
  mockBorderState.isLoading = false;
}

describe('useMarketplaceFacade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetState();
  });

  // ── Listings ─────────────────────────────────────────────────────

  it('exposes listings from marketplace store', () => {
    const { result } = renderHook(() => useMarketplaceFacade());
    expect(result.current.listings).toHaveLength(2);
    expect((result.current.listings[0] as Record<string, unknown>).name).toBe('Rare Badge');
  });

  it('exposes empty listings', () => {
    mockMarketplaceState.listings = [];
    const { result } = renderHook(() => useMarketplaceFacade());
    expect(result.current.listings).toEqual([]);
  });

  it('exposes selectedListing as null by default', () => {
    const { result } = renderHook(() => useMarketplaceFacade());
    expect(result.current.selectedListing).toBeNull();
  });

  it('exposes selectedListing when set', () => {
    mockMarketplaceState.selectedListing = { id: 'list-1', name: 'Rare Badge', price: 500 };
    const { result } = renderHook(() => useMarketplaceFacade());
    expect(result.current.selectedListing).not.toBeNull();
    expect((result.current.selectedListing as Record<string, unknown>).name).toBe('Rare Badge');
  });

  it('exposes filters', () => {
    const { result } = renderHook(() => useMarketplaceFacade());
    expect(result.current.filters).toEqual({
      type: 'all',
      priceRange: [0, 10000],
      sortBy: 'newest',
    });
  });

  it('exposes stats', () => {
    const { result } = renderHook(() => useMarketplaceFacade());
    expect(result.current.stats).toEqual({ totalListings: 42, totalSales: 128 });
  });

  it('exposes null stats', () => {
    mockMarketplaceState.stats = null;
    const { result } = renderHook(() => useMarketplaceFacade());
    expect(result.current.stats).toBeNull();
  });

  it('exposes isLoadingListings false by default', () => {
    const { result } = renderHook(() => useMarketplaceFacade());
    expect(result.current.isLoadingListings).toBe(false);
  });

  it('exposes isLoadingListings true', () => {
    mockMarketplaceState.isLoading = true;
    const { result } = renderHook(() => useMarketplaceFacade());
    expect(result.current.isLoadingListings).toBe(true);
  });

  it('exposes isPurchasing false by default', () => {
    const { result } = renderHook(() => useMarketplaceFacade());
    expect(result.current.isPurchasing).toBe(false);
  });

  it('exposes isPurchasing true', () => {
    mockMarketplaceState.isPurchasing = true;
    const { result } = renderHook(() => useMarketplaceFacade());
    expect(result.current.isPurchasing).toBe(true);
  });

  // ── Avatar borders ──────────────────────────────────────────────

  it('exposes allBorders from border store', () => {
    const { result } = renderHook(() => useMarketplaceFacade());
    expect(result.current.allBorders).toHaveLength(2);
  });

  it('exposes equippedBorder from getEquippedBorder()', () => {
    const { result } = renderHook(() => useMarketplaceFacade());
    expect(result.current.equippedBorder).toEqual({
      id: 'b-1',
      name: 'Gold Ring',
      rarity: 'legendary',
    });
  });

  it('exposes undefined equippedBorder when none equipped', () => {
    (mockBorderState.getEquippedBorder as ReturnType<typeof vi.fn>).mockReturnValue(undefined);
    const { result } = renderHook(() => useMarketplaceFacade());
    expect(result.current.equippedBorder).toBeUndefined();
  });

  it('exposes isLoadingBorders', () => {
    mockBorderState.isLoading = true;
    const { result } = renderHook(() => useMarketplaceFacade());
    expect(result.current.isLoadingBorders).toBe(true);
  });

  // ── Action delegation: listings ──────────────────────────────────

  it('fetchListings delegates to marketplace store', () => {
    const { result } = renderHook(() => useMarketplaceFacade());
    result.current.fetchListings(true);
    expect(mockMarketplaceState.fetchListings).toHaveBeenCalledWith(true);
  });

  it('purchaseListing delegates with listingId', () => {
    const { result } = renderHook(() => useMarketplaceFacade());
    result.current.purchaseListing('list-1');
    expect(mockMarketplaceState.purchaseListing).toHaveBeenCalledWith('list-1');
  });

  it('setFilters delegates with partial filters', () => {
    const { result } = renderHook(() => useMarketplaceFacade());
    result.current.setFilters({ type: 'border' });
    expect(mockMarketplaceState.setFilters).toHaveBeenCalledWith({ type: 'border' });
  });

  it('clearFilters delegates to marketplace store', () => {
    const { result } = renderHook(() => useMarketplaceFacade());
    result.current.clearFilters();
    expect(mockMarketplaceState.clearFilters).toHaveBeenCalledOnce();
  });

  // ── Action delegation: borders ───────────────────────────────────

  it('initializeBorders delegates to border store', () => {
    const { result } = renderHook(() => useMarketplaceFacade());
    result.current.initializeBorders();
    expect(mockBorderState.initialize).toHaveBeenCalledOnce();
  });

  it('equipBorder delegates with borderId', () => {
    const { result } = renderHook(() => useMarketplaceFacade());
    result.current.equipBorder('b-2');
    expect(mockBorderState.equipBorder).toHaveBeenCalledWith('b-2');
  });

  it('purchaseBorder delegates with borderId', () => {
    const { result } = renderHook(() => useMarketplaceFacade());
    result.current.purchaseBorder('b-3');
    expect(mockBorderState.purchaseBorder).toHaveBeenCalledWith('b-3');
  });

  // ── Interface completeness ───────────────────────────────────────

  it('returns all 16 expected keys', () => {
    const { result } = renderHook(() => useMarketplaceFacade());
    const keys = Object.keys(result.current);

    const expected = [
      'listings',
      'selectedListing',
      'filters',
      'stats',
      'isLoadingListings',
      'isPurchasing',
      'allBorders',
      'equippedBorder',
      'isLoadingBorders',
      'fetchListings',
      'purchaseListing',
      'setFilters',
      'clearFilters',
      'initializeBorders',
      'equipBorder',
      'purchaseBorder',
    ];
    for (const k of expected) expect(keys).toContain(k);
    expect(keys).toHaveLength(expected.length);
  });

  it('all action properties are functions', () => {
    const { result } = renderHook(() => useMarketplaceFacade());
    const actions = [
      'fetchListings',
      'purchaseListing',
      'setFilters',
      'clearFilters',
      'initializeBorders',
      'equipBorder',
      'purchaseBorder',
    ] as const;
    for (const a of actions) {
      expect(typeof result.current[a]).toBe('function');
    }
  });
});
