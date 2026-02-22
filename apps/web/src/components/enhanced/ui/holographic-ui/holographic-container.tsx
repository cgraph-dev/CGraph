import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getTheme, INTENSITY_MULTIPLIERS } from './constants';
import type { HolographicContainerProps, HolographicConfig, HolographicTheme } from './types';

/**
 * HolographicContainer Component
 *
 * Main container with 3D parallax, scanlines, and glitch effects
 */
export function HolographicContainer({
  children,
  config: userConfig,
  className,
  onClick,
}: HolographicContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isGlitching, setIsGlitching] = useState(false);
  const [flickerOpacity, setFlickerOpacity] = useState(1);

  const config: HolographicConfig = {
    intensity: userConfig?.intensity ?? 'medium',
    colorTheme: userConfig?.colorTheme ?? 'cyan',
    enableScanlines: userConfig?.enableScanlines ?? true,
    enableFlicker: userConfig?.enableFlicker ?? true,
    enableParallax: userConfig?.enableParallax ?? true,
    enable3D: userConfig?.enable3D ?? true,
    glitchProbability: userConfig?.glitchProbability ?? 0.02,
    ...userConfig,
  };

  const theme: HolographicTheme = config.customColors ?? getTheme(config.colorTheme);

  // Motion values for parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [5, -5]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-5, 5]), {
    stiffness: 300,
    damping: 30,
  });

  // Random glitch effect
  useEffect(() => {
    if (!config.enableFlicker) return;

    const glitchInterval = setInterval(() => {
      if (Math.random() < (config.glitchProbability ?? 0.02)) {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 100 + Math.random() * 150);
      }
    }, 500);

    return () => clearInterval(glitchInterval);
  }, [config.enableFlicker, config.glitchProbability]);

  // Subtle flicker
  useEffect(() => {
    if (!config.enableFlicker) return;

    const flickerInterval = setInterval(() => {
      setFlickerOpacity(0.95 + Math.random() * 0.05);
    }, 100);

    return () => clearInterval(flickerInterval);
  }, [config.enableFlicker]);

  // Mouse tracking for parallax
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!config.enableParallax) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      mouseX.set(x);
      mouseY.set(y);
    },
    [config.enableParallax, mouseX, mouseY]
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  const intensityMultiplier = INTENSITY_MULTIPLIERS[config.intensity ?? 'medium'];

  return (
    <motion.div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden rounded-lg',
        'transition-all duration-300',
        className
      )}
      style={{
        perspective: 1000,
        opacity: flickerOpacity,
        background: theme.background,
        boxShadow: `
          0 0 ${20 * intensityMultiplier}px ${theme.glow},
          inset 0 0 ${30 * intensityMultiplier}px ${theme.glow}
        `,
        border: `1px solid ${theme.primary}`,
        rotateX: config.enable3D ? rotateX : 0,
        rotateY: config.enable3D ? rotateY : 0,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Holographic gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(
            135deg,
            transparent 0%,
            ${theme.glow} 25%,
            transparent 50%,
            ${theme.glow} 75%,
            transparent 100%
          )`,
          opacity: 0.1 * intensityMultiplier,
          animation: 'holographicShimmer 3s linear infinite',
        }}
      />

      {/* Scanlines */}
      {config.enableScanlines && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              ${theme.scanline},
              ${theme.scanline} 1px,
              transparent 1px,
              transparent 3px
            )`,
            opacity: 0.5 * intensityMultiplier,
            animation: 'scanlineMove 10s linear infinite',
          }}
        />
      )}

      {/* Glitch overlay */}
      <AnimatePresence>
        {isGlitching && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              background: `linear-gradient(
                90deg,
                transparent 0%,
                ${theme.accent} 10%,
                transparent 20%
              )`,
              mixBlendMode: 'overlay',
            }}
          />
        )}
      </AnimatePresence>

      {/* Corner decorations */}
      <div className="absolute left-0 top-0 h-8 w-8">
        <svg viewBox="0 0 32 32" className="h-full w-full">
          <path d="M0 0 L32 0 L32 4 L4 4 L4 32 L0 32 Z" fill={theme.primary} opacity={0.8} />
        </svg>
      </div>
      <div className="absolute right-0 top-0 h-8 w-8 rotate-90">
        <svg viewBox="0 0 32 32" className="h-full w-full">
          <path d="M0 0 L32 0 L32 4 L4 4 L4 32 L0 32 Z" fill={theme.primary} opacity={0.8} />
        </svg>
      </div>
      <div className="absolute bottom-0 left-0 h-8 w-8 -rotate-90">
        <svg viewBox="0 0 32 32" className="h-full w-full">
          <path d="M0 0 L32 0 L32 4 L4 4 L4 32 L0 32 Z" fill={theme.primary} opacity={0.8} />
        </svg>
      </div>
      <div className="absolute bottom-0 right-0 h-8 w-8 rotate-180">
        <svg viewBox="0 0 32 32" className="h-full w-full">
          <path d="M0 0 L32 0 L32 4 L4 4 L4 32 L0 32 Z" fill={theme.primary} opacity={0.8} />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

export default HolographicContainer;
