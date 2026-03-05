/**
 * Coin Shop Service
 *
 * API client for the coin shop backend endpoints.
 * - Fetch available coin bundles (with Stripe prices)
 * - Initiate Stripe Checkout sessions for coin purchases
 *
 * @module modules/gamification/services/coinShopService
 */

import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';

const logger = createLogger('CoinShopService');

// ============================================================================
// Types
// ============================================================================

export interface CoinBundleDTO {
  id: string;
  coins: number;
  bonus_coins: number;
  price: number;
  stripe_price_id?: string;
  popular?: boolean;
  best_value?: boolean;
}

export interface CheckoutResponse {
  checkout_url: string;
  session_id: string;
}

// ============================================================================
// API Methods
// ============================================================================

/**
 * Fetch available coin bundles from the backend.
 * Endpoint: GET /api/v1/shop/bundles
 */
export async function getBundles(): Promise<CoinBundleDTO[]> {
  try {
    const response = await api.get('/api/v1/shop/bundles');
    return response.data?.data || response.data?.bundles || [];
  } catch (error) {
    logger.error('Failed to fetch coin bundles:', error);
    throw error;
  }
}

/**
 * Initiate a Stripe Checkout session for purchasing a coin bundle.
 * Endpoint: POST /api/v1/shop/purchase-coins
 *
 * Returns a checkout URL to redirect the user to Stripe.
 */
export async function checkout(bundleId: string): Promise<CheckoutResponse> {
  try {
    const response = await api.post('/api/v1/shop/purchase-coins', {
      bundle_id: bundleId,
    });
    const data = response.data?.data || response.data;
    return {
      checkout_url: data.checkout_url,
      session_id: data.session_id,
    };
  } catch (error) {
    logger.error('Failed to create checkout session:', error);
    throw error;
  }
}
