/**
 * Grid & Dot Background Components
 * Pattern backgrounds for landing pages
 */

import {
  DEFAULT_GRID_COLOR,
  DEFAULT_GRID_SIZE,
  DEFAULT_GRID_OPACITY,
  DEFAULT_DOT_COLOR,
  DEFAULT_DOT_SIZE,
  DEFAULT_DOT_POINT_SIZE,
  DEFAULT_DOT_OPACITY,
} from './constants';
import type { GridBackgroundProps, DotBackgroundProps } from './types';

export function GridBackground({
  color = DEFAULT_GRID_COLOR,
  size = DEFAULT_GRID_SIZE,
  opacity = DEFAULT_GRID_OPACITY,
  fade = true,
}: GridBackgroundProps) {
  return (
    <div
      className="absolute inset-0"
      style={{
        opacity,
        backgroundImage: `
          linear-gradient(to right, ${color} 1px, transparent 1px),
          linear-gradient(to bottom, ${color} 1px, transparent 1px)
        `,
        backgroundSize: `${size}px ${size}px`,
        maskImage: fade
          ? 'radial-gradient(ellipse at center, black 30%, transparent 80%)'
          : undefined,
        WebkitMaskImage: fade
          ? 'radial-gradient(ellipse at center, black 30%, transparent 80%)'
          : undefined,
      }}
    />
  );
}

export function DotBackground({
  color = DEFAULT_DOT_COLOR,
  size = DEFAULT_DOT_SIZE,
  dotSize = DEFAULT_DOT_POINT_SIZE,
  opacity = DEFAULT_DOT_OPACITY,
}: DotBackgroundProps) {
  return (
    <div
      className="absolute inset-0"
      style={{
        opacity,
        backgroundImage: `radial-gradient(circle, ${color} ${dotSize}px, transparent ${dotSize}px)`,
        backgroundSize: `${size}px ${size}px`,
      }}
    />
  );
}
