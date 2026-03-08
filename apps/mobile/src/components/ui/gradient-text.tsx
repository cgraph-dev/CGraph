/**
 * Animated gradient text for React Native using MaskedView + LinearGradient.
 * @module components/ui/GradientText
 */
import React, { useEffect } from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  useReducedMotion,
  interpolate,
} from 'react-native-reanimated';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface GradientTextProps {
  children: string;
  /** Enable animation (default true) */
  animated?: boolean;
  /** Custom gradient colors */
  colors?: readonly [string, string, ...string[]];
  /** Text style overrides */
  style?: TextStyle;
  /** Font size (default 24) */
  fontSize?: number;
}

/**
 * Renders text with an animated gradient fill.
 * Uses MaskedView to clip a LinearGradient to text shape.
 */
export default function GradientText({
  children,
  animated = true,
  colors = ['#10b981', '#8b5cf6', '#06b6d4', '#10b981'],
  style,
  fontSize = 24,
}: GradientTextProps) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const shouldAnimate = animated && !reducedMotion;

  useEffect(() => {
    if (!shouldAnimate) return;
    progress.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [shouldAnimate, progress]);

  const animatedGradientStyle = useAnimatedStyle(() => {
    const translateX = interpolate(progress.value, [0, 1], [0, -fontSize * 3]);
    return {
      transform: [{ translateX }],
    };
  });

  return (
    <MaskedView maskElement={<Text style={[styles.text, { fontSize }, style]}>{children}</Text>}>
      <AnimatedLinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          {
            height: fontSize * 1.5,
            width: fontSize * children.length * 1.2,
          },
          shouldAnimate ? animatedGradientStyle : undefined,
        ]}
      />
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  text: {
    fontWeight: '700',
  },
});
