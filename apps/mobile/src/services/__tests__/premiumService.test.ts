/**
 * Tests for premiumService — subscription, coins, and shop API functions.
 *
 * @module services/__tests__/premiumService.test
 */

import {
  getSubscriptionTiers,
  getUserSubscription,
  subscribe,
  cancelSubscription,
  resumeSubscription,
  changeSubscriptionTier,
  getPremiumPerks,
  getCoinBalance,
  getCoinPackages,
  purchaseCoinPackage,
  getCoinTransactions,
  getShopCategories,
  getShopItems,
  getFeaturedItems,
  getLimitedOffers,
  getShopItem,
  purchaseItem,
  equipItem,
  unequipItem,
  getInventory,
  giftItem,
} from '../premiumService';

// Mock the api module (default export)
jest.mock('../../lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

import api from '../../lib/api';

const mockApi = api as jest.Mocked<typeof api>;

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Subscription API ─────────────────────────────────────────────────

describe('getSubscriptionTiers', () => {
  it('returns transformed subscription tiers', async () => {
    const rawTiers = [
      {
        id: 't1',
        name: 'free',
        display_name: 'Free',
        price: 0,
        currency: 'USD',
        interval: 'month',
        features: ['basic'],
        highlighted: false,
      },
      {
        id: 't2',
        name: 'premium',
        display_name: 'Premium',
        price: 9.99,
        currency: 'USD',
        interval: 'month',
        features: ['all'],
        highlighted: true,
        discount: 20,
      },
    ];
    mockApi.get.mockResolvedValue({ data: { data: rawTiers } });

    const result = await getSubscriptionTiers();
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/subscriptions/tiers');
    expect(result).toHaveLength(2);
    expect(result[0].displayName).toBe('Free');
    expect(result[1].highlighted).toBe(true);
    expect(result[1].discount).toBe(20);
  });

  it('handles tiers in alternative response format', async () => {
    mockApi.get.mockResolvedValue({
      data: { tiers: [{ id: 't1', name: 'free', price: 0 }] },
    });
    const result = await getSubscriptionTiers();
    expect(result).toHaveLength(1);
  });
});

describe('getUserSubscription', () => {
  it('transforms user subscription from snake_case', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        data: {
          tier: 'premium',
          status: 'active',
          current_period_start: '2024-01-01',
          current_period_end: '2024-02-01',
          cancel_at_period_end: false,
          trial_end: null,
        },
      },
    });

    const result = await getUserSubscription();
    expect(result.tier).toBe('premium');
    expect(result.status).toBe('active');
    expect(result.currentPeriodStart).toBe('2024-01-01');
    expect(result.currentPeriodEnd).toBe('2024-02-01');
    expect(result.cancelAtPeriodEnd).toBe(false);
    expect(result.trialEnd).toBeNull();
  });

  it('defaults tier to "free" when missing', async () => {
    mockApi.get.mockResolvedValue({ data: { data: {} } });
    const result = await getUserSubscription();
    expect(result.tier).toBe('free');
  });
});

describe('subscribe', () => {
  it('sends tier_id and payment_method_id', async () => {
    mockApi.post.mockResolvedValue({
      data: { client_secret: 'cs_test', subscription_id: 'sub_abc' },
    });

    const result = await subscribe('tier-premium', 'pm_card');
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/subscriptions', {
      tier_id: 'tier-premium',
      payment_method_id: 'pm_card',
    });
    expect(result.clientSecret).toBe('cs_test');
    expect(result.subscriptionId).toBe('sub_abc');
  });
});

describe('cancelSubscription', () => {
  it('returns updated subscription', async () => {
    mockApi.post.mockResolvedValue({
      data: { data: { tier: 'premium', status: 'canceled', cancel_at_period_end: true } },
    });
    const result = await cancelSubscription();
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/users/me/subscription/cancel');
    expect(result.cancelAtPeriodEnd).toBe(true);
  });
});

describe('resumeSubscription', () => {
  it('returns resumed subscription', async () => {
    mockApi.post.mockResolvedValue({
      data: { data: { tier: 'premium', status: 'active', cancel_at_period_end: false } },
    });
    const result = await resumeSubscription();
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/users/me/subscription/resume');
    expect(result.cancelAtPeriodEnd).toBe(false);
  });
});

