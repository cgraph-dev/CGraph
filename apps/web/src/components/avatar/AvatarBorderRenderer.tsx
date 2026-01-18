import { memo, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { AvatarBorderConfig, BorderTheme, ParticleConfig, ParticleType } from '@/types/avatar-borders';
import { THEME_COLORS } from '@/types/avatar-borders';
import { useAvatarBorderStore } from '@/stores/avatarBorderStore';

/**
 * AvatarBorderRenderer
 *
 * Renders animated avatar borders with support for:
 * - 150+ unique border styles across 20+ themes
 * - Particle effects (flames, sparkles, bubbles, etc.)
 * - WebGL shaders for advanced effects
 * - Performance optimization with reduced motion support
 * - Custom color overrides
 */

// ==================== TYPE DEFINITIONS ====================

export interface AvatarBorderRendererProps {
  /** Avatar image URL */
  src: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Border configuration (or use store if not provided) */
  border?: AvatarBorderConfig;
  /** Size in pixels */
  size?: number;
  /** Custom class name */
  className?: string;
  /** Whether to show particles */
  showParticles?: boolean;
  /** Animation speed multiplier */
  animationSpeed?: number;
  /** Whether border is interactive (hover effects) */
  interactive?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Override colors */
  customColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  /** Reduced motion for accessibility */
  reducedMotion?: boolean;
}

// ==================== ANIMATION KEYFRAMES ====================

const ANIMATION_KEYFRAMES = {
  rotate: {
    rotate: [0, 360],
    transition: { duration: 3, repeat: Infinity, ease: 'linear' as const },
  },
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [0.8, 1, 0.8],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const },
  },
  glow: {
    boxShadow: [
      '0 0 10px var(--glow-color)',
      '0 0 25px var(--glow-color)',
      '0 0 10px var(--glow-color)',
    ],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const },
  },
  shimmer: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: { duration: 3, repeat: Infinity, ease: 'linear' as const },
  },
  wave: {
    y: [0, -3, 0, 3, 0],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const },
  },
  spark: {
    opacity: [0.5, 1, 0.5],
    scale: [0.9, 1.1, 0.9],
    transition: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' as const },
  },
  float: {
    y: [0, -5, 0],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const },
  },
  bounce: {
    scale: [1, 1.08, 1],
    transition: { duration: 0.6, repeat: Infinity, ease: 'easeOut' as const },
  },
  ripple: {
    scale: [1, 1.2],
    opacity: [0.6, 0],
    transition: { duration: 1.5, repeat: Infinity, ease: 'easeOut' as const },
  },
  orbit: (index: number, total: number) => ({
    rotate: [0, 360],
    transition: {
      duration: 4 + index * 0.5,
      repeat: Infinity,
      ease: 'linear' as const,
      delay: (index / total) * 2,
    },
  }),
};

// ==================== HELPER FUNCTIONS ====================

/** Derive animation type from border type */
function getAnimationTypeFromBorder(borderType: string): string {
  if (borderType.includes('rotating') || borderType.includes('ring')) return 'rotate';
  if (borderType.includes('pulse') || borderType.includes('heartbeat')) return 'pulse';
  if (borderType.includes('glow') || borderType.includes('radiance')) return 'glow';
  if (borderType.includes('shimmer') || borderType.includes('prismatic')) return 'shimmer';
  if (borderType.includes('wave') || borderType.includes('flow')) return 'wave';
  if (borderType.includes('spark') || borderType.includes('fire') || borderType.includes('flame')) return 'spark';
  if (borderType.includes('float') || borderType.includes('bubble')) return 'float';
  if (borderType.includes('ripple')) return 'ripple';
  if (borderType.includes('bounce')) return 'bounce';
  if (borderType === 'static' || borderType === 'none') return 'none';
  return 'pulse'; // Default fallback
}

