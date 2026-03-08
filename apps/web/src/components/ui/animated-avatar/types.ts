/**
 * Type definitions for AnimatedAvatar
 * @module components/ui/animated-avatar
 */

import type { Transition, TargetAndTransition } from 'motion/react';

export type AnimationReturn = {
  animate?: TargetAndTransition;
  transition?: Transition;
};

// Border style categories for organization
export type BorderCategory = 'free' | 'premium' | 'legendary' | 'limited';

export type BorderStyleType =
  // Free styles
  | 'none'
  | 'solid'
  | 'gradient'
  | 'pulse'
  // Premium styles
  | 'rainbow'
  | 'spin'
  | 'glow'
  | 'neon'
  | 'fire'
  | 'electric'
  | 'aurora'
  | 'plasma'
  | 'cosmic'
  | 'matrix'
  | 'holographic'
  | 'diamond'
  | 'emerald'
  | 'ruby'
  | 'sapphire'
  | 'amethyst'
  // Legendary styles
  | 'supernova'
  | 'black_hole'
  | 'quantum'
  | 'void'
  | 'celestial'
  // Limited edition
  | 'anniversary'
  | 'founders'
  | 'champion';

export interface AvatarStyle {
  borderStyle: BorderStyleType;
  borderWidth: number;
  borderColor: string;
  secondaryColor: string;
  glowIntensity: number;
  animationSpeed: 'none' | 'slow' | 'normal' | 'fast' | 'ultra';
  shape: 'circle' | 'rounded-square' | 'hexagon' | 'octagon' | 'shield' | 'diamond';
  particleEffect: 'none' | 'sparkles' | 'bubbles' | 'flames' | 'snow' | 'hearts' | 'stars';
  pulseOnHover: boolean;
  showLevel: boolean;
  levelBadgeStyle: 'default' | 'minimal' | 'ornate' | 'cyber';
}

export interface BorderStyleInfo {
  id: BorderStyleType;
  name: string;
  category: BorderCategory;
  description: string;
  coinPrice: number;
  preview: string;
}

export interface AnimatedAvatarProps {
  src?: string | null;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  fallbackText?: string;
  customStyle?: Partial<AvatarStyle>;
  className?: string;
  onClick?: () => void;
  showStatus?: boolean;
  statusType?: 'online' | 'idle' | 'dnd' | 'offline';
  level?: number;
  isPremium?: boolean;
  isVerified?: boolean;
  title?: { name: string; color: string; animation?: string };
}

export interface AvatarStyleStore {
  style: AvatarStyle;
  ownedStyles: BorderStyleType[];
  updateStyle: <K extends keyof AvatarStyle>(key: K, value: AvatarStyle[K]) => void;
  resetStyle: () => void;
  addOwnedStyle: (style: BorderStyleType) => void;
  exportStyle: () => string;
  importStyle: (json: string) => boolean;
}
