/**
 * Premium Types
 */

export type SubscriptionTier = 'free' | 'premium' | 'enterprise';

export interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  bonusCoins: number;
  price: number;
  currency: string;
  isPopular: boolean;
}

export interface PurchaseHistory {
  id: string;
  type: 'subscription' | 'coins' | 'item';
  productId: string;
  productName: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'refunded' | 'failed';
  createdAt: string;
}

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  limits: SubscriptionLimits;
}

export interface SubscriptionLimits {
  maxGroups: number;
  maxForums: number;
  maxFileSize: number; // in MB
  maxStorageGB: number;
  customEmojis: number;
  customThemes: boolean;
  prioritySupport: boolean;
  noAds: boolean;
}
