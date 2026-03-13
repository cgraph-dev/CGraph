/**
 * Floating orbs animation component for the who's online screen.
 * @module screens/community/whos-online-screen/components/floating-orbs
 */
import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OrbData {
  color: string;
  size: number;
  initialX: number;
  initialY: number;
  initialScale: number;
  initialOpacity: number;
  targetX1: number;
  targetY1: number;
  targetX2: number;
  targetY2: number;
  targetScale1: number;
  targetScale2: number;
  targetOpacity1: number;
  targetOpacity2: number;
  duration: number;
}

function Orb({ data, index }: { data: OrbData; index: number }) {
  const x = useSharedValue(data.initialX);
  const y = useSharedValue(data.initialY);
  const scale = useSharedValue(data.initialScale);
  const opacity = useSharedValue(data.initialOpacity);

  useEffect(() => {
    const d = data.duration;
    x.value = withDelay(
      index * 500,
      withRepeat(
        withSequence(
          withTiming(data.targetX1, { duration: d, easing: Easing.inOut(Easing.sin) }),
          withTiming(data.targetX2, { duration: d, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );
    y.value = withDelay(
      index * 500,
      withRepeat(
        withSequence(
          withTiming(data.targetY1, { duration: d, easing: Easing.inOut(Easing.sin) }),
          withTiming(data.targetY2, { duration: d, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );
    scale.value = withDelay(
      index * 500,
      withRepeat(
        withSequence(
          withTiming(data.targetScale1, { duration: d / 2, easing: Easing.inOut(Easing.sin) }),
          withTiming(data.targetScale2, { duration: d / 2, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );
    opacity.value = withDelay(
      index * 500,
      withRepeat(
        withSequence(
          withTiming(data.targetOpacity1, { duration: d / 2 }),
          withTiming(data.targetOpacity2, { duration: d / 2 })
        ),
        -1,
        true
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.orb,
        {
          width: data.size,
          height: data.size,
          borderRadius: data.size / 2,
          backgroundColor: data.color,
        },
        animatedStyle,
      ]}
    />
  );
}

/**
 * FloatingOrbs - Animated background orbs for visual effect
 * Renders 8 floating orbs with randomized positions, sizes, and colors
 */
export function FloatingOrbs() {
  const orbsData = useMemo<OrbData[]>(
    () =>
      Array.from({ length: 8 }, (_, i) => {
        const size = 60 + Math.random() * 100;
        return {
          color: ['#10b981', '#8b5cf6', '#3b82f6', '#ec4899'][i % 4],
          size,
          initialX: Math.random() * SCREEN_WIDTH,
          initialY: Math.random() * SCREEN_HEIGHT * 0.6,
          initialScale: 0.5 + Math.random() * 0.5,
          initialOpacity: 0.1 + Math.random() * 0.2,
          targetX1: Math.random() * (SCREEN_WIDTH - size),
          targetY1: Math.random() * (SCREEN_HEIGHT * 0.5),
          targetX2: Math.random() * (SCREEN_WIDTH - size),
          targetY2: Math.random() * (SCREEN_HEIGHT * 0.5),
          targetScale1: 0.6 + Math.random() * 0.6,
          targetScale2: 0.4 + Math.random() * 0.4,
          targetOpacity1: 0.2 + Math.random() * 0.15,
          targetOpacity2: 0.1 + Math.random() * 0.1,
          duration: 8000 + Math.random() * 6000,
        };
      }),
    []
  );

  return (
    <View style={styles.orbsContainer} pointerEvents="none">
      {orbsData.map((data, index) => (
        <Orb key={index} data={data} index={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  orbsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
  },
});
