/**
 * FloatingLogo - Animated Floating Logo Component
 *
 * A stunning animated logo that floats and responds to mouse movement.
 * Uses CSS transforms and the LogoIcon for a polished look.
 *
 * Features:
 * - 3D rotation following mouse position
 * - Smooth floating animation
 * - Glow/bloom effect
 * - Gradient coloring
 * - Performance-optimized rendering
 */

import { useRef, useEffect, useCallback, useState, memo } from 'react';
import { motion } from 'framer-motion';
import { LogoIcon } from '@/components/Logo';

interface FloatingLogoProps {
  /** Size of the logo */
  size?: number;
  /** Primary color */
  primaryColor?: string;
  /** Secondary color for gradient */
  secondaryColor?: string;
  /** Glow color */
  glowColor?: string;
  /** Mouse follow intensity (0-1) */
  mouseIntensity?: number;
  /** Float animation amplitude */
  floatAmplitude?: number;
  /** Additional CSS classes */
  className?: string;
}

export const FloatingLogo = memo(function FloatingLogo({
  size = 300,
  primaryColor = '#10b981',
  secondaryColor = '#8b5cf6',
  glowColor = '#06b6d4',
  mouseIntensity = 0.3,
  floatAmplitude = 10,
  className = '',
}: FloatingLogoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const targetRotationRef = useRef({ x: 0, y: 0 });
  const rafIdRef = useRef<number | null>(null);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) / (rect.width / 2);
      const deltaY = (e.clientY - centerY) / (rect.height / 2);

      targetRotationRef.current = {
        x: -deltaY * 20 * mouseIntensity,
        y: deltaX * 20 * mouseIntensity,
      };
    },
    [mouseIntensity]
  );

  useEffect(() => {
    const animate = () => {
      setRotation((prev) => ({
        x: prev.x + (targetRotationRef.current.x - prev.x) * 0.1,
        y: prev.y + (targetRotationRef.current.y - prev.y) * 0.1,
      }));
      rafIdRef.current = requestAnimationFrame(animate);
    };

    rafIdRef.current = requestAnimationFrame(animate);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove]);

  return (
    <motion.div
      ref={containerRef}
      className={`floating-logo ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: size,
        height: size,
        position: 'relative',
        perspective: '1000px',
        cursor: 'pointer',
      }}
    >
      {/* Outer glow layers */}
      <div
        style={{
          position: 'absolute',
          inset: '-30%',
          background: `radial-gradient(circle, ${glowColor}30 0%, ${primaryColor}15 40%, transparent 70%)`,
          filter: 'blur(40px)',
          animation: 'floating-logo-glow 4s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: '-20%',
          background: `radial-gradient(circle, ${secondaryColor}25 0%, transparent 60%)`,
          filter: 'blur(30px)',
          animation: 'floating-logo-glow 4s ease-in-out infinite 1s',
        }}
      />

      {/* Main logo container with 3D transform */}
      <motion.div
        animate={{
          y: [0, -floatAmplitude, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        }}
      >
        {/* Logo with glow effect */}
        <div
          style={{
            position: 'relative',
            transform: 'translateZ(20px)',
          }}
        >
          {/* Glow behind logo */}
          <div
            style={{
              position: 'absolute',
              inset: '-20%',
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              filter: 'blur(25px)',
              opacity: isHovered ? 0.8 : 0.5,
              transition: 'opacity 0.3s ease',
              borderRadius: '50%',
            }}
          />

          {/* The actual logo */}
          <LogoIcon size={size * 0.6} color="gradient" showGlow animated />
        </div>
      </motion.div>

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            width: 4 + (i % 3) * 2,
            height: 4 + (i % 3) * 2,
            borderRadius: '50%',
            background: i % 2 === 0 ? primaryColor : secondaryColor,
            boxShadow: `0 0 10px ${i % 2 === 0 ? primaryColor : secondaryColor}`,
            left: `${20 + ((i * 60) % 80)}%`,
            top: `${10 + ((i * 50) % 80)}%`,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, i % 2 === 0 ? 10 : -10, 0],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.3,
          }}
        />
      ))}
    </motion.div>
  );
});

export default FloatingLogo;
