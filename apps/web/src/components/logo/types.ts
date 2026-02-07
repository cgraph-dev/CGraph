/**
 * Logo Module Types
 *
 * Type definitions for the CGraph circuit board logo system.
 *
 * @module components/logo/types
 */

/** Available logo color theme variants */
export type LogoColorVariant =
  | 'default'
  | 'cyan'
  | 'emerald'
  | 'purple'
  | 'white'
  | 'dark'
  | 'gradient';

/** Props shared by all logo component variants */
export interface LogoProps {
  /** Logo width in pixels */
  size?: number;
  /** Additional CSS class names */
  className?: string;
  /** Whether to play entrance animations */
  animated?: boolean;
  /** Color theme variant */
  color?: LogoColorVariant;
  /** Whether to render cyan glow effects */
  showGlow?: boolean;
}
