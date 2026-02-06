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

export { default as CoinShop } from './CoinShop';
export { CoinBundleCard } from './CoinBundleCard';
export { ShopItemCard } from './ShopItemCard';
export { CoinBalanceCard } from './CoinBalanceCard';
export { DailyBonusBanner } from './DailyBonusBanner';
export { CategoryFilter } from './CategoryFilter';
export { AmbientParticles } from './AmbientParticles';
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
