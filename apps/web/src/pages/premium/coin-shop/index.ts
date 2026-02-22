/**
 * CoinShop module - virtual currency shop for premium features
 *
 * This module provides:
 * - Coin bundle purchases with payment integration
 * - Shop items organized by category (themes, emojis, badges, effects, boosts, gifts)
 * - Rarity system (common, rare, epic, legendary)
 * - Daily bonus claiming
 * - Owned item tracking
 */

export { default as CoinShop } from './coin-shop';
export { CoinBundleCard } from './coin-bundle-card';
export { ShopItemCard } from './shop-item-card';
export { CoinBalanceCard } from './coin-balance-card';
export { DailyBonusBanner } from './daily-bonus-banner';
export { CategoryFilter } from './category-filter';
export { AmbientParticles } from './ambient-particles';
export { useCoinShop } from './useCoinShop';
export { COIN_BUNDLES, SHOP_ITEMS, RARITY_COLORS, CATEGORY_LABELS } from './constants';
export type {
  CoinBundle,
  ShopItem,
  ShopCategory,
  ItemRarity,
  DailyBonus,
  RarityColors,
  RarityColorMap,
  CategoryLabelMap,
} from './types';
