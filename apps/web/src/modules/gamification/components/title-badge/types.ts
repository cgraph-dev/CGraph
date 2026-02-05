/**
 * TitleBadge Type Definitions
 *
 * Types and interfaces for the TitleBadge module.
 */

import type { Title, TitleRarity } from '@/data/titles';

/**
 * Animation types supported by title badges
 */
export type TitleAnimationType =
  // Basic animations
  | 'shimmer'
  | 'glow'
  | 'pulse'
  | 'rainbow'
  | 'wave'
  | 'sparkle'
  | 'bounce'
  | 'float'
  // Elemental animations
  | 'fire'
  | 'ice'
  | 'electric'
  // Advanced animations
  | 'holographic'
  | 'matrix'
  | 'plasma'
  | 'crystalline'
  | 'ethereal'
  | 'cosmic'
  | 'lightning'
  | 'nature'
  | 'void'
  | 'aurora'
  | 'glitch'
  | 'neon_flicker'
  | 'inferno'
  | 'blizzard'
  | 'storm'
  | 'divine'
  | 'shadow';

/**
 * Props for the TitleBadge component
 */
export interface TitleBadgeProps {
  /** Title ID or Title object to display */
  title: string | Title;
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Show animation (some contexts may want static display) */
  animated?: boolean;
  /** Show tooltip on hover */
  showTooltip?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Additional className */
  className?: string;
}

/**
 * Props for ProfileTitleDisplay component
 */
export interface ProfileTitleDisplayProps {
  titleId: string | null;
  onChangeTitle?: () => void;
  isEditable?: boolean;
  className?: string;
}

/**
 * Animation configuration type
 */
export interface AnimationConfig {
  backgroundPosition?: string[];
  filter?: string[];
  boxShadow?: string[];
  textShadow?: string[];
  opacity?: number[];
  scale?: number[];
  x?: number[];
  y?: number[];
  transition: {
    duration: number;
    repeat: number;
    ease: string;
    times?: number[];
    repeatDelay?: number;
  };
}

/**
 * Rarity gradient map type
 */
export type RarityGradientMap = Record<TitleRarity, string>;

/**
 * Size class map type
 */
export type SizeClassMap = Record<'xs' | 'sm' | 'md' | 'lg', string>;
