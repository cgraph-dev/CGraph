/**
 * EmptyState Component
 *
 * Empty state display for when no leaderboard data is available with:
 * - Floating animation for the icon container
 * - Pulse animation for scale effect
 * - Trophy icon with gradient background
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// =============================================================================
// COMPONENT
// =============================================================================

export function EmptyState() {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Float animation - moves up and down
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse animation - scales up and down
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [floatAnim, pulseAnim]);

  return (
    <View style={styles.emptyContainer}>
      <Animated.View
        style={{
          transform: [{ translateY: floatAnim }, { scale: pulseAnim }],
        }}
      >
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
