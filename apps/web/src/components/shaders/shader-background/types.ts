/**
 * Shader Background Module Types
 *
 * Type definitions for the WebGL shader background component.
 *
 * @module components/shaders/shader-background
 * @since v0.7.33
 */

/** Available shader visual effects */
export type ShaderVariant = 'fluid' | 'particles' | 'waves' | 'neural' | 'matrix';

/** Props for the ShaderBackground component */
export interface ShaderBackgroundProps {
  /** Shader visual effect variant */
  variant?: ShaderVariant;
  /** Primary color (hex) */
  color1?: string;
  /** Secondary color (hex) */
  color2?: string;
  /** Tertiary color (hex) */
  color3?: string;
  /** Animation speed multiplier */
  speed?: number;
  /** Effect intensity (0-1) */
  intensity?: number;
  /** Enable mouse-reactive effects */
  interactive?: boolean;
  /** Additional CSS classes */
  className?: string;
}
