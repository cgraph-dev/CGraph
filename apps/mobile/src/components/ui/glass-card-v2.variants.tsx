/**
 * GlassCard V2 - Convenience Variant Wrappers
 *
 * Pre-configured card components for each glassmorphism variant.
 */

import React from 'react';
import type { GlassCardV2Props } from './glass-card-v2.types';
import GlassCardV2 from './glass-card-v2';

/**
 * Frosted Card component.
 *
 */
export function FrostedCard(props: Omit<GlassCardV2Props, 'variant'>) {
  return <GlassCardV2 {...props} variant="frosted" />;
}

/**
 * Crystal Card component.
 *
 */
export function CrystalCard(props: Omit<GlassCardV2Props, 'variant'>) {
  return <GlassCardV2 {...props} variant="crystal" />;
}

/**
 * Neon Card component.
 *
 */
export function NeonCard(props: Omit<GlassCardV2Props, 'variant'>) {
  return <GlassCardV2 {...props} variant="neon" outerGlow scanlines />;
}

/**
 * Holographic Card component.
 *
 */
export function HolographicCard(props: Omit<GlassCardV2Props, 'variant'>) {
  return (
    <GlassCardV2 {...props} variant="holographic" borderAnimation="rotate" scanlines particles />
  );
}

/**
 * Aurora Card component.
 *
 */
export function AuroraCard(props: Omit<GlassCardV2Props, 'variant'>) {
  return <GlassCardV2 {...props} variant="aurora" borderAnimation="breathe" />;
}

/**
 * Midnight Card component.
 *
 */
export function MidnightCard(props: Omit<GlassCardV2Props, 'variant'>) {
  return <GlassCardV2 {...props} variant="midnight" depth="deep" />;
}

/**
 * Dawn Card component.
 *
 */
export function DawnCard(props: Omit<GlassCardV2Props, 'variant'>) {
  return <GlassCardV2 {...props} variant="dawn" innerGlow />;
}

/**
 * Ember Card component.
 *
 */
export function EmberCard(props: Omit<GlassCardV2Props, 'variant'>) {
  return <GlassCardV2 {...props} variant="ember" outerGlow particles particleType="sparkles" />;
}

/**
 * Ocean Card component.
 *
 */
export function OceanCard(props: Omit<GlassCardV2Props, 'variant'>) {
  return <GlassCardV2 {...props} variant="ocean" animated />;
}
