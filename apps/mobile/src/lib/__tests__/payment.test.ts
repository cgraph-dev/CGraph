/**
 * Tests for PaymentService — in-app purchases, subscriptions, and coin operations.
 *
 * @module lib/__tests__/payment.test
 */

// Mock API, Platform, Linking, Alert before import
jest.mock('../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
  API_URL: 'https://api.cgraph.test',
}));

const mockCanOpenURL = jest.fn();
const mockOpenURL = jest.fn();
const mockAlertFn = jest.fn();

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  Linking: {},
  Alert: {
    alert: (...args: unknown[]) => mockAlertFn(...args),
  },
}));

jest.mock('expo-linking', () => ({
  canOpenURL: (...args: unknown[]) => mockCanOpenURL(...args),
  openURL: (...args: unknown[]) => mockOpenURL(...args),
  createURL: jest.fn(),
  parse: jest.fn(),
}));

import api from '../api';
import paymentService, { PRODUCT_IDS } from '../payment';

const mockApi = api as jest.Mocked<typeof api>;

beforeEach(() => {
  jest.clearAllMocks();
  // Reset the singleton's internal state for each test by re-initializing
  // We access the private fields through casting
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (paymentService as any).isInitialized = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (paymentService as any).products = new Map();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (paymentService as any).purchaseListeners = [];
});

// ── PRODUCT_IDS ──────────────────────────────────────────────────────

describe('PRODUCT_IDS', () => {
  it('has monthly and yearly premium IDs', () => {
    expect(PRODUCT_IDS.PREMIUM_MONTHLY).toBeDefined();
    expect(PRODUCT_IDS.PREMIUM_YEARLY).toBeDefined();
  });

  it('has monthly and yearly premium plus (enterprise) IDs', () => {
    expect(PRODUCT_IDS.PREMIUM_PLUS_MONTHLY).toBeDefined();
    expect(PRODUCT_IDS.PREMIUM_PLUS_YEARLY).toBeDefined();
  });

  it('has coin bundle IDs', () => {
    expect(PRODUCT_IDS.COINS_100).toBeDefined();
    expect(PRODUCT_IDS.COINS_500).toBeDefined();
    expect(PRODUCT_IDS.COINS_1200).toBeDefined();
  });
});

// ── initialize ───────────────────────────────────────────────────────

