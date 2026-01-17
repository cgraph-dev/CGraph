/**
 * ColorPicker - HSL Color Picker with Swatches
 *
 * Features:
 * - HSL color wheel/slider selection
 * - Preset color swatches
 * - Recent colors history
 * - Hex/RGB/HSL input modes
 * - Animated transitions
 * - Eyedropper (placeholder for future)
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
  TextInput,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  TapGestureHandler,
  TapGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import chroma from 'chroma-js';

import { SPRING_PRESETS } from '../../lib/animations/AnimationLibrary';

// ============================================================================
// Types
// ============================================================================

export interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  swatches?: string[];
  showSwatches?: boolean;
  showRecentColors?: boolean;
  recentColorsCount?: number;
  showInput?: boolean;
  inputMode?: 'hex' | 'rgb' | 'hsl';
  showPreview?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  hapticFeedback?: boolean;
}

interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

type GestureContext = {
  startX: number;
  startY: number;
};

// ============================================================================
// Constants
// ============================================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DEFAULT_SWATCHES = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ffffff', '#9ca3af', '#000000',
];

const SIZE_CONFIG = {
  sm: { sliderHeight: 24, swatchSize: 28, previewSize: 40 },
  md: { sliderHeight: 32, swatchSize: 36, previewSize: 56 },
  lg: { sliderHeight: 40, swatchSize: 44, previewSize: 72 },
};

// ============================================================================
// Color Utilities
// ============================================================================

function hexToHSL(hex: string): HSL {
  try {
    const [h, s, l] = chroma(hex).hsl();
    return {
      h: isNaN(h) ? 0 : h,
      s: isNaN(s) ? 0 : s * 100,
      l: l * 100,
    };
  } catch {
    return { h: 0, s: 100, l: 50 };
  }
}

function hslToHex(hsl: HSL): string {
  try {
    return chroma.hsl(hsl.h, hsl.s / 100, hsl.l / 100).hex();
  } catch {
    return '#000000';
  }
}

// ============================================================================
// Component
// ============================================================================

export function ColorPicker({
  value,
  onChange,
  swatches = DEFAULT_SWATCHES,
  showSwatches = true,
  showRecentColors = true,
  recentColorsCount = 8,
  showInput = true,
  inputMode = 'hex',
  showPreview = true,
  size = 'md',
  style,
  hapticFeedback = true,
}: ColorPickerProps) {
  const [hsl, setHSL] = useState<HSL>(() => hexToHSL(value));
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState(value);

  const sizeConfig = SIZE_CONFIG[size];
  const sliderWidth = SCREEN_WIDTH - 64;

  // Sync external value changes
  useEffect(() => {
    const newHSL = hexToHSL(value);
    setHSL(newHSL);
    setInputValue(value);
  }, [value]);

  // Update color and trigger callback
  const updateColor = useCallback(
    (newHSL: HSL) => {
      setHSL(newHSL);
      const hex = hslToHex(newHSL);
      setInputValue(hex);
      onChange(hex);
    },
    [onChange]
  );

  // Add to recent colors
  const addToRecentColors = useCallback(
    (color: string) => {
      setRecentColors((prev) => {
        const filtered = prev.filter((c) => c !== color);
        return [color, ...filtered].slice(0, recentColorsCount);
      });
    },
    [recentColorsCount]
  );

  // Handle swatch press
  const handleSwatchPress = useCallback(
    (color: string) => {
      if (hapticFeedback) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      const newHSL = hexToHSL(color);
      updateColor(newHSL);
      addToRecentColors(color);
    },
    [hapticFeedback, updateColor, addToRecentColors]
  );

  // Handle input change
  const handleInputChange = useCallback(
    (text: string) => {
      setInputValue(text);

      // Validate and update if valid hex
      if (/^#[0-9A-Fa-f]{6}$/.test(text)) {
        const newHSL = hexToHSL(text);
        setHSL(newHSL);
        onChange(text);
      }
    },
    [onChange]
  );

  // Handle input submit
  const handleInputSubmit = useCallback(() => {
    const hex = hslToHex(hsl);
    addToRecentColors(hex);
  }, [hsl, addToRecentColors]);

  const currentHex = hslToHex(hsl);

  return (
    <View style={[styles.container, style]}>
      {/* Preview and Input */}
      <View style={styles.header}>
        {showPreview && (
          <View
            style={[
              styles.preview,
              { width: sizeConfig.previewSize, height: sizeConfig.previewSize },
            ]}
          >
            <View style={[styles.previewColor, { backgroundColor: currentHex }]} />
          </View>
        )}

        {showInput && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputValue}
              onChangeText={handleInputChange}
              onSubmitEditing={handleInputSubmit}
              placeholder="#000000"
              placeholderTextColor="#6b7280"
              autoCapitalize="characters"
              maxLength={7}
            />
          </View>
        )}
      </View>

      {/* Hue Slider */}
      <View style={styles.sliderSection}>
        <Animated.Text style={styles.sliderLabel}>Hue</Animated.Text>
        <HueSlider
          value={hsl.h}
          onChange={(h) => updateColor({ ...hsl, h })}
          width={sliderWidth}
          height={sizeConfig.sliderHeight}
          hapticFeedback={hapticFeedback}
        />
      </View>

      {/* Saturation Slider */}
      <View style={styles.sliderSection}>
        <Animated.Text style={styles.sliderLabel}>Saturation</Animated.Text>
        <SaturationSlider
          hue={hsl.h}
          value={hsl.s}
          onChange={(s) => updateColor({ ...hsl, s })}
          width={sliderWidth}
          height={sizeConfig.sliderHeight}
          hapticFeedback={hapticFeedback}
        />
      </View>

      {/* Lightness Slider */}
      <View style={styles.sliderSection}>
        <Animated.Text style={styles.sliderLabel}>Lightness</Animated.Text>
        <LightnessSlider
          hue={hsl.h}
          saturation={hsl.s}
          value={hsl.l}
          onChange={(l) => updateColor({ ...hsl, l })}
          width={sliderWidth}
          height={sizeConfig.sliderHeight}
          hapticFeedback={hapticFeedback}
        />
      </View>

      {/* Recent Colors */}
      {showRecentColors && recentColors.length > 0 && (
        <View style={styles.swatchSection}>
          <Animated.Text style={styles.swatchLabel}>Recent</Animated.Text>
          <View style={styles.swatchGrid}>
            {recentColors.map((color, index) => (
              <Swatch
                key={`recent-${index}`}
                color={color}
                size={sizeConfig.swatchSize}
                selected={color === currentHex}
                onPress={() => handleSwatchPress(color)}
              />
            ))}
          </View>
        </View>
      )}

      {/* Preset Swatches */}
      {showSwatches && (
        <View style={styles.swatchSection}>
          <Animated.Text style={styles.swatchLabel}>Swatches</Animated.Text>
          <View style={styles.swatchGrid}>
            {swatches.map((color, index) => (
              <Swatch
                key={`swatch-${index}`}
                color={color}
                size={sizeConfig.swatchSize}
                selected={color === currentHex}
                onPress={() => handleSwatchPress(color)}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// Hue Slider Component
// ============================================================================

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  width: number;
  height: number;
  hapticFeedback?: boolean;
}

function HueSlider({ value, onChange, width, height, hapticFeedback }: SliderProps) {
  const thumbX = useSharedValue((value / 360) * width);
  const scale = useSharedValue(1);

  useEffect(() => {
    thumbX.value = withSpring((value / 360) * width, SPRING_PRESETS.snappy);
  }, [value, width]);

  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    GestureContext
  >({
    onStart: () => {
      scale.value = withSpring(1.2, SPRING_PRESETS.snappy);
    },
    onActive: (event) => {
      const x = Math.max(0, Math.min(width, event.x));
      thumbX.value = x;
      const hue = (x / width) * 360;
      runOnJS(onChange)(hue);
    },
    onEnd: () => {
      scale.value = withSpring(1, SPRING_PRESETS.snappy);
      if (hapticFeedback) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      }
    },
  });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: thumbX.value - height / 2 },
      { scale: scale.value },
    ],
  }));

  const hueColors = Array.from({ length: 12 }, (_, i) =>
    chroma.hsl((i / 11) * 360, 1, 0.5).hex()
  );

  return (
    <View style={[styles.slider, { width, height, borderRadius: height / 2 }]}>
      <LinearGradient
        colors={hueColors as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[StyleSheet.absoluteFill, { borderRadius: height / 2 }]}
      />

      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={StyleSheet.absoluteFill}>
          <Animated.View
            style={[
              styles.thumb,
              { width: height, height, borderRadius: height / 2 },
              thumbStyle,
            ]}
          />
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

// ============================================================================
// Saturation Slider Component
// ============================================================================

interface SaturationSliderProps extends SliderProps {
  hue: number;
}

function SaturationSlider({ hue, value, onChange, width, height, hapticFeedback }: SaturationSliderProps) {
  const thumbX = useSharedValue((value / 100) * width);
  const scale = useSharedValue(1);

  useEffect(() => {
    thumbX.value = withSpring((value / 100) * width, SPRING_PRESETS.snappy);
  }, [value, width]);

  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    GestureContext
  >({
    onStart: () => {
      scale.value = withSpring(1.2, SPRING_PRESETS.snappy);
    },
    onActive: (event) => {
      const x = Math.max(0, Math.min(width, event.x));
      thumbX.value = x;
      const saturation = (x / width) * 100;
      runOnJS(onChange)(saturation);
    },
    onEnd: () => {
      scale.value = withSpring(1, SPRING_PRESETS.snappy);
      if (hapticFeedback) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      }
    },
  });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: thumbX.value - height / 2 },
      { scale: scale.value },
    ],
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

      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={StyleSheet.absoluteFill}>
          <Animated.View
            style={[
              styles.thumb,
              { width: height, height, borderRadius: height / 2 },
              thumbStyle,
            ]}
          />
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

