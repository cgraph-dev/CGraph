/**
 * Premium Service
 *
 * Backend API integration for premium and shop features:
 * - Subscription management
 * - Coin shop
 * - Premium perks
 * - In-app purchases
 *
 * @module services/premiumService
 * @since v0.9.0
 */

import api from '../lib/api';

// ==================== TYPES ====================

export interface SubscriptionTier {
  id: string;
  name: 'free' | 'plus' | 'pro' | 'ultimate';
  displayName: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  highlighted: boolean;
  discount?: number;
}

export interface UserSubscription {
  tier: 'free' | 'plus' | 'pro' | 'ultimate';
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
}

export interface PremiumPerk {
  id: string;
  name: string;
  description: string;
  icon: string;
  requiredTier: 'plus' | 'pro' | 'ultimate';
  enabled: boolean;
  value?: string | number;
}

export interface CoinBalance {
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  pendingRewards: number;
}

export interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  bonusCoins: number;
  price: number;
  currency: string;
  popular: boolean;
  discount?: number;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: 'avatar_frames' | 'chat_bubbles' | 'titles' | 'emojis' | 'effects' | 'badges';
  price: number;
  priceType: 'coins' | 'real';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'divine';
  owned: boolean;
  equipped: boolean;
  limitedTime: boolean;
  expiresAt: string | null;
  stock: number | null;
}

export interface ShopCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  itemCount: number;
}

export interface PurchaseResult {
  success: boolean;
  item: ShopItem;
  newBalance: number;
  transaction: {
    id: string;
    amount: number;
    createdAt: string;
  };
}

export interface CoinTransaction {
  id: string;
  type: 'earn' | 'spend' | 'purchase' | 'gift' | 'refund';
  amount: number;
  description: string;
  itemId: string | null;
  createdAt: string;
}

export interface GiftResult {
  success: boolean;
  recipientUsername: string;
  item: ShopItem;
  message: string | null;
}

// ==================== SUBSCRIPTION API ====================

/**
 * Get available subscription tiers
 */
export async function getSubscriptionTiers(): Promise<SubscriptionTier[]> {
  const response = await api.get('/api/v1/subscriptions/tiers');
  return (response.data.data || response.data.tiers || []).map(transformSubscriptionTier);
}

/**
 * Get current user's subscription
 */
export async function getUserSubscription(): Promise<UserSubscription> {
  const response = await api.get('/api/v1/users/me/subscription');
  return transformUserSubscription(response.data.data || response.data);
}

/**
 * Subscribe to a tier
 */
