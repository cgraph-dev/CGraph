/**
 * CircuitBoardLogo — SVG Circuit Board Visualization
 *
 * Orchestrates the animated CGraph logo composed of:
 * - Hexagon frame border
 * - "C" and "G" letter circuit traces
 * - 20 data node circles
 * - Central hub with pulse ring
 * - Data-flow particles along traces
 *
 * @module components/animated-logo/CircuitBoardLogo
 */

import { motion } from 'framer-motion';
import { useId } from 'react';
import type { CircuitBoardLogoProps, SvgFilterIds } from './types';
import { COLOR_PALETTES } from './constants';
import { useSplashAnimation } from './useSplashAnimation';
import { SvgDefs } from './svg/SvgDefs';
import { CLetterTraces } from './svg/CLetterTraces';
import { GLetterTraces } from './svg/GLetterTraces';
import { CircuitNodes } from './svg/CircuitNodes';
import { CentralHub } from './svg/CentralHub';
import { DataFlowParticles } from './svg/DataFlowParticles';

export function CircuitBoardLogo({
  logoSize,
  isAnimated = false,
  isLoading = false,
  isSplash = false,
  color = 'default',
  onAnimationComplete,
}: CircuitBoardLogoProps) {
  const uniqueId = useId();
  const c = (COLOR_PALETTES[color] ?? COLOR_PALETTES['default'])!;
  const { showParticles } = useSplashAnimation(isSplash, isLoading, onAnimationComplete);

  const ids: SvgFilterIds = {
    primaryGrad: `anim-circuit-primary-${uniqueId}`,
    secondaryGrad: `anim-circuit-secondary-${uniqueId}`,
    tertiaryGrad: `anim-circuit-tertiary-${uniqueId}`,
    glow: `anim-glow-${uniqueId}`,
    nodeGlow: `anim-node-glow-${uniqueId}`,
    particleGlow: `anim-particle-glow-${uniqueId}`,
  };

  const shouldAnimate = isAnimated || isSplash || isLoading;

  return (
    <svg
      viewBox="0 0 120 96"
      width={logoSize}
      height={logoSize * 0.8}
      style={{ overflow: 'visible' }}
    >
      <SvgDefs ids={ids} colors={c} />

      {/* Hexagon frame */}
      <motion.path
        d="M60 2L112 28V68L60 94L8 68V28L60 2Z"
        fill="none"
        stroke={`url(#${ids.primaryGrad})`}
        strokeWidth="1"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={shouldAnimate ? { pathLength: 1, opacity: 0.2 } : { pathLength: 1, opacity: 0.15 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      />

      <CLetterTraces ids={ids} shouldAnimate={shouldAnimate} />
      <GLetterTraces ids={ids} shouldAnimate={shouldAnimate} />
      <CircuitNodes ids={ids} shouldAnimate={shouldAnimate} isLoading={isLoading} />
      <CentralHub
        ids={ids}
        shouldAnimate={shouldAnimate}
        isLoading={isLoading}
        showParticles={showParticles}
        tertiaryColor={c.tertiary}
      />
      <DataFlowParticles ids={ids} colors={c} showParticles={showParticles} />
    </svg>
  );
}
