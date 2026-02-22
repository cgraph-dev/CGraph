import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * FloatingOrbs - Animated background orbs for visual effect
 * Renders 8 floating orbs with randomized positions, sizes, and colors
 */
export function FloatingOrbs() {
  const orbs = useRef(
    Array.from({ length: 8 }, (_, i) => ({
      x: new Animated.Value(Math.random() * SCREEN_WIDTH),
      y: new Animated.Value(Math.random() * SCREEN_HEIGHT * 0.6),
      scale: new Animated.Value(0.5 + Math.random() * 0.5),
      opacity: new Animated.Value(0.1 + Math.random() * 0.2),
      color: ['#10b981', '#8b5cf6', '#3b82f6', '#ec4899'][i % 4],
      size: 60 + Math.random() * 100,
    }))
  ).current;

  useEffect(() => {
    orbs.forEach((orb, index) => {
      const animateOrb = () => {
        const targetX = Math.random() * (SCREEN_WIDTH - orb.size);
        const targetY = Math.random() * (SCREEN_HEIGHT * 0.5);
        const duration = 8000 + Math.random() * 6000;

        Animated.parallel([
          Animated.timing(orb.x, {
            toValue: targetX,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb.y, {
            toValue: targetY,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(orb.scale, {
              toValue: 0.6 + Math.random() * 0.6,
              duration: duration / 2,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(orb.scale, {
              toValue: 0.4 + Math.random() * 0.4,
              duration: duration / 2,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(orb.opacity, {
              toValue: 0.2 + Math.random() * 0.15,
              duration: duration / 2,
              useNativeDriver: true,
            }),
            Animated.timing(orb.opacity, {
              toValue: 0.1 + Math.random() * 0.1,
              duration: duration / 2,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => animateOrb());
      };

      setTimeout(() => animateOrb(), index * 500);
    });
  }, [orbs]);

  return (
    <View style={styles.orbsContainer} pointerEvents="none">
      {orbs.map((orb, index) => (
        <Animated.View
          key={index}
          style={[
            styles.orb,
            {
              width: orb.size,
              height: orb.size,
              borderRadius: orb.size / 2,
              backgroundColor: orb.color,
              transform: [{ translateX: orb.x }, { translateY: orb.y }, { scale: orb.scale }],
              opacity: orb.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  orbsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
  },
});
