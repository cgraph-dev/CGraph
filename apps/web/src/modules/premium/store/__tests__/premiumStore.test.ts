/**
 * Premium Module Store Unit Tests
 *
 * Comprehensive tests for the Zustand premium store.
 * Covers initial state, subscription management, coin operations,
 * purchase history, and computed helpers.
 */

import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { usePremiumStore } from '@/modules/premium/store';
import type { PurchaseHistory } from '@/modules/premium/store';

// ── Fixtures ───────────────────────────────────────────────────────────

const mockPurchase: PurchaseHistory = {
  id: 'purchase-1',
  type: 'subscription',
  productId: 'plan-pro',
  productName: 'Pro Plan',
  amount: 9.99,
  currency: 'USD',
  status: 'completed',
  createdAt: '2026-01-15T12:00:00Z',
};

const mockPurchase2: PurchaseHistory = {
  id: 'purchase-2',
  type: 'coins',
  productId: 'coin-pack-500',
  productName: '500 Coins',
  amount: 4.99,
  currency: 'USD',
  status: 'completed',
  createdAt: '2026-01-20T10:00:00Z',
};

const mockPurchasePending: PurchaseHistory = {
  id: 'purchase-3',
  type: 'item',
  productId: 'badge-gold',
  productName: 'Gold Badge',
  amount: 2.99,
  currency: 'USD',
  status: 'pending',
  createdAt: '2026-02-01T09:00:00Z',
};

// ── Helpers ────────────────────────────────────────────────────────────

const getInitialState = () => ({
  isSubscribed: false,
  currentTier: null,
  subscribedAt: null,
  expiresAt: null,
  status: 'none' as const,
  coinBalance: 0,
  purchaseHistory: [],
  isLoading: false,
});

afterEach(() => {
  usePremiumStore.setState(getInitialState());
  vi.clearAllMocks();
});

// ════════════════════════════════════════════════════════════════════════
// Tests
// ════════════════════════════════════════════════════════════════════════