export async function subscribe(
  tierId: string,
  paymentMethodId: string
): Promise<{ clientSecret: string; subscriptionId: string }> {
  const response = await api.post('/api/v1/subscriptions', {
    tier_id: tierId,
    payment_method_id: paymentMethodId,
  });
  return {
    clientSecret: response.data.data?.client_secret || response.data.client_secret,
    subscriptionId: response.data.data?.subscription_id || response.data.subscription_id,
  };
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(): Promise<UserSubscription> {
  const response = await api.post('/api/v1/users/me/subscription/cancel');
  return transformUserSubscription(response.data.data || response.data);
}

/**
 * Resume canceled subscription
 */
export async function resumeSubscription(): Promise<UserSubscription> {
  const response = await api.post('/api/v1/users/me/subscription/resume');
  return transformUserSubscription(response.data.data || response.data);
}

/**
 * Change subscription tier
 */
export async function changeSubscriptionTier(newTierId: string): Promise<UserSubscription> {
  const response = await api.post('/api/v1/users/me/subscription/change', {
    tier_id: newTierId,
  });
  return transformUserSubscription(response.data.data || response.data);
}

/**
 * Get premium perks for current user
 */
export async function getPremiumPerks(): Promise<PremiumPerk[]> {
  const response = await api.get('/api/v1/users/me/premium-perks');
  return (response.data.data || response.data.perks || []).map(transformPremiumPerk);
}

// ==================== COIN API ====================

/**
 * Get coin balance
 */
export async function getCoinBalance(): Promise<CoinBalance> {
  const response = await api.get('/api/v1/users/me/coins');
  return transformCoinBalance(response.data.data || response.data);
}

/**
 * Get available coin packages
 */
export async function getCoinPackages(): Promise<CoinPackage[]> {
  const response = await api.get('/api/v1/shop/coin-packages');
  return (response.data.data || response.data.packages || []).map(transformCoinPackage);
}

/**
 * Purchase coin package
 */
export async function purchaseCoinPackage(
  packageId: string,
  paymentMethodId: string
): Promise<{ clientSecret: string; transactionId: string }> {
  const response = await api.post('/api/v1/shop/coin-packages/purchase', {
    package_id: packageId,
    payment_method_id: paymentMethodId,
  });
  return {
    clientSecret: response.data.data?.client_secret || response.data.client_secret,
    transactionId: response.data.data?.transaction_id || response.data.transaction_id,
  };
}

/**
 * Get coin transaction history
 */
export async function getCoinTransactions(options?: {
  limit?: number;
  offset?: number;
  type?: string;
}): Promise<CoinTransaction[]> {
  const params = {
    limit: options?.limit || 50,
    offset: options?.offset || 0,
    type: options?.type,
  };
  const response = await api.get('/api/v1/users/me/coins/transactions', { params });
  return (response.data.data || response.data.transactions || []).map(transformCoinTransaction);
}

// ==================== SHOP API ====================

/**
 * Get shop categories
 */
export async function getShopCategories(): Promise<ShopCategory[]> {
  const response = await api.get('/api/v1/shop/categories');
  return (response.data.data || response.data.categories || []).map(transformShopCategory);
}

/**
 * Get shop items by category
 */
export async function getShopItems(
  categoryId: string,
  options?: { limit?: number; offset?: number; rarity?: string }
): Promise<ShopItem[]> {
  const params = {
    limit: options?.limit || 50,
    offset: options?.offset || 0,
    rarity: options?.rarity,
  };
  const response = await api.get(`/api/v1/shop/categories/${categoryId}/items`, { params });
  return (response.data.data || response.data.items || []).map(transformShopItem);
}

/**
 * Get featured shop items
 */
export async function getFeaturedItems(): Promise<ShopItem[]> {
  const response = await api.get('/api/v1/shop/featured');
  return (response.data.data || response.data.items || []).map(transformShopItem);
}

/**
 * Get limited time offers
 */
export async function getLimitedOffers(): Promise<ShopItem[]> {
  const response = await api.get('/api/v1/shop/limited');
  return (response.data.data || response.data.items || []).map(transformShopItem);
}

/**
 * Get item details
 */
export async function getShopItem(itemId: string): Promise<ShopItem> {
  const response = await api.get(`/api/v1/shop/items/${itemId}`);
  return transformShopItem(response.data.data || response.data);
}

/**
 * Purchase item with coins
 */
export async function purchaseItem(itemId: string): Promise<PurchaseResult> {
  const response = await api.post(`/api/v1/shop/items/${itemId}/purchase`);
  return transformPurchaseResult(response.data.data || response.data);
}

/**
 * Equip purchased item
 */
export async function equipItem(itemId: string): Promise<void> {
  await api.post(`/api/v1/users/me/inventory/${itemId}/equip`);
}

/**
 * Unequip item
 */
export async function unequipItem(itemId: string): Promise<void> {
  await api.post(`/api/v1/users/me/inventory/${itemId}/unequip`);
}

/**
 * Get user's inventory
 */
export async function getInventory(options?: { category?: string }): Promise<ShopItem[]> {
  const params = options?.category ? { category: options.category } : {};
  const response = await api.get('/api/v1/users/me/inventory', { params });
  return (response.data.data || response.data.items || []).map(transformShopItem);
}

/**
 * Gift item to another user
 */
export async function giftItem(
  itemId: string,
  recipientUsername: string,
  message?: string
): Promise<GiftResult> {
  const response = await api.post(`/api/v1/shop/items/${itemId}/gift`, {
    recipient_username: recipientUsername,
    message,
  });
  return transformGiftResult(response.data.data || response.data);
}

// ==================== TRANSFORMERS ====================

/** API response type for transform functions */
type ApiData = Record<string, unknown>;

function transformSubscriptionTier(data: ApiData): SubscriptionTier {
  return {
    id: data.id,
    name: data.name,
    displayName: data.display_name || data.displayName || data.name,
    price: data.price,
    currency: data.currency || 'USD',
    interval: data.interval || 'month',
    features: data.features || [],
    highlighted: data.highlighted ?? false,
    discount: data.discount,
  };
}

function transformUserSubscription(data: ApiData): UserSubscription {
  return {
    tier: data.tier || 'free',
    status: data.status || 'active',
    currentPeriodStart: data.current_period_start || data.currentPeriodStart,
    currentPeriodEnd: data.current_period_end || data.currentPeriodEnd,
    cancelAtPeriodEnd: data.cancel_at_period_end ?? data.cancelAtPeriodEnd ?? false,
    trialEnd: data.trial_end || data.trialEnd || null,
  };
}

function transformPremiumPerk(data: ApiData): PremiumPerk {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    icon: data.icon,
    requiredTier: data.required_tier || data.requiredTier,
    enabled: data.enabled ?? true,
    value: data.value,
  };
}