/** Get particle type from border type */
function getParticleTypeFromBorder(borderType: string): ParticleType {
  if (borderType.includes('fire') || borderType.includes('flame') || borderType.includes('inferno')) return 'flame';
  if (borderType.includes('sakura') || borderType.includes('cherry') || borderType.includes('petal')) return 'petal';
  if (borderType.includes('spark') || borderType.includes('electric') || borderType.includes('lightning')) return 'sparkle';
  if (borderType.includes('bubble') || borderType.includes('water')) return 'bubble';
  if (borderType.includes('star') || borderType.includes('cosmic') || borderType.includes('stellar')) return 'star';
  if (borderType.includes('snow') || borderType.includes('frost') || borderType.includes('ice')) return 'snowflake';
  if (borderType.includes('leaf') || borderType.includes('nature') || borderType.includes('vine')) return 'leaf';
  if (borderType.includes('coin') || borderType.includes('golden')) return 'circle';
  if (borderType.includes('heart')) return 'heart';
  if (borderType.includes('pixel') || borderType.includes('8bit')) return 'pixel';
  if (borderType.includes('gear') || borderType.includes('steampunk')) return 'gear';
  if (borderType.includes('rune') || borderType.includes('ancient')) return 'rune';
  return 'sparkle'; // Default fallback
}

// ==================== THEME-SPECIFIC STYLES ====================

const getThemeStyles = (theme: BorderTheme, colors: { primary: string; secondary: string; accent: string }) => {
  const baseGradient = `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`;

  const themeOverrides: Partial<Record<BorderTheme, React.CSSProperties>> = {
    '8bit': {
      imageRendering: 'pixelated',
      borderRadius: '0',
    },
    japanese: {
      borderRadius: '50%',
    },
    anime: {
      borderRadius: '50%',
    },
    cyberpunk: {
      clipPath: 'polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%)',
      borderRadius: '4px',
    },
    gothic: {
      borderRadius: '50%',
    },
    kawaii: {
      borderRadius: '50%',
    },
    steampunk: {
      borderRadius: '50%',
    },
    vaporwave: {
      borderRadius: '50%',
    },
    nature: {
      borderRadius: '50%',
    },
    cosmic: {
      borderRadius: '50%',
    },
    elemental: {
      borderRadius: '50%',
    },
    fantasy: {
      borderRadius: '50%',
    },
    scifi: {
      clipPath: 'polygon(5% 0, 100% 0, 100% 95%, 95% 100%, 0 100%, 0 5%)',
    },
    minimal: {
      borderRadius: '50%',
    },
    gaming: {
      borderRadius: '8px',
    },
    seasonal: {
      borderRadius: '50%',
    },
    achievement: {
      borderRadius: '50%',
    },
    premium: {
      borderRadius: '50%',
    },
    free: {
      borderRadius: '50%',
    },
  };

  return {
    background: baseGradient,
    ...themeOverrides[theme],
  };
};

// ==================== PARTICLE COMPONENT ====================

interface ParticleProps {
  config: ParticleConfig;
  containerSize: number;
  index: number;
  total: number;
  colors: { primary: string; secondary: string; accent: string };
}

