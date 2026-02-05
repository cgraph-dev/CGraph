/**
 * MagneticCursor Component
 * Custom magnetic cursor that expands on hover
 */

import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import {
  MAGNETIC_SPRING_CONFIG,
  MAGNETIC_CURSOR_SIZE_DEFAULT,
  MAGNETIC_CURSOR_SIZE_HOVER,
} from './constants';
import type { MagneticCursorProps } from './types';

export function MagneticCursor({ children, className = '' }: MagneticCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const cursorX = useSpring(mouseX, MAGNETIC_SPRING_CONFIG);
  const cursorY = useSpring(mouseY, MAGNETIC_SPRING_CONFIG);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <>
      {/* Custom cursor */}
      <motion.div
        className="pointer-events-none fixed z-50 mix-blend-difference"
        style={{
          left: cursorX,
          top: cursorY,
          x: '-50%',
          y: '-50%',
        }}
      >
        <motion.div
          className="rounded-full bg-white"
          animate={{
            width: isHovering ? MAGNETIC_CURSOR_SIZE_HOVER : MAGNETIC_CURSOR_SIZE_DEFAULT,
            height: isHovering ? MAGNETIC_CURSOR_SIZE_HOVER : MAGNETIC_CURSOR_SIZE_DEFAULT,
          }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        />
      </motion.div>

      {/* Content wrapper */}
      <div
        ref={cursorRef}
        className={className}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {children}
      </div>
    </>
  );
}
