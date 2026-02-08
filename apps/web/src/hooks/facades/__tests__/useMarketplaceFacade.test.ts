/**
 * useMarketplaceFacade Unit Tests
 *
 * Tests for the marketplace composition facade hook.
 * Validates aggregation of marketplace listings and avatar border stores.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMarketplaceFacade } from '../useMarketplaceFacade';

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
  useMarketplaceStore: vi.fn((selector: (s: typeof mockMarketplaceState) => unknown) =>
    selector(mockMarketplaceState)
  ),
  useAvatarBorderStore: vi.fn((selector: (s: typeof mockBorderState) => unknown) =>
    selector(mockBorderState)
  ),
}));

describe('useMarketplaceFacade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listings', () => {
    it('exposes listings from marketplace store', () => {
      const { result } = renderHook(() => useMarketplaceFacade());
      expect(result.current.listings).toHaveLength(2);
      expect((result.current.listings[0] as unknown as Record<string, unknown>).name).toBe(
        'Rare Badge'
      );
    });

    it('exposes selectedListing as null by default', () => {
      const { result } = renderHook(() => useMarketplaceFacade());
      expect(result.current.selectedListing).toBeNull();
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
      expect(result.current.stats).toEqual({
        totalListings: 42,
        totalSales: 128,
      });
    });

    it('exposes loading states', () => {
      const { result } = renderHook(() => useMarketplaceFacade());
      expect(result.current.isLoadingListings).toBe(false);
      expect(result.current.isPurchasing).toBe(false);
    });
  });

  describe('avatar borders', () => {
    it('exposes allBorders', () => {
      const { result } = renderHook(() => useMarketplaceFacade());
      expect(result.current.allBorders).toHaveLength(2);
    });

    it('exposes isLoadingBorders', () => {
      const { result } = renderHook(() => useMarketplaceFacade());
      expect(result.current.isLoadingBorders).toBe(false);
    });
  });

  describe('listing actions', () => {
    it('exposes fetchListings', () => {
      const { result } = renderHook(() => useMarketplaceFacade());
      expect(typeof result.current.fetchListings).toBe('function');
    });

    it('exposes purchaseListing', () => {
      const { result } = renderHook(() => useMarketplaceFacade());
      expect(typeof result.current.purchaseListing).toBe('function');
    });

    it('exposes setFilters', () => {
      const { result } = renderHook(() => useMarketplaceFacade());
      expect(typeof result.current.setFilters).toBe('function');
    });

    it('exposes clearFilters', () => {
      const { result } = renderHook(() => useMarketplaceFacade());
      expect(typeof result.current.clearFilters).toBe('function');
    });
  });

  describe('border actions', () => {
    it('exposes initializeBorders', () => {
      const { result } = renderHook(() => useMarketplaceFacade());
      expect(typeof result.current.initializeBorders).toBe('function');
    });

    it('exposes equipBorder', () => {
      const { result } = renderHook(() => useMarketplaceFacade());
      expect(typeof result.current.equipBorder).toBe('function');
    });

    it('exposes purchaseBorder', () => {
      const { result } = renderHook(() => useMarketplaceFacade());
      expect(typeof result.current.purchaseBorder).toBe('function');
    });
  });

  describe('interface completeness', () => {
    it('returns all expected keys', () => {
      const { result } = renderHook(() => useMarketplaceFacade());
      const keys = Object.keys(result.current);

      const expectedKeys = [
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

      for (const key of expectedKeys) {
        expect(keys).toContain(key);
      }
    });
  });
});
