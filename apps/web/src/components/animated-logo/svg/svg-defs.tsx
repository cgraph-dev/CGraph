/**
 * SVG Definitions
 *
 * Gradient and filter definitions shared across all
 * CircuitBoardLogo sub-components.
 *
 * @module components/animated-logo/svg/SvgDefs
 */

import type { SvgFilterIds, ColorDefinition } from '../types';

/** Props for the SvgDefs component */
export interface SvgDefsProps {
  /** Unique filter/gradient IDs */
  ids: SvgFilterIds;
  /** Color palette */
  colors: ColorDefinition;
}

/** SVG gradient and glow filter definitions */
export function SvgDefs({ ids, colors: c }: SvgDefsProps) {
  return (
    <defs>
      {/* Gradients */}
      <linearGradient id={ids.primaryGrad} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={c.primary} />
        <stop offset="100%" stopColor={c.primary} stopOpacity="0.8" />
      </linearGradient>
      <linearGradient id={ids.secondaryGrad} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={c.secondary} />
        <stop offset="100%" stopColor={c.secondary} stopOpacity="0.7" />
      </linearGradient>
      <linearGradient id={ids.tertiaryGrad} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={c.tertiary} />
        <stop offset="100%" stopColor={c.tertiary} stopOpacity="0.8" />
      </linearGradient>

      {/* Glow filters */}
      <filter id={ids.glow} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id={ids.nodeGlow} x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id={ids.particleGlow} x="-200%" y="-200%" width="500%" height="500%">
        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}
