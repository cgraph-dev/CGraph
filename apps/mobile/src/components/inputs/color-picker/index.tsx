/**
 * ColorPicker - HSL Color Picker with Swatches
 * @module components/inputs/color-picker
 */
import React, { useState, useCallback, useEffect } from 'react';
import { View, TextInput } from 'react-native';
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  type ColorPickerProps,
  type HSL,
  DEFAULT_SWATCHES,
  SIZE_CONFIG,
  SCREEN_WIDTH,
} from './types';
import { styles } from './styles';
import { hexToHSL, hslToHex } from './utils';
import { HueSlider, SaturationSlider, LightnessSlider } from './sliders';
import { Swatch } from './swatch';

export type { ColorPickerProps } from './types';

/**
 * HSL Color Picker with swatches, sliders, and hex input.
 */
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

  useEffect(() => {
    const newHSL = hexToHSL(value);
    setHSL(newHSL);
    setInputValue(value);
  }, [value]);

  const updateColor = useCallback(
    (newHSL: HSL) => {
      setHSL(newHSL);
      const hex = hslToHex(newHSL);
      setInputValue(hex);
      onChange(hex);
    },
    [onChange]
  );

  const addToRecentColors = useCallback(
    (color: string) => {
      setRecentColors((prev) => {
        const filtered = prev.filter((c) => c !== color);
        return [color, ...filtered].slice(0, recentColorsCount);
      });
    },
    [recentColorsCount]
  );

  const handleSwatchPress = useCallback(
    (color: string) => {
      if (hapticFeedback) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newHSL = hexToHSL(color);
      updateColor(newHSL);
      addToRecentColors(color);
    },
    [hapticFeedback, updateColor, addToRecentColors]
  );

  const handleInputChange = useCallback(
    (text: string) => {
      setInputValue(text);
      if (/^#[0-9A-Fa-f]{6}$/.test(text)) {
        const newHSL = hexToHSL(text);
        setHSL(newHSL);
        onChange(text);
      }
    },
    [onChange]
  );

  const handleInputSubmit = useCallback(() => {
    const hex = hslToHex(hsl);
    addToRecentColors(hex);
  }, [hsl, addToRecentColors]);

  const currentHex = hslToHex(hsl);

  return (
    <View style={[styles.container, style]}>
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

export default ColorPicker;
