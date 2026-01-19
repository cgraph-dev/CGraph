/**
 * Premium Services (Mobile)
 */

import { API_URL } from '@/services/api';

export const premiumApi = {
  // Premium subscription
  getSubscriptionStatus: () => `${API_URL}/api/v1/premium/status`,
  getSubscriptionTiers: () => `${API_URL}/api/v1/premium/tiers`,
  getFeatures: () => `${API_URL}/api/v1/premium/features`,
  subscribe: () => `${API_URL}/api/v1/premium/subscribe`, // POST with { tier } in body
  cancelSubscription: () => `${API_URL}/api/v1/premium/cancel`,
  
  // Coins (separate /coins routes)
  getCoinBalance: () => `${API_URL}/api/v1/coins`,
  getCoinHistory: () => `${API_URL}/api/v1/coins/history`,
  getCoinPackages: () => `${API_URL}/api/v1/coins/packages`,
  getEarnMethods: () => `${API_URL}/api/v1/coins/earn`,
  
  // Shop (separate /shop routes)
  getShopItems: () => `${API_URL}/api/v1/shop`,
  getShopItem: (itemId: string) => `${API_URL}/api/v1/shop/${itemId}`,
  purchaseShopItem: (itemId: string) => `${API_URL}/api/v1/shop/${itemId}/purchase`,
  getShopPurchases: () => `${API_URL}/api/v1/shop/purchases`,
};

export const TIER_FEATURES = {
  free: {
    maxGroups: 5,
    maxFileSize: 10,
    customEmoji: false,
    animatedAvatar: false,
    premiumBadge: false,
  },
  starter: {
    maxGroups: 25,
    maxFileSize: 50,
    customEmoji: true,
    animatedAvatar: false,
    premiumBadge: true,
  },
  pro: {
    maxGroups: 100,
    maxFileSize: 100,
    customEmoji: true,
    animatedAvatar: true,
    premiumBadge: true,
  },
  ultimate: {
    maxGroups: -1,
    maxFileSize: 500,
    customEmoji: true,
    animatedAvatar: true,
    premiumBadge: true,
  },
} as const;
