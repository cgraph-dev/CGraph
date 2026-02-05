/**
 * Spotlight Component
 * Cursor-following spotlight effect
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { DEFAULT_SPOTLIGHT_SIZE, DEFAULT_SPOTLIGHT_COLOR } from './constants';
import type { SpotlightProps } from './types';

export function Spotlight({
  children,
  className = '',
  size = DEFAULT_SPOTLIGHT_SIZE,
  color = DEFAULT_SPOTLIGHT_COLOR,
}: SpotlightProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Spotlight gradient */}
      <motion.div
        className="pointer-events-none absolute"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          left: mousePos.x - size / 2,
          top: mousePos.y - size / 2,
        }}
        animate={{ opacity: isHovering ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      {children}
    </div>
  );
}
