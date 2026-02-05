/**
 * TiltCard Component
 * 3D tilt effect card with glare
 */

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { DEFAULT_MAX_TILT, DEFAULT_PERSPECTIVE, TILT_SPRING_CONFIG } from './constants';
import type { TiltCardProps } from './types';

export function TiltCard({
  children,
  className = '',
  maxTilt = DEFAULT_MAX_TILT,
  perspective = DEFAULT_PERSPECTIVE,
  glare = true,
}: TiltCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [maxTilt, -maxTilt]), TILT_SPRING_CONFIG);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-maxTilt, maxTilt]), TILT_SPRING_CONFIG);

  const glareX = useTransform(x, [-0.5, 0.5], ['0%', '100%']);
  const glareY = useTransform(y, [-0.5, 0.5], ['0%', '100%']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const normalX = (e.clientX - rect.left) / rect.width - 0.5;
    const normalY = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(normalX);
    y.set(normalY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      className={`relative ${className}`}
      style={{
        perspective,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="relative"
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
      >
        {children}

        {/* Glare effect */}
        {glare && (
          <motion.div
            className="rounded-inherit pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.15) 0%, transparent 60%)`,
              borderRadius: 'inherit',
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
}
