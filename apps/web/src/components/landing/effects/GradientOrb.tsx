/**
 * GradientOrb & GradientBackground Components
 * Floating animated gradient orbs for background effects
 */

import { motion } from 'framer-motion';
import { DEFAULT_ORB_SIZE, DEFAULT_ORB_BLUR, DEFAULT_ANIMATION_DURATION } from './constants';
import type { GradientOrbProps } from './types';

export function GradientOrb({
  color,
  size = DEFAULT_ORB_SIZE,
  blur = DEFAULT_ORB_BLUR,
  position = { top: '20%', left: '20%' },
  animate = true,
  animationDuration = DEFAULT_ANIMATION_DURATION,
}: GradientOrbProps) {
  return (
    <motion.div
      className="pointer-events-none absolute rounded-full"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: `blur(${blur}px)`,
        ...position,
      }}
      animate={
        animate
          ? {
              x: [0, 50, -30, 0],
              y: [0, -40, 30, 0],
              scale: [1, 1.1, 0.95, 1],
            }
          : {}
      }
      transition={{
        duration: animationDuration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

export function GradientBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <GradientOrb
        color="rgba(16, 185, 129, 0.15)"
        size={600}
        position={{ top: '10%', left: '20%' }}
      />
      <GradientOrb
        color="rgba(6, 182, 212, 0.12)"
        size={500}
        position={{ top: '40%', right: '15%' }}
        animationDuration={18}
      />
      <GradientOrb
        color="rgba(139, 92, 246, 0.1)"
        size={400}
        position={{ bottom: '20%', left: '10%' }}
        animationDuration={22}
      />
    </div>
  );
}
