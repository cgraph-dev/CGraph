/**
 * StickerPicker Types and Data
 */

import { AnimationColors } from '@/lib/animations/animation-engine';

export type StickerRarity = 'common' | 'rare' | 'epic' | 'legendary';

// All 15 animation types matching web parity
export type StickerAnimationType =
  | 'bounce'
  | 'pulse'
  | 'shake'
  | 'wiggle'
  | 'float'
  | 'pop'
  | 'wave'
  | 'spin'
  | 'zoom'
  | 'flip'
  | 'swing'
  | 'jello'
  | 'heartbeat'
  | 'flash'
  | 'rubberband'
  | 'none';

export interface Sticker {
  id: string;
  emoji: string;
  name: string;
  pack: string;
  rarity: StickerRarity;
  animation: StickerAnimationType;
  isLocked: boolean;
  price?: number;
}

export interface StickerPack {
  id: string;
  name: string;
  icon: string;
  stickers: Sticker[];
  isLimitedTime?: boolean;
  isPremium?: boolean;
}

export interface StickerPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectSticker: (sticker: Sticker) => void;
  userCoins?: number;
  onPurchase?: (stickerId: string, price: number) => Promise<boolean>;
}

// Rarity color mapping
export const getRarityColor = (rarity: StickerRarity): string => {
  const colorMap: Record<StickerRarity, string> = {
    common: AnimationColors.gray500,
    rare: '#3b82f6',
    epic: '#8b5cf6',
    legendary: '#f59e0b',
  };
  return colorMap[rarity];
};

// Sample sticker packs (in real app, fetch from backend)
export const STICKER_PACKS: StickerPack[] = [
  {
    id: 'emotions',
    name: 'Emotions',
    icon: '😊',
    stickers: [
      {
        id: 'happy',
        emoji: '😊',
        name: 'Happy',
        pack: 'emotions',
        rarity: 'common',
        animation: 'bounce',
        isLocked: false,
      },
      {
        id: 'love',
        emoji: '😍',
        name: 'Love',
        pack: 'emotions',
        rarity: 'common',
        animation: 'pulse',
        isLocked: false,
      },
      {
        id: 'laugh',
        emoji: '😂',
        name: 'Laugh',
        pack: 'emotions',
        rarity: 'common',
        animation: 'shake',
        isLocked: false,
      },
      {
        id: 'cool',
        emoji: '😎',
        name: 'Cool',
        pack: 'emotions',
        rarity: 'rare',
        animation: 'wiggle',
        isLocked: false,
      },
      {
        id: 'mindblown',
        emoji: '🤯',
        name: 'Mind Blown',
        pack: 'emotions',
        rarity: 'epic',
        animation: 'pop',
        isLocked: false,
      },
    ],
  },
  {
    id: 'reactions',
    name: 'Reactions',
    icon: '👍',
    stickers: [
      {
        id: 'thumbsup',
        emoji: '👍',
        name: 'Thumbs Up',
        pack: 'reactions',
        rarity: 'common',
        animation: 'bounce',
        isLocked: false,
      },
      {
        id: 'fire',
        emoji: '🔥',
        name: 'Fire',
        pack: 'reactions',
        rarity: 'rare',
        animation: 'wave',
        isLocked: false,
      },
      {
        id: 'rocket',
        emoji: '🚀',
        name: 'Rocket',
        pack: 'reactions',
        rarity: 'epic',
        animation: 'float',
        isLocked: false,
      },
      {
        id: 'star',
        emoji: '⭐',
        name: 'Star',
        pack: 'reactions',
        rarity: 'legendary',
        animation: 'spin',
        isLocked: false,
        price: 100,
      },
    ],
  },
  {
    id: 'gaming',
    name: 'Gaming',
    icon: '🎮',
    isPremium: true,
    stickers: [
      {
        id: 'controller',
        emoji: '🎮',
        name: 'Controller',
        pack: 'gaming',
        rarity: 'rare',
        animation: 'wiggle',
        isLocked: true,
        price: 50,
      },
      {
        id: 'trophy',
        emoji: '🏆',
        name: 'Trophy',
        pack: 'gaming',
        rarity: 'epic',
        animation: 'bounce',
        isLocked: true,
        price: 150,
      },
      {
        id: 'crown',
        emoji: '👑',
        name: 'Crown',
        pack: 'gaming',
        rarity: 'legendary',
        animation: 'spin',
        isLocked: true,
        price: 300,
      },
    ],
  },
  {
    id: 'seasonal',
    name: 'Seasonal',
    icon: '🎄',
    isLimitedTime: true,
    stickers: [
      {
        id: 'christmas',
        emoji: '🎄',
        name: 'Christmas',
        pack: 'seasonal',
        rarity: 'rare',
        animation: 'bounce',
        isLocked: true,
        price: 200,
      },
      {
        id: 'gift',
        emoji: '🎁',
        name: 'Gift',
        pack: 'seasonal',
        rarity: 'epic',
        animation: 'shake',
        isLocked: true,
        price: 250,
      },
    ],
  },
];