function transformCoinBalance(data: ApiData): CoinBalance {
  return {
    balance: data.balance || 0,
    lifetimeEarned: data.lifetime_earned ?? data.lifetimeEarned ?? 0,
    lifetimeSpent: data.lifetime_spent ?? data.lifetimeSpent ?? 0,
    pendingRewards: data.pending_rewards ?? data.pendingRewards ?? 0,
  };
}

function transformCoinPackage(data: ApiData): CoinPackage {
  return {
    id: data.id,
    name: data.name,
    coins: data.coins,
    bonusCoins: data.bonus_coins ?? data.bonusCoins ?? 0,
    price: data.price,
    currency: data.currency || 'USD',
    popular: data.popular ?? false,
    discount: data.discount,
  };
}

function transformShopItem(data: ApiData): ShopItem {
  return {
    id: data.id,
    name: data.name,
    description: data.description || '',
    imageUrl: data.image_url || data.imageUrl,
    category: data.category,
    price: data.price,
    priceType: data.price_type || data.priceType || 'coins',
    rarity: data.rarity || 'common',
    owned: data.owned ?? false,
    equipped: data.equipped ?? false,
    limitedTime: data.limited_time ?? data.limitedTime ?? false,
    expiresAt: data.expires_at || data.expiresAt || null,
    stock: data.stock ?? null,
  };
}

function transformShopCategory(data: ApiData): ShopCategory {
  return {
    id: data.id,
    name: data.name,
    description: data.description || '',
    icon: data.icon,
    itemCount: data.item_count ?? data.itemCount ?? 0,
  };
}

function transformPurchaseResult(data: ApiData): PurchaseResult {
  return {
    success: data.success ?? true,
    item: transformShopItem(data.item),
    newBalance: data.new_balance ?? data.newBalance ?? 0,
    transaction: {
      id: data.transaction?.id,
      amount: data.transaction?.amount,
      createdAt: data.transaction?.created_at || data.transaction?.createdAt,
    },
  };
}

function transformCoinTransaction(data: ApiData): CoinTransaction {
  return {
    id: data.id,
    type: data.type,
    amount: data.amount,
    description: data.description || '',
    itemId: data.item_id || data.itemId || null,
    createdAt: data.created_at || data.createdAt,
  };
}

function transformGiftResult(data: ApiData): GiftResult {
  return {
    success: data.success ?? true,
    recipientUsername: data.recipient_username || data.recipientUsername,
    item: transformShopItem(data.item),
    message: data.message || null,
  };
}