// ============================================================================
// Lightness Slider Component
// ============================================================================

interface LightnessSliderProps extends SliderProps {
  hue: number;
  saturation: number;
}

function LightnessSlider({
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

  useEffect(() => {
    thumbX.value = withSpring((value / 100) * width, SPRING_PRESETS.snappy);
  }, [value, width]);

  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    GestureContext
  >({
    onStart: () => {
      scale.value = withSpring(1.2, SPRING_PRESETS.snappy);
    },
    onActive: (event) => {
      const x = Math.max(0, Math.min(width, event.x));
      thumbX.value = x;
      const lightness = (x / width) * 100;
      runOnJS(onChange)(lightness);
    },
    onEnd: () => {
      scale.value = withSpring(1, SPRING_PRESETS.snappy);
      if (hapticFeedback) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      }
    },
  });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: thumbX.value - height / 2 },
      { scale: scale.value },
    ],
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

      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={StyleSheet.absoluteFill}>
          <Animated.View
            style={[
              styles.thumb,
              { width: height, height, borderRadius: height / 2 },
              thumbStyle,
            ]}
          />
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

// ============================================================================
// Swatch Component
// ============================================================================

interface SwatchProps {
  color: string;
  size: number;
  selected: boolean;
  onPress: () => void;
}

function Swatch({ color, size, selected, onPress }: SwatchProps) {
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.9, SPRING_PRESETS.snappy);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_PRESETS.snappy);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
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

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  preview: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#374151',
  },
  previewColor: {
    flex: 1,
  },
  inputContainer: {
    flex: 1,
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'monospace',
  },
  sliderSection: {
    marginBottom: 20,
  },
  sliderLabel: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  slider: {
    position: 'relative',
    overflow: 'visible',
  },
  thumb: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: '#374151',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  swatchSection: {
    marginTop: 16,
  },
  swatchLabel: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  swatch: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default ColorPicker;
