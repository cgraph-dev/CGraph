/**
 * Payment Service for Mobile
 *
 * Handles in-app purchases for Premium subscriptions and Coin purchases.
 * Uses expo-in-app-purchases for iOS/Android native purchases
 * with Stripe as fallback for web/testing.
 */

import { Platform, Alert } from 'react-native';
import * as Linking from 'expo-linking';
import api from './api';

// ============================================================================
// Types
// ============================================================================

export type ProductType = 'subscription' | 'consumable';

export interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  priceAmountMicros: number;
  priceCurrencyCode: string;
  type: ProductType;
}

export interface Purchase {
  productId: string;
  transactionId: string;
  transactionDate: number;
  transactionReceipt: string;
  purchaseState: 'purchased' | 'pending' | 'restored';
}

export interface SubscriptionStatus {
  isActive: boolean;
  tier: 'free' | 'premium' | 'enterprise';
  expiresAt: string | null;
  willRenew: boolean;
  provider: 'stripe' | 'apple' | 'google' | null;
}

// ============================================================================
// Product IDs
// ============================================================================

export const PRODUCT_IDS = {
  // Subscriptions
  PREMIUM_MONTHLY: 'cgraph_premium_monthly',
  PREMIUM_YEARLY: 'cgraph_premium_yearly',
  PREMIUM_PLUS_MONTHLY: 'cgraph_premium_plus_monthly',
  PREMIUM_PLUS_YEARLY: 'cgraph_premium_plus_yearly',

  // Coin Bundles (consumables)
  COINS_100: 'cgraph_coins_100',
  COINS_500: 'cgraph_coins_500',
  COINS_1200: 'cgraph_coins_1200',
  COINS_2500: 'cgraph_coins_2500',
  COINS_6000: 'cgraph_coins_6000',
} as const;

// ============================================================================
// Payment Service Class
// ============================================================================

class PaymentService {
  private isInitialized = false;
  private products: Map<string, Product> = new Map();
  private purchaseListeners: ((purchase: Purchase) => void)[] = [];

  /**
   * Initialize the payment service
   * Call this early in the app lifecycle
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // In a production app, this would initialize the native IAP SDK
      // For now, we'll use a backend-based approach

      if (__DEV__) console.warn('[PaymentService] Initializing...');

      // Fetch products from backend
      await this.fetchProducts();

      this.isInitialized = true;
      if (__DEV__) console.warn('[PaymentService] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[PaymentService] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Fetch available products from the backend
   */
  private async fetchProducts(): Promise<void> {
    try {
      // Fetch subscription tiers
      const [tiersRes, coinsRes] = await Promise.allSettled([
        api.get('/api/v1/premium/tiers'),
        api.get('/api/v1/coins/packages'),
      ]);

      if (tiersRes.status === 'fulfilled') {
        const tiers = tiersRes.value.data?.tiers || tiersRes.value.data || [];
        for (const tier of tiers) {
          if (tier.id !== 'free') {
            // Monthly subscription
            this.products.set(`cgraph_${tier.id}_monthly`, {
              id: `cgraph_${tier.id}_monthly`,
              title: `${tier.name} Monthly`,
              description: tier.description || `${tier.name} subscription - monthly`,
              price: `$${tier.price_monthly || tier.price || 0}`,
              priceAmountMicros: (tier.price_monthly || tier.price || 0) * 1000000,
              priceCurrencyCode: 'USD',
              type: 'subscription',
            });
            // Yearly subscription
            const yearlyPrice =
              tier.price_yearly || (tier.price_monthly || tier.price || 0) * 12 * 0.8;
            this.products.set(`cgraph_${tier.id}_yearly`, {
              id: `cgraph_${tier.id}_yearly`,
              title: `${tier.name} Yearly`,
              description: `${tier.name} subscription - yearly (20% off)`,
              price: `$${yearlyPrice.toFixed(2)}`,
              priceAmountMicros: yearlyPrice * 1000000,
              priceCurrencyCode: 'USD',
              type: 'subscription',
            });
          }
        }
      }

      if (coinsRes.status === 'fulfilled') {
        const packages = coinsRes.value.data?.packages || coinsRes.value.data || [];
        for (const pkg of packages) {
          this.products.set(pkg.id, {
            id: pkg.id,
            title: pkg.title || `${pkg.coins} Coins`,
            description: pkg.description || `${pkg.coins} CGraph Coins`,
            price: `$${pkg.price || 0}`,
            priceAmountMicros: (pkg.price || 0) * 1000000,
            priceCurrencyCode: 'USD',
            type: 'consumable',
          });
        }
      }

      // If no products fetched, load fallbacks
      if (this.products.size === 0) {
        this.loadFallbackProducts();
      }
    } catch (error) {
      console.error('[PaymentService] Failed to fetch products:', error);
      this.loadFallbackProducts();
    }
  }