describe('premiumStore', () => {
  // ── 1. Initial state ─────────────────────────────────────────────────

  describe('initial state', () => {
    it('should have correct default values', () => {
      const s = usePremiumStore.getState();
      expect(s.isSubscribed).toBe(false);
      expect(s.currentTier).toBeNull();
      expect(s.subscribedAt).toBeNull();
      expect(s.expiresAt).toBeNull();
      expect(s.coinBalance).toBe(0);
      expect(s.purchaseHistory).toEqual([]);
    });

    it('should expose all expected actions', () => {
      const s = usePremiumStore.getState();
      expect(typeof s.setSubscription).toBe('function');
      expect(typeof s.cancelSubscription).toBe('function');
      expect(typeof s.addCoins).toBe('function');
      expect(typeof s.spendCoins).toBe('function');
      expect(typeof s.addPurchase).toBe('function');
      expect(typeof s.getRemainingDays).toBe('function');
      expect(typeof s.canAfford).toBe('function');
    });
  });

  // ── 2. setSubscription ───────────────────────────────────────────────

  describe('setSubscription', () => {
    it('should set subscription details correctly', () => {
      const expiresAt = '2026-03-01T00:00:00Z';
      usePremiumStore.getState().setSubscription('pro', expiresAt);

      const s = usePremiumStore.getState();
      expect(s.isSubscribed).toBe(true);
      expect(s.currentTier).toBe('pro');
      expect(s.expiresAt).toBe(expiresAt);
      expect(s.subscribedAt).not.toBeNull();
    });

    it('should set subscribedAt to a valid ISO timestamp', () => {
      usePremiumStore.getState().setSubscription('plus', '2026-06-01T00:00:00Z');

      const s = usePremiumStore.getState();
      expect(s.subscribedAt).toBeTruthy();
      // Ensure it's a valid date string
      expect(new Date(s.subscribedAt!).toISOString()).toBe(s.subscribedAt);
    });

    it('should overwrite previous subscription when called again', () => {
      usePremiumStore.getState().setSubscription('plus', '2026-03-01T00:00:00Z');
      usePremiumStore.getState().setSubscription('enterprise', '2026-12-31T23:59:59Z');

      const s = usePremiumStore.getState();
      expect(s.currentTier).toBe('enterprise');
      expect(s.expiresAt).toBe('2026-12-31T23:59:59Z');
    });
  });

  // ── 3. cancelSubscription ────────────────────────────────────────────

  describe('cancelSubscription', () => {
    it('should clear all subscription fields', () => {
      usePremiumStore.getState().setSubscription('pro', '2026-06-01T00:00:00Z');
      usePremiumStore.getState().cancelSubscription();

      const s = usePremiumStore.getState();
      expect(s.isSubscribed).toBe(false);
      expect(s.currentTier).toBeNull();
      expect(s.subscribedAt).toBeNull();
      expect(s.expiresAt).toBeNull();
    });

    it('should not affect coin balance or purchase history', () => {
      usePremiumStore.setState({ coinBalance: 500, purchaseHistory: [mockPurchase] });
      usePremiumStore.getState().setSubscription('pro', '2026-06-01T00:00:00Z');
      usePremiumStore.getState().cancelSubscription();

      const s = usePremiumStore.getState();
      expect(s.coinBalance).toBe(500);
      expect(s.purchaseHistory).toHaveLength(1);
    });
  });

  // ── 4. addCoins ──────────────────────────────────────────────────────

  describe('addCoins', () => {
    it('should increase coin balance by the given amount', () => {
      usePremiumStore.getState().addCoins(100);
      expect(usePremiumStore.getState().coinBalance).toBe(100);
    });

    it('should accumulate across multiple calls', () => {
      usePremiumStore.getState().addCoins(100);
      usePremiumStore.getState().addCoins(250);
      usePremiumStore.getState().addCoins(50);
      expect(usePremiumStore.getState().coinBalance).toBe(400);
    });
  });

  // ── 5. spendCoins ────────────────────────────────────────────────────

  describe('spendCoins', () => {
    beforeEach(() => {
      usePremiumStore.setState({ coinBalance: 500 });
    });

    it('should deduct coins and return true when balance is sufficient', () => {
      const result = usePremiumStore.getState().spendCoins(200);
      expect(result).toBe(true);
      expect(usePremiumStore.getState().coinBalance).toBe(300);
    });

    it('should return false and not deduct when balance is insufficient', () => {
      const result = usePremiumStore.getState().spendCoins(600);
      expect(result).toBe(false);
      expect(usePremiumStore.getState().coinBalance).toBe(500);
    });

    it('should allow spending the exact balance', () => {
      const result = usePremiumStore.getState().spendCoins(500);
      expect(result).toBe(true);
      expect(usePremiumStore.getState().coinBalance).toBe(0);
    });

    it('should handle spending zero coins', () => {
      const result = usePremiumStore.getState().spendCoins(0);
      expect(result).toBe(true);
      expect(usePremiumStore.getState().coinBalance).toBe(500);
    });
  });

  // ── 6. addPurchase ───────────────────────────────────────────────────

  describe('addPurchase', () => {
    it('should prepend the purchase to history', () => {
      usePremiumStore.getState().addPurchase(mockPurchase);
      const history = usePremiumStore.getState().purchaseHistory;
      expect(history).toHaveLength(1);
      expect(history[0]!.id).toBe('purchase-1');
    });

    it('should add newest purchases first', () => {
      usePremiumStore.getState().addPurchase(mockPurchase);
      usePremiumStore.getState().addPurchase(mockPurchase2);

      const history = usePremiumStore.getState().purchaseHistory;
      expect(history).toHaveLength(2);
      expect(history[0]!.id).toBe('purchase-2');
      expect(history[1]!.id).toBe('purchase-1');
    });

    it('should preserve all purchase fields', () => {
      usePremiumStore.getState().addPurchase(mockPurchasePending);
      const p = usePremiumStore.getState().purchaseHistory[0]!;

      expect(p.type).toBe('item');
      expect(p.productId).toBe('badge-gold');
      expect(p.productName).toBe('Gold Badge');
      expect(p.amount).toBe(2.99);
      expect(p.currency).toBe('USD');
      expect(p.status).toBe('pending');
    });
  });

  // ── 7. canAfford ─────────────────────────────────────────────────────

  describe('canAfford', () => {
    it('should return true when balance >= price', () => {
      usePremiumStore.setState({ coinBalance: 300 });
      expect(usePremiumStore.getState().canAfford(300)).toBe(true);
      expect(usePremiumStore.getState().canAfford(100)).toBe(true);
    });

    it('should return false when balance < price', () => {
      usePremiumStore.setState({ coinBalance: 50 });
      expect(usePremiumStore.getState().canAfford(100)).toBe(false);
    });

    it('should return true for zero price', () => {
      usePremiumStore.setState({ coinBalance: 0 });
      expect(usePremiumStore.getState().canAfford(0)).toBe(true);
    });
  });

  // ── 8. getRemainingDays ──────────────────────────────────────────────

  describe('getRemainingDays', () => {
    it('should return null when no expiry is set', () => {
      expect(usePremiumStore.getState().getRemainingDays()).toBeNull();
    });

    it('should return a positive number for a future expiry date', () => {
      const future = new Date();
      future.setDate(future.getDate() + 10);
      usePremiumStore.setState({ expiresAt: future.toISOString() });

      const days = usePremiumStore.getState().getRemainingDays();
      expect(days).toBeGreaterThanOrEqual(9);
      expect(days).toBeLessThanOrEqual(11);
    });

    it('should return 0 for expired subscriptions', () => {
      const past = new Date('2020-01-01T00:00:00Z');
      usePremiumStore.setState({ expiresAt: past.toISOString() });

      expect(usePremiumStore.getState().getRemainingDays()).toBe(0);
    });
  });

  // ── 9. Combined workflows ────────────────────────────────────────────

  describe('combined workflows', () => {
    it('should handle a full subscribe → add coins → spend → cancel flow', () => {
      const store = usePremiumStore.getState();
      store.setSubscription('pro', '2026-12-31T23:59:59Z');

      expect(usePremiumStore.getState().isSubscribed).toBe(true);

      usePremiumStore.getState().addCoins(1000);
      expect(usePremiumStore.getState().coinBalance).toBe(1000);

      const spent = usePremiumStore.getState().spendCoins(400);
      expect(spent).toBe(true);
      expect(usePremiumStore.getState().coinBalance).toBe(600);

      usePremiumStore.getState().addPurchase(mockPurchase);
      expect(usePremiumStore.getState().purchaseHistory).toHaveLength(1);

      usePremiumStore.getState().cancelSubscription();
      expect(usePremiumStore.getState().isSubscribed).toBe(false);
      // Coins and purchases survive cancellation
      expect(usePremiumStore.getState().coinBalance).toBe(600);
      expect(usePremiumStore.getState().purchaseHistory).toHaveLength(1);
    });

    it('should handle tier upgrade by calling setSubscription again', () => {
      usePremiumStore.getState().setSubscription('plus', '2026-06-01T00:00:00Z');
      expect(usePremiumStore.getState().currentTier).toBe('plus');

      usePremiumStore.getState().setSubscription('enterprise', '2027-01-01T00:00:00Z');
      expect(usePremiumStore.getState().currentTier).toBe('enterprise');
      expect(usePremiumStore.getState().isSubscribed).toBe(true);
    });
  });

  // ── fetchBillingStatus ───────────────────────────────────────────────

  describe('fetchBillingStatus', () => {
    it('should set tier and status from billing API on success', async () => {
      const mockStatus = {
        tier: 'pro',
        status: 'active',
        currentPeriodEnd: '2027-06-01T00:00:00Z',
      };

      const { billingService } = await import('@/services/billing');
      vi.spyOn(billingService, 'getStatus').mockResolvedValueOnce(
        mockStatus as ReturnType<typeof billingService.getStatus> extends Promise<infer T>
          ? T
          : never
      );

      await usePremiumStore.getState().fetchBillingStatus();

      const state = usePremiumStore.getState();
      expect(state.isSubscribed).toBe(true);
      expect(state.currentTier).toBe('pro');
      expect(state.expiresAt).toBe('2027-06-01T00:00:00Z');
      expect(state.status).toBe('active');
      expect(state.isLoading).toBe(false);
    });

    it('should set isSubscribed false for canceled status', async () => {
      const mockStatus = {
        tier: 'plus',
        status: 'canceled',
        currentPeriodEnd: '2026-03-01T00:00:00Z',
      };

      const { billingService } = await import('@/services/billing');
      vi.spyOn(billingService, 'getStatus').mockResolvedValueOnce(
        mockStatus as ReturnType<typeof billingService.getStatus> extends Promise<infer T>
          ? T
          : never
      );

      await usePremiumStore.getState().fetchBillingStatus();

      const state = usePremiumStore.getState();
      expect(state.isSubscribed).toBe(false);
      expect(state.status).toBe('canceled');
      expect(state.isLoading).toBe(false);
    });

    it('should handle API errors gracefully', async () => {
      const { billingService } = await import('@/services/billing');
      vi.spyOn(billingService, 'getStatus').mockRejectedValueOnce(new Error('Network error'));

      await usePremiumStore.getState().fetchBillingStatus();

      const state = usePremiumStore.getState();
      expect(state.isLoading).toBe(false);
      // State should remain at defaults
      expect(state.isSubscribed).toBe(false);
    });

    it('should set isLoading while fetching', async () => {
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      const { billingService } = await import('@/services/billing');
      vi.spyOn(billingService, 'getStatus').mockReturnValueOnce(pendingPromise as never);

      const fetchPromise = usePremiumStore.getState().fetchBillingStatus();
      expect(usePremiumStore.getState().isLoading).toBe(true);

      resolvePromise!({ tier: 'free', status: 'none', currentPeriodEnd: null });
      await fetchPromise;

      expect(usePremiumStore.getState().isLoading).toBe(false);
    });
  });
});
