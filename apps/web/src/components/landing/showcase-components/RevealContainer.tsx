/**
 * RevealContainer Component
 * Reveal content on scroll with directional animation
 */

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { REVEAL_DIRECTIONS, DEFAULT_DURATION, EASE_OUT_CUBIC } from './constants';
import type { RevealContainerProps } from './types';

export function RevealContainer({
  children,
  className = '',
  direction = 'up',
  delay = 0,
}: RevealContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={REVEAL_DIRECTIONS[direction]}
      transition={{ duration: DEFAULT_DURATION, delay, ease: EASE_OUT_CUBIC }}
    >
      {children}
    </motion.div>
  );
}
