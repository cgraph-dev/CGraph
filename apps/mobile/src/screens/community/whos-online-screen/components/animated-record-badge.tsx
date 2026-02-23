import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

interface AnimatedRecordBadgeProps {
  record: number;
  recordDate: string | null;
  scrollY: SharedValue<number>;
}

/**
 * AnimatedRecordBadge - Trophy badge showing record stats
 * Features shimmer effect, trophy bounce, and scroll parallax
 */
export function AnimatedRecordBadge({ record, recordDate, scrollY }: AnimatedRecordBadgeProps) {
  const trophyBounce = useSharedValue(1);
  const shimmerAnim = useSharedValue(0);
  const entryAnim = useSharedValue(0);

  useEffect(() => {
    // Entry animation
    entryAnim.value = withDelay(300, withSpring(1, { damping: 6, stiffness: 50 }));

    // Trophy bounce
    trophyBounce.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );

    // Shimmer animation
    shimmerAnim.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
  }, [entryAnim, trophyBounce, shimmerAnim]);

  const containerStyle = useAnimatedStyle(() => {
    const parallaxScale = interpolate(
      scrollY.value,
      [-50, 0, 100],
      [1.05, 1, 0.95],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ scale: entryAnim.value * parallaxScale }],
      opacity: entryAnim.value,
    };
  });

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmerAnim.value, [0, 1], [-200, 200]) }],
  }));

  const trophyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: trophyBounce.value }],
  }));

  const formatRecordDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Animated.View
      style={[
        styles.recordContainerEnhanced,
        containerStyle,
      ]}
    >
      <BlurView intensity={40} tint="dark" style={styles.recordBlur}>
        {/* Shimmer effect */}
        <Animated.View
          style={[styles.shimmerEffect, shimmerStyle]}
        >
          <LinearGradient
            colors={['transparent', 'rgba(245, 158, 11, 0.2)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>

        <Animated.View style={trophyStyle}>
          <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.trophyContainer}>
            <Ionicons name="trophy" size={24} color="#fff" />
          </LinearGradient>
        </Animated.View>

        <View style={styles.recordInfo}>
          <Text style={styles.recordLabel}>
            Record: <Text style={styles.recordValue}>{record}</Text> users online
          </Text>
          <Text style={styles.recordDate}>{formatRecordDate(recordDate)}</Text>
        </View>

        <View style={styles.recordCrown}>
          <Ionicons name="ribbon" size={16} color="#f59e0b" />
        </View>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  recordContainerEnhanced: {
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  recordBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 20,
    overflow: 'hidden',
  },
  shimmerEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 400,
  },
  trophyContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recordInfo: {
    flex: 1,
  },
  recordLabel: {
    fontSize: 14,
    color: '#d1d5db',
  },
  recordValue: {
    color: '#f59e0b',
    fontWeight: '700',
    fontSize: 16,
  },
  recordDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  recordCrown: {
    marginLeft: 8,
  },
});
