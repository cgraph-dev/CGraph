/**
 * HSL slider components for the color picker.
 * @module components/inputs/color-picker/sliders
 */
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import chroma from 'chroma-js';
import { SPRING_PRESETS, getSpringConfig } from '../../../lib/animations/animation-library';
import type { SliderProps } from './types';
import { styles } from './styles';

// ============================================================================
// Hue Slider
// ============================================================================

/** Description. */
/** Hue Slider component. */
export function HueSlider({ value, onChange, width, height, hapticFeedback }: SliderProps) {
  const thumbX = useSharedValue((value / 360) * width);
  const scale = useSharedValue(1);
  const springCfg = getSpringConfig(SPRING_PRESETS.snappy);

  useEffect(() => {
    thumbX.value = withSpring((value / 360) * width, springCfg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, width]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      scale.value = withSpring(1.2, springCfg);
    })
    .onUpdate((event) => {
      'worklet';
      const x = Math.max(0, Math.min(width, event.x));
      thumbX.value = x;
      const hue = (x / width) * 360;
      runOnJS(onChange)(hue);
    })
    .onEnd(() => {
      'worklet';
      scale.value = withSpring(1, springCfg);
      if (hapticFeedback) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      }
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value - height / 2 }, { scale: scale.value }],
  }));

  const hueColors = Array.from({ length: 12 }, (_, i) => chroma.hsl((i / 11) * 360, 1, 0.5).hex());

  return (
    <View style={[styles.slider, { width, height, borderRadius: height / 2 }]}>
      <LinearGradient
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        colors={hueColors as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[StyleSheet.absoluteFill, { borderRadius: height / 2 }]}
      />
      <GestureDetector gesture={panGesture}>
        <Animated.View style={StyleSheet.absoluteFill}>
          <Animated.View
            style={[styles.thumb, { width: height, height, borderRadius: height / 2 }, thumbStyle]}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

// ============================================================================
// Saturation Slider
// ============================================================================

interface SaturationSliderProps extends SliderProps {
  hue: number;
}

/** Description. */
/** Saturation Slider component. */
export function SaturationSlider({
  hue,
  value,
  onChange,
  width,
  height,
  hapticFeedback,
}: SaturationSliderProps) {
  const thumbX = useSharedValue((value / 100) * width);
  const scale = useSharedValue(1);
  const springCfg = getSpringConfig(SPRING_PRESETS.snappy);

  useEffect(() => {
    thumbX.value = withSpring((value / 100) * width, springCfg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, width]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      scale.value = withSpring(1.2, springCfg);
    })
    .onUpdate((event) => {
      'worklet';
      const x = Math.max(0, Math.min(width, event.x));
      thumbX.value = x;
      const saturation = (x / width) * 100;
      runOnJS(onChange)(saturation);
    })
    .onEnd(() => {
      'worklet';
      scale.value = withSpring(1, springCfg);
      if (hapticFeedback) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      }
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value - height / 2 }, { scale: scale.value }],
  }));

  const leftColor = chroma.hsl(hue, 0, 0.5).hex();
  const rightColor = chroma.hsl(hue, 1, 0.5).hex();

  return (
    <View style={[styles.slider, { width, height, borderRadius: height / 2 }]}>
      <LinearGradient
        colors={[leftColor, rightColor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[StyleSheet.absoluteFill, { borderRadius: height / 2 }]}
      />
      <GestureDetector gesture={panGesture}>
        <Animated.View style={StyleSheet.absoluteFill}>
          <Animated.View
            style={[styles.thumb, { width: height, height, borderRadius: height / 2 }, thumbStyle]}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

// ============================================================================
// Lightness Slider
// ============================================================================

interface LightnessSliderProps extends SliderProps {
  hue: number;
  saturation: number;
}

/** Description. */
/** Lightness Slider component. */
export function LightnessSlider({
  hue,
  saturation,
  value,
  onChange,
  width,
  height,
  hapticFeedback,
}: LightnessSliderProps) {
  const thumbX = useSharedValue((value / 100) * width);
  const scale = useSharedValue(1);
  const springCfg = getSpringConfig(SPRING_PRESETS.snappy);

  useEffect(() => {
    thumbX.value = withSpring((value / 100) * width, springCfg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, width]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      scale.value = withSpring(1.2, springCfg);
    })
    .onUpdate((event) => {
      'worklet';
      const x = Math.max(0, Math.min(width, event.x));
      thumbX.value = x;
      const lightness = (x / width) * 100;
      runOnJS(onChange)(lightness);
    })
    .onEnd(() => {
      'worklet';
      scale.value = withSpring(1, springCfg);
      if (hapticFeedback) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      }
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value - height / 2 }, { scale: scale.value }],
  }));

  const leftColor = chroma.hsl(hue, saturation / 100, 0).hex();
  const midColor = chroma.hsl(hue, saturation / 100, 0.5).hex();
  const rightColor = chroma.hsl(hue, saturation / 100, 1).hex();

  return (
    <View style={[styles.slider, { width, height, borderRadius: height / 2 }]}>
      <LinearGradient
        colors={[leftColor, midColor, rightColor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[StyleSheet.absoluteFill, { borderRadius: height / 2 }]}
      />
      <GestureDetector gesture={panGesture}>
        <Animated.View style={StyleSheet.absoluteFill}>
          <Animated.View
            style={[styles.thumb, { width: height, height, borderRadius: height / 2 }, thumbStyle]}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