describe('changeSubscriptionTier', () => {
  it('sends new tier_id', async () => {
    mockApi.post.mockResolvedValue({
      data: { data: { tier: 'enterprise', status: 'active' } },
    });
    const result = await changeSubscriptionTier('tier-enterprise');
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/users/me/subscription/change', {
      tier_id: 'tier-enterprise',
    });
    expect(result.tier).toBe('enterprise');
  });
});

describe('getPremiumPerks', () => {
  it('transforms premium perks', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        data: [
          { id: 'p1', name: 'Custom Badge', description: 'A badge', icon: '🏆', required_tier: 'premium', enabled: true },
        ],
      },
    });
    const result = await getPremiumPerks();
    expect(result).toHaveLength(1);
    expect(result[0].requiredTier).toBe('premium');
  });
});

// ── Coin API ─────────────────────────────────────────────────────────

describe('getCoinBalance', () => {
  it('transforms coin balance from snake_case', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        data: { balance: 500, lifetime_earned: 1000, lifetime_spent: 500, pending_rewards: 50 },
      },
    });
    const result = await getCoinBalance();
    expect(result.balance).toBe(500);
    expect(result.lifetimeEarned).toBe(1000);
    expect(result.lifetimeSpent).toBe(500);
    expect(result.pendingRewards).toBe(50);
  });

  it('defaults to zeros on empty data', async () => {
    mockApi.get.mockResolvedValue({ data: { data: {} } });
    const result = await getCoinBalance();
    expect(result.balance).toBe(0);
    expect(result.lifetimeEarned).toBe(0);
  });
});

describe('getCoinPackages', () => {
  it('transforms coin packages', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        data: [
          { id: 'cp1', name: 'Starter', coins: 100, bonus_coins: 10, price: 0.99, popular: true },
        ],
      },
    });
    const result = await getCoinPackages();
    expect(result[0].bonusCoins).toBe(10);
    expect(result[0].popular).toBe(true);
  });
});

describe('purchaseCoinPackage', () => {
  it('sends package_id and payment_method_id', async () => {
    mockApi.post.mockResolvedValue({
      data: { client_secret: 'cs_coins', transaction_id: 'tx_1' },
    });
    const result = await purchaseCoinPackage('cp1', 'pm_card');
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/shop/coin-packages/purchase', {
      package_id: 'cp1',
      payment_method_id: 'pm_card',
    });
    expect(result.clientSecret).toBe('cs_coins');
    expect(result.transactionId).toBe('tx_1');
  });
});

describe('getCoinTransactions', () => {
  it('fetches transactions with default params', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        data: [
          { id: 'tx1', type: 'earn', amount: 50, description: 'Daily', created_at: '2024-01-01' },
        ],
      },
    });
    const result = await getCoinTransactions();
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/users/me/coins/transactions', {
      params: { limit: 50, offset: 0, type: undefined },
    });
    expect(result[0].createdAt).toBe('2024-01-01');
  });

  it('passes custom filter params', async () => {
    mockApi.get.mockResolvedValue({ data: { data: [] } });
    await getCoinTransactions({ limit: 10, offset: 5, type: 'spend' });
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/users/me/coins/transactions', {
      params: { limit: 10, offset: 5, type: 'spend' },
    });
  });
});

// ── Shop API ─────────────────────────────────────────────────────────

describe('getShopCategories', () => {
  it('transforms shop categories', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        data: [
          { id: 'cat1', name: 'Badges', description: 'Cool badges', icon: '🏅', item_count: 5 },
        ],
      },
    });
    const result = await getShopCategories();
    expect(result[0].itemCount).toBe(5);
  });
});

