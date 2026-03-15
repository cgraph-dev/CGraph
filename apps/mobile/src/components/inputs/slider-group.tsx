/**
 * SliderGroup - Multi-Slider with Constraints
 *
 * Features:
 * - Single and range sliders
 * - Multiple linked sliders with constraints
 * - Step snapping
 * - Value labels
 * - Animated thumb and track
 * - Haptic feedback at steps
 */

import React, { useCallback, useEffect } from 'react';
import { StyleSheet, View, ViewStyle, StyleProp, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  interpolateColor,
  Extrapolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

import { SPRING_PRESETS, getSpringConfig } from '../../lib/animations/animation-library';

// ============================================================================
// Types
// ============================================================================

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  valueFormatter?: (value: number) => string;
  trackColor?: string;
  activeTrackColor?: string;
  thumbColor?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  hapticFeedback?: boolean;
}

export interface RangeSliderProps {
  values: [number, number];
  onChange: (values: [number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
  minRange?: number; // Minimum distance between thumbs
  label?: string;
  showValues?: boolean;
  valueFormatter?: (value: number) => string;
  trackColor?: string;
  activeTrackColor?: string;
  thumbColor?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  hapticFeedback?: boolean;
}

export interface SliderGroupProps {
  sliders: Array<{
    id: string;
    label: string;
    value: number;
    min?: number;
    max?: number;
    step?: number;
    valueFormatter?: (value: number) => string;
    color?: string;
  }>;
  onChange: (id: string, value: number) => void;
  linked?: boolean; // If true, values must sum to a constant
  linkedSum?: number;
  showValues?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  hapticFeedback?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const SIZE_CONFIG = {
  sm: { trackHeight: 4, thumbSize: 20, fontSize: 12 },
  md: { trackHeight: 6, thumbSize: 28, fontSize: 14 },
  lg: { trackHeight: 8, thumbSize: 36, fontSize: 16 },
};

// ============================================================================
// Single Slider Component
// ============================================================================

/**
 * Slider component.
 *
 */
export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue = true,
  valueFormatter = (v) => v.toFixed(0),
  trackColor = '#374151',
  activeTrackColor = '#10b981',
  thumbColor = '#ffffff',
  disabled = false,
  size = 'md',
  style,
  labelStyle,
  hapticFeedback = true,
}: SliderProps) {
  const sizeConfig = SIZE_CONFIG[size];
  const [trackWidth, setTrackWidth] = React.useState(0);

  const thumbX = useSharedValue(0);
  const scale = useSharedValue(1);
  const lastStepValue = useSharedValue(value);

  // Calculate thumb position from value
  const valueToPosition = useCallback(
    (v: number) => {
      const normalizedValue = (v - min) / (max - min);
      return normalizedValue * (trackWidth - sizeConfig.thumbSize);
    },
    [min, max, trackWidth, sizeConfig.thumbSize]
  );

  // Calculate value from position
  const positionToValue = useCallback(
    (x: number) => {
      const normalizedPosition = x / (trackWidth - sizeConfig.thumbSize);
      const rawValue = normalizedPosition * (max - min) + min;
      const steppedValue = Math.round(rawValue / step) * step;
      return Math.max(min, Math.min(max, steppedValue));
    },
    [min, max, step, trackWidth, sizeConfig.thumbSize]
  );

  // Sync thumb position with value
  useEffect(() => {
    if (trackWidth > 0) {
      thumbX.value = withSpring(valueToPosition(value), getSpringConfig(SPRING_PRESETS.snappy));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, trackWidth, valueToPosition]);

  // Trigger haptic on step change
  const triggerStepHaptic = useCallback(
    (newValue: number) => {
      if (hapticFeedback && newValue !== lastStepValue.value) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        lastStepValue.value = newValue;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hapticFeedback]
  );

  const gestureContext = useSharedValue({ startX: 0 });
  const springCfg = getSpringConfig(SPRING_PRESETS.snappy);

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .onStart(() => {
      'worklet';
      gestureContext.value = { startX: thumbX.value };
      scale.value = withSpring(1.15, springCfg);
    })
    .onUpdate((event) => {
      'worklet';
      if (disabled) return;

      const maxX = trackWidth - sizeConfig.thumbSize;
      const newX = Math.max(0, Math.min(maxX, gestureContext.value.startX + event.translationX));
      thumbX.value = newX;

      const newValue = positionToValue(newX);
      runOnJS(triggerStepHaptic)(newValue);
      runOnJS(onChange)(newValue);
    })
    .onEnd(() => {
      'worklet';
      scale.value = withSpring(1, springCfg);
    });

  // Animated styles
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value }, { scale: scale.value }],
  }));

  const activeTrackStyle = useAnimatedStyle(() => ({
    width: thumbX.value + sizeConfig.thumbSize / 2,
  }));

  const handleLayout = useCallback((event: { nativeEvent: { layout: { width: number } } }) => {
    setTrackWidth(event.nativeEvent.layout.width);
  }, []);

  return (
    <View style={[styles.sliderContainer, style]}>
      {/* Header */}
      {(label || showValue) && (
        <View style={styles.sliderHeader}>
          {label && (
            <Animated.Text
              style={[styles.sliderLabel, { fontSize: sizeConfig.fontSize }, labelStyle]}
            >
              {label}
            </Animated.Text>
          )}
          {showValue && (
            <Animated.Text style={[styles.sliderValue, { fontSize: sizeConfig.fontSize }]}>
              {valueFormatter(value)}
            </Animated.Text>
          )}
        </View>
      )}

      {/* Track */}
      <View
        style={[
          styles.track,
          {
            height: sizeConfig.trackHeight,
            backgroundColor: trackColor,
            borderRadius: sizeConfig.trackHeight / 2,
          },
        ]}
        onLayout={handleLayout}
      >
        {/* Active Track */}
        <Animated.View
          style={[
            styles.activeTrack,
            {
              height: sizeConfig.trackHeight,
              backgroundColor: activeTrackColor,
              borderRadius: sizeConfig.trackHeight / 2,
            },
            activeTrackStyle,
          ]}
        />

        {/* Thumb */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.thumb,
              {
                width: sizeConfig.thumbSize,
                height: sizeConfig.thumbSize,
                borderRadius: sizeConfig.thumbSize / 2,
                backgroundColor: thumbColor,
                top: -(sizeConfig.thumbSize - sizeConfig.trackHeight) / 2,
              },
              thumbStyle,
              disabled && styles.disabledThumb,
            ]}
          />
        </GestureDetector>
      </View>
    </View>
  );
}