  /**
   * Load fallback products when API is unavailable
   */
  private loadFallbackProducts(): void {
    const fallbackProducts: Product[] = [
      // Subscriptions
      {
        id: PRODUCT_IDS.PREMIUM_MONTHLY,
        title: 'Premium Monthly',
        description: 'Premium subscription - monthly',
        price: '$4.99',
        priceAmountMicros: 4990000,
        priceCurrencyCode: 'USD',
        type: 'subscription',
      },
      {
        id: PRODUCT_IDS.PREMIUM_YEARLY,
        title: 'Premium Yearly',
        description: 'Premium subscription - yearly (20% off)',
        price: '$47.90',
        priceAmountMicros: 47900000,
        priceCurrencyCode: 'USD',
        type: 'subscription',
      },
      {
        id: PRODUCT_IDS.PREMIUM_PLUS_MONTHLY,
        title: 'Premium+ Monthly',
        description: 'Premium+ subscription - monthly',
        price: '$9.99',
        priceAmountMicros: 9990000,
        priceCurrencyCode: 'USD',
        type: 'subscription',
      },
      {
        id: PRODUCT_IDS.PREMIUM_PLUS_YEARLY,
        title: 'Premium+ Yearly',
        description: 'Premium+ subscription - yearly (20% off)',
        price: '$95.90',
        priceAmountMicros: 95900000,
        priceCurrencyCode: 'USD',
        type: 'subscription',
      },

      // Coin bundles
      {
        id: PRODUCT_IDS.COINS_100,
        title: '100 Coins',
        description: '100 CGraph Coins',
        price: '$0.99',
        priceAmountMicros: 990000,
        priceCurrencyCode: 'USD',
        type: 'consumable',
      },
      {
        id: PRODUCT_IDS.COINS_500,
        title: '550 Coins',
        description: '500 + 50 Bonus Coins',
        price: '$4.99',
        priceAmountMicros: 4990000,
        priceCurrencyCode: 'USD',
        type: 'consumable',
      },
      {
        id: PRODUCT_IDS.COINS_1200,
        title: '1,400 Coins',
        description: '1,200 + 200 Bonus Coins',
        price: '$9.99',
        priceAmountMicros: 9990000,
        priceCurrencyCode: 'USD',
        type: 'consumable',
      },
      {
        id: PRODUCT_IDS.COINS_2500,
        title: '3,000 Coins',
        description: '2,500 + 500 Bonus Coins',
        price: '$19.99',
        priceAmountMicros: 19990000,
        priceCurrencyCode: 'USD',
        type: 'consumable',
      },
      {
        id: PRODUCT_IDS.COINS_6000,
        title: '7,500 Coins',
        description: '6,000 + 1,500 Bonus Coins',
        price: '$49.99',
        priceAmountMicros: 49990000,
        priceCurrencyCode: 'USD',
        type: 'consumable',
      },
    ];

    for (const product of fallbackProducts) {
      this.products.set(product.id, product);
    }
  }

  /**
   * Get all available products
   */
  getProducts(): Product[] {
    return Array.from(this.products.values());
  }

  /**
   * Get a specific product by ID
   */
  getProduct(productId: string): Product | undefined {
    return this.products.get(productId);
  }

  /**
   * Purchase a product
   */
  async purchaseProduct(productId: string): Promise<Purchase | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const product = this.products.get(productId);
    if (!product) {
      if (__DEV__) {
        console.warn(
          `[PaymentService] Product '${productId}' not found. IAP products require App Store Connect / Google Play Console setup.`
        );
        return null;
      }
      throw new Error(`Product not found: ${productId}`);
    }

