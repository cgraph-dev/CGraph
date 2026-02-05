/**
 * SplitText Component
 * Text with character or word split animation
 */

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { DEFAULT_STAGGER, EASE_OUT_CUBIC } from './constants';
import type { SplitTextProps } from './types';

export function SplitText({
  children,
  className = '',
  type = 'chars',
  stagger = DEFAULT_STAGGER,
}: SplitTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  const items = type === 'words' ? children.split(' ') : children.split('');

  return (
    <span ref={ref} className={`inline-block ${className}`}>
      {items.map((item, index) => (
        <motion.span
          key={index}
          className="inline-block"
          initial={{ opacity: 0, y: 50, rotateX: -90 }}
          animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
          transition={{
            duration: 0.5,
            delay: index * stagger,
            ease: EASE_OUT_CUBIC,
          }}
        >
          {item}
          {type === 'words' && index < items.length - 1 ? '\u00A0' : ''}
        </motion.span>
      ))}
    </span>
  );
}
