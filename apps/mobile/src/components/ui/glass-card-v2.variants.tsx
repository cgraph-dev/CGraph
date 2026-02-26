/**
 * GlassCard V2 - Convenience Variant Wrappers
 *
 * Pre-configured card components for each glassmorphism variant.
 */

import React from 'react';
import type { GlassCardV2Props } from './glass-card-v2.types';
import GlassCardV2 from './glass-card-v2';

/**
 *
 */
export function FrostedCard(props: Omit<GlassCardV2Props, 'variant'>) {
  return <GlassCardV2 {...props} variant="frosted" />;
}

/**
 *
 */
export function CrystalCard(props: Omit<GlassCardV2Props, 'variant'>) {
  return <GlassCardV2 {...props} variant="crystal" />;
}

/**
 *
 */
export function NeonCard(props: Omit<GlassCardV2Props, 'variant'>) {
  return <GlassCardV2 {...props} variant="neon" outerGlow scanlines />;
}

/**
 *
 */
export function HolographicCard(props: Omit<GlassCardV2Props, 'variant'>) {
  return (
    <GlassCardV2 {...props} variant="holographic" borderAnimation="rotate" scanlines particles />
  );
}

/**
 *
 */
export function AuroraCard(props: Omit<GlassCardV2Props, 'variant'>) {
  return <GlassCardV2 {...props} variant="aurora" borderAnimation="breathe" />;
}

/**
 *
 */
export function MidnightCard(props: Omit<GlassCardV2Props, 'variant'>) {
  return <GlassCardV2 {...props} variant="midnight" depth="deep" />;
}

/**
 *
 */
export function DawnCard(props: Omit<GlassCardV2Props, 'variant'>) {
  return <GlassCardV2 {...props} variant="dawn" innerGlow />;
}

/**
 *
 */
export function EmberCard(props: Omit<GlassCardV2Props, 'variant'>) {
  return <GlassCardV2 {...props} variant="ember" outerGlow particles particleType="sparkles" />;
}

/**
 *
 */
export function OceanCard(props: Omit<GlassCardV2Props, 'variant'>) {
  return <GlassCardV2 {...props} variant="ocean" animated />;
}
