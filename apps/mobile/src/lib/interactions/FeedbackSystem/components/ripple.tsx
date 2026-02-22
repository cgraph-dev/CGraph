/**
 * Ripple - Ripple effect component
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, GestureResponderEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { RippleProps } from '../types';
import { styles } from '../styles';

// Ripple circle helper
function RippleCircle({
  x,
  y,
  color,
  duration,
}: {
  x: number;
  y: number;
  color: string;
  duration: number;
}) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withTiming(4, { duration, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(0, { duration, easing: Easing.out(Easing.cubic) });
  }, [duration, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x - 25 }, { translateY: y - 25 }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.rippleCircle, { backgroundColor: color }, animatedStyle]} />;
}

export function Ripple({
  color = 'rgba(255, 255, 255, 0.3)',
  duration = 600,
  style,
  children,
  onPress,
}: RippleProps) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const rippleIdRef = React.useRef(0);

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      const { locationX, locationY } = event.nativeEvent;

      const newRipple = {
        id: rippleIdRef.current++,
        x: locationX,
        y: locationY,
      };

      setRipples((prev) => [...prev, newRipple]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, duration);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress?.();
    },
    [duration, onPress]
  );

  return (
    <Pressable onPress={handlePress} style={[styles.rippleContainer, style]}>
      {children}
      {ripples.map((ripple) => (
        <RippleCircle key={ripple.id} x={ripple.x} y={ripple.y} color={color} duration={duration} />
      ))}
    </Pressable>
  );
}
