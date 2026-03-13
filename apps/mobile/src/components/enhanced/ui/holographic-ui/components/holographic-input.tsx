/**
 * Holographic-themed text input component with animated focus effects and glowing borders.
 * @module components/enhanced/ui/holographic-ui/HolographicInput
 */
import { durations } from '@cgraph/animation-constants';
import React, { useState, useEffect } from 'react';
import { TextInput, StyleSheet, ViewStyle, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { HolographicConfig, getTheme } from '../types';

interface HolographicInputProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  disabled?: boolean;
  colorTheme?: HolographicConfig['colorTheme'];
  style?: ViewStyle;
}

/**
 * Holographic Input component.
 *
 */
export function HolographicInput({
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  disabled = false,
  colorTheme = 'cyan',
  style,
}: HolographicInputProps) {
  const theme = getTheme(colorTheme);
  const [isFocused, setIsFocused] = useState(false);
  const focusLineWidth = useSharedValue(0);
  const glowIntensity = useSharedValue(0);

  useEffect(() => {
    focusLineWidth.value = withTiming(isFocused ? 1 : 0, { duration: durations.slow.ms });
    glowIntensity.value = withTiming(isFocused ? 1 : 0, { duration: durations.slow.ms });

    if (isFocused) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);

  const containerAnimStyle = useAnimatedStyle(() => ({
    ...(Platform.OS === 'ios'
      ? { shadowRadius: interpolate(glowIntensity.value, [0, 1], [5, 20]) }
      : {}),
  }));

  const focusLineAnimStyle = useAnimatedStyle(() => ({
    width: `${interpolate(focusLineWidth.value, [0, 1], [0, 100])}%`,
  }));

  return (
    <Animated.View
      style={[
        styles.inputContainer,
        {
          borderColor: isFocused ? theme.primary : `${theme.secondary}50`,
          backgroundColor: theme.background,
        },
        Platform.OS === 'ios' && {
          shadowColor: theme.glow,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: isFocused ? 0.6 : 0.2,
        },
        containerAnimStyle,
        style,
      ]}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={`${theme.secondary}80`}
        secureTextEntry={secureTextEntry}
        editable={!disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={[
          styles.textInput,
          {
            color: theme.primary,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      />

      {/* Focus indicator line */}
      <Animated.View
        style={[
          styles.focusLine,
          {
            backgroundColor: theme.accent,
          },
          focusLineAnimStyle,
          Platform.OS === 'ios' && {
            shadowColor: theme.accent,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 10,
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  focusLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
  },
});
