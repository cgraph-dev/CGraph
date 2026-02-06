/**
 * ProfilePreview Type Definitions
 */

import type { DemoState } from '../types';

/**
 * Theme colors for profile cards
 */
export interface ThemeColors {
  primary: string;
  secondary: string;
  glow: string;
  name: string;
}

/**
 * Props for profile card variants
 */
export interface CardProps {
  state: DemoState;
  colors: ThemeColors;
  speedMultiplier: number;
}

/**
 * Mock badge data structure
 */
export interface MockBadge {
  id: string;
  emoji: string;
  name: string;
  rarity: string;
  description: string;
  theme: string;
}
