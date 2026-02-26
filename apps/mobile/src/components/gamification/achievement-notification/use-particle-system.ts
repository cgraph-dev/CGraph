import { durations } from '@cgraph/animation-constants';
import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';

interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  rotation: Animated.Value;
  color: string;
}

export function useParticleSystem(count: number, colors: string[], trigger: boolean) {
  const particles = useRef<Particle[]>([]);
  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    if (!trigger) return;

    particles.current = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      scale: new Animated.Value(0),
      opacity: new Animated.Value(1),
      rotation: new Animated.Value(0),
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    setRenderKey((prev) => prev + 1);

    particles.current.forEach((particle, index) => {
      const angle = (index / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const distance = 80 + Math.random() * 60;
      const targetX = Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance;

      Animated.parallel([
        Animated.spring(particle.x, {
          toValue: targetX, tension: 40, friction: 5, useNativeDriver: true,
        }),
        Animated.spring(particle.y, {
          toValue: targetY, tension: 40, friction: 5, useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.spring(particle.scale, {
            toValue: 1 + Math.random() * 0.5, tension: 200, friction: 10, useNativeDriver: true,
          }),
          Animated.timing(particle.scale, {
            toValue: 0, duration: durations.smooth.ms, useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(300),
          Animated.timing(particle.opacity, {
            toValue: 0, duration: durations.smooth.ms, useNativeDriver: true,
          }),
        ]),
        Animated.timing(particle.rotation, {
          toValue: (Math.random() - 0.5) * 4, duration: durations.extended.ms, useNativeDriver: true,
        }),
      ]).start();
    });
  }, [trigger, count, colors]);

  return { particles: particles.current, renderKey };
}

export type { Particle };
