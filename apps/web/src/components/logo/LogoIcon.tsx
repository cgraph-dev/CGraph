/**
 * CGraph Logo Icon
 *
 * Renders the official CGraph brand logo (CG monogram with
 * green-to-purple gradient and circuit accents).
 * Uses the actual logo.png asset instead of an SVG approximation.
 *
 * @module components/logo/LogoIcon
 */

import { memo } from 'react';
import type { LogoProps } from './types';

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
      style={{ objectFit: 'contain', display: 'block' }}
    />
  );
});
