/**
 * ConfettiCelebration - Animated Celebration Component
 *
 * Beautiful confetti animation for celebrating achievements, purchases,
 * level ups, and other special moments.
 *
 * Features:
 * - Customizable confetti colors
 * - Multiple animation patterns
 * - Particle physics with gravity
 * - Haptic feedback on trigger
 * - Auto-hide after animation
 * - Configurable duration and intensity
 *
 * @version 1.0.0
 * @since v0.9.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export type ConfettiPattern = 'burst' | 'shower' | 'fountain' | 'spiral';

export interface ConfettiCelebrationProps {
  /** Whether confetti is active */
  active: boolean;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Animation pattern */
  pattern?: ConfettiPattern;
  /** Custom confetti colors */
  colors?: string[];
  /** Number of confetti pieces */
  count?: number;
  /** Animation duration in ms */
  duration?: number;
  /** Whether to trigger haptic feedback */
  hapticFeedback?: boolean;
}

interface ConfettiPiece {
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  color: string;
  size: number;
  shape: 'square' | 'rectangle' | 'circle';
}

const DEFAULT_COLORS = [
  '#f59e0b', // Gold
  '#3b82f6', // Blue
  '#10b981', // Green
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#f97316', // Orange
];

/**
 * Confetti Celebration component.
 *
 */
export default function ConfettiCelebration({
  active,
  onComplete,
  pattern = 'burst',
  colors = DEFAULT_COLORS,
  count = 50,
  duration = 3000,
  hapticFeedback = true,
}: ConfettiCelebrationProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (active) {
      if (hapticFeedback) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Create confetti pieces
      const newPieces: ConfettiPiece[] = Array.from({ length: count }, () => ({
        x: new Animated.Value(0),
        y: new Animated.Value(0),
        rotation: new Animated.Value(0),
        scale: new Animated.Value(0),
        opacity: new Animated.Value(1),
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 8 + Math.random() * 8,

         
        shape: ['square', 'rectangle', 'circle'][Math.floor(Math.random() * 3)] as
          | 'square'
          | 'rectangle'
          | 'circle',
      }));

      setPieces(newPieces);

      // Animate based on pattern
      const animations = newPieces.map((piece, index) => {
        const delay = index * (duration / count / 3);

        let xTarget: number;
        let yTarget: number;
        let startX = SCREEN_WIDTH / 2;
        let startY = SCREEN_HEIGHT / 2;

        switch (pattern) {
          case 'shower':
            startX = Math.random() * SCREEN_WIDTH;
            startY = -50;
            xTarget = startX + (Math.random() - 0.5) * 200;
            yTarget = SCREEN_HEIGHT + 100;
            piece.x.setValue(startX);
            piece.y.setValue(startY);
            break;
          case 'fountain':
            startX = SCREEN_WIDTH / 2 + (Math.random() - 0.5) * 100;
            startY = SCREEN_HEIGHT;
            xTarget = startX + (Math.random() - 0.5) * SCREEN_WIDTH;
            yTarget = -100;
            piece.x.setValue(startX);
            piece.y.setValue(startY);
            break;
          case 'spiral': {
            const angle = (index / count) * Math.PI * 4;
            const radius = 50 + (index / count) * 300;
            xTarget = SCREEN_WIDTH / 2 + Math.cos(angle) * radius;
            yTarget = SCREEN_HEIGHT / 2 + Math.sin(angle) * radius;
            piece.x.setValue(SCREEN_WIDTH / 2);
            piece.y.setValue(SCREEN_HEIGHT / 2);
            break;
          }
          case 'burst':
          default: {
            const burstAngle = Math.random() * Math.PI * 2;
            const burstRadius = 200 + Math.random() * 300;
            xTarget = SCREEN_WIDTH / 2 + Math.cos(burstAngle) * burstRadius;
            yTarget = SCREEN_HEIGHT / 2 + Math.sin(burstAngle) * burstRadius;
            piece.x.setValue(SCREEN_WIDTH / 2);
            piece.y.setValue(SCREEN_HEIGHT / 2);
            break;
          }
        }

        return Animated.parallel([
          Animated.sequence([
            Animated.delay(delay),
            Animated.spring(piece.scale, {
              toValue: 1,
              friction: 4,
              tension: 60,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(piece.x, {
              toValue: xTarget,
              duration: duration - delay,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(piece.y, {
              toValue: yTarget,
              duration: duration - delay,
              easing: pattern === 'shower' ? Easing.in(Easing.quad) : Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
          Animated.loop(
            Animated.timing(piece.rotation, {
              toValue: 1,
              duration: 1000 + Math.random() * 1000,
              easing: Easing.linear,
              useNativeDriver: true,
            })
          ),
          Animated.sequence([
            Animated.delay(delay + duration * 0.6),
            Animated.timing(piece.opacity, {
              toValue: 0,
              duration: duration * 0.4,
              useNativeDriver: true,
            }),
          ]),
        ]);
      });

      animationRef.current = Animated.parallel(animations);
      animationRef.current.start(() => {
        setPieces([]);
        onComplete?.();
      });
    }

    return () => {
      animationRef.current?.stop();
    };
  }, [active, pattern, colors, count, duration, hapticFeedback, onComplete]);

  if (!active || pieces.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      {pieces.map((piece, index) => {
        const rotation = piece.rotation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.piece,
              piece.shape === 'circle' && { borderRadius: piece.size / 2 },
              piece.shape === 'rectangle' && { width: piece.size, height: piece.size * 2 },
              {
                width: piece.size,
                height: piece.shape === 'rectangle' ? piece.size * 2 : piece.size,
                backgroundColor: piece.color,
                transform: [
                  { translateX: piece.x },
                  { translateY: piece.y },
                  { rotate: rotation },
                  { scale: piece.scale },
                ],
                opacity: piece.opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  piece: {
    position: 'absolute',
    width: 10,
    height: 10,
  },
});
