/**
 * Type definitions for ThemedBorderCard module
 */

import type { BorderDefinition, BorderRarity } from '@/data/borderCollections';
import type { CSSProperties } from 'react';

/** Size configuration for border cards */
export interface SizeConfig {
  container: string;
  avatar: string;
  text: string;
  badge: string;
}

/** Result of border animation calculation */
export interface BorderAnimationResult {
  animate?: Record<string, unknown>;
  transition?: Record<string, unknown>;
  style?: CSSProperties;
}

/** Props for ThemedBorderCard component */
export interface ThemedBorderCardProps {
  border: BorderDefinition;
  isSelected: boolean;
  onSelect: () => void;
  showAnimation?: boolean;
  size?: 'sm' | 'md' | 'lg';
  allowPreview?: boolean;
}

/** Props for BorderCardGrid component */
export interface BorderCardGridProps {
  children: React.ReactNode;
  cardSize?: 'sm' | 'md' | 'lg';
  columns?: 3 | 4 | 5 | 6;
  className?: string;
}

/** Re-export necessary types */
export type { BorderDefinition, BorderRarity };
