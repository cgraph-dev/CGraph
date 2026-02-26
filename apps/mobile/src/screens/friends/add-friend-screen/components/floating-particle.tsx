/**
 * Floating particle background animation component.
 * @module screens/friends/add-friend-screen/components/floating-particle
 */
import { durations } from '@cgraph/animation-constants';
import React, { useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';
import { styles } from '../styles';

interface FloatingParticleProps {
  delay: number;
  size: number;
  startX: number;
}

export function FloatingParticle({ delay, size, startX }: FloatingParticleProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnimation = () => {
      translateY.setValue(600);
      opacity.setValue(0);

      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 8000 + Math.random() * 4000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.5,
              duration: durations.verySlow.ms,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.5,
              duration: durations.epic.ms,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: durations.loop.ms,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start(() => startAnimation());
    };

    startAnimation();
  }, []);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: size,
          height: size,
          left: startX,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    />
  );
}
