/** Size classes for RewardCard */
export const REWARD_CARD_SIZE_CLASSES = {
  sm: 'h-12 w-12 text-xs',
  md: 'h-16 w-16 text-sm',
  lg: 'h-20 w-20 text-base',
} as const;

/** Icon sizes for RewardCard */
export const REWARD_CARD_ICON_SIZES = {
  sm: 'h-5 w-5',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
} as const;

/** Gradient + border classes keyed by rarity */
export const RARITY_COLORS = {
  common: 'from-gray-500/20 to-gray-600/20 border-gray-500/30',
  uncommon: 'from-green-500/20 to-green-600/20 border-green-500/30',
  rare: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
  epic: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
  legendary: 'from-orange-500/20 to-orange-600/20 border-orange-500/30',
  mythic: 'from-pink-500/20 to-pink-600/20 border-pink-500/30',
} as const;

export const RARITY_FALLBACK = 'from-white/5 to-white/10 border-white/20';

export type RewardCardSize = keyof typeof REWARD_CARD_SIZE_CLASSES;
