/**
 * HolographicCard Component
 * Card with rainbow holographic and glare effects
 */

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { HOLO_PERSPECTIVE, HOLO_ROTATION_FACTOR, HOLO_SPRING_CONFIG } from './constants';
import type { HolographicCardProps, GlarePosition } from './types';

export function HolographicCard({ children, className = '' }: HolographicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState<GlarePosition>({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setRotateX((y - 0.5) * -HOLO_ROTATION_FACTOR);
    setRotateY((x - 0.5) * HOLO_ROTATION_FACTOR);
    setGlarePos({ x: x * 100, y: y * 100 });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePos({ x: 50, y: 50 });
  };

  return (
    <motion.div
      ref={cardRef}
      className={`relative ${className}`}
      style={{
        perspective: HOLO_PERSPECTIVE,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX,
        rotateY,
      }}
      transition={{ type: 'spring', ...HOLO_SPRING_CONFIG }}
    >
      {/* Rainbow holographic effect */}
      <div
        className="rounded-inherit pointer-events-none absolute inset-0 opacity-50"
        style={{
          background: `
            linear-gradient(
              ${glarePos.x * 3.6}deg,
              rgba(255, 0, 0, 0.3),
              rgba(255, 154, 0, 0.3),
              rgba(208, 222, 33, 0.3),
              rgba(79, 220, 74, 0.3),
              rgba(63, 218, 216, 0.3),
              rgba(47, 201, 226, 0.3),
              rgba(28, 127, 238, 0.3),
              rgba(95, 21, 242, 0.3),
              rgba(186, 12, 248, 0.3),
              rgba(251, 7, 217, 0.3),
              rgba(255, 0, 0, 0.3)
            )
          `,
          mixBlendMode: 'overlay',
          borderRadius: 'inherit',
        }}
      />

      {/* Glare effect */}
      <div
        className="rounded-inherit pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.4) 0%, transparent 60%)`,
          borderRadius: 'inherit',
        }}
      />

      {children}
    </motion.div>
  );
}
