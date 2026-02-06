/**
 * Type definitions for CoinShop module
 */

export type ShopCategory = 'theme' | 'emoji' | 'badge' | 'effect' | 'boost' | 'gift';

export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface CoinBundle {
  id: string;
  coins: number;
  bonusCoins: number;
  price: number;
  popular?: boolean;
  bestValue?: boolean;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: ShopCategory;
  coinPrice: number;
  icon: React.ReactNode;
  preview?: string;
  rarity: ItemRarity;
  limited?: boolean;
  stock?: number;
}

export interface DailyBonus {
  available: boolean;
  amount: number;
}

export interface RarityColors {
  bg: string;
  border: string;
  text: string;
}

export type RarityColorMap = Record<ItemRarity, RarityColors>;

export type CategoryLabelMap = Record<ShopCategory, string>;
