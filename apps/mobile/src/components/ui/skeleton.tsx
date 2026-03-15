/**
 * Skeleton — shimmer loading placeholder using Reanimated.
 * @module components/ui/skeleton
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

type SkeletonShape = 'text' | 'avatar' | 'card' | 'message' | 'thumbnail';

interface SkeletonProps {
  shape?: SkeletonShape;
  /** Width override (default depends on shape) */
  width?: number | string;
  /** Height override (default depends on shape) */
  height?: number;
  /** Repeat count for shape-based skeleton */
  count?: number;
  style?: ViewStyle;
}

function ShimmerBox({
  w,
  h,
  borderRadius = 6,
  style,
}: {
  w: number | string;
  h: number;
  borderRadius?: number;
  style?: ViewStyle;
}) {
  const translateX = useSharedValue(-1);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  }, [translateX]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value * 200 }],
  }));

  return (
    <View
      style={[
        {
           
          width: w as number,
          height: h,
          borderRadius,
          backgroundColor: 'rgba(255,255,255,0.06)',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFillObject, animStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.04)', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    </View>
  );
}

/** Skeleton component. */
export default function Skeleton({
  shape = 'card',
  width,
  height,
  count = 1,
  style,
}: SkeletonProps) {
  const items = Array.from({ length: count });

  return (
    <View style={[{ gap: 12 }, style]}>
      {items.map((_, i) => (
        <SkeletonShape key={i} shape={shape} width={width} height={height} />
      ))}
    </View>
  );
}

function SkeletonShape({
  shape,
  width,
  height,
}: {
  shape: SkeletonShape;
  width?: number | string;
  height?: number;
}) {
  switch (shape) {
    case 'text':
      return (
        <View style={{ gap: 6 }}>
          <ShimmerBox w={width ?? '100%'} h={height ?? 14} />
          <ShimmerBox w="80%" h={height ?? 14} />
          <ShimmerBox w="60%" h={height ?? 14} />
        </View>
      );
    case 'avatar':
      return <ShimmerBox w={40} h={40} borderRadius={20} />;
    case 'card':
      return <ShimmerBox w={width ?? '100%'} h={height ?? 96} borderRadius={12} />;
    case 'message':
      return (
        <View style={{ flexDirection: 'row', gap: 12, paddingVertical: 8 }}>
          <ShimmerBox w={40} h={40} borderRadius={20} />
          <View style={{ flex: 1, gap: 6 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <ShimmerBox w={96} h={14} />
              <ShimmerBox w={56} h={12} />
            </View>
            <ShimmerBox w="100%" h={14} />
            <ShimmerBox w="75%" h={14} />
          </View>
        </View>
      );
    case 'thumbnail':
      return <ShimmerBox w={width ?? '100%'} h={height ?? 160} borderRadius={12} />;
  }
}