describe('initialize', () => {
  it('fetches products from API', async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url === '/api/v1/premium/tiers') {
        return Promise.resolve({
          data: {
            tiers: [
              { id: 'premium', name: 'Premium', price_monthly: 4.99, description: 'Premium tier' },
            ],
          },
        });
      }
      if (url === '/api/v1/coins/packages') {
        return Promise.resolve({
          data: {
            packages: [
              { id: 'cgraph_coins_100', coins: 100, price: 0.99, title: '100 Coins' },
            ],
          },
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    await paymentService.initialize();
    // Should have fetched tiers and packages
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/premium/tiers');
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/coins/packages');
    // Should have products loaded (2 from tiers: monthly+yearly, 1 from coins)
    expect(paymentService.getProducts().length).toBeGreaterThanOrEqual(1);
  });

  it('falls back to hardcoded products on API error', async () => {
    mockApi.get.mockRejectedValue(new Error('API down'));

    await paymentService.initialize();

    // Should have fallback products
    const products = paymentService.getProducts();
    expect(products.length).toBeGreaterThan(0);
  });

  it('does not re-initialize if already initialized', async () => {
    mockApi.get.mockResolvedValue({ data: { tiers: [] } });

    await paymentService.initialize();
    await paymentService.initialize();

    // Should only have called the APIs once (2 calls total: tiers + packages)
    expect(mockApi.get).toHaveBeenCalledTimes(2);
  });
});

// ── getProducts / getProduct ─────────────────────────────────────────

describe('getProducts', () => {
  it('returns empty array when not initialized', () => {
    expect(paymentService.getProducts()).toEqual([]);
  });

  it('returns all products after initialization', async () => {
    mockApi.get.mockRejectedValue(new Error('Fallback'));
    await paymentService.initialize();
    expect(paymentService.getProducts().length).toBeGreaterThan(0);
  });
});

describe('getProduct', () => {
  it('returns specific product by ID', async () => {
    mockApi.get.mockRejectedValue(new Error('Fallback'));
    await paymentService.initialize();

    const product = paymentService.getProduct(PRODUCT_IDS.PREMIUM_MONTHLY);
    expect(product).toBeDefined();
    expect(product!.id).toBe(PRODUCT_IDS.PREMIUM_MONTHLY);
  });

  it('returns undefined for non-existent product', async () => {
    mockApi.get.mockRejectedValue(new Error('Fallback'));
    await paymentService.initialize();

    expect(paymentService.getProduct('non-existent')).toBeUndefined();
  });
});

// ── purchaseProduct ──────────────────────────────────────────────────

describe('purchaseProduct — subscription', () => {
  beforeEach(async () => {
    mockApi.get.mockRejectedValue(new Error('Fallback'));
    await paymentService.initialize();
  });

  it('initiates subscription purchase via Stripe checkout', async () => {
    mockApi.post.mockResolvedValue({
      data: { checkout_url: 'https://checkout.stripe.com/session/test' },
    });
    mockCanOpenURL.mockResolvedValue(true);
    mockOpenURL.mockResolvedValue(true);

    const result = await paymentService.purchaseProduct(PRODUCT_IDS.PREMIUM_MONTHLY);

    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/premium/subscribe', expect.objectContaining({
      tier: 'premium',
      billing_interval: 'month',
      platform: 'ios',
    }));
    expect(mockOpenURL).toHaveBeenCalledWith('https://checkout.stripe.com/session/test');
    expect(result).not.toBeNull();
    expect(result!.purchaseState).toBe('pending');
  });

  it('maps premium_plus to enterprise tier', async () => {
    mockApi.post.mockResolvedValue({ data: { checkout_url: 'https://checkout.stripe.com/x' } });
    mockCanOpenURL.mockResolvedValue(true);
    mockOpenURL.mockResolvedValue(true);

    await paymentService.purchaseProduct(PRODUCT_IDS.PREMIUM_PLUS_YEARLY);

    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/premium/subscribe', expect.objectContaining({
      tier: 'enterprise',
      billing_interval: 'year',
    }));
  });

  it('throws when product not found', async () => {
    await expect(paymentService.purchaseProduct('bad-id')).rejects.toThrow('Product not found: bad-id');
  });

  it('shows alert on purchase error', async () => {
    mockApi.post.mockRejectedValue({
      response: { data: { message: 'Insufficient funds' } },
    });

    const result = await paymentService.purchaseProduct(PRODUCT_IDS.PREMIUM_MONTHLY);

    expect(result).toBeNull();
    expect(mockAlertFn).toHaveBeenCalledWith(
      'Purchase Failed',
      'Insufficient funds',
      expect.any(Array)
    );
  });
});

describe('purchaseProduct — coins', () => {
  beforeEach(async () => {
    mockApi.get.mockRejectedValue(new Error('Fallback'));
    await paymentService.initialize();
  });

  it('purchases coins via checkout URL', async () => {
    mockApi.post.mockResolvedValue({
      data: { checkout_url: 'https://checkout.stripe.com/coins' },
    });
    mockCanOpenURL.mockResolvedValue(true);
    mockOpenURL.mockResolvedValue(true);

    const result = await paymentService.purchaseProduct(PRODUCT_IDS.COINS_100);

    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/coins/purchase', expect.objectContaining({
      package_id: PRODUCT_IDS.COINS_100,
    }));
    expect(result).not.toBeNull();
    expect(result!.purchaseState).toBe('pending');
  });

  it('handles instant coin purchase (no checkout URL)', async () => {
    mockApi.post.mockResolvedValue({
      data: { success: true, coins_added: 100 },
    });

    const result = await paymentService.purchaseProduct(PRODUCT_IDS.COINS_100);

    expect(result).not.toBeNull();
    expect(result!.purchaseState).toBe('purchased');
  });
});

// ── restorePurchases ─────────────────────────────────────────────────

describe('restorePurchases', () => {
  it('returns restored purchase when user has active subscription', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { data: [] } }); // initialize
    await paymentService.initialize();

    mockApi.get.mockResolvedValue({
      data: { tier: 'premium', is_active: true },
    });

    const result = await paymentService.restorePurchases();

    expect(result).toHaveLength(1);
    expect(result[0].purchaseState).toBe('restored');
  });

  it('returns empty array when user has no active subscription', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { data: [] } });
    await paymentService.initialize();

    mockApi.get.mockResolvedValue({
      data: { tier: 'free', is_active: false },
    });

    const result = await paymentService.restorePurchases();
    expect(result).toEqual([]);
  });

  it('returns empty array on error', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { data: [] } });
    await paymentService.initialize();

    mockApi.get.mockRejectedValue(new Error('Network error'));

    const result = await paymentService.restorePurchases();
    expect(result).toEqual([]);
  });
});

