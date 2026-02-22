import { memo } from 'react';
import { motion } from 'framer-motion';
import { prefersReducedMotion, DEFAULT_AURORA_COLORS, DEFAULT_AURORA_SPEED } from './constants';
import type { AuroraGlowProps } from './types';

/**
 * AuroraGlow Component
 *
 * Animated aurora borealis gradient background
 */
export const AuroraGlow = memo(function AuroraGlow({
  colors = DEFAULT_AURORA_COLORS,
  speed = DEFAULT_AURORA_SPEED,
}: AuroraGlowProps) {
  if (prefersReducedMotion()) {
    return (
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `linear-gradient(135deg, ${colors[0]}20 0%, ${colors[2]}20 50%, ${colors[1]}20 100%)`,
        }}
      />
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -inset-[100%]"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 20% 40%, ${colors[0]}25 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 60%, ${colors[2]}20 0%, transparent 50%),
            radial-gradient(ellipse 70% 60% at 50% 30%, ${colors[1]}15 0%, transparent 50%),
            radial-gradient(ellipse 50% 70% at 70% 80%, ${colors[3]}20 0%, transparent 50%)
          `,
        }}
        animate={{
          rotate: [0, 360],
          scale: [1, 1.1, 1],
        }}
        transition={{
          rotate: { duration: speed * 10, repeat: Infinity, ease: 'linear' },
          scale: { duration: speed, repeat: Infinity, ease: 'easeInOut' },
        }}
      />
    </div>
  );
});

export default AuroraGlow;
