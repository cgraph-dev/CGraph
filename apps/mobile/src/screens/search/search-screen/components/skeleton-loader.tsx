/**
 * SkeletonLoader – shimmer placeholder while search results load.
 *
 * @module screens/search/SearchScreen/components/skeleton-loader
 */

import { durations } from '@cgraph/animation-constants';
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

interface SkeletonLoaderProps {
  isDark: boolean;
}

/**
 *
 */
export function SkeletonLoader({ isDark }: SkeletonLoaderProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: durations.verySlow.ms,
          useNativeDriver: true,
          easing: Easing.ease,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: durations.verySlow.ms,
          useNativeDriver: true,
          easing: Easing.ease,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={skeletonStyles.container}>
      {[1, 2, 3].map((i) => (
        <Animated.View
          key={i}
          style={[
            skeletonStyles.item,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
              opacity,
            },
          ]}
        >
          <View
            style={[
              skeletonStyles.avatar,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' },
            ]}
          />
          <View style={skeletonStyles.content}>
            <View
              style={[
                skeletonStyles.line,
                {
                  width: '60%',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
                },
              ]}
            />
            <View
              style={[
                skeletonStyles.line,
                {
                  width: '40%',
                  marginTop: 8,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                },
              ]}
            />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  container: { gap: 12 },
  item: { flexDirection: 'row', padding: 12, borderRadius: 14, alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 14 },
  content: { flex: 1, marginLeft: 12 },
  line: { height: 12, borderRadius: 6 },
});
