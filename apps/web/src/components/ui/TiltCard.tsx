/**
 * TiltCard Component
 * 
 * 3D tilt effect card with mouse tracking and optional glare effect.
 * Creates an immersive, interactive card experience.
 */

import { useRef, type ReactNode, type CSSProperties } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { springs } from '@/lib/animationPresets';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Maximum tilt angle in degrees */
  maxTilt?: number;
  /** Perspective distance */
  perspective?: number;
  /** Enable glare effect */
  glare?: boolean;
  /** Glare intensity (0-1) */
  glareIntensity?: number;
  /** Scale on hover */
  scale?: number;
  /** Additional glow color */
  glowColor?: string;
  /** Enable shadow on hover */
  shadow?: boolean;
  /** Disable tilt effect */
  disabled?: boolean;
}

export default function TiltCard({
  children,
  className = '',
  style,
  maxTilt = 15,
  perspective = 1000,
  glare = true,
  glareIntensity = 0.15,
  scale = 1.02,
  glowColor,
  shadow = true,
  disabled = false,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Motion values for mouse position (normalized -0.5 to 0.5)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring smoothing for rotations
  const springConfig = { stiffness: 150, damping: 15 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [maxTilt, -maxTilt]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-maxTilt, maxTilt]), springConfig);

  // Glare position
  const glareX = useTransform(mouseX, [-0.5, 0.5], ['0%', '100%']);
  const glareY = useTransform(mouseY, [-0.5, 0.5], ['0%', '100%']);
  
  // Glare background - computed from glareX and glareY
  const glareBackground = useTransform(
    [glareX, glareY],
    ([x, y]) => `radial-gradient(circle at ${x} ${y}, rgba(255,255,255,${glareIntensity}) 0%, transparent 60%)`
  );

  // Scale on hover
  const scaleValue = useSpring(1, springs.snappy);
  
  // Glow opacity - must be computed at top level (hooks can't be called in JSX)
  const glowOpacity = useTransform(scaleValue, [1, scale], [0, 0.5]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseEnter = () => {
    if (!disabled) {
      scaleValue.set(scale);
    }
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    scaleValue.set(1);
  };

  return (
    <motion.div
      ref={cardRef}
      className={`relative ${className}`}
      style={{
        perspective,
        transformStyle: 'preserve-3d',
        ...style,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="relative h-full w-full"
        style={{
          rotateX: disabled ? 0 : rotateX,
          rotateY: disabled ? 0 : rotateY,
          scale: scaleValue,
          transformStyle: 'preserve-3d',
          boxShadow: shadow && !disabled
            ? glowColor
              ? `0 20px 40px -10px ${glowColor}40, 0 10px 20px -5px rgba(0,0,0,0.3)`
              : '0 20px 40px -10px rgba(0,0,0,0.3), 0 10px 20px -5px rgba(0,0,0,0.2)'
            : undefined,
        }}
      >
        {/* Card content */}
        {children}

        {/* Glare overlay */}
        {glare && !disabled && (
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden"
            style={{
              background: glareBackground,
            }}
          />
        )}

        {/* Glow effect */}
        {glowColor && !disabled && (
          <motion.div
            className="pointer-events-none absolute -inset-1 -z-10 rounded-[inherit] opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background: glowColor,
              opacity: glowOpacity,
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
}

/**
 * Simplified TiltCard for smaller elements
 */
export function MiniTiltCard({
  children,
  className = '',
  maxTilt = 10,
}: {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
}) {
  return (
    <TiltCard
      className={className}
      maxTilt={maxTilt}
      glare={false}
      shadow={false}
      scale={1.05}
    >
      {children}
    </TiltCard>
  );
}
