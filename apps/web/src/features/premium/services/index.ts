/**
 * Premium Services
 * 
 * API and business logic services for premium features.
 */

// API endpoints for premium
export const premiumApi = {
  // Premium subscription (separate /premium routes)
  getSubscriptionStatus: () => '/api/v1/premium/status',
  getSubscriptionTiers: () => '/api/v1/premium/tiers',
  getFeatures: () => '/api/v1/premium/features',
  subscribe: () => '/api/v1/premium/subscribe', // POST with { tier } in body
  cancelSubscription: () => '/api/v1/premium/cancel',
  
  // Coins (separate /coins routes)
  getCoinBalance: () => '/api/v1/coins',
  getCoinHistory: () => '/api/v1/coins/history',
  getCoinPackages: () => '/api/v1/coins/packages',
  getEarnMethods: () => '/api/v1/coins/earn',
  
  // Shop (separate /shop routes)
  getShopItems: () => '/api/v1/shop',
  getShopCategories: () => '/api/v1/shop/categories',
  purchaseShopItem: (itemId: string) => `/api/v1/shop/${itemId}/purchase`,
  getShopPurchases: () => '/api/v1/shop/purchases',
};

// Subscription tier features
export const TIER_FEATURES = {
  free: {
    maxGroups: 5,
    maxForums: 5,
    maxFileSize: 10, // MB
    customEmoji: false,
    animatedAvatar: false,
    premiumBadge: false,
    prioritySupport: false,
    adFree: false,
  },
  starter: {
    maxGroups: 10,
    maxForums: 10,
    maxFileSize: 50,
    customEmoji: true,
    animatedAvatar: false,
    premiumBadge: true,
    prioritySupport: false,
    adFree: true,
  },
  pro: {
    maxGroups: 50,
    maxForums: 50,
    maxFileSize: 100,
    customEmoji: true,
    animatedAvatar: true,
    premiumBadge: true,
    prioritySupport: true,
    adFree: true,
  },
  business: {
    maxGroups: -1, // unlimited
    maxForums: -1, // unlimited
    maxFileSize: 500,
    customEmoji: true,
    animatedAvatar: true,
    premiumBadge: true,
    prioritySupport: true,
    adFree: true,
  },
  // Alias for backward compatibility
  ultimate: {
    maxGroups: -1, // unlimited
    maxForums: -1, // unlimited
    maxFileSize: 500,
    customEmoji: true,
    animatedAvatar: true,
    premiumBadge: true,
    prioritySupport: true,
    adFree: true,
  },
} as const;
