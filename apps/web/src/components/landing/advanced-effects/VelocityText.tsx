/**
 * VelocityText Component
 * Velocity-based scrolling text animation
 */

import { useRef } from 'react';
import {
  motion,
  useMotionValue,
  useScroll,
  useVelocity,
  useSpring,
  useTransform,
  useAnimationFrame,
} from 'framer-motion';
import { VELOCITY_DEFAULT_BASE, VELOCITY_SPRING_CONFIG } from './constants';
import type { VelocityTextProps } from './types';

export function VelocityText({
  children,
  className = '',
  baseVelocity = VELOCITY_DEFAULT_BASE,
}: VelocityTextProps) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, VELOCITY_SPRING_CONFIG);
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], { clamp: false });

  const x = useTransform(baseX, (v) => `${v}%`);

  const directionFactor = useRef<number>(1);

  useAnimationFrame((_t, delta) => {
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);

    if (velocityFactor.get() < 0) {
      directionFactor.current = -1;
    } else if (velocityFactor.get() > 0) {
      directionFactor.current = 1;
    }

    moveBy += directionFactor.current * moveBy * velocityFactor.get();

    baseX.set(baseX.get() + moveBy);

    if (baseX.get() < -100) {
      baseX.set(0);
    } else if (baseX.get() > 0) {
      baseX.set(-100);
    }
  });

  return (
    <div className={`flex overflow-hidden whitespace-nowrap ${className}`}>
      <motion.div className="flex gap-4" style={{ x }}>
        {[...Array(4)].map((_, i) => (
          <span key={i} className="flex-shrink-0">
            {children}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