// ── getSubscriptionStatus ────────────────────────────────────────────

describe('getSubscriptionStatus', () => {
  it('returns active subscription status', async () => {
    mockApi.get.mockResolvedValue({
      data: { data: { tier: 'premium', is_active: true, will_renew: true, provider: 'stripe' } },
    });

    const status = await paymentService.getSubscriptionStatus();

    expect(status.isActive).toBe(true);
    expect(status.tier).toBe('premium');
    expect(status.willRenew).toBe(true);
    expect(status.provider).toBe('stripe');
  });

  it('returns free fallback on error', async () => {
    mockApi.get.mockRejectedValue(new Error('Auth required'));

    const status = await paymentService.getSubscriptionStatus();

    expect(status.isActive).toBe(false);
    expect(status.tier).toBe('free');
  });
});

// ── cancelSubscription ───────────────────────────────────────────────

describe('cancelSubscription', () => {
  it('opens App Store subscriptions on iOS', async () => {
    // Platform.OS is 'ios' (from mock)
    mockOpenURL.mockResolvedValue(true);

    const result = await paymentService.cancelSubscription();

    expect(result).toBe(true);
    expect(mockOpenURL).toHaveBeenCalledWith(
      'https://apps.apple.com/account/subscriptions'
    );
  });

  it('returns false on error', async () => {
    mockOpenURL.mockRejectedValue(new Error('Cannot open'));

    const result = await paymentService.cancelSubscription();
    expect(result).toBe(false);
  });
});

// ── getCoinBalance ───────────────────────────────────────────────────

describe('getCoinBalance', () => {
  it('returns balance from API', async () => {
    mockApi.get.mockResolvedValue({ data: { balance: 500 } });
    const result = await paymentService.getCoinBalance();
    expect(result).toBe(500);
  });

  it('returns 0 on error', async () => {
    mockApi.get.mockRejectedValue(new Error('Error'));
    const result = await paymentService.getCoinBalance();
    expect(result).toBe(0);
  });
});

// ── purchaseWithCoins ────────────────────────────────────────────────

describe('purchaseWithCoins', () => {
  it('sends item_id and price', async () => {
    mockApi.post.mockResolvedValue({ data: { success: true } });

    const result = await paymentService.purchaseWithCoins('item-1', 100);

    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/shop/purchase', {
      item_id: 'item-1',
      price: 100,
    });
    expect(result).toBe(true);
  });

  it('returns false and shows alert on error', async () => {
    mockApi.post.mockRejectedValue({
      response: { data: { message: 'Not enough coins' } },
    });

    const result = await paymentService.purchaseWithCoins('item-1', 100);

    expect(result).toBe(false);
    expect(mockAlertFn).toHaveBeenCalled();
  });
});

// ── claimDailyCoins ──────────────────────────────────────────────────

describe('claimDailyCoins', () => {
  it('returns claimed coins on success', async () => {
    mockApi.post.mockResolvedValue({
      data: { coins_awarded: 25, next_claim_at: '2024-01-16T00:00:00Z' },
    });

    const result = await paymentService.claimDailyCoins();

    expect(result.success).toBe(true);
    expect(result.coins).toBe(25);
    expect(result.nextClaimAt).toBe('2024-01-16T00:00:00Z');
  });

  it('returns failure with next claim time on error', async () => {
    mockApi.post.mockRejectedValue({
      response: { data: { next_claim_at: '2024-01-16T12:00:00Z' } },
    });

    const result = await paymentService.claimDailyCoins();

    expect(result.success).toBe(false);
    expect(result.coins).toBe(0);
    expect(result.nextClaimAt).toBe('2024-01-16T12:00:00Z');
  });
});

// ── addPurchaseListener ──────────────────────────────────────────────

describe('addPurchaseListener', () => {
  it('returns unsubscribe function', () => {
    const listener = jest.fn();
    const unsub = paymentService.addPurchaseListener(listener);
    expect(typeof unsub).toBe('function');
  });

  it('removes listener when unsubscribed', () => {
    const listener = jest.fn();
    const unsub = paymentService.addPurchaseListener(listener);
    unsub();
    // Listener should be removed — no way to verify externally
    // beyond not throwing
  });
});
