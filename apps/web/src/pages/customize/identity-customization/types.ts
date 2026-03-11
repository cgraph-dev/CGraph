/**
 * Type definitions for IdentityCustomization module
 */

import type { TitleAnimationType } from '@/data/titlesCollection';

export type Rarity = 'free' | 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface Border {
  id: string;
  name: string;
  rarity: Rarity;
  animation: string;
  colors: string[];
  unlocked: boolean;
  unlockRequirement?: string;
}

export interface Title {
  id: string;
  name: string;
  animationType: TitleAnimationType;
  gradient: string;
  unlocked: boolean;
  unlockRequirement?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: Rarity;
  unlocked: boolean;
  unlockRequirement?: string;
}

export interface ProfileLayout {
  id: string;
  name: string;
  description: string;
  preview: string;
  unlocked: boolean;
}

export interface RarityOption {
  value: Rarity;
  label: string;
  color: string;
}
