/** TiltCard — 3D hover tilt effect wrapper for cards using Framer Motion. */
import { memo, useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { prefersReducedMotion } from './constants';
import type { TiltCardProps } from './types';
import { springs } from '@/lib/animation-presets';

/**
 * TiltCard Component
 *
 * 3D hover tilt effect for cards
 */
export const TiltCard = memo(function TiltCard({
  children,
  className = '',
  maxTilt = 10,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-maxTilt, maxTilt]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion() || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    x.set((e.clientX - centerX) / rect.width);
    y.set((e.clientY - centerY) / rect.height);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      className={className}
      style={{
        rotateX: prefersReducedMotion() ? 0 : rotateX,
        rotateY: prefersReducedMotion() ? 0 : rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: prefersReducedMotion() ? 1 : 1.02 }}
      transition={springs.bouncy}
    >
      {children}
    </motion.div>
  );
});

export default TiltCard;
