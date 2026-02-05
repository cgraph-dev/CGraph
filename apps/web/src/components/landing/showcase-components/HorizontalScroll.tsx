/**
 * HorizontalScroll Component
 * Horizontal scroll showcase driven by vertical scroll
 */

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import type { HorizontalScrollProps } from './types';

export function HorizontalScroll({ children, className = '' }: HorizontalScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const x = useTransform(scrollYProgress, [0, 1], ['0%', `-${(children.length - 1) * 100}%`]);

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ height: `${children.length * 100}vh` }}
    >
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <motion.div className="flex" style={{ x }}>
          {children.map((child, index) => (
            <div
              key={index}
              className="flex h-screen w-screen flex-shrink-0 items-center justify-center px-8"
            >
              {child}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
