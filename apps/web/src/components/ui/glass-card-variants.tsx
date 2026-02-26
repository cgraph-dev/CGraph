/**
 * Glass card style variant components.
 * @module
 */
import GlassCard from './glass-card';
import type { GlassCardProps } from './glass-card.types';

/**
 * unknown for the ui module.
 */
/**
 * Glass Card Neon display component.
 */
export function GlassCardNeon({ children, className, ...props }: Omit<GlassCardProps, 'variant'>) {
  return (
    <GlassCard variant="neon" glow borderGradient shimmer className={className} {...props}>
      {children}
    </GlassCard>
  );
}

/**
 * unknown for the ui module.
 */
/**
 * Glass Card Holographic display component.
 */
export function GlassCardHolographic({
  children,
  className,
  ...props
}: Omit<GlassCardProps, 'variant'>) {
  return (
    <GlassCard variant="holographic" hover3D particles className={className} {...props}>
      {children}
    </GlassCard>
  );
}

/**
 * unknown for the ui module.
 */
/**
 * Glass Card Crystal display component.
 */
export function GlassCardCrystal({
  children,
  className,
  ...props
}: Omit<GlassCardProps, 'variant'>) {
  return (
    <GlassCard
      variant="crystal"
      intensity="strong"
      glow
      glowColor="rgba(16, 185, 129, 0.3)"
      className={className}
      {...props}
    >
      {children}
    </GlassCard>
  );
}
