/**
 * EmptyState Component
 *
 * Empty state display for when no leaderboard data is available with:
 * - Floating animation for the icon container
 * - Pulse animation for scale effect
 * - Trophy icon with gradient background
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, withTiming, withRepeat, withSequence, useAnimatedStyle, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// =============================================================================
// COMPONENT
// =============================================================================

export function EmptyState() {
  const floatAnim = useSharedValue(0);
  const pulseAnim = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatAnim.value }, { scale: pulseAnim.value }],
  }));

  useEffect(() => {
    // Float animation - moves up and down
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );

    // Pulse animation - scales up and down
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1
    );
  }, []);

  return (
    <View style={styles.emptyContainer}>
      <Animated.View style={animStyle}>
        <LinearGradient colors={['#374151', '#1F2937']} style={styles.emptyIconContainer}>
          <Ionicons name="trophy" size={48} color="#9CA3AF" />
        </LinearGradient>
      </Animated.View>
      <Text style={styles.emptyTitle}>No Rankings Yet</Text>
      <Text style={styles.emptySubtitle}>Check back later for leaderboard updates</Text>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
