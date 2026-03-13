/**
 * VoiceSearchButton – animated mic button with wave visualiser.
 *
 * @module screens/search/SearchScreen/components/voice-search-button
 */

import { durations } from '@cgraph/animation-constants';
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import type { ThemeColors } from '@/stores';

interface VoiceSearchButtonProps {
  onPress: () => void;
  isListening: boolean;
  colors: ThemeColors;
}

/**
 * Voice Search Button component.
 *
 */
export function VoiceSearchButton({ onPress, isListening, colors }: VoiceSearchButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;
  const waveAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: durations.slow.ms,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: durations.slow.ms,
            useNativeDriver: true,
          }),
        ])
      ).start();

      const createWave = (anim: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, {
              toValue: 1,
              duration: durations.smooth.ms,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.3,
              duration: durations.smooth.ms,
              useNativeDriver: true,
            }),
          ])
        );

      createWave(waveAnim1, 0).start();
      createWave(waveAnim2, 100).start();
      createWave(waveAnim3, 200).start();
    } else {
      scaleAnim.setValue(1);
      waveAnim1.setValue(0);
      waveAnim2.setValue(0);
      waveAnim3.setValue(0);
    }
  }, [isListening, scaleAnim, waveAnim1, waveAnim2, waveAnim3]);

  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      activeOpacity={0.7}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <LinearGradient
          colors={isListening ? ['#ef4444', '#f97316'] : [colors.surface, colors.surface]}
          style={voiceStyles.button}
        >
          {isListening ? (
            <View style={voiceStyles.waveContainer}>
              <Animated.View style={[voiceStyles.wave, { transform: [{ scaleY: waveAnim1 }] }]} />
              <Animated.View style={[voiceStyles.wave, { transform: [{ scaleY: waveAnim2 }] }]} />
              <Animated.View style={[voiceStyles.wave, { transform: [{ scaleY: waveAnim3 }] }]} />
            </View>
          ) : (
            <Ionicons name="mic" size={20} color={colors.textSecondary} />
          )}
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const voiceStyles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  wave: {
    width: 4,
    height: 16,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
});
