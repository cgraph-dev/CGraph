/**
 * Appearance Settings Types
 *
 * Type definitions for appearance settings components.
 */

import type { Theme } from '@/lib/theme/ThemeEngine';
import type { ReactNode } from 'react';

// =============================================================================
// COMPONENT PROPS
// =============================================================================

/**
 * Props for ThemeCard component
 */
export interface ThemeCardProps {
  /** Theme to display */
  theme: Theme;
  /** Whether this theme is currently active */
  isActive: boolean;
  /** Callback when theme is selected */
  onSelect: () => void;
  /** Optional callback to delete custom theme */
  onDelete?: () => void;
  /** Whether this is a premium theme */
  isPremium?: boolean;
}

/**
 * Props for Slider component
 */
export interface SliderProps {
  /** Current value */
  value: number;
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
  /** Step increment */
  step: number;
  /** Change handler */
  onChange: (value: number) => void;
  /** Label text */
  label: string;
  /** Optional formatted display value */
  displayValue?: string;
  /** Optional icon element */
  icon?: ReactNode;
}

/**
 * Props for Toggle component
 */
export interface ToggleProps {
  /** Whether toggle is enabled */
  enabled: boolean;
  /** Change handler */
  onChange: () => void;
  /** Label text */
  label: string;
  /** Optional description text */
  description?: string;
  /** Optional icon element */
  icon?: ReactNode;
  /** Whether toggle is disabled */
  disabled?: boolean;
}

/**
 * Props for SectionHeader component
 */
export interface SectionHeaderProps {
  /** Icon element */
  icon: ReactNode;
  /** Section title */
  title: string;
  /** Optional description */
  description?: string;
}

// =============================================================================
// THEME GROUPS
// =============================================================================

/**
 * Organized theme groups by category
 */
export interface ThemeGroups {
  dark: Theme[];
  light: Theme[];
  special: Theme[];
  custom: Theme[];
}
