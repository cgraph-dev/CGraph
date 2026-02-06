/**
 * Constants for CoinShop module
 */

import {
  SparklesIcon,
  FaceSmileIcon,
  ShieldCheckIcon,
  BoltIcon,
  GiftIcon,
  HeartIcon,
  FireIcon,
  MusicalNoteIcon,
} from '@heroicons/react/24/outline';
import type { CoinBundle, ShopItem, RarityColorMap, CategoryLabelMap } from './types';

export const COIN_BUNDLES: CoinBundle[] = [
  { id: 'tiny', coins: 50, bonusCoins: 0, price: 0.99 },
  { id: 'small', coins: 150, bonusCoins: 10, price: 2.99 },
  { id: 'medium', coins: 500, bonusCoins: 50, price: 9.99, popular: true },
  { id: 'large', coins: 1200, bonusCoins: 150, price: 19.99 },
  { id: 'huge', coins: 2500, bonusCoins: 400, price: 39.99 },
  { id: 'mega', coins: 5500, bonusCoins: 1000, price: 79.99, bestValue: true },
];

export const SHOP_ITEMS: ShopItem[] = [
  // Themes
  {
    id: 'theme_midnight',
    name: 'Midnight Aurora',
    description: 'A beautiful dark theme with aurora borealis accents',
    category: 'theme',
    coinPrice: 500,
    icon: <SparklesIcon className="h-6 w-6" />,
    preview: '/previews/midnight.png',
    rarity: 'rare',
  },
  {
    id: 'theme_neon',
    name: 'Neon Dreams',
    description: 'Vibrant neon colors for the night owls',
    category: 'theme',
    coinPrice: 750,
    icon: <SparklesIcon className="h-6 w-6" />,
    preview: '/previews/neon.png',
    rarity: 'epic',
  },
  {
    id: 'theme_galaxy',
    name: 'Galaxy',
    description: 'Stars and cosmic dust background',
    category: 'theme',
    coinPrice: 1000,
    icon: <SparklesIcon className="h-6 w-6" />,
    preview: '/previews/galaxy.png',
    rarity: 'legendary',
    limited: true,
    stock: 100,
  },
  // Emojis
  {
    id: 'emoji_animated',
    name: 'Animated Pack',
    description: '50 exclusive animated emojis',
    category: 'emoji',
    coinPrice: 300,
    icon: <FaceSmileIcon className="h-6 w-6" />,
    rarity: 'rare',
  },
  {
    id: 'emoji_seasonal',
    name: 'Seasonal Pack',
    description: 'Holiday and seasonal emojis',
    category: 'emoji',
    coinPrice: 200,
    icon: <FaceSmileIcon className="h-6 w-6" />,
    rarity: 'common',
  },
  // Badges
  {
    id: 'badge_early',
    name: 'Early Adopter',
    description: 'Show you were here from the start',
    category: 'badge',
    coinPrice: 1500,
    icon: <ShieldCheckIcon className="h-6 w-6" />,
    rarity: 'legendary',
    limited: true,
    stock: 50,
  },
  {
    id: 'badge_verified',
    name: 'Verified Badge',
    description: 'Get the verified checkmark',
    category: 'badge',
    coinPrice: 2000,
    icon: <ShieldCheckIcon className="h-6 w-6" />,
    rarity: 'legendary',
  },
  // Effects
  {
    id: 'effect_confetti',
    name: 'Confetti Burst',
    description: 'Add confetti to your messages',
    category: 'effect',
    coinPrice: 400,
    icon: <SparklesIcon className="h-6 w-6" />,
    rarity: 'rare',
  },
  {
    id: 'effect_sound',
    name: 'Sound Effects Pack',
    description: 'Custom notification sounds',
    category: 'effect',
    coinPrice: 350,
    icon: <MusicalNoteIcon className="h-6 w-6" />,
    rarity: 'common',
  },
  // Boosts
  {
    id: 'boost_xp',
    name: 'XP Boost (7 days)',
    description: '2x XP for all actions',
    category: 'boost',
    coinPrice: 800,
    icon: <BoltIcon className="h-6 w-6" />,
    rarity: 'epic',
  },
  {
    id: 'boost_karma',
    name: 'Karma Boost (7 days)',
    description: '1.5x karma from forum posts',
    category: 'boost',
    coinPrice: 600,
    icon: <FireIcon className="h-6 w-6" />,
    rarity: 'rare',
  },
  // Gifts
  {
    id: 'gift_small',
    name: 'Gift Box (Small)',
    description: 'Send 50 coins to a friend',
    category: 'gift',
    coinPrice: 60,
    icon: <GiftIcon className="h-6 w-6" />,
    rarity: 'common',
  },
  {
    id: 'gift_premium',
    name: 'Premium Gift',
    description: 'Gift 1 week of Premium',
    category: 'gift',
    coinPrice: 1500,
    icon: <HeartIcon className="h-6 w-6" />,
    rarity: 'legendary',
  },
];

export const RARITY_COLORS: RarityColorMap = {
  common: { bg: 'bg-gray-500/20', border: 'border-gray-500/30', text: 'text-gray-400' },
  rare: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400' },
  epic: { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-400' },
  legendary: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400' },
};

export const CATEGORY_LABELS: CategoryLabelMap = {
  theme: 'Themes',
  emoji: 'Emojis',
  badge: 'Badges',
  effect: 'Effects',
  boost: 'Boosts',
  gift: 'Gifts',
};
