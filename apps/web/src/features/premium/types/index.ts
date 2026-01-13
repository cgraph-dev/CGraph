/**
 * Premium Types
 * 
 * TypeScript types and interfaces for premium feature.
 */

export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'ultimate';

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  description: string;
  features: string[];
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  isPopular: boolean;
}

export interface SubscriptionStatus {
  isActive: boolean;
  tier: SubscriptionTier;
  plan: SubscriptionPlan | null;
  startedAt: string;
  expiresAt: string;
  willRenew: boolean;
  paymentMethod?: PaymentMethod;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'crypto';
  lastFour?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

export interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  bonusCoins: number;
  price: number;
  currency: string;
  discount?: number;
  isPopular: boolean;
  isLimited: boolean;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: ShopItemCategory;
  type: ShopItemType;
  price: number;
  currency: 'coins' | 'premium';
  previewUrl?: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  isLimited: boolean;
  stock?: number;
  expiresAt?: string;
  isPurchased: boolean;
}

export type ShopItemCategory = 
  | 'avatars'
  | 'badges'
  | 'themes'
  | 'stickers'
  | 'effects';

export type ShopItemType =
  | 'avatar_border'
  | 'avatar_effect'
  | 'badge'
  | 'title'
  | 'theme'
  | 'chat_bubble'
  | 'sticker_pack'
  | 'emoji_pack';

export interface PurchaseHistory {
  id: string;
  type: 'subscription' | 'coins' | 'shop_item';
  itemId: string;
  itemName: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  createdAt: string;
  invoiceUrl?: string;
}

export interface Inventory {
  avatarBorders: InventoryItem[];
  badges: InventoryItem[];
  themes: InventoryItem[];
  stickerPacks: InventoryItem[];
  titles: InventoryItem[];
}

export interface InventoryItem {
  id: string;
  itemId: string;
  name: string;
  type: ShopItemType;
  acquiredAt: string;
  expiresAt?: string;
  isEquipped: boolean;
}
