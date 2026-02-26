/**
 * AnimatedResultItem – slide-in wrapper for search result rows.
 *
 * @module screens/search/SearchScreen/components/animated-result-item
 */

import { durations } from '@cgraph/animation-constants';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AnimatedResultItemProps {
  children: React.ReactNode;
  index: number;
  onPress: () => void;
}

/**
 *
 */
export function AnimatedResultItem({ children, index, onPress }: AnimatedResultItemProps) {
  const translateX = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const delay = index * 80;
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: durations.smooth.ms,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.2)),
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: durations.slow.ms,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: durations.smooth.ms,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.1)),
      }),
    ]).start();
  }, [index, translateX, opacity, scale]);

  return (
    <Animated.View
      style={{
        transform: [{ translateX }, { scale }],
        opacity,
      }}
    >
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        activeOpacity={0.8}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}
