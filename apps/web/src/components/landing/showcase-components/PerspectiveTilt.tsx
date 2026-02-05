/**
 * PerspectiveTilt Component
 * Container with 3D perspective tilt on mouse movement
 */

import { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { TILT_SPRING_CONFIG, DEFAULT_PERSPECTIVE, DEFAULT_MAX_TILT } from './constants';
import type { PerspectiveTiltProps } from './types';

export function PerspectiveTilt({
  children,
  className = '',
  perspective = DEFAULT_PERSPECTIVE,
  maxTilt = DEFAULT_MAX_TILT,
}: PerspectiveTiltProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  const rotateXSpring = useSpring(rotateX, TILT_SPRING_CONFIG);
  const rotateYSpring = useSpring(rotateY, TILT_SPRING_CONFIG);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    rotateX.set(-y * maxTilt);
    rotateY.set(x * maxTilt);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      ref={containerRef}
      className={className}
      style={{
        perspective,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{
          rotateX: rotateXSpring,
          rotateY: rotateYSpring,
          transformStyle: 'preserve-3d',
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