describe('getShopItems', () => {
  it('fetches items by category with params', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        data: [
          {
            id: 'item1', name: 'Gold Badge', description: 'Shiny',
            image_url: '/img.png', category: 'badges', price: 100,
            price_type: 'coins', rarity: 'rare', owned: false,
            equipped: false, limited_time: false, expires_at: null, stock: null,
          },
        ],
      },
    });
    const result = await getShopItems('cat1', { rarity: 'rare' });
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/shop/categories/cat1/items', {
      params: { limit: 50, offset: 0, rarity: 'rare' },
    });
    expect(result[0].imageUrl).toBe('/img.png');
    expect(result[0].priceType).toBe('coins');
    expect(result[0].rarity).toBe('rare');
  });
});

describe('getFeaturedItems', () => {
  it('returns featured items', async () => {
    mockApi.get.mockResolvedValue({
      data: { data: [{ id: 'fi1', name: 'Featured', price: 50 }] },
    });
    const result = await getFeaturedItems();
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/shop/featured');
    expect(result).toHaveLength(1);
  });
});

describe('getLimitedOffers', () => {
  it('returns limited time offers', async () => {
    mockApi.get.mockResolvedValue({
      data: { data: [{ id: 'lo1', name: 'Limited', limited_time: true }] },
    });
    const result = await getLimitedOffers();
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/shop/limited');
    expect(result[0].limitedTime).toBe(true);
  });
});

describe('getShopItem', () => {
  it('returns single item details', async () => {
    mockApi.get.mockResolvedValue({
      data: { data: { id: 'item99', name: 'Epic Sword', rarity: 'epic' } },
    });
    const result = await getShopItem('item99');
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/shop/items/item99');
    expect(result.rarity).toBe('epic');
  });
});

describe('purchaseItem', () => {
  it('returns purchase result with transformed data', async () => {
    mockApi.post.mockResolvedValue({
      data: {
        data: {
          success: true,
          item: { id: 'item1', name: 'Badge', rarity: 'rare', owned: true },
          new_balance: 400,
          transaction: { id: 'tx1', amount: 100, created_at: '2024-01-01' },
        },
      },
    });
    const result = await purchaseItem('item1');
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/shop/items/item1/purchase');
    expect(result.success).toBe(true);
    expect(result.newBalance).toBe(400);
    expect(result.item.owned).toBe(true);
  });
});

describe('equipItem', () => {
  it('calls equip endpoint', async () => {
    mockApi.post.mockResolvedValue({ data: {} });
    await equipItem('item1');
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/users/me/inventory/item1/equip');
  });
});

describe('unequipItem', () => {
  it('calls unequip endpoint', async () => {
    mockApi.post.mockResolvedValue({ data: {} });
    await unequipItem('item1');
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/users/me/inventory/item1/unequip');
  });
});

describe('getInventory', () => {
  it('returns inventory items', async () => {
    mockApi.get.mockResolvedValue({
      data: { data: [{ id: 'inv1', name: 'My Badge', owned: true, equipped: true }] },
    });
    const result = await getInventory({ category: 'badges' });
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/users/me/inventory', {
      params: { category: 'badges' },
    });
    expect(result[0].owned).toBe(true);
    expect(result[0].equipped).toBe(true);
  });

  it('sends no params when category is not provided', async () => {
    mockApi.get.mockResolvedValue({ data: { data: [] } });
    await getInventory();
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/users/me/inventory', { params: {} });
  });
});

describe('giftItem', () => {
  it('sends gift with optional message', async () => {
    mockApi.post.mockResolvedValue({
      data: {
        data: {
          success: true,
          recipient_username: 'alice',
          item: { id: 'item1', name: 'Gift Badge' },
          message: 'Enjoy!',
        },
      },
    });
    const result = await giftItem('item1', 'alice', 'Enjoy!');
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/shop/items/item1/gift', {
      recipient_username: 'alice',
      message: 'Enjoy!',
    });
    expect(result.recipientUsername).toBe('alice');
    expect(result.message).toBe('Enjoy!');
  });

  it('sends gift without message', async () => {
    mockApi.post.mockResolvedValue({
      data: {
        data: {
          success: true,
          recipient_username: 'bob',
          item: { id: 'item2', name: 'Badge' },
          message: null,
        },
      },
    });
    const result = await giftItem('item2', 'bob');
    expect(result.message).toBeNull();
  });
});
