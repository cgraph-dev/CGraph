import React from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  enableTilt?: boolean;
  spotlightColor?: string;
}

/**
 * GlassCard - CGraph Primitive
 *
 * A premium container component featuring:
 * - "Deep Glass" background (black/40 + blur)
 * - Mouse-following spotlight border
 * - Optional 3D tilt effect on hover
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  enableTilt = true,
  spotlightColor = 'rgba(16, 185, 129, 0.15)', // Default Emerald tint
}) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = ({ currentTarget, clientX, clientY }: React.MouseEvent) => {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  const bg = useMotionTemplate`radial-gradient(
    650px circle at ${mouseX}px ${mouseY}px,
    ${spotlightColor},
    transparent 80%
  )`;

  const Content = (
    <div
      className={`group relative overflow-hidden rounded-xl border border-white/5 bg-black/40 backdrop-blur-xl ${className}`}
      onMouseMove={handleMouseMove}
    >
      {/* Spotlight overlay */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{ background: bg }}
      />

      {/* Content wrapper */}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );

  if (enableTilt) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.4, type: 'spring' }}
        className="h-full"
      >
        {Content}
      </motion.div>
    );
  }

  return Content;
};
