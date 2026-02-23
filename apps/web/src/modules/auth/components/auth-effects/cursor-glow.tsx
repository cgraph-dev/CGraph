/**
 * Auth page cursor-following glow effect.
 * @module
 */
import { memo, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { prefersReducedMotion, DEFAULT_COLOR, DEFAULT_GLOW_SIZE } from './constants';
import type { CursorGlowProps } from './types';

/**
 * CursorGlow Component
 *
 * Mouse-following light glow effect
 */
export const CursorGlow = memo(function CursorGlow({
  color = DEFAULT_COLOR,
  size = DEFAULT_GLOW_SIZE,
}: CursorGlowProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 150 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const handleMouse = (e: MouseEvent) => {
      x.set(e.clientX - size / 2);
      y.set(e.clientY - size / 2);
    };

    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, [x, y, size]);

  if (prefersReducedMotion()) return null;

  return (
    <motion.div
      className="pointer-events-none fixed z-0"
      style={{
        x: springX,
        y: springY,
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
        borderRadius: '50%',
        filter: 'blur(40px)',
      }}
    />
  );
});

export default CursorGlow;
