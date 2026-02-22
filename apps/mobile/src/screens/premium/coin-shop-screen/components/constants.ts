/**
 * CoinShopScreen Constants
 *
 * Shared types, constants, and data for the Coin Shop feature.
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface SpecialOffer {
  id: string;
  title: string;
  description: string;
  originalPrice: number;
  discountPrice: number;
  coins: number;
  bonusCoins: number;
  icon: string;
  gradient: readonly [string, string];
  endsInHours: number;
  tag?: string;
}

export interface CoinBundle {
  id: string;
  coins: number;
  bonus: number;
  price: string;
  productId: string;
  popular?: boolean;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'divine';
  owned?: boolean;
  limited?: boolean;
}

// ============================================================================
// Rarity Colors
// ============================================================================

export const RARITY_COLORS: Record<string, readonly [string, string]> = {
  common: ['#6b7280', '#4b5563'],
  uncommon: ['#22c55e', '#16a34a'],
  rare: ['#3b82f6', '#2563eb'],
  epic: ['#8b5cf6', '#7c3aed'],
  legendary: ['#f59e0b', '#d97706'],
  divine: ['#ec4899', '#db2777'],
};

// ============================================================================
// Special Offers
// ============================================================================

export const SPECIAL_OFFERS: SpecialOffer[] = [
  {
    id: 'so1',
    title: 'Starter Pack',
    description: 'Perfect for new users! Get coins at an amazing discount.',
    originalPrice: 9.99,
    discountPrice: 4.99,
    coins: 1000,
    bonusCoins: 100,
    icon: '🚀',
    gradient: ['#3b82f6', '#2563eb'] as const,
    endsInHours: 24,
    tag: '50% OFF',
  },
  {
    id: 'so2',
    title: 'Weekend Special',
    description: 'Limited weekend deal with bonus coins!',
    originalPrice: 29.99,
    discountPrice: 14.99,
    coins: 3000,
    bonusCoins: 500,
    icon: '⚡',
    gradient: ['#8b5cf6', '#7c3aed'] as const,
    endsInHours: 48,
    tag: '50% OFF',
  },
  {
    id: 'so3',
    title: 'Mega Bundle',
    description: 'Best value! Massive coin bundle at the lowest price.',
    originalPrice: 99.99,
    discountPrice: 39.99,
    coins: 10000,
    bonusCoins: 2000,
    icon: '💫',
    gradient: ['#f59e0b', '#d97706'] as const,
    endsInHours: 12,
    tag: '60% OFF',
  },
];

// ============================================================================
// Coin Bundles
// ============================================================================

export const COIN_BUNDLES: CoinBundle[] = [
  { id: 'small', coins: 100, bonus: 0, price: '$0.99', productId: 'coins_100' },
  { id: 'medium', coins: 500, bonus: 50, price: '$4.99', productId: 'coins_500', popular: true },
  { id: 'large', coins: 1200, bonus: 200, price: '$9.99', productId: 'coins_1200' },
  { id: 'mega', coins: 2500, bonus: 500, price: '$19.99', productId: 'coins_2500' },
  { id: 'ultra', coins: 6000, bonus: 1500, price: '$49.99', productId: 'coins_6000' },
];

// ============================================================================
// Shop Items
// ============================================================================

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'theme_neon',
    name: 'Neon Dreams',
    description: 'Cyberpunk neon theme with animated gradients',
    price: 250,
    image: 'theme_neon',
    category: 'theme',
    rarity: 'epic',
  },
  {
    id: 'theme_ocean',
    name: 'Ocean Depths',
    description: 'Calming ocean-inspired color palette',
    price: 150,
    image: 'theme_ocean',
    category: 'theme',
    rarity: 'rare',
  },
  {
    id: 'badge_verified',
    name: 'Verified Badge',
    description: 'Official verification checkmark',
    price: 500,
    image: 'badge_verified',
    category: 'badge',
    rarity: 'legendary',
  },
  {
    id: 'badge_star',
    name: 'Rising Star',
    description: 'Shining star badge with glow effect',
    price: 300,
    image: 'badge_star',
    category: 'badge',
    rarity: 'epic',
  },
  {
    id: 'effect_sparkles',
    name: 'Sparkle Trail',
    description: 'Animated sparkles follow your cursor',
    price: 200,
    image: 'effect_sparkles',
    category: 'effect',
    rarity: 'rare',
  },
  {
    id: 'boost_xp',
    name: 'XP Boost (24h)',
    description: '2x XP for 24 hours',
    price: 150,
    image: 'boost_xp',
    category: 'boost',
    rarity: 'common',
  },
  {
    id: 'avatar_frame_gold',
    name: 'Golden Frame',
    description: 'Luxurious golden avatar frame',
    price: 400,
    image: 'frame_gold',
    category: 'avatar',
    rarity: 'legendary',
    limited: true,
  },
  {
    id: 'effect_confetti',
    name: 'Confetti Burst',
    description: 'Celebrate with colorful confetti effects',
    price: 175,
    image: 'effect_confetti',
    category: 'effect',
    rarity: 'uncommon',
  },
];
