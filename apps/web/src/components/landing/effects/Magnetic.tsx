/**
 * Magnetic Component
 * Magnetic attraction effect for elements
 */

import { motion, useMotionValue, useSpring } from 'framer-motion';
import { DEFAULT_MAGNETIC_STRENGTH, MAGNETIC_SPRING_CONFIG } from './constants';
import type { MagneticProps } from './types';

export function Magnetic({
  children,
  className = '',
  strength = DEFAULT_MAGNETIC_STRENGTH,
}: MagneticProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, MAGNETIC_SPRING_CONFIG);
  const springY = useSpring(y, MAGNETIC_SPRING_CONFIG);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) / (rect.width / strength));
    y.set((e.clientY - centerY) / (rect.height / strength));
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      className={className}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  );
}
