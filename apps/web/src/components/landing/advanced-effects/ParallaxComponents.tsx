/**
 * Parallax Components
 * 3D parallax layer and scene components with mouse tracking
 */

import { useState, useEffect, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { PARALLAX_DEFAULT_SENSITIVITY } from './constants';
import type { ParallaxLayerProps, ParallaxSceneProps } from './types';

export function ParallaxLayer({ children, depth, className = '' }: ParallaxLayerProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const x = useSpring(useTransform(mouseX, [-500, 500], [-depth * 50, depth * 50]), springConfig);
  const y = useSpring(useTransform(mouseY, [-500, 500], [-depth * 50, depth * 50]), springConfig);
  const scale = useTransform(mouseY, [-500, 500], [1 - depth * 0.05, 1 + depth * 0.05]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX - window.innerWidth / 2);
      mouseY.set(e.clientY - window.innerHeight / 2);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      className={className}
      style={{
        x,
        y,
        scale,
        transformStyle: 'preserve-3d',
        transform: `translateZ(${depth * 100}px)`,
      }}
    >
      {children}
    </motion.div>
  );
}

interface ParallaxContextValue {
  mouseX: ReturnType<typeof useMotionValue<number>>;
  mouseY: ReturnType<typeof useMotionValue<number>>;
}

export function ParallaxScene({
  children,
  className = '',
  sensitivity = PARALLAX_DEFAULT_SENSITIVITY,
}: ParallaxSceneProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX - window.innerWidth / 2) * sensitivity,
        y: (e.clientY - window.innerHeight / 2) * sensitivity,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [sensitivity]);

  return (
    <div
      className={className}
      style={{
        perspective: 1000,
        transformStyle: 'preserve-3d',
      }}
    >
      <motion.div
        style={{
          transformStyle: 'preserve-3d',
        }}
        animate={{
          rotateX: -mousePos.y,
          rotateY: mousePos.x,
        }}
        transition={{ type: 'spring', stiffness: 100, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
