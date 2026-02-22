/**
 * Skeleton - Loading skeleton with shimmer effect
 */

import React, { useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { SkeletonProps, SkeletonGroupProps } from '../types';
import { styles } from '../styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 4,
  shimmerColor = 'rgba(255, 255, 255, 0.1)',
  backgroundColor = '#374151',
  animated = true,
  style,
}: SkeletonProps) {
  const shimmerPosition = useSharedValue(-1);

  useEffect(() => {
    if (animated) {
      shimmerPosition.value = withRepeat(
        withTiming(2, { duration: 1500, easing: Easing.linear }),
        -1,
        false
      );
    }

    return () => {
      cancelAnimation(shimmerPosition);
    };
  }, [animated, shimmerPosition]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shimmerPosition.value * (typeof width === 'number' ? width : SCREEN_WIDTH) },
    ],
  }));

  return (
    <View style={[styles.skeleton, { width, height, borderRadius, backgroundColor }, style]}>
      {animated && (
        <Animated.View style={[styles.shimmerContainer, shimmerStyle]}>
          <LinearGradient
            colors={['transparent', shimmerColor, 'transparent'] as [string, string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.shimmer, { width: typeof width === 'number' ? width : SCREEN_WIDTH }]}
          />
        </Animated.View>
      )}
    </View>
  );
}

export function SkeletonGroup({
  count = 3,
  variant = 'text',
  animated = true,
  style,
}: SkeletonGroupProps) {
  const renderSkeleton = (index: number) => {
    switch (variant) {
      case 'avatar':
        return (
          <Skeleton key={index} width={48} height={48} borderRadius={24} animated={animated} />
        );

      case 'card':
        return (
          <View key={index} style={styles.skeletonCard}>
            <Skeleton width="100%" height={120} borderRadius={12} animated={animated} />
            <View style={styles.skeletonCardContent}>
              <Skeleton width="60%" height={16} animated={animated} />
              <Skeleton width="80%" height={12} animated={animated} />
            </View>
          </View>
        );

      case 'list-item':
        return (
          <View key={index} style={styles.skeletonListItem}>
            <Skeleton width={48} height={48} borderRadius={24} animated={animated} />
            <View style={styles.skeletonListItemContent}>
              <Skeleton width="70%" height={14} animated={animated} />
              <Skeleton width="50%" height={12} animated={animated} />
            </View>
          </View>
        );

      case 'text':
      default:
        return (
          <Skeleton
            key={index}
            width={index === count - 1 ? '60%' : '100%'}
            height={14}
            animated={animated}
            style={{ marginBottom: index < count - 1 ? 8 : 0 }}
          />
        );
    }
  };

  return (
    <View style={style}>{Array.from({ length: count }).map((_, i) => renderSkeleton(i))}</View>
  );
}
