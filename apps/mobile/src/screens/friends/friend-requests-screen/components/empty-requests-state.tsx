/**
 * EmptyRequestsState Component
 *
 * Animated empty state for friend requests.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { EmptyRequestsStateProps } from '../types';

export function EmptyRequestsState({ type }: EmptyRequestsStateProps) {
  const pulseAnim = useSharedValue(1);
  const floatAnim = useSharedValue(0);

  useEffect(() => {
    // Pulse animation
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Float animation
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [pulseAnim, floatAnim]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }, { translateY: floatAnim.value }],
  }));

  const isIncoming = type === 'incoming';

  return (
    <View style={styles.emptyContainer}>
      <Animated.View
        style={[
          styles.emptyIconContainer,
          animatedIconStyle,
        ]}
      >
        <LinearGradient
          colors={isIncoming ? ['#8B5CF6', '#6366F1'] : ['#06B6D4', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.emptyIconGradient}
        >
          <Ionicons
            name={isIncoming ? 'mail-outline' : 'paper-plane-outline'}
            size={48}
            color="#FFF"
          />
        </LinearGradient>
      </Animated.View>

      <Text style={styles.emptyTitle}>
        {isIncoming ? 'No incoming requests' : 'No sent requests'}
      </Text>
      <Text style={styles.emptyDescription}>
        {isIncoming
          ? 'Friend requests you receive will appear here'
          : 'Friend requests you send will appear here'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyIconGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F3F4F6',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
  },
});