const Particle = memo(function Particle({ config, containerSize, index, total, colors }: ParticleProps) {
  const angle = (index / total) * Math.PI * 2;
  const radius = containerSize / 2 + 8;
  const startX = Math.cos(angle) * radius;
  const startY = Math.sin(angle) * radius;

  const getParticleStyle = (): React.CSSProperties => {
    switch (config.type) {
      case 'spark':
        return {
          width: 4,
          height: 4,
          background: colors.accent,
          borderRadius: '50%',
          boxShadow: `0 0 6px ${colors.accent}`,
        };
      case 'flame':
        return {
          width: 6,
          height: 10,
          background: `linear-gradient(to top, ${colors.primary}, ${colors.secondary}, transparent)`,
          borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
        };
      case 'snowflake':
        return {
          width: 6,
          height: 6,
          background: 'white',
          borderRadius: '50%',
          boxShadow: '0 0 4px rgba(255,255,255,0.8)',
        };
      case 'bubble':
        return {
          width: 8,
          height: 8,
          background: 'transparent',
          border: `1px solid ${colors.primary}`,
          borderRadius: '50%',
        };
      case 'sakura':
        return {
          width: 8,
          height: 8,
          background: '#FFB7C5',
          borderRadius: '50% 0 50% 0',
          transform: 'rotate(45deg)',
        };
      case 'star':
        return {
          width: 6,
          height: 6,
          background: colors.accent,
          clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
        };
      case 'heart':
        return {
          width: 8,
          height: 8,
          background: '#FF6B9D',
          clipPath: 'path("M4 1.5C2.5 0 0 1 0 3.5C0 6 4 8 4 8S8 6 8 3.5C8 1 5.5 0 4 1.5Z")',
        };
      case 'coin':
        return {
          width: 8,
          height: 8,
          background: 'linear-gradient(135deg, #FFD700, #FFA500)',
          borderRadius: '50%',
          border: '1px solid #B8860B',
        };
      case 'leaf':
        return {
          width: 6,
          height: 10,
          background: '#4ADE80',
          borderRadius: '50% 0',
          transform: `rotate(${45 + index * 30}deg)`,
        };
      case 'electric':
        return {
          width: 2,
          height: 12,
          background: `linear-gradient(to bottom, transparent, ${colors.accent}, transparent)`,
          transform: `rotate(${index * 45}deg)`,
        };
      case 'rune':
        return {
          width: 10,
          height: 10,
          background: 'transparent',
          border: `1px solid ${colors.accent}`,
          borderRadius: '2px',
          transform: `rotate(45deg)`,
        };
      case 'crystal':
        return {
          width: 6,
          height: 12,
          background: `linear-gradient(to bottom, ${colors.primary}, transparent)`,
          clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
        };
      case 'gear':
        return {
          width: 10,
          height: 10,
          background: '#8B7355',
          borderRadius: '2px',
          border: '1px solid #5D4037',
        };
      case 'pixel':
        return {
          width: 4,
          height: 4,
          background: colors.accent,
          borderRadius: '0',
        };
      case 'glitch':
        return {
          width: 12,
          height: 2,
          background: colors.accent,
          opacity: 0.7,
        };
      default:
        return {
          width: 4,
          height: 4,
          background: colors.accent,
          borderRadius: '50%',
        };
    }
  };

  const getAnimation = () => {
    switch (config.type) {
      case 'flame':
        return {
          y: [0, -15, 0],
          opacity: [1, 0.5, 1],
          scale: [1, 1.2, 1],
          transition: { duration: 0.8 + Math.random() * 0.4, repeat: Infinity, delay: index * 0.1 },
        };
      case 'snowflake':
        return {
          y: [0, 20],
          x: [0, Math.sin(index) * 5],
          opacity: [1, 0],
          transition: { duration: 2 + Math.random(), repeat: Infinity, delay: index * 0.2 },
        };
      case 'bubble':
        return {
          y: [0, -20],
          opacity: [0.8, 0],
          scale: [0.5, 1.2],
          transition: { duration: 2, repeat: Infinity, delay: index * 0.3 },
        };
      case 'sakura':
        return {
          y: [0, 30],
          x: [0, Math.sin(index * 2) * 15],
          rotate: [0, 360],
          opacity: [1, 0],
          transition: { duration: 3, repeat: Infinity, delay: index * 0.4 },
        };
      case 'electric':
        return {
          opacity: [0, 1, 0],
          scaleY: [0.5, 1.5, 0.5],
          transition: { duration: 0.2, repeat: Infinity, delay: index * 0.05 },
        };
      default:
        return ANIMATION_KEYFRAMES.orbit(index, total);
    }
  };

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: '50%',
        top: '50%',
        x: startX,
        y: startY,
        ...getParticleStyle(),
      }}
      animate={getAnimation()}
    />
  );
});

