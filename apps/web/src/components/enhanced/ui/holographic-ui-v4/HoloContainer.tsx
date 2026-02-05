/**
 * HoloContainer Component
 * @version 4.0.0
 */

import { ReactNode, useRef, useEffect, useState, useCallback, forwardRef } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  AnimatePresence,
  MotionProps,
} from 'framer-motion';
import { cn } from '@/lib/utils';
import { HoloPreset, HoloConfig, getTheme, getIntensityMultiplier } from './types';

interface HoloContainerProps extends Omit<MotionProps, 'children'> {
  children: ReactNode;
  preset?: HoloPreset;
  intensity?: HoloConfig['intensity'];
  enableScanlines?: boolean;
  enableFlicker?: boolean;
  enableParallax?: boolean;
  enable3D?: boolean;
  enableGlow?: boolean;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'aside';
  onClick?: () => void;
}

export const HoloContainer = forwardRef<HTMLDivElement, HoloContainerProps>(function HoloContainer(
  {
    children,
    preset = 'cyan',
    intensity = 'medium',
    enableScanlines = true,
    enableFlicker = true,
    enableParallax = true,
    enable3D = true,
    enableGlow = true,
    className,
    as: Component = 'div',
    onClick,
    ...motionProps
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isGlitching, setIsGlitching] = useState(false);
  const [flickerOpacity, setFlickerOpacity] = useState(1);
  const [isHovered, setIsHovered] = useState(false);

  const theme = getTheme(preset);
  const mult = getIntensityMultiplier(intensity);

  // Parallax motion values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-200, 200], [4, -4]), {
    stiffness: 400,
    damping: 40,
  });
  const rotateY = useSpring(useTransform(mouseX, [-200, 200], [-4, 4]), {
    stiffness: 400,
    damping: 40,
  });

  // Glitch effect
  useEffect(() => {
    if (!enableFlicker) return;
    const interval = setInterval(() => {
      if (Math.random() < 0.02) {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 80 + Math.random() * 120);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [enableFlicker]);

  // Flicker effect
  useEffect(() => {
    if (!enableFlicker) return;
    const interval = setInterval(() => {
      setFlickerOpacity(0.96 + Math.random() * 0.04);
    }, 80);
    return () => clearInterval(interval);
  }, [enableFlicker]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!enableParallax || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left - rect.width / 2);
      mouseY.set(e.clientY - rect.top - rect.height / 2);
    },
    [enableParallax, mouseX, mouseY]
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  }, [mouseX, mouseY]);

  const MotionComponent = motion[Component];

  return (
    <MotionComponent
      ref={ref || containerRef}
      className={cn('relative overflow-hidden rounded-xl', className)}
      style={{
        perspective: 1000,
        opacity: flickerOpacity,
        background: theme.background,
        border: `1px solid ${theme.border}`,
        boxShadow: enableGlow
          ? `
              0 0 ${15 * mult}px ${theme.glow}40,
              0 0 ${30 * mult}px ${theme.glow}20,
              inset 0 0 ${20 * mult}px ${theme.glow}10
            `
          : undefined,
        rotateX: enable3D ? rotateX : 0,
        rotateY: enable3D ? rotateY : 0,
        transformStyle: 'preserve-3d',
      }}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.01 }}
      {...motionProps}
    >
      {/* Holographic gradient overlay */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(
              135deg,
              transparent 0%,
              ${theme.glow}15 25%,
              transparent 50%,
              ${theme.glow}10 75%,
              transparent 100%
            )`,
        }}
        animate={
          isHovered
            ? { backgroundPosition: ['0% 0%', '200% 200%'] }
            : { backgroundPosition: '0% 0%' }
        }
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />

      {/* Scanlines */}
      {enableScanlines && (
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
            opacity: 0.4 * mult,
          }}
        />
      )}

      {/* Glitch overlay */}
      <AnimatePresence>
        {isGlitching && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-50"
            initial={{ opacity: 0, x: -2 }}
            animate={{ opacity: 0.8, x: [0, 2, -2, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            style={{
              background: `linear-gradient(90deg, transparent 40%, ${theme.accent}30 50%, transparent 60%)`,
              mixBlendMode: 'screen',
            }}
          />
        )}
      </AnimatePresence>

      {/* Corner brackets */}
      <CornerBrackets color={theme.primary} />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </MotionComponent>
  );
});

// Corner bracket decorations
function CornerBrackets({ color }: { color: string }) {
  const corners = [
    'top-0 left-0',
    'top-0 right-0 rotate-90',
    'bottom-0 left-0 -rotate-90',
    'bottom-0 right-0 rotate-180',
  ];

  return (
    <>
      {corners.map((pos, i) => (
        <div key={i} className={`absolute h-6 w-6 ${pos}`}>
          <svg viewBox="0 0 24 24" className="h-full w-full">
            <path d="M0 0 L24 0 L24 3 L3 3 L3 24 L0 24 Z" fill={color} opacity={0.7} />
          </svg>
        </div>
      ))}
    </>
  );
}
