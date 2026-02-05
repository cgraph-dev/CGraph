/**
 * RevealText Component
 * Scroll-based text reveal animation
 */

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import type { RevealTextProps, WordProps } from './types';

function Word({ children, range, progress }: WordProps) {
  const opacity = useTransform(progress, range, [0, 1]);
  const y = useTransform(progress, range, [20, 0]);

  return (
    <motion.span className="relative mr-2 inline-block" style={{ opacity, y }}>
      {children}
    </motion.span>
  );
}

export function RevealText({ children, className = '' }: RevealTextProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const words = children.split(' ');

  return (
    <span ref={containerRef} className={`inline ${className}`}>
      {words.map((word, i) => {
        const start = i / words.length;
        const end = start + 1 / words.length;

        return (
          <Word key={i} range={[start, end]} progress={scrollYProgress}>
            {word}
          </Word>
        );
      })}
    </span>
  );
}
