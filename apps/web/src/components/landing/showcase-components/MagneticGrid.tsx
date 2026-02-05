/**
 * MagneticGrid Component
 * Grid with magnetic attraction to mouse cursor
 */

import { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { MAGNETIC_SPRING_CONFIG, MAGNETIC_DISTANCE, MAGNETIC_FORCE_MULTIPLIER } from './constants';
import type { MagneticGridProps, MagneticGridItemProps } from './types';

function MagneticGridItem({ children, mousePos }: MagneticGridItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, MAGNETIC_SPRING_CONFIG);
  const springY = useSpring(y, MAGNETIC_SPRING_CONFIG);

  useEffect(() => {
    if (!itemRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    const parentRect = itemRef.current.parentElement?.getBoundingClientRect();
    if (!parentRect) return;

    const centerX = rect.left - parentRect.left + rect.width / 2;
    const centerY = rect.top - parentRect.top + rect.height / 2;

    const dx = mousePos.x - centerX;
    const dy = mousePos.y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < MAGNETIC_DISTANCE) {
      const force = (MAGNETIC_DISTANCE - dist) / MAGNETIC_DISTANCE;
      x.set(dx * force * MAGNETIC_FORCE_MULTIPLIER);
      y.set(dy * force * MAGNETIC_FORCE_MULTIPLIER);
    } else {
      x.set(0);
      y.set(0);
    }
  }, [mousePos, x, y]);

  return (
    <motion.div ref={itemRef} style={{ x: springX, y: springY }}>
      {children}
    </motion.div>
  );
}

export function MagneticGrid({ children, columns = 3, className = '' }: MagneticGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

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
      className={`grid gap-6 ${className}`}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      onMouseMove={handleMouseMove}
    >
      {children.map((child, index) => (
        <MagneticGridItem key={index} mousePos={mousePos} containerRef={containerRef}>
          {child}
        </MagneticGridItem>
      ))}
    </div>
  );
}
