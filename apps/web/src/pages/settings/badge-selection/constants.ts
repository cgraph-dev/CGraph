/**
 * Badge Selection Constants
 */

import { Trophy, Award, Star, Shield, Crown } from 'lucide-react';

export const CATEGORY_ICONS: Record<string, typeof Trophy> = {
  social: Trophy,
  content: Award,
  mastery: Star,
  event: Shield,
  premium: Crown,
};

export const CATEGORY_LABELS: Record<string, string> = {
  all: 'All Badges',
  social: 'Social',
  content: 'Content',
  mastery: 'Mastery',
  event: 'Events',
  premium: 'Premium',
};

export const CATEGORIES = ['social', 'content', 'mastery', 'event', 'premium'] as const;

export const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'] as const;

export const RARITY_COLORS: Record<string, string> = {
  common: 'text-gray-400 border-white/[0.08]',
  uncommon: 'text-green-400 border-green-600',
  rare: 'text-blue-400 border-blue-600',
  epic: 'text-purple-400 border-purple-600',
  legendary: 'text-yellow-400 border-yellow-600',
  mythic: 'text-pink-400 border-pink-600',
};

export const RARITY_BG_COLORS: Record<string, string> = {
  common: 'bg-gray-500',
  uncommon: 'bg-green-500',
  rare: 'bg-blue-500',
  epic: 'bg-purple-500',
  legendary: 'bg-yellow-500',
  mythic: 'bg-pink-500',
};

export const RARITY_TEXT_COLORS: Record<string, string> = {
  common: 'text-gray-400',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-yellow-400',
  mythic: 'text-pink-400',
};

export const MAX_EQUIPPED_BADGES = 5;
