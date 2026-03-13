/**
 * Swatch component for the color picker.
 * @module components/inputs/color-picker/swatch
 */
import React, { useCallback } from 'react';
import { Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { SPRING_PRESETS } from '../../../lib/animations/animation-library';
import { styles } from './styles';

interface SwatchProps {
  color: string;
  size: number;
  selected: boolean;
  onPress: () => void;
}

/** Description. */
/** Swatch component. */
export function Swatch({ color, size, selected, onPress }: SwatchProps) {
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.9, SPRING_PRESETS.snappy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_PRESETS.snappy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[
          styles.swatch,
          {
            width: size,
            height: size,
            borderRadius: size / 4,
            backgroundColor: color,
            borderColor: selected ? '#ffffff' : 'transparent',
            borderWidth: selected ? 3 : 0,
          },
          animatedStyle,
        ]}
      />
    </Pressable>
  );
}
