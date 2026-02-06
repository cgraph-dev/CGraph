/**
 * Profile Theme Card Module Types
 *
 * Type definitions for the profile theme card components.
 *
 * @module modules/settings/components/customize/profile-theme-card
 */

import type { ProfileThemeConfig } from '@/data/profileThemes';

/** Props for the main ProfileThemeCard component */
export interface ProfileThemeCardProps {
  /** Theme configuration data */
  theme: ProfileThemeConfig;
  /** Whether this theme is currently selected */
  isSelected: boolean;
  /** Callback when the theme card is clicked */
  onSelect: () => void;
  /** Whether to show the preview overlay */
  allowPreview?: boolean;
  /** Whether to render particle effects */
  showParticles?: boolean;
}

/** Props for the ProfileThemeGrid layout component */
export interface ProfileThemeGridProps {
  /** Grid children (typically ProfileThemeCard instances) */
  children: React.ReactNode;
  /** Number of grid columns */
  columns?: 2 | 3 | 4;
  /** Additional CSS classes */
  className?: string;
}

/** Internal particle data for theme effects */
export interface Particle {
  /** Unique particle ID */
  id: number;
  /** X position (0-100%) */
  x: number;
  /** Y position (0-100%) */
  y: number;
  /** Particle size in pixels */
  size: number;
  /** Animation delay in seconds */
  delay: number;
  /** Animation duration in seconds */
  duration: number;
  /** Particle color (hex or CSS color) */
  color: string;
}
