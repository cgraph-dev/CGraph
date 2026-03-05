/**
 * Coin Shop Store
 *
 * Zustand store for managing coin bundle data fetched from the backend.
 * Provides:
 * - bundles[] — live coin bundles with pricing from the API
 * - fetchBundles() — load bundles from GET /api/v1/shop/bundles
 * - initiateCheckout() — start a Stripe Checkout session
 *
 * @module modules/gamification/store/coinShopStore
 */

import { create } from 'zustand';
import * as coinShopService from '../services/coinShopService';
import type { CoinBundleDTO } from '../services/coinShopService';
import { createLogger } from '@/lib/logger';

const logger = createLogger('CoinShopStore');

// ============================================================================
// Types
// ============================================================================

export interface CoinBundle {
  id: string;
  coins: number;
  bonusCoins: number;
  price: number;
  popular?: boolean;
  bestValue?: boolean;
}

interface CoinShopState {
  bundles: CoinBundle[];
  loading: boolean;
  error: string | null;
  checkoutLoading: boolean;
  fetchBundles: () => Promise<void>;
  initiateCheckout: (bundleId: string) => Promise<string | null>;
}

// ============================================================================
// Helpers
// ============================================================================

function transformBundle(dto: CoinBundleDTO): CoinBundle {
  return {
    id: dto.id,
    coins: dto.coins,
    bonusCoins: dto.bonus_coins ?? 0,
    price: dto.price,
    popular: dto.popular,
    bestValue: dto.best_value,
  };
}

// ============================================================================
// Store
// ============================================================================

export const useCoinShopStore = create<CoinShopState>((set) => ({
  bundles: [],
  loading: false,
  error: null,
  checkoutLoading: false,

  fetchBundles: async () => {
    set({ loading: true, error: null });
    try {
      const data = await coinShopService.getBundles();
      set({ bundles: data.map(transformBundle), loading: false });
    } catch (error) {
      logger.error('Failed to load bundles', error);
      set({ error: 'Failed to load coin bundles', loading: false });
    }
  },

  initiateCheckout: async (bundleId: string) => {
    set({ checkoutLoading: true });
    try {
      const { checkout_url } = await coinShopService.checkout(bundleId);
      set({ checkoutLoading: false });
      return checkout_url || null;
    } catch (error) {
      logger.error('Checkout failed', error);
      set({ checkoutLoading: false });
      return null;
    }
  },
}));
