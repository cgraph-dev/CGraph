/**
 * BorderRenderer Component
 *
 * Resolves AvatarBorder data into AnimatedBorder props.
 * Takes a border configuration object and maps it to the correct
 * animation type, colors, and sizing.
 *
 * @module avatar-border/border-renderer
 */

import { memo } from 'react';
import { AnimatedBorder, type BorderAnimationType } from './animated-border';

/** Shape expected from backend AvatarBorder / store data. */
export interface AvatarBorderData {
  id: string;
  animationType?: string;
  animation_type?: string;
  primaryColor?: string;
  primary_color?: string;
  secondaryColor?: string;
  secondary_color?: string;
  accentColor?: string;
  accent_color?: string;
  rarity?: string;
}

export interface BorderRendererProps {
  /** Avatar border data from the API or store */
  border: AvatarBorderData | null | undefined;
  /** Size in pixels */
  size?: number;
  /** Border thickness */
  borderWidth?: number;
  /** Content to wrap */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

/** Fallback colors per rarity when border has no explicit colors. */
const RARITY_COLORS: Record<string, { primary: string; secondary: string; accent: string }> = {
  common: { primary: '#9ca3af', secondary: '#6b7280', accent: '#4b5563' },
  uncommon: { primary: '#22c55e', secondary: '#16a34a', accent: '#15803d' },
  rare: { primary: '#3b82f6', secondary: '#2563eb', accent: '#1d4ed8' },
  epic: { primary: '#a855f7', secondary: '#9333ea', accent: '#7c3aed' },
  legendary: { primary: '#f59e0b', secondary: '#d97706', accent: '#b45309' },
  mythic: { primary: '#ec4899', secondary: '#db2777', accent: '#be185d' },
  unique: { primary: '#f472b6', secondary: '#a855f7', accent: '#6366f1' },
};

const DEFAULT_COLORS = RARITY_COLORS['common']!;

/** Normalize animation type string to our typed enum. */
function resolveAnimationType(raw?: string): BorderAnimationType {
  if (!raw) return 'none';
  const normalized = raw.toLowerCase().replace(/[-_\s]/g, '') as string;
  const MAP: Record<string, BorderAnimationType> = {
    none: 'none',
    static: 'static',
    pulse: 'pulse',
    rotate: 'rotate',
    shimmer: 'shimmer',
    wave: 'wave',
    breathe: 'breathe',
    spin: 'spin',
    rainbow: 'rainbow',
    particles: 'particles',
    glow: 'glow',
    flow: 'flow',
    spark: 'spark',
  };
  return MAP[normalized] ?? 'static';
}

/**
 * BorderRenderer component.
 *
 * Resolves backend AvatarBorder data to AnimatedBorder visual props.
 * If no border is provided, renders children without a border wrapper.
 */
export const BorderRenderer = memo(function BorderRenderer({
  border,
  size = 80,
  borderWidth = 3,
  children,
  className,
}: BorderRendererProps) {
  if (!border) {
    return <>{children}</>;
  }

  const animationType = resolveAnimationType(
    border.animationType ?? border.animation_type,
  );
  const rarityColors = RARITY_COLORS[border.rarity ?? ''] ?? DEFAULT_COLORS;

  return (
    <AnimatedBorder
      animationType={animationType}
      borderColor={border.primaryColor ?? border.primary_color ?? rarityColors.primary}
      borderColorSecondary={border.secondaryColor ?? border.secondary_color ?? rarityColors.secondary}
      borderColorAccent={border.accentColor ?? border.accent_color ?? rarityColors.accent}
      size={size}
      borderWidth={borderWidth}
      className={className}
    >
      {children}
    </AnimatedBorder>
  );
});

export default BorderRenderer;