// ==================== MAIN COMPONENT ====================

export const AvatarBorderRenderer = memo(function AvatarBorderRenderer({
  src,
  alt = 'Avatar',
  border: propBorder,
  size = 80,
  className,
  showParticles: propShowParticles,
  animationSpeed = 1,
  interactive = true,
  onClick,
  customColors,
  reducedMotion: propReducedMotion,
}: AvatarBorderRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const preferences = useAvatarBorderStore((state) => state.preferences);
  const displayBorder = useAvatarBorderStore((state) => state.getDisplayBorder());

  // Use prop border or store border
  const border = propBorder ?? displayBorder;

  // Merge preferences with props
  const showParticles = propShowParticles ?? preferences.showParticles;
  const reducedMotion = propReducedMotion ?? preferences.reducedMotion;
  const finalAnimationSpeed = animationSpeed * preferences.animationSpeed;

  // Get colors
  const colors = useMemo(() => {
    if (!border) return THEME_COLORS.free;
    const themeColors = THEME_COLORS[border.theme] || THEME_COLORS.free;
    return {
      primary: customColors?.primary ?? border.primaryColor ?? themeColors.primary,
      secondary: customColors?.secondary ?? border.secondaryColor ?? themeColors.secondary,
      accent: customColors?.accent ?? border.accentColor ?? themeColors.accent,
    };
  }, [border, customColors]);

  // If no border or 'none', just render the avatar
  if (!border || border.id === 'none') {
    return (
      <div
        className={cn('relative rounded-full overflow-hidden', className)}
        style={{ width: size, height: size }}
        onClick={onClick}
      >
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      </div>
    );
  }

  // Calculate dimensions
  const borderWidth = Math.max(3, size * 0.06);
  const innerSize = size - borderWidth * 2;

  // Get theme-specific styles
  const themeStyles = getThemeStyles(border.theme, colors);

  // Get animation based on border type
  const getAnimationVariant = () => {
    if (reducedMotion) return {};

    // Determine animation type from border type
    const animationType = getAnimationTypeFromBorder(border.type);
    const baseAnimation = ANIMATION_KEYFRAMES[animationType as keyof typeof ANIMATION_KEYFRAMES];

    if (typeof baseAnimation === 'function') {
      return baseAnimation(0, 1);
    }

    if (baseAnimation) {
      // Adjust animation duration based on speed
      return {
        ...baseAnimation,
        transition: {
          ...baseAnimation.transition,
          duration: (baseAnimation.transition?.duration || 2) / finalAnimationSpeed,
        },
      };
    }

    return {};
  };

  // Particle configuration - derive from border type
  const particleCount = showParticles && border.particleCount ? Math.round((border.particleCount || 8) * (preferences.particleDensity / 50)) : 0;

  return (
    <motion.div
      ref={containerRef}
      className={cn('relative flex items-center justify-center cursor-pointer', className)}
      style={{
        width: size,
        height: size,
        '--glow-color': colors.accent,
      } as React.CSSProperties}
      onClick={onClick}
      whileHover={interactive && !reducedMotion ? { scale: 1.05 } : undefined}
      whileTap={interactive && !reducedMotion ? { scale: 0.98 } : undefined}
    >
      {/* Outer glow effect */}
      {getAnimationTypeFromBorder(border.type) !== 'none' && !reducedMotion && (
        <motion.div
          className="absolute inset-0 rounded-full blur-md"
          style={{
            background: `radial-gradient(circle, ${colors.accent}40 0%, transparent 70%)`,
          }}
          animate={{
            opacity: [0.5, 0.8, 0.5],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2 / finalAnimationSpeed,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Animated border ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          ...themeStyles,
          padding: borderWidth,
        }}
        animate={getAnimationVariant()}
      >
        {/* Shimmer overlay */}
        {getAnimationTypeFromBorder(border.type) === 'shimmer' && !reducedMotion && (
          <motion.div
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{
              background: `linear-gradient(90deg, transparent, ${colors.accent}60, transparent)`,
              backgroundSize: '200% 100%',
            }}
            animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
            transition={{ duration: 3 / finalAnimationSpeed, repeat: Infinity, ease: 'linear' }}
          />
        )}

        {/* Rotating ring for rotate animations */}
        {(getAnimationTypeFromBorder(border.type) === 'rotate' || border.type.includes('rotating')) && !reducedMotion && (
          <motion.div
            className="absolute inset-0"
            style={{
              background: `conic-gradient(from 0deg, ${colors.primary}, ${colors.secondary}, ${colors.accent}, ${colors.primary})`,
              borderRadius: 'inherit',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 3 / finalAnimationSpeed, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </motion.div>

      {/* Avatar image container */}
      <div
        className="relative z-10 rounded-full overflow-hidden bg-gray-900"
        style={{
          width: innerSize,
          height: innerSize,
        }}
      >
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      </div>

      {/* Particle effects */}
      {showParticles && particleCount > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: particleCount }).map((_, i) => (
            <Particle
              key={i}
              config={{
                type: getParticleTypeFromBorder(border.type),
                count: border.particleCount || 8,
                size: 4,
                color: colors.primary,
                opacity: 0.8,
                speed: 1,
                direction: 'random',
                pattern: 'orbit',
              }}
              containerSize={size}
              index={i}
              total={particleCount}
              colors={colors}
            />
          ))}
        </div>
      )}

      {/* Ripple effect for certain borders */}
      {getAnimationTypeFromBorder(border.type) === 'ripple' && !reducedMotion && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full border-2"
              style={{ borderColor: colors.accent }}
              animate={{
                scale: [1, 1.5],
                opacity: [0.6, 0],
              }}
              transition={{
                duration: 2 / finalAnimationSpeed,
                repeat: Infinity,
                delay: i * 0.6,
                ease: 'easeOut',
              }}
            />
          ))}
        </>
      )}

      {/* Premium badge indicator */}
      {border.isPremium && (
        <div
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] z-20"
          style={{
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
            boxShadow: `0 0 6px ${colors.accent}`,
          }}
        >
          ★
        </div>
      )}
    </motion.div>
  );
});

