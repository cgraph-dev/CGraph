/**
 * CGraph Logo
 *
 * Renders the official CGraph brand logo (CG monogram with
 * green-to-purple gradient and circuit accents).
 * Uses the actual logo.png asset instead of an SVG approximation.
 *
 * @since v2.1.0
 */

import { memo } from 'react';

export type LogoColorVariant =
  | 'default'
  | 'cyan'
  | 'emerald'
  | 'purple'
  | 'white'
  | 'dark'
  | 'gradient';

export interface LogoProps {
  /** Logo width in pixels */
  size?: number;
  /** Additional CSS class names */
  className?: string;
  /** Kept for interface compatibility (no-op) */
  animated?: boolean;
  /** Kept for interface compatibility (no-op) */
  color?: LogoColorVariant;
  /** Kept for interface compatibility (no-op) */
  showGlow?: boolean;
}

/**
 * Main CGraph Logo — renders the branded logo.png image.
 */
export const LogoIcon = memo(function LogoIcon({
  size = 40,
  className = '',
}: LogoProps): React.JSX.Element {
  return (
    <img
      src="/logo.png"
      alt="CGraph"
      width={size}
      height={size}
      className={className}
      draggable={false}
      fetchPriority="high"
      style={{ objectFit: 'contain', display: 'block' }}
    />
  );
});
