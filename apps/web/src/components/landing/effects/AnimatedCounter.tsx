/**
 * AnimatedCounter Component
 * Animated number counter
 */

import { useState, useEffect } from 'react';
import { DEFAULT_COUNTER_DURATION } from './constants';
import type { AnimatedCounterProps } from './types';

export function AnimatedCounter({
  value,
  duration = DEFAULT_COUNTER_DURATION,
  className = '',
  prefix = '',
  suffix = '',
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);

      setCount(Math.floor(progress * value));

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}
