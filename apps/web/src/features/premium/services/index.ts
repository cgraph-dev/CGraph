/**
 * Premium Services
 * 
 * API and business logic services for premium features.
 */

// API endpoints for premium
export const premiumApi = {
  // Subscription
  getSubscriptionStatus: () => '/api/v1/premium/status',
  getSubscriptionPlans: () => '/api/v1/premium/plans',
  subscribe: (planId: string) => `/api/v1/premium/subscribe/${planId}`,
  cancelSubscription: () => '/api/v1/premium/cancel',
  updatePaymentMethod: () => '/api/v1/premium/payment-method',
  
  // Coins
  getCoinBalance: () => '/api/v1/premium/coins',
  getCoinPackages: () => '/api/v1/premium/coins/packages',
  purchaseCoins: (packageId: string) => `/api/v1/premium/coins/purchase/${packageId}`,
  
  // Shop
  getShopItems: () => '/api/v1/premium/shop',
  purchaseShopItem: (itemId: string) => `/api/v1/premium/shop/${itemId}/purchase`,
  getInventory: () => '/api/v1/premium/inventory',
  
  // History
  getPurchaseHistory: () => '/api/v1/premium/history',
  getInvoice: (purchaseId: string) => `/api/v1/premium/history/${purchaseId}/invoice`,
};

// Subscription tier features
export const TIER_FEATURES = {
  free: {
    maxGroups: 5,
    maxFileSize: 10, // MB
    customEmoji: false,
    animatedAvatar: false,
    premiumBadge: false,
    prioritySupport: false,
    adFree: false,
  },
  starter: {
    maxGroups: 25,
    maxFileSize: 50,
    customEmoji: true,
    animatedAvatar: false,
    premiumBadge: true,
    prioritySupport: false,
    adFree: true,
  },
  pro: {
    maxGroups: 100,
    maxFileSize: 100,
    customEmoji: true,
    animatedAvatar: true,
    premiumBadge: true,
    prioritySupport: true,
    adFree: true,
  },
  ultimate: {
    maxGroups: -1, // unlimited
    maxFileSize: 500,
    customEmoji: true,
    animatedAvatar: true,
    premiumBadge: true,
    prioritySupport: true,
    adFree: true,
  },
} as const;