// ============================================================================
// Range Slider Component
// ============================================================================

/**
 * Range Slider component.
 *
 */
export function RangeSlider({
  values,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  minRange = 0,
  label,
  showValues = true,
  valueFormatter = (v) => v.toFixed(0),
  trackColor = '#374151',
  activeTrackColor = '#10b981',
  thumbColor = '#ffffff',
  disabled = false,
  size = 'md',
  style,
  hapticFeedback = true,
}: RangeSliderProps) {
  const sizeConfig = SIZE_CONFIG[size];
  const [trackWidth, setTrackWidth] = React.useState(0);

  const thumbX1 = useSharedValue(0);
  const thumbX2 = useSharedValue(0);
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);

  const valueToPosition = useCallback(
    (v: number) => {
      const normalizedValue = (v - min) / (max - min);
      return normalizedValue * (trackWidth - sizeConfig.thumbSize);
    },
    [min, max, trackWidth, sizeConfig.thumbSize]
  );

  const positionToValue = useCallback(
    (x: number) => {
      const normalizedPosition = x / (trackWidth - sizeConfig.thumbSize);
      const rawValue = normalizedPosition * (max - min) + min;
      const steppedValue = Math.round(rawValue / step) * step;
      return Math.max(min, Math.min(max, steppedValue));
    },
    [min, max, step, trackWidth, sizeConfig.thumbSize]
  );

  // Sync positions
  useEffect(() => {
    if (trackWidth > 0) {
      const springCfg = getSpringConfig(SPRING_PRESETS.snappy);
      thumbX1.value = withSpring(valueToPosition(values[0]), springCfg);
      thumbX2.value = withSpring(valueToPosition(values[1]), springCfg);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, trackWidth, valueToPosition]);

  const gestureContext1 = useSharedValue({ startX: 0 });
  const gestureContext2 = useSharedValue({ startX: 0 });
  const springCfg = getSpringConfig(SPRING_PRESETS.snappy);

  // Gesture handler for thumb 1 (left)
  const panGesture1 = Gesture.Pan()
    .enabled(!disabled)
    .onStart(() => {
      'worklet';
      gestureContext1.value = { startX: thumbX1.value };
      scale1.value = withSpring(1.15, springCfg);
    })
    .onUpdate((event) => {
      'worklet';
      if (disabled) return;

      const maxX = trackWidth - sizeConfig.thumbSize;
      const otherThumbX = thumbX2.value;
      const minRangePixels = (minRange / (max - min)) * maxX;

      let newX = gestureContext1.value.startX + event.translationX;

      // Left thumb - constrained by right thumb
      const maxAllowedX = otherThumbX - minRangePixels;
      newX = Math.max(0, Math.min(maxAllowedX, newX));
      thumbX1.value = newX;

      const value1 = positionToValue(newX);
      const value2 = positionToValue(thumbX2.value);

       
      runOnJS(onChange)([value1, value2] as [number, number]);

      if (hapticFeedback) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      }
    })
    .onEnd(() => {
      'worklet';
      scale1.value = withSpring(1, springCfg);
    });

  // Gesture handler for thumb 2 (right)
  const panGesture2 = Gesture.Pan()
    .enabled(!disabled)
    .onStart(() => {
      'worklet';
      gestureContext2.value = { startX: thumbX2.value };
      scale2.value = withSpring(1.15, springCfg);
    })
    .onUpdate((event) => {
      'worklet';
      if (disabled) return;

      const maxX = trackWidth - sizeConfig.thumbSize;
      const minRangePixels = (minRange / (max - min)) * maxX;

      let newX = gestureContext2.value.startX + event.translationX;

      // Right thumb - constrained by left thumb
      const minAllowedX = thumbX1.value + minRangePixels;
      newX = Math.max(minAllowedX, Math.min(maxX, newX));
      thumbX2.value = newX;

      const value1 = positionToValue(thumbX1.value);
      const value2 = positionToValue(newX);

       
      runOnJS(onChange)([value1, value2] as [number, number]);

      if (hapticFeedback) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      }
    })
    .onEnd(() => {
      'worklet';
      scale2.value = withSpring(1, springCfg);
    });

  const thumbStyle1 = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX1.value }, { scale: scale1.value }],
  }));

  const thumbStyle2 = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX2.value }, { scale: scale2.value }],
  }));

  const activeTrackStyle = useAnimatedStyle(() => ({
    left: thumbX1.value + sizeConfig.thumbSize / 2,
    width: thumbX2.value - thumbX1.value,
  }));

  const handleLayout = useCallback((event: { nativeEvent: { layout: { width: number } } }) => {
    setTrackWidth(event.nativeEvent.layout.width);
  }, []);

  return (
    <View style={[styles.sliderContainer, style]}>
      {/* Header */}
      {(label || showValues) && (
        <View style={styles.sliderHeader}>
          {label && (
            <Animated.Text style={[styles.sliderLabel, { fontSize: sizeConfig.fontSize }]}>
              {label}
            </Animated.Text>
          )}
          {showValues && (
            <Animated.Text style={[styles.sliderValue, { fontSize: sizeConfig.fontSize }]}>
              {valueFormatter(values[0])} - {valueFormatter(values[1])}
            </Animated.Text>
          )}
        </View>
      )}

      {/* Track */}
      <View
        style={[
          styles.track,
          {
            height: sizeConfig.trackHeight,
            backgroundColor: trackColor,
            borderRadius: sizeConfig.trackHeight / 2,
          },
        ]}
        onLayout={handleLayout}
      >
        {/* Active Track */}
        <Animated.View
          style={[
            styles.activeTrack,
            {
              height: sizeConfig.trackHeight,
              backgroundColor: activeTrackColor,
              borderRadius: sizeConfig.trackHeight / 2,
              position: 'absolute',
            },
            activeTrackStyle,
          ]}
        />

        {/* Left Thumb */}
        <GestureDetector gesture={panGesture1}>
          <Animated.View
            style={[
              styles.thumb,
              {
                width: sizeConfig.thumbSize,
                height: sizeConfig.thumbSize,
                borderRadius: sizeConfig.thumbSize / 2,
                backgroundColor: thumbColor,
                top: -(sizeConfig.thumbSize - sizeConfig.trackHeight) / 2,
                zIndex: 2,
              },
              thumbStyle1,
            ]}
          />
        </GestureDetector>

        {/* Right Thumb */}
        <GestureDetector gesture={panGesture2}>
          <Animated.View
            style={[
              styles.thumb,
              {
                width: sizeConfig.thumbSize,
                height: sizeConfig.thumbSize,
                borderRadius: sizeConfig.thumbSize / 2,
                backgroundColor: thumbColor,
                top: -(sizeConfig.thumbSize - sizeConfig.trackHeight) / 2,
                zIndex: 2,
              },
              thumbStyle2,
            ]}
          />
        </GestureDetector>
      </View>
    </View>
  );
}

