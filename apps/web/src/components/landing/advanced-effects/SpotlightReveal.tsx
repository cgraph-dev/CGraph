/**
 * SpotlightReveal Component
 * Spotlight effect that reveals content on hover
 */

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { SPOTLIGHT_DEFAULT_SIZE } from './constants';
import type { SpotlightRevealProps, MousePosition } from './types';

export function SpotlightReveal({
  children,
  className = '',
  spotlightSize = SPOTLIGHT_DEFAULT_SIZE,
}: SpotlightRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<MousePosition>({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Hidden content */}
      <div className="relative z-10 opacity-30">{children}</div>

      {/* Revealed content */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          background: `radial-gradient(circle ${spotlightSize}px at ${mousePos.x}px ${mousePos.y}px, transparent, black)`,
          maskImage: `radial-gradient(circle ${spotlightSize}px at ${mousePos.x}px ${mousePos.y}px, black, transparent)`,
          WebkitMaskImage: `radial-gradient(circle ${spotlightSize}px at ${mousePos.x}px ${mousePos.y}px, black, transparent)`,
        }}
        animate={{ opacity: isHovering ? 1 : 0 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
