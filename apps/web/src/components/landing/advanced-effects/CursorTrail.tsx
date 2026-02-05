/**
 * CursorTrail Component
 * Mouse cursor trail effect with fading particles
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  TRAIL_DEFAULT_COLOR,
  TRAIL_DEFAULT_SIZE,
  TRAIL_DEFAULT_LENGTH,
  TRAIL_DEFAULT_FADE_SPEED,
} from './constants';
import type { CursorTrailProps, TrailPoint } from './types';

export function CursorTrail({
  color = TRAIL_DEFAULT_COLOR,
  size = TRAIL_DEFAULT_SIZE,
  trailLength = TRAIL_DEFAULT_LENGTH,
  fadeSpeed = TRAIL_DEFAULT_FADE_SPEED,
}: CursorTrailProps) {
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const newPoint = { x: e.clientX, y: e.clientY, id: idRef.current++ };
      setTrail((prev) => [...prev.slice(-trailLength + 1), newPoint]);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [trailLength]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {trail.map((point, index) => {
        const opacity = (index / trail.length) * fadeSpeed;
        const scale = (index / trail.length) * 0.8 + 0.2;

        return (
          <motion.div
            key={point.id}
            className="absolute rounded-full"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity, scale }}
            exit={{ opacity: 0, scale: 0 }}
            style={{
              left: point.x - size / 2,
              top: point.y - size / 2,
              width: size,
              height: size,
              background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
            }}
          />
        );
      })}
    </div>
  );
}
