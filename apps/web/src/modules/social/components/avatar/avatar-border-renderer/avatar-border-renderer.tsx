/**
 * AvatarBorderRenderer - Main component
 *
 * Renders animated avatar borders with support for:
 * - 150+ unique border styles across 20+ themes
 * - Particle effects (flames, sparkles, bubbles, etc.)
 * - Performance optimization with reduced motion support
 * - Custom color overrides
 */

import { durations } from '@cgraph/animation-constants';
import { memo, useMemo, useRef, type CSSProperties } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { THEME_COLORS } from '@/types/avatar-borders';
import { LottieBorderRenderer } from '@/lib/lottie/lottie-border-renderer';
import type { AvatarBorderRendererProps, BorderColors } from './types';
import {
  ANIMATION_KEYFRAMES,
  getAnimationTypeFromBorder,
  getParticleTypeFromBorder,
  getThemeStyles,
} from './animations';
import { Particle } from './particle';

/** Type guard: is the value a lottie animation config object? */
function isLottieConfig(
  val: unknown
): val is { loop?: boolean; speed?: number; segment?: [number, number] } {
  return typeof val === 'object' && val !== null;
}

/** Type guard: is the key a valid ANIMATION_KEYFRAMES entry? */
function isAnimationKey(key: string): key is keyof typeof ANIMATION_KEYFRAMES {
  return key in ANIMATION_KEYFRAMES;
}

/** CSS properties with CSS custom property support */
type CSSPropertiesWithVars = CSSProperties & Record<`--${string}`, string>;

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
  const preferences = {
    showParticles: true,
    reducedMotion: false,
    animationSpeed: 1,
    particleDensity: 50,
  };
  const displayBorder = null;

  // Use prop border or store border
  const border = propBorder ?? displayBorder;

  // Merge preferences with props
  const showParticles = propShowParticles ?? preferences.showParticles;
  const reducedMotion = propReducedMotion ?? preferences.reducedMotion;
  const finalAnimationSpeed = animationSpeed * preferences.animationSpeed;

  // Get colors
  const colors = useMemo((): BorderColors => {
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
        className={cn('relative overflow-hidden rounded-full', className)}
        style={{ width: size, height: size }}
        onClick={onClick}
      >
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      </div>
    );
  }

  // Lottie border path: delegate to LottieBorderRenderer
  const lottieUrl: string | undefined = (() => {
    if ('lottieUrl' in border && typeof border.lottieUrl === 'string') return border.lottieUrl;
    if ('lottie_url' in border && typeof border.lottie_url === 'string') return border.lottie_url;
    return undefined;
  })();
  const isLottieType =
    border.type?.includes('lottie') ||
    ('animationType' in border && border.animationType === 'lottie') ||
    ('animation_type' in border && border.animation_type === 'lottie');
  if (isLottieType && lottieUrl) {
    const rawConfig =
      ('lottieConfig' in border ? border.lottieConfig : undefined) ??
      ('lottie_config' in border ? border.lottie_config : undefined);
    const lottieConfig = isLottieConfig(rawConfig) ? rawConfig : undefined;
    return (
      <LottieBorderRenderer
        lottieUrl={lottieUrl}
        avatarSize={size}
        borderWidth={Math.max(3, size * 0.06)}
        lottieConfig={lottieConfig}
        fallbackColor={colors.primary}
        className={className}
      >
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      </LottieBorderRenderer>
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

    const animationType = getAnimationTypeFromBorder(border.type);

    if (!isAnimationKey(animationType)) return {};
    const baseAnimation = ANIMATION_KEYFRAMES[animationType];

    if (typeof baseAnimation === 'function') {
      return baseAnimation(0, 1);
    }

    if (baseAnimation) {
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

  // Particle configuration
  const particleCount =
    showParticles && border.particleCount
      ? Math.round((border.particleCount || 8) * (preferences.particleDensity / 50))
      : 0;

  const containerStyle: CSSPropertiesWithVars = {
    width: size,
    height: size,
    '--glow-color': colors.accent,
  };

  return (
    <motion.div
      ref={containerRef}
      className={cn('relative flex cursor-pointer items-center justify-center', className)}
      style={containerStyle}
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
            duration: durations.loop.ms / 1000 / finalAnimationSpeed,
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
            className="absolute inset-0 overflow-hidden rounded-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${colors.accent}60, transparent)`,
              backgroundSize: '200% 100%',
            }}
            animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
            transition={{
              duration: durations.cinematic.ms / 1000 / finalAnimationSpeed,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        )}

        {/* Rotating ring for rotate animations */}
        {(getAnimationTypeFromBorder(border.type) === 'rotate' ||
          border.type.includes('rotating')) &&
          !reducedMotion && (
            <motion.div
              className="absolute inset-0"
              style={{
                background: `conic-gradient(from 0deg, ${colors.primary}, ${colors.secondary}, ${colors.accent}, ${colors.primary})`,
                borderRadius: 'inherit',
              }}
              animate={{ rotate: 360 }}
              transition={{
                duration: durations.cinematic.ms / 1000 / finalAnimationSpeed,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          )}
      </motion.div>

      {/* Avatar image container */}
      <div
        className="relative z-10 overflow-hidden rounded-full bg-[rgb(30,32,40)]"
        style={{
          width: innerSize,
          height: innerSize,
        }}
      >
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      </div>

      {/* Particle effects */}
      {showParticles && particleCount > 0 && (
        <div className="pointer-events-none absolute inset-0">
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
                duration: durations.loop.ms / 1000 / finalAnimationSpeed,
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
          className="absolute -right-1 -top-1 z-20 flex h-4 w-4 items-center justify-center rounded-full text-[8px]"
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

export default AvatarBorderRenderer;