    try {
      if (__DEV__) console.warn('[PaymentService] Starting purchase for:', productId);

      if (product.type === 'subscription') {
        // Map store product IDs to internal tier names
        const tier = productId.includes('premium_plus') ? 'enterprise' : 'premium';
        const billingInterval = productId.includes('yearly') ? 'year' : 'month';

        const response = await api.post('/api/v1/premium/subscribe', {
          tier,
          billing_interval: billingInterval,
          platform: Platform.OS,
        });

        const { checkout_url } = response.data;

        if (checkout_url) {
          // Open Stripe checkout in browser
          const supported = await Linking.canOpenURL(checkout_url);
          if (supported) {
            await Linking.openURL(checkout_url);
          } else {
            throw new Error('Cannot open payment URL');
          }
        }

        return {
          productId,
          transactionId: `sub_${Date.now()}`,
          transactionDate: Date.now(),
          transactionReceipt: '',
          purchaseState: 'pending',
        };
      } else {
        // Coin purchase - use coins packages endpoint
        const response = await api.post('/api/v1/coins/purchase', {
          package_id: productId,
          platform: Platform.OS,
        });

        const { checkout_url, success, coins_added: _coinsAdded } = response.data;

        if (checkout_url) {
          const supported = await Linking.canOpenURL(checkout_url);
          if (supported) {
            await Linking.openURL(checkout_url);
          }
          return {
            productId,
            transactionId: `coins_${Date.now()}`,
            transactionDate: Date.now(),
            transactionReceipt: '',
            purchaseState: 'pending',
          };
        }

        if (success) {
          return {
            productId,
            transactionId: `coins_${Date.now()}`,
            transactionDate: Date.now(),
            transactionReceipt: '',
            purchaseState: 'purchased',
          };
        }
      }

      return null;
    } catch (error: unknown) {
      console.error('[PaymentService] Purchase failed:', error);

      // Show user-friendly error

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const axiosError = error as { response?: { data?: { message?: string; error?: string } } };
      Alert.alert(
        'Purchase Failed',
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Unable to complete purchase. Please try again.',
        [{ text: 'OK' }]
      );

      return null;
    }
  }

  /**
   * Restore previous purchases
   * Note: For Stripe, subscription status is already synced via /premium/status
   * This is mainly for native IAP restore functionality
   */
  async restorePurchases(): Promise<Purchase[]> {
    try {
      if (__DEV__) console.warn('[PaymentService] Restoring purchases...');

      // Check current subscription status - this is the "restore" for Stripe
      const status = await this.getSubscriptionStatus();

      if (status.isActive && status.tier !== 'free') {
        // User has an active subscription
        const productId =
          status.tier === 'enterprise'
            ? PRODUCT_IDS.PREMIUM_PLUS_MONTHLY
            : PRODUCT_IDS.PREMIUM_MONTHLY;

        return [
          {
            productId,
            transactionId: `restored_${Date.now()}`,
            transactionDate: Date.now(),
            transactionReceipt: '',
            purchaseState: 'restored',
          },
        ];
      }

      return [];
    } catch (error) {
      console.error('[PaymentService] Restore failed:', error);
      return [];
    }
  }

  /**
   * Get current subscription status
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      const response = await api.get('/api/v1/premium/status');
      const data = response.data?.data || response.data;

      return {
        isActive: data.is_active || data.tier !== 'free',
        tier: data.tier || 'free',
        expiresAt: data.expires_at || null,
        willRenew: data.will_renew ?? data.auto_renew ?? false,
        provider: data.provider || null,
      };
    } catch (error) {
      console.error('[PaymentService] Failed to get subscription status:', error);
      return {
        isActive: false,
        tier: 'free',
        expiresAt: null,
        willRenew: false,
        provider: null,
      };
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(): Promise<boolean> {
    try {
      // For native subscriptions, redirect to platform settings
      if (Platform.OS === 'ios') {
        await Linking.openURL('https://apps.apple.com/account/subscriptions');
        return true;
      } else if (Platform.OS === 'android') {
        await Linking.openURL('https://play.google.com/store/account/subscriptions');
        return true;
      }

      // For Stripe subscriptions, call backend
      await api.post('/api/v1/premium/cancel');
      return true;
    } catch (error) {
      console.error('[PaymentService] Cancel failed:', error);
      return false;
    }
  }

  /**
   * Get user's coin balance
   */
  async getCoinBalance(): Promise<number> {
    try {
      const response = await api.get('/api/v1/coins');
      return response.data?.balance || response.data?.coins || 0;
    } catch (error) {
      console.error('[PaymentService] Failed to get coin balance:', error);
      return 0;
    }
  }

  /**
   * Purchase a shop item with coins
   */
  async purchaseWithCoins(itemId: string, price: number): Promise<boolean> {
    try {
      const response = await api.post('/api/v1/shop/purchase', {
        item_id: itemId,
        price,
      });

      return response.data.success || false;
    } catch (error: unknown) {
      console.error('[PaymentService] Coin purchase failed:', error);

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const axiosError = error as { response?: { data?: { message?: string } } };
      Alert.alert(
        'Purchase Failed',
        axiosError.response?.data?.message || 'Unable to complete purchase.',
        [{ text: 'OK' }]
      );

      return false;
    }
  }

  /**
   * Claim daily free coins
   */
  async claimDailyCoins(): Promise<{
    success: boolean;
    coins: number;
    nextClaimAt: string | null;
  }> {
    try {
      const response = await api.post('/api/v1/shop/claim-daily');

      return {
        success: true,
        coins: response.data.coins_awarded || 0,
        nextClaimAt: response.data.next_claim_at || null,
      };
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const axiosError = error as { response?: { data?: { next_claim_at?: string } } };
      return {
        success: false,
        coins: 0,
        nextClaimAt: axiosError.response?.data?.next_claim_at || null,
      };
    }
  }

  /**
   * Add purchase listener
   */
  addPurchaseListener(listener: (purchase: Purchase) => void): () => void {
    this.purchaseListeners.push(listener);
    return () => {
      const index = this.purchaseListeners.indexOf(listener);
      if (index > -1) {
        this.purchaseListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify purchase listeners
   */
  private notifyPurchaseListeners(purchase: Purchase): void {
    for (const listener of this.purchaseListeners) {
      try {
        listener(purchase);
      } catch (error) {
        console.error('[PaymentService] Listener error:', error);
      }
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
export default paymentService;
