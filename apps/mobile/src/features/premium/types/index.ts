/**
 * Premium Types (Mobile)
 */

export type SubscriptionTier = 'free' | 'premium' | 'enterprise';

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  features: string[];
  priceMonthly: number;
  priceYearly: number;
  isPopular: boolean;
}

export interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  bonusCoins: number;
  price: number;
  isPopular: boolean;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: 'avatar_border' | 'badge' | 'theme' | 'sticker_pack';
  price: number;
  currency: 'coins' | 'premium';
  previewUrl?: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  isPurchased: boolean;
}
