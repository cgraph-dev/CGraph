/**
 * ParallaxImage Component
 * Image with parallax scroll effect
 */

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { DEFAULT_PARALLAX_SPEED } from './constants';
import type { ParallaxImageProps } from './types';

export function ParallaxImage({
  src,
  alt,
  className = '',
  speed = DEFAULT_PARALLAX_SPEED,
}: ParallaxImageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [-100 * speed, 100 * speed]);

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.img src={src} alt={alt} className="h-full w-full object-cover" style={{ y }} />
    </div>
  );
}
