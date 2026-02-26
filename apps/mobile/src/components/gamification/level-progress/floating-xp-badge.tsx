/**
 * Floating XP badge animation component.
 */
import { durations } from '@cgraph/animation-constants';
import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface FloatingXPBadgeProps {
  amount: number;
  onComplete: () => void;
}

export function FloatingXPBadge({ amount, onComplete }: FloatingXPBadgeProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        tension: 200,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(200),
        Animated.timing(translateY, {
          toValue: -60,
          duration: durations.ambient.ms,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(1200),
        Animated.timing(opacity, {
          toValue: 0,
          duration: durations.slower.ms,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => onComplete());
  }, []);

  return (
    <Animated.View
      style={[
        styles.floatingXPBadge,
        { transform: [{ translateY }, { scale }], opacity },
      ]}
    >
      <LinearGradient
        colors={['#10b981', '#059669']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.floatingXPGradient}
      >
        <Text style={styles.floatingXPText}>+{amount} XP</Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  floatingXPBadge: {
    position: 'absolute', top: 0, right: 12, zIndex: 100,
  },
  floatingXPGradient: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  floatingXPText: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
});
