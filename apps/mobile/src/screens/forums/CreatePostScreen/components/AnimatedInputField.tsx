/**
 * AnimatedInputField - Animated text input with focus effects
 */

import React, { useRef } from 'react';
import { View, Text, TextInput, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';

import { AnimatedInputProps } from '../types';
import { styles } from '../styles';

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
  const focusAnim = useRef(new Animated.Value(0)).current;
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.spring(focusAnim, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: false,
      }),
      Animated.timing(labelAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleBlur = () => {
    Animated.parallel([
      Animated.spring(focusAnim, {
        toValue: 0,
        friction: 8,
        tension: 100,
        useNativeDriver: false,
      }),
      Animated.timing(labelAnim, {
        toValue: value ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.1)', '#8B5CF6'],
  });

  const labelTranslateY = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const labelScale = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.85],
  });

  const charProgress = maxLength ? (value.length / maxLength) * 100 : 0;
  const isNearLimit = maxLength && value.length > maxLength * 0.9;

  return (
    <Animated.View style={styles.inputContainer}>
      {/* Label */}
      <Animated.View
        style={[
          styles.labelContainer,
          {
            transform: [{ translateY: labelTranslateY }, { scale: labelScale }],
          },
        ]}
      >
        <Text style={styles.inputLabel}>{label}</Text>
      </Animated.View>

      {/* Input wrapper with glow */}
      <View style={styles.inputWrapper}>
        <Animated.View
          style={[
            styles.inputGlow,
            {
              opacity: glowAnim,
            },
          ]}
        />

        <Animated.View
          style={[
            styles.inputBorder,
            {
              borderColor,
              transform: [
                {
                  translateX: shakeAnim.interpolate({
                    inputRange: [-1, 1],
                    outputRange: [-4, 4],
                  }),
                },
              ],
            },
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
