/**
 * AnimatedInputField - Animated text input with focus effects
 */

import React from 'react';
import { View, Text, TextInput } from 'react-native';
import Animated, { useSharedValue, withTiming, withSpring, useAnimatedStyle, interpolate, interpolateColor } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { AnimatedInputProps } from '../types';
import { styles } from '../styles';

/**
 *
 */
export function AnimatedInputField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  maxLength,
  minHeight,
  showCharCount = false,
}: AnimatedInputProps) {
  const focusAnim = useSharedValue(0);
  const labelAnim = useSharedValue(value ? 1 : 0);
  const glowAnim = useSharedValue(0);
  const shakeAnim = useSharedValue(0);

  const handleFocus = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    focusAnim.value = withSpring(1, { damping: 8, stiffness: 100 });
    labelAnim.value = withTiming(1, { duration: 200 });
    glowAnim.value = withTiming(1, { duration: 300 });
  };

  const handleBlur = () => {
    focusAnim.value = withSpring(0, { damping: 8, stiffness: 100 });
    labelAnim.value = withTiming(value ? 1 : 0, { duration: 200 });
    glowAnim.value = withTiming(0, { duration: 300 });
  };

  const labelAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(labelAnim.value, [0, 1], [0, -8]) },
      { scale: interpolate(labelAnim.value, [0, 1], [1, 0.85]) },
    ],
  }));

  const glowAnimStyle = useAnimatedStyle(() => ({
    opacity: glowAnim.value,
  }));

  const inputBorderAnimStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(focusAnim.value, [0, 1], ['rgba(255,255,255,0.1)', '#8B5CF6']),
    transform: [
      { translateX: interpolate(shakeAnim.value, [-1, 1], [-4, 4]) },
    ],
  }));

  const charProgress = maxLength ? (value.length / maxLength) * 100 : 0;
  const isNearLimit = maxLength && value.length > maxLength * 0.9;

  return (
    <Animated.View style={styles.inputContainer}>
      {/* Label */}
      <Animated.View
        style={[
          styles.labelContainer,
          labelAnimStyle,
        ]}
      >
        <Text style={styles.inputLabel}>{label}</Text>
      </Animated.View>

      {/* Input wrapper with glow */}
      <View style={styles.inputWrapper}>
        <Animated.View
          style={[
            styles.inputGlow,
            glowAnimStyle,
          ]}
        />

        <Animated.View
          style={[
            styles.inputBorder,
            inputBorderAnimStyle,
          ]}
        >
          <TextInput
            style={[
              styles.textInput,
              multiline && { minHeight: minHeight || 150, textAlignVertical: 'top' },
            ]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#6B7280"
            onFocus={handleFocus}
            onBlur={handleBlur}
            multiline={multiline}
            maxLength={maxLength}
          />
        </Animated.View>
      </View>

      {/* Character count */}
      {showCharCount && maxLength && (
        <View style={styles.charCountContainer}>
          <View style={styles.charProgressBar}>
            <Animated.View
              style={[
                styles.charProgressFill,
                {
                  width: `${Math.min(charProgress, 100)}%`,
                  backgroundColor: isNearLimit ? '#EF4444' : '#8B5CF6',
                },
              ]}
            />
          </View>
          <Text style={[styles.charCountText, isNearLimit ? { color: '#EF4444' } : undefined]}>
            {value.length}/{maxLength}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}
