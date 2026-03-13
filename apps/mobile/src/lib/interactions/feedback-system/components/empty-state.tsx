/**
 * EmptyState - Animated empty state component
 */

import { durations } from '@cgraph/animation-constants';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';

import { SPRING_PRESETS } from '../../../animations/animation-library';
import { EmptyStateProps } from '../types';
import { styles } from '../styles';

/**
 * Empty State component.
 *
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  animated = true,
  style,
}: EmptyStateProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const iconFloat = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      opacity.value = withTiming(1, { duration: durations.slower.ms });
      translateY.value = withSpring(0, SPRING_PRESETS.gentle);

      // Floating icon animation
      iconFloat.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: durations.loop.ms, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: durations.loop.ms, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      opacity.value = 1;
      translateY.value = 0;
    }
  }, [animated, opacity, translateY, iconFloat]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: iconFloat.value }],
  }));

  return (
    <Animated.View style={[styles.emptyState, style, containerStyle]}>
      {icon && <Animated.View style={[styles.emptyStateIcon, iconStyle]}>{icon}</Animated.View>}
      {title && <Animated.Text style={styles.emptyStateTitle}>{title}</Animated.Text>}
      {description && (
        <Animated.Text style={styles.emptyStateDescription}>{description}</Animated.Text>
      )}
      {action && <View style={styles.emptyStateAction}>{action}</View>}
    </Animated.View>
  );
}
