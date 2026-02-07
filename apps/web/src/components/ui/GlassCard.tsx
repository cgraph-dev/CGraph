/**
 * GlassCard Component
 *
 * Futuristic glassmorphic card with advanced visual effects.
 * Features blur, gradient borders, glow effects, and 3D transforms.
 *
 * @version 2.1.0 - Performance optimizations for hover3D and particles
 * @since v0.7.33
 */

import { ReactNode, HTMLAttributes, useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useThrottledCallback, usePrefersReducedMotion } from '@/hooks';

// =============================================================================
// TYPES
// =============================================================================

export interface GlassCardProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  | 'children'
  | 'onDrag'
  | 'onDragEnd'
  | 'onDragStart'
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onAnimationIteration'
> {
  children: ReactNode;
  variant?: 'default' | 'frosted' | 'crystal' | 'neon' | 'holographic' | 'aurora';
  intensity?: 'subtle' | 'medium' | 'strong';
  glow?: boolean;
  glowColor?: string;
  hover3D?: boolean;
  shimmer?: boolean;
  borderGradient?: boolean;
  particles?: boolean;
  className?: string;
}

// =============================================================================
// VARIANT STYLES
// =============================================================================

const variantStyles = {
  default: {
    background: 'rgba(17, 24, 39, 0.6)',
    blur: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  frosted: {
    background: 'rgba(31, 41, 55, 0.4)',
    blur: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
  },
  crystal: {
    background: 'rgba(17, 24, 39, 0.3)',
    blur: 'blur(24px)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
  },
  neon: {
    background: 'rgba(17, 24, 39, 0.5)',
    blur: 'blur(16px)',
    border: '2px solid rgba(16, 185, 129, 0.5)',
  },
  holographic: {
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
    blur: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  aurora: {
    background:
      'linear-gradient(135deg, rgba(0, 255, 128, 0.08) 0%, rgba(0, 200, 255, 0.08) 50%, rgba(180, 100, 255, 0.08) 100%)',
    blur: 'blur(20px)',
    border: '1px solid rgba(100, 255, 218, 0.2)',
  },
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function GlassCard({
  children,
  variant = 'default',
  intensity: _intensity = 'medium',
  glow = false,
  glowColor = 'rgba(16, 185, 129, 0.5)',
  hover3D = true,
  shimmer = false,
  borderGradient = false,
  particles = false,
  className,
  ...props
}: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Disable 3D effect if user prefers reduced motion
  const shouldAnimate3D = hover3D && !prefersReducedMotion;

  // Motion values for 3D tilt effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), {
    stiffness: 200,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), {
    stiffness: 200,
    damping: 20,
  });

  // Handle mouse move for 3D effect - throttled to ~60fps for performance
  const handleMouseMoveInternal = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current || !shouldAnimate3D) return;

      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const percentX = (e.clientX - centerX) / (rect.width / 2);
      const percentY = (e.clientY - centerY) / (rect.height / 2);

      mouseX.set(percentX);
      mouseY.set(percentY);
    },
    [shouldAnimate3D, mouseX, mouseY]
  );

  // Throttle mouse move handler to 16ms (~60fps) for smooth but efficient updates
  const handleMouseMove = useThrottledCallback(
    (e: React.MouseEvent<HTMLDivElement>) => handleMouseMoveInternal(e),
    16
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  }, [mouseX, mouseY]);

  // Get style values
  const style = variantStyles[variant];

  // Build dynamic styles
  const backdropFilter = style.blur;
  const border = style.border;

  const glowStyle = glow
    ? {
        boxShadow: isHovered
          ? `0 0 30px ${glowColor}, 0 0 60px ${glowColor}, inset 0 0 20px ${glowColor}`
          : `0 0 15px ${glowColor}, inset 0 0 10px ${glowColor}`,
      }
    : {};

  return (
    <motion.div
      ref={cardRef}
      className={cn('relative overflow-hidden rounded-2xl transition-all duration-300', className)}
      style={{
        ...glowStyle,
        rotateX: shouldAnimate3D ? rotateX : 0,
        rotateY: shouldAnimate3D ? rotateY : 0,
        transformStyle: 'preserve-3d',
        perspective: 1000,
        // GPU layer promotion for better performance
        willChange: shouldAnimate3D ? 'transform' : 'auto',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      whileHover={shouldAnimate3D ? { scale: 1.02, z: 50 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      {...props}
    >
      {/* Background with blur */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: style.background,
          backdropFilter,
          WebkitBackdropFilter: backdropFilter,
        }}
      />

      {/* Border gradient overlay */}
      {borderGradient && (
        <div
          className="absolute inset-0 -z-10 rounded-2xl"
          style={{
            padding: '2px',
            background:
              'linear-gradient(135deg, rgba(16, 185, 129, 0.5), rgba(139, 92, 246, 0.5), rgba(236, 72, 153, 0.5))',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />
      )}

      {/* Shimmer effect */}
      {shimmer && (
        <div className="absolute inset-0 -z-10 overflow-hidden rounded-2xl">
          <div
            className="absolute inset-0 animate-shimmer"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
              backgroundSize: '200% 100%',
            }}
          />
        </div>
      )}

      {/* Particles effect - only animate when hovered for performance */}
      {particles && (
        <div className="absolute inset-0 -z-10 overflow-hidden rounded-2xl">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-primary-400"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: 0.3,
                // GPU layer promotion for particle performance
                willChange: isHovered && !prefersReducedMotion ? 'transform, opacity' : 'auto',
                transform: 'translateZ(0)',
              }}
              animate={
                isHovered && !prefersReducedMotion
                  ? {
                      y: [0, -20, 0],
                      opacity: [0.3, 0.6, 0.3],
                    }
                  : { y: 0, opacity: 0.3 }
              }
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: isHovered ? Infinity : 0,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      )}

      {/* Holographic gradient overlay (for holographic variant) */}
      {variant === 'holographic' && (
        <div
          className="absolute inset-0 -z-10 opacity-30"
          style={{
            background: `linear-gradient(
              ${mouseX.get() * 180 + 135}deg,
              rgba(16, 185, 129, 0.2),
              rgba(139, 92, 246, 0.2),
              rgba(236, 72, 153, 0.2)
            )`,
          }}
        />
      )}

      {/* Border */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl" style={{ border }} />

      {/* Content */}
      <div className="relative z-10">{children}</div>

      {/* Inner glow highlight */}
      {isHovered && glow && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background: `radial-gradient(circle at ${mouseX.get() * 50 + 50}% ${mouseY.get() * 50 + 50}%, ${glowColor}, transparent 70%)`,
            opacity: 0.2,
          }}
        />
      )}
    </motion.div>
  );
}

// =============================================================================
// SPECIALIZED VARIANTS
// =============================================================================

export function GlassCardNeon({ children, className, ...props }: Omit<GlassCardProps, 'variant'>) {
  return (
    <GlassCard variant="neon" glow borderGradient shimmer className={className} {...props}>
      {children}
    </GlassCard>
  );
}

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