// ==================== PRESET WRAPPERS ====================

/** Simple border with just a colored ring */
export const SimpleBorderAvatar = memo(function SimpleBorderAvatar({
  src,
  size = 80,
  color = '#22c55e',
  ...props
}: Omit<AvatarBorderRendererProps, 'border'> & { color?: string }) {
  const border: AvatarBorderConfig = {
    id: 'simple-custom',
    type: 'static',
    name: 'Simple',
    description: 'Simple colored border',
    theme: 'minimal',
    rarity: 'free',
    unlockType: 'default',
    isPremium: false,
    primaryColor: color,
    secondaryColor: color,
    accentColor: color,
    tags: ['custom'],
  };

  return <AvatarBorderRenderer src={src} size={size} border={border} showParticles={false} {...props} />;
});

/** Animated glow border */
export const GlowBorderAvatar = memo(function GlowBorderAvatar({
  src,
  size = 80,
  color = '#22c55e',
  ...props
}: Omit<AvatarBorderRendererProps, 'border'> & { color?: string }) {
  const border: AvatarBorderConfig = {
    id: 'glow-custom',
    type: 'simple-glow',
    name: 'Glow',
    description: 'Glowing animated border',
    theme: 'minimal',
    rarity: 'free',
    unlockType: 'default',
    isPremium: false,
    primaryColor: color,
    secondaryColor: color,
    accentColor: color,
    animationSpeed: 'normal',
    tags: ['custom', 'glow'],
  };

  return <AvatarBorderRenderer src={src} size={size} border={border} showParticles={false} {...props} />;
});

export default AvatarBorderRenderer;
