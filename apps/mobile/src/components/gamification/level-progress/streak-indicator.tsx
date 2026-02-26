/**
 * Streak indicator with fire animation and multiplier badge.
 */
import { durations } from '@cgraph/animation-constants';
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getStreakMultiplier, getStreakColor } from './level-progress-types';

interface StreakIndicatorProps {
  streak: number;
  showMultiplier?: boolean;
}

export function StreakIndicator({ streak, showMultiplier = true }: StreakIndicatorProps) {
  const fireAnim = useRef(new Animated.Value(0)).current;
  const multiplier = getStreakMultiplier(streak);
  const color = getStreakColor(streak);

  useEffect(() => {
    if (streak > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(fireAnim, {
            toValue: 1,
            duration: durations.slow.ms,
            useNativeDriver: true,
          }),
          Animated.timing(fireAnim, {
            toValue: 0,
            duration: durations.slow.ms,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [streak]);

  const fireTranslateY = fireAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -3],
  });

  if (streak === 0) return null;

  return (
    <View style={[styles.streakContainer, { borderColor: color + '50' }]}>
      <Animated.View style={{ transform: [{ translateY: fireTranslateY }] }}>
        <Ionicons name="flame" size={18} color={color} />
      </Animated.View>
      <Text style={[styles.streakNumber, { color }]}>{streak}</Text>
      {showMultiplier && multiplier > 1 && (
        <View style={[styles.multiplierBadge, { backgroundColor: color + '20' }]}>
          <Text style={[styles.multiplierText, { color }]}>{multiplier}x</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  streakContainer: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10,
    paddingVertical: 6, borderRadius: 12, borderWidth: 1,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
  },
  streakNumber: { fontSize: 14, fontWeight: '700', marginLeft: 4 },
  multiplierBadge: { marginLeft: 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  multiplierText: { fontSize: 10, fontWeight: '700' },
});
