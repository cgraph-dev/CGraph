/**
 * LoadingAnimation - Animated loading indicators
 */

import { durations } from '@cgraph/animation-constants';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';

import { LoadingAnimationProps } from '../types';
import { styles } from '../styles';

// Loading helper components
function LoadingDot({ index, size, color }: { index: number; size: number; color: string }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withDelay(
      index * 150,
      withRepeat(
        withSequence(withTiming(1.5, { duration: durations.slow.ms }), withTiming(1, { duration: durations.slow.ms })),
        -1,
        false
      )
    );
  }, [index, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
}

function LoadingBar({
  index,
  width,
  height,
  color,
}: {
  index: number;
  width: number;
  height: number;
  color: string;
}) {
  const scaleY = useSharedValue(0.4);

  useEffect(() => {
    scaleY.value = withDelay(
      index * 100,
      withRepeat(
        withSequence(withTiming(1, { duration: durations.slow.ms }), withTiming(0.4, { duration: durations.slow.ms })),
        -1,
        false
      )
    );
  }, [index, scaleY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scaleY.value }],
  }));

  return (
    <Animated.View
      style={[{ width, height, borderRadius: width / 2, backgroundColor: color }, animatedStyle]}
    />
  );
}

function PulsingCircle({ size, color }: { size: number; color: string }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.5, { duration: durations.verySlow.ms, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    opacity.value = withRepeat(
      withTiming(0, { duration: durations.verySlow.ms, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
  }, [scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
          animatedStyle,
        ]}
      />
      <View
        style={{
          width: size * 0.6,
          height: size * 0.6,
          borderRadius: size * 0.3,
          backgroundColor: color,
          position: 'absolute',
          top: size * 0.2,
          left: size * 0.2,
        }}
      />
    </View>
  );
}

/**
 *
 */
export function LoadingAnimation({
  visible,
  size = 40,
  color = '#10b981',
  variant = 'spinner',
  style,
}: LoadingAnimationProps) {
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: durations.normal.ms });

      if (variant === 'spinner') {
        rotation.value = withRepeat(
          withTiming(360, { duration: durations.verySlow.ms, easing: Easing.linear }),
          -1,
          false
        );
      }
    } else {
      opacity.value = withTiming(0, { duration: durations.normal.ms });
      cancelAnimation(rotation);
    }

    return () => {
      cancelAnimation(rotation);
    };
  }, [visible, variant, rotation, opacity]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  if (!visible && opacity.value === 0) return null;

  const renderContent = () => {
    switch (variant) {
      case 'spinner':
        return (
          <Animated.View
            style={[
              styles.spinner,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: size / 10,
                borderColor: color,
                borderTopColor: 'transparent',
              },
              spinnerStyle,
            ]}
          />
        );

      case 'dots':
        return (
          <View style={[styles.dotsContainer, { gap: size / 4 }]}>
            {[0, 1, 2].map((i) => (
              <LoadingDot key={i} index={i} size={size / 4} color={color} />
            ))}
          </View>
        );

      case 'pulse':
        return <PulsingCircle size={size} color={color} />;

      case 'bars':
        return (
          <View style={[styles.barsContainer, { gap: size / 8 }]}>
            {[0, 1, 2, 3].map((i) => (
              <LoadingBar key={i} index={i} width={size / 6} height={size} color={color} />
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Animated.View style={[styles.loadingContainer, style, containerStyle]}>
      {renderContent()}
    </Animated.View>
  );
}
