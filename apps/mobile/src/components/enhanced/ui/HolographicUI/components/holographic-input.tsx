import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, Animated, StyleSheet, ViewStyle, Platform } from 'react-native';
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
  const focusLineWidth = useRef(new Animated.Value(0)).current;
  const glowIntensity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(focusLineWidth, {
        toValue: isFocused ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(glowIntensity, {
        toValue: isFocused ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();

    if (isFocused) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [isFocused]);

  const lineWidthPercent = focusLineWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const shadowRadius = glowIntensity.interpolate({
    inputRange: [0, 1],
    outputRange: [5, 20],
  });

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
          shadowRadius,
        },
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
            width: lineWidthPercent,
            backgroundColor: theme.accent,
          },
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
