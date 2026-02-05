/**
 * ScrollCounter Component
 * Animated counter triggered on scroll
 */

import { useRef, useState, useEffect } from 'react';
import { useInView } from 'framer-motion';
import { DEFAULT_COUNTER_DURATION } from './constants';
import type { ScrollCounterProps } from './types';

export function ScrollCounter({
  value,
  prefix = '',
  suffix = '',
  duration = DEFAULT_COUNTER_DURATION,
  className = '',
}: ScrollCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    let animationId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);

      // Easing function - easeOutQuart
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.floor(easeOutQuart * value));

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isInView, value, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
}
