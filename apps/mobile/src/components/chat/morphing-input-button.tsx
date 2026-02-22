/**
 * MorphingInputButton Component
 * 
 * Animated button that morphs between send and mic icons based on input state.
 * Matches web parity with AnimatePresence-like transitions.
 * 
 * @module components/chat/MorphingInputButton
 * @since v0.8.2
 */

import React, { memo, useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  Animated,
  StyleSheet,
  ActivityIndicator,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export interface MorphingInputButtonProps {
  /** Whether there is text in the input */
  hasText: boolean;
  /** Whether a message is currently being sent */
  isSending: boolean;
  /** Callback when send button is pressed */
  onSend: () => void;
  /** Callback when mic button is pressed */
  onMic: () => void;
  /** Primary color for send button gradient */
  primaryColor: string;
  /** Secondary surface color for mic button */
  surfaceColor: string;
  /** Text color for mic icon */
  textColor: string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * MorphingInputButton - Animated send/mic toggle with morphing effect
 * 
 * Features:
 * - Smooth scale + rotation transition between icons
 * - Gradient background on send button
 * - Pulse animation on hover state
 * - Loading spinner during send
 * 
 * @example
 * ```tsx
 * <MorphingInputButton
 *   hasText={inputText.trim().length > 0}
 *   isSending={isSending}
 *   onSend={handleSend}
 *   onMic={() => setVoiceMode(true)}
 *   primaryColor={colors.primary}
 *   surfaceColor={colors.surfaceHover}
 *   textColor={colors.textSecondary}
 * />
 * ```
 */
export const MorphingInputButton = memo(function MorphingInputButton({
  hasText,
  isSending,
  onSend,
  onMic,
  primaryColor,
  surfaceColor,
  textColor,
  disabled = false,
}: MorphingInputButtonProps) {
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(hasText ? 0 : 1)).current;
  const opacitySendAnim = useRef(new Animated.Value(hasText ? 1 : 0)).current;
  const opacityMicAnim = useRef(new Animated.Value(hasText ? 0 : 1)).current;

  // Morph animation when hasText changes
  useEffect(() => {
    if (hasText) {
      // Morph to send button
      Animated.parallel([
        // Scale down then up
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
            easing: Easing.out(Easing.quad),
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 200,
            friction: 12,
          }),
        ]),
        // Rotate from -180 to 0
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        // Fade in send icon
        Animated.timing(opacitySendAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        // Fade out mic icon
        Animated.timing(opacityMicAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Morph to mic button
      Animated.parallel([
        // Scale down then up
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
            easing: Easing.out(Easing.quad),
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 200,
            friction: 12,
          }),
        ]),
        // Rotate from 0 to -180
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        // Fade out send icon
        Animated.timing(opacitySendAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        // Fade in mic icon
        Animated.timing(opacityMicAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [hasText, scaleAnim, rotateAnim, opacitySendAnim, opacityMicAnim]);

  // Sending animation (rotate)
  useEffect(() => {
    if (isSending) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: -1, // Reverse rotation
          duration: 500,
          useNativeDriver: true,
          easing: Easing.linear,
        })
      ).start();
    } else {
      rotateAnim.stopAnimation();
      rotateAnim.setValue(hasText ? 0 : 1);
    }
  }, [isSending, rotateAnim, hasText]);

  // Press animation
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 10,
    }).start();
  };

  // Interpolated rotation
  const rotation = rotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['360deg', '0deg', '-180deg'],
  });

  const handlePress = () => {
    if (hasText) {
      onSend();
    } else {
      onMic();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || isSending}
      activeOpacity={1}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.buttonWrapper,
          {
            transform: [{ scale: scaleAnim }, { rotate: rotation }],
          },
        ]}
      >
        {hasText ? (
          // Send button with gradient
          <LinearGradient
            colors={[primaryColor, `${primaryColor}dd`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientButton}
          >
            <Animated.View style={{ opacity: opacitySendAnim }}>
              {isSending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </Animated.View>
          </LinearGradient>
        ) : (
          // Mic button
          <Animated.View
            style={[
              styles.micButton,
              { backgroundColor: surfaceColor, opacity: opacityMicAnim },
            ]}
          >
            <Ionicons name="mic" size={22} color={textColor} />
          </Animated.View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonWrapper: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MorphingInputButton;