// ============================================================================
// Slider Group Component
// ============================================================================

/**
 * Slider Group component.
 *
 */
export function SliderGroup({
  sliders,
  onChange,
  linked = false,
  linkedSum,
  showValues = true,
  size = 'md',
  style,
  hapticFeedback = true,
}: SliderGroupProps) {
  const handleSliderChange = useCallback(
    (id: string, newValue: number) => {
      if (linked && linkedSum !== undefined) {
        // Redistribute values among other sliders
        const currentSlider = sliders.find((s) => s.id === id);
        if (!currentSlider) return;

        const _currentTotal = sliders.reduce((sum, s) => sum + s.value, 0);
        const diff = newValue - currentSlider.value;
        const otherSliders = sliders.filter((s) => s.id !== id);
        const otherTotal = otherSliders.reduce((sum, s) => sum + s.value, 0);

        // Redistribute proportionally
        if (otherTotal > 0) {
          otherSliders.forEach((s) => {
            const proportion = s.value / otherTotal;
            const adjustment = diff * proportion;
            const adjustedValue = Math.max(s.min || 0, s.value - adjustment);
            onChange(s.id, adjustedValue);
          });
        }
      }

      onChange(id, newValue);
    },
    [sliders, linked, linkedSum, onChange]
  );

  return (
    <View style={[styles.groupContainer, style]}>
      {sliders.map((slider) => (
        <Slider
          key={slider.id}
          value={slider.value}
          onChange={(v) => handleSliderChange(slider.id, v)}
          min={slider.min}
          max={slider.max}
          step={slider.step}
          label={slider.label}
          showValue={showValues}
          valueFormatter={slider.valueFormatter}
          activeTrackColor={slider.color}
          size={size}
          hapticFeedback={hapticFeedback}
          style={styles.groupSlider}
        />
      ))}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  sliderContainer: {
    marginVertical: 8,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sliderLabel: {
    color: '#e5e7eb',
    fontWeight: '500',
  },
  sliderValue: {
    color: '#9ca3af',
    fontVariant: ['tabular-nums'],
  },
  track: {
    position: 'relative',
    overflow: 'visible',
  },
  activeTrack: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  thumb: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#374151',
  },
  disabledThumb: {
    backgroundColor: '#6b7280',
    borderColor: '#4b5563',
  },
  groupContainer: {
    gap: 16,
  },
  groupSlider: {
    marginVertical: 0,
  },
});

export default Slider;
