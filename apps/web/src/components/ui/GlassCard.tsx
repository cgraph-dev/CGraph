/**
 * GlassCard Component
 *
 * Futuristic glassmorphic card with advanced visual effects.
 * Features blur, gradient borders, glow effects, and 3D transforms.
 *
 * @version 2.0.0
 * @since v0.7.33
 */

import { ReactNode, HTMLAttributes, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export interface GlassCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 
  'children' | 'onDrag' | 'onDragEnd' | 'onDragStart' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'> {
  children: ReactNode;
  variant?: 'default' | 'frosted' | 'crystal' | 'neon' | 'holographic';
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
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function GlassCard({
  children,
  variant = 'default',
  intensity = 'medium',
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

  // Handle mouse move for 3D effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !hover3D) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const percentX = (e.clientX - centerX) / (rect.width / 2);
    const percentY = (e.clientY - centerY) / (rect.height / 2);

    mouseX.set(percentX);
    mouseY.set(percentY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

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
        rotateX: hover3D ? rotateX : 0,
        rotateY: hover3D ? rotateY : 0,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      whileHover={hover3D ? { scale: 1.02, z: 50 } : {}}
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
          className="absolute inset-0 rounded-2xl -z-10"
          style={{
            padding: '2px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.5), rgba(139, 92, 246, 0.5), rgba(236, 72, 153, 0.5))',
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
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
              backgroundSize: '200% 100%',
            }}
          />
        </div>
      )}

      {/* Particles effect */}
      {particles && (
        <div className="absolute inset-0 -z-10 overflow-hidden rounded-2xl">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-primary-400"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: 0.3,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
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
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{ border }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>

      {/* Inner glow highlight */}
      {isHovered && glow && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
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
    <GlassCard
      variant="neon"
      glow
      borderGradient
      shimmer
      className={className}
      {...props}
    >
      {children}
    </GlassCard>
  );
}

export function GlassCardHolographic({ children, className, ...props }: Omit<GlassCardProps, 'variant'>) {
  return (
    <GlassCard
      variant="holographic"
      hover3D
      particles
      className={className}
      {...props}
    >
      {children}
    </GlassCard>
  );
}

export function GlassCardCrystal({ children, className, ...props }: Omit<GlassCardProps, 'variant'>) {
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
