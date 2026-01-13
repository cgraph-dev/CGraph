/**
 * Premium Services (Mobile)
 */

import { API_URL } from '@/services/api';

export const premiumApi = {
  getSubscriptionStatus: () => `${API_URL}/api/v1/premium/status`,
  getSubscriptionPlans: () => `${API_URL}/api/v1/premium/plans`,
  subscribe: (planId: string) => `${API_URL}/api/v1/premium/subscribe/${planId}`,
  cancelSubscription: () => `${API_URL}/api/v1/premium/cancel`,
  getCoinBalance: () => `${API_URL}/api/v1/premium/coins`,
  getCoinPackages: () => `${API_URL}/api/v1/premium/coins/packages`,
  purchaseCoins: (packageId: string) => `${API_URL}/api/v1/premium/coins/purchase/${packageId}`,
  getShopItems: () => `${API_URL}/api/v1/premium/shop`,
  purchaseShopItem: (itemId: string) => `${API_URL}/api/v1/premium/shop/${itemId}/purchase`,
  getInventory: () => `${API_URL}/api/v1/premium/inventory`,
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
