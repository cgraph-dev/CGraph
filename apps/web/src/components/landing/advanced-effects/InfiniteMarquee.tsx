/**
 * InfiniteMarquee Component
 * Infinite scrolling marquee with pause on hover
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MARQUEE_DEFAULT_SPEED } from './constants';
import type { InfiniteMarqueeProps } from './types';

export function InfiniteMarquee({
  children,
  speed = MARQUEE_DEFAULT_SPEED,
  direction = 'left',
  pauseOnHover = true,
  className = '',
}: InfiniteMarqueeProps) {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <div
      className={`relative flex overflow-hidden ${className}`}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <motion.div
        className="flex min-w-full shrink-0 items-center gap-4"
        animate={{
          x: direction === 'left' ? [0, '-100%'] : ['-100%', 0],
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: 'linear',
          repeatType: 'loop',
        }}
        style={{
          animationPlayState: isPaused ? 'paused' : 'running',
        }}
      >
        {children}
        {children}
      </motion.div>
      <motion.div
        className="flex min-w-full shrink-0 items-center gap-4"
        animate={{
          x: direction === 'left' ? [0, '-100%'] : ['-100%', 0],
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: 'linear',
          repeatType: 'loop',
        }}
        style={{
          animationPlayState: isPaused ? 'paused' : 'running',
        }}
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
}
