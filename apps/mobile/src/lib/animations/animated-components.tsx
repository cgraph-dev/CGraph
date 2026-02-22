/**
 * AnimatedComponents - Pre-built Animated Components using Reanimated
 *
 * Features:
 * - AnimatedView with entrance/exit presets
 * - AnimatedText with character-by-character animation
 * - AnimatedList with stagger support
 * - AnimatedButton with press feedback
 * - AnimatedImage with loading effects
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ImageStyle,
  StyleProp,
  ImageSourcePropType,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  FadeIn,
  FadeOut,
  FadeInUp,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  FadeOutUp,
  FadeOutDown,
  FadeOutLeft,
  FadeOutRight,
  SlideInUp,
  SlideInDown,
  SlideInLeft,
  SlideInRight,
  SlideOutUp,
  SlideOutDown,
  SlideOutLeft,
  SlideOutRight,
  ZoomIn,
  ZoomOut,
  BounceIn,
  BounceOut,
  FlipInXUp,
  FlipInXDown,
  FlipInYLeft,
  FlipInYRight,
  FlipOutXUp,
  FlipOutXDown,
  FlipOutYLeft,
  FlipOutYRight,
  RotateInDownLeft,
  RotateInDownRight,
  RotateInUpLeft,
  RotateInUpRight,
  RotateOutDownLeft,
  RotateOutDownRight,
  RotateOutUpLeft,
  RotateOutUpRight,
  Layout,
  LinearTransition,
  SequencedTransition,
  FadingTransition,
  JumpingTransition,
  CurvedTransition,
  EntryExitTransition,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { SPRING_PRESETS, LOOP_ANIMATIONS } from './animation-library';

// ============================================================================
// Entering/Exiting Animation Presets
// ============================================================================

const ENTERING_PRESETS = {
  fadeIn: FadeIn,
  fadeInUp: FadeInUp,
  fadeInDown: FadeInDown,
  fadeInLeft: FadeInLeft,
  fadeInRight: FadeInRight,
  slideInUp: SlideInUp,
  slideInDown: SlideInDown,
  slideInLeft: SlideInLeft,
  slideInRight: SlideInRight,
  zoomIn: ZoomIn,
  bounceIn: BounceIn,
  flipInXUp: FlipInXUp,
  flipInXDown: FlipInXDown,
  flipInYLeft: FlipInYLeft,
  flipInYRight: FlipInYRight,
  rotateInDownLeft: RotateInDownLeft,
  rotateInDownRight: RotateInDownRight,
  rotateInUpLeft: RotateInUpLeft,
  rotateInUpRight: RotateInUpRight,
};

const EXITING_PRESETS = {
  fadeOut: FadeOut,
  fadeOutUp: FadeOutUp,
  fadeOutDown: FadeOutDown,
  fadeOutLeft: FadeOutLeft,
  fadeOutRight: FadeOutRight,
  slideOutUp: SlideOutUp,
  slideOutDown: SlideOutDown,
  slideOutLeft: SlideOutLeft,
  slideOutRight: SlideOutRight,
  zoomOut: ZoomOut,
  bounceOut: BounceOut,
  flipOutXUp: FlipOutXUp,
  flipOutXDown: FlipOutXDown,
  flipOutYLeft: FlipOutYLeft,
  flipOutYRight: FlipOutYRight,
  rotateOutDownLeft: RotateOutDownLeft,
  rotateOutDownRight: RotateOutDownRight,
  rotateOutUpLeft: RotateOutUpLeft,
  rotateOutUpRight: RotateOutUpRight,
};

const LAYOUT_PRESETS = {
  default: Layout,
  linear: LinearTransition,
  sequenced: SequencedTransition,
  fading: FadingTransition,
  jumping: JumpingTransition,
  curved: CurvedTransition,
  entryExit: EntryExitTransition,
};

// ============================================================================
// AnimatedView Component
// ============================================================================

export interface AnimatedViewProps {
  children: React.ReactNode;
  entering?: keyof typeof ENTERING_PRESETS;
  exiting?: keyof typeof EXITING_PRESETS;
  layout?: keyof typeof LAYOUT_PRESETS;
  delay?: number;
  duration?: number;
  springConfig?: keyof typeof SPRING_PRESETS;
  style?: StyleProp<ViewStyle>;
  loop?: keyof typeof LOOP_ANIMATIONS;
  onAnimationComplete?: () => void;
}

export function AnimatedView({
  children,
  entering = 'fadeIn',
  exiting = 'fadeOut',
  layout = 'default',
  delay = 0,
  duration = 300,
  springConfig = 'default',
  style,
  loop,
  onAnimationComplete,
}: AnimatedViewProps) {
  const EnteringAnimation = ENTERING_PRESETS[entering];
  const ExitingAnimation = EXITING_PRESETS[exiting];
  const LayoutAnimation = LAYOUT_PRESETS[layout];
  const spring = SPRING_PRESETS[springConfig];

  // Loop animation values
  const loopProgress = useSharedValue(0);

  useEffect(() => {
    if (loop && LOOP_ANIMATIONS[loop]) {
      const loopConfig = LOOP_ANIMATIONS[loop];
      loopProgress.value = withRepeat(withTiming(1, { duration: loopConfig.duration }), -1, true);
    }
  }, [loop]);

  const loopStyle = useAnimatedStyle(() => {
    if (!loop || !LOOP_ANIMATIONS[loop]) return {};

    const loopConfig = LOOP_ANIMATIONS[loop];
    const keyframes = loopConfig.keyframes;
    const step = loopProgress.value * (keyframes.length - 1);
    const currentIndex = Math.floor(step);
    const nextIndex = Math.min(currentIndex + 1, keyframes.length - 1);
    const progress = step - currentIndex;

    const current = keyframes[currentIndex] || {};
    const next = keyframes[nextIndex] || {};

    const result: ViewStyle = {
      transform: [],
    };

    // Interpolate numeric values
    if ('scale' in current && 'scale' in next) {
      const scale = interpolate(
        progress,
        [0, 1],
        [current.scale as number, next.scale as number],
        Extrapolation.CLAMP
      );
      (result.transform as unknown[]).push({ scale });
    }

    if ('translateX' in current && 'translateX' in next) {
      const translateX = interpolate(
        progress,
        [0, 1],
        [current.translateX as number, next.translateX as number],
        Extrapolation.CLAMP
      );
      (result.transform as unknown[]).push({ translateX });
    }

    if ('translateY' in current && 'translateY' in next) {
      const translateY = interpolate(
        progress,
        [0, 1],
        [current.translateY as number, next.translateY as number],
        Extrapolation.CLAMP
      );
      (result.transform as unknown[]).push({ translateY });
    }

    if ('opacity' in current && 'opacity' in next) {
      result.opacity = interpolate(
        progress,
        [0, 1],
        [current.opacity as number, next.opacity as number],
        Extrapolation.CLAMP
      );
    }

    return result;
  });

  // Configure animations - use springify only if available
  const enteringConfig = EnteringAnimation.delay(delay).duration(duration);

  const exitingConfig = ExitingAnimation.duration(duration);

  return (
    <Animated.View
      entering={enteringConfig}
      exiting={exitingConfig}
      layout={Layout}
      style={[style, loop ? loopStyle : undefined]}
    >
      {children}
    </Animated.View>
  );
}

// ============================================================================
// AnimatedText Component
// ============================================================================

export interface AnimatedTextProps {
  children: string;
  style?: StyleProp<TextStyle>;
  entering?: keyof typeof ENTERING_PRESETS;
  delay?: number;
  staggerDelay?: number;
  characterAnimation?: boolean;
}

export function AnimatedText({
  children,
  style,
  entering = 'fadeInUp',
  delay = 0,
  staggerDelay = 30,
  characterAnimation = false,
}: AnimatedTextProps) {
  const EnteringAnimation = ENTERING_PRESETS[entering];

  if (characterAnimation) {
    const characters = children.split('');

    return (
      <View style={styles.textRow}>
        {characters.map((char, index) => (
          <Animated.Text
            key={`${char}-${index}`}
            entering={EnteringAnimation.delay(delay + index * staggerDelay).duration(300)}
            style={style}
          >
            {char === ' ' ? '\u00A0' : char}
          </Animated.Text>
        ))}
      </View>
    );
  }

  return (
    <Animated.Text entering={EnteringAnimation.delay(delay).duration(300)} style={style}>
      {children}
    </Animated.Text>
  );
}

// ============================================================================
// AnimatedButton Component
// ============================================================================

export interface AnimatedButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  pressStyle?: 'scale' | 'opacity' | 'glow' | 'bounce';
  hapticFeedback?: boolean;
  disabled?: boolean;
}

export function AnimatedButton({
  children,
  onPress,
  onLongPress,
  style,
  pressStyle = 'scale',
  hapticFeedback = true,
  disabled = false,
}: AnimatedButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const triggerHaptic = useCallback(() => {
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [hapticFeedback]);

  const handlePressIn = useCallback(() => {
    if (disabled) return;

    switch (pressStyle) {
      case 'scale':
        scale.value = withSpring(0.95, SPRING_PRESETS.snappy);
        break;
      case 'opacity':
        opacity.value = withTiming(0.7, { duration: 100 });
        break;
      case 'bounce':
        scale.value = withSequence(
          withSpring(0.9, SPRING_PRESETS.snappy),
          withSpring(1.05, SPRING_PRESETS.bouncy),
          withSpring(1, SPRING_PRESETS.default)
        );
        break;
      case 'glow':
        scale.value = withSpring(1.02, SPRING_PRESETS.snappy);
        break;
    }

    runOnJS(triggerHaptic)();
  }, [pressStyle, disabled, triggerHaptic]);

  const handlePressOut = useCallback(() => {
    if (disabled) return;

    switch (pressStyle) {
      case 'scale':
      case 'bounce':
      case 'glow':
        scale.value = withSpring(1, SPRING_PRESETS.default);
        break;
      case 'opacity':
        opacity.value = withTiming(1, { duration: 100 });
        break;
    }
  }, [pressStyle, disabled]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View style={[style, animatedStyle, disabled && styles.disabled]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ============================================================================
// AnimatedList Component
// ============================================================================

export interface AnimatedListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  entering?: keyof typeof ENTERING_PRESETS;
  staggerDelay?: number;
  style?: StyleProp<ViewStyle>;
  itemStyle?: StyleProp<ViewStyle>;
}

export function AnimatedList<T>({
  data,
  renderItem,
  keyExtractor,
  entering = 'fadeInUp',
  staggerDelay = 50,
  style,
  itemStyle,
}: AnimatedListProps<T>) {
  const EnteringAnimation = ENTERING_PRESETS[entering];

  return (
    <View style={style}>
      {data.map((item, index) => (
        <Animated.View
          key={keyExtractor(item, index)}
          entering={EnteringAnimation.delay(index * staggerDelay).duration(300)}
          layout={Layout.springify()}
          style={itemStyle}
        >
          {renderItem(item, index)}
        </Animated.View>
      ))}
    </View>
  );
}

// ============================================================================
// AnimatedImage Component
// ============================================================================

export interface AnimatedImageProps {
  source: ImageSourcePropType;
  style?: StyleProp<ImageStyle>;
  entering?: keyof typeof ENTERING_PRESETS;
  delay?: number;
  loadingEffect?: 'fade' | 'blur' | 'shimmer';
}

export function AnimatedImage({
  source,
  style,
  entering = 'fadeIn',
  delay = 0,
  loadingEffect = 'fade',
}: AnimatedImageProps) {
  const EnteringAnimation = ENTERING_PRESETS[entering];
  const loadProgress = useSharedValue(0);
  const shimmerPosition = useSharedValue(0);

  useEffect(() => {
    loadProgress.value = withTiming(1, { duration: 500 });

    if (loadingEffect === 'shimmer') {
      shimmerPosition.value = withRepeat(withTiming(1, { duration: 1000 }), -1, false);
    }
  }, [loadingEffect]);

  const loadingStyle = useAnimatedStyle(() => {
    switch (loadingEffect) {
      case 'fade':
        return { opacity: loadProgress.value };
      case 'blur':
        return { opacity: loadProgress.value };
      case 'shimmer':
        return {
          opacity: interpolate(shimmerPosition.value, [0, 0.5, 1], [0.5, 1, 0.5]),
        };
      default:
        return {};
    }
  });

  return (
    <Animated.View entering={EnteringAnimation.delay(delay).duration(300)} style={loadingStyle}>
      <Image source={source} style={style} />
    </Animated.View>
  );
}

// ============================================================================
// AnimatedCounter Component
// ============================================================================

export interface AnimatedCounterProps {
  value: number;
  duration?: number;
  style?: StyleProp<TextStyle>;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function AnimatedCounter({
  value,
  duration = 1000,
  style,
  prefix = '',
  suffix = '',
  decimals = 0,
}: AnimatedCounterProps) {
  const animatedValue = useSharedValue(0);
  const [displayValue, setDisplayValue] = React.useState(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, { duration });
  }, [value, duration]);

  useEffect(() => {
    const interval = setInterval(() => {
      const current = animatedValue.value;
      setDisplayValue(current);
    }, 16);

    return () => clearInterval(interval);
  }, []);

  const formattedValue =
    decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue).toString();

  return (
    <Text style={style}>
      {prefix}
      {formattedValue}
      {suffix}
    </Text>
  );
}

// ============================================================================
// AnimatedProgress Component
// ============================================================================

export interface AnimatedProgressProps {
  progress: number; // 0-1
  width?: number;
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  style?: StyleProp<ViewStyle>;
  animated?: boolean;
}

export function AnimatedProgress({
  progress,
  width = 200,
  height = 8,
  backgroundColor = '#374151',
  progressColor = '#10b981',
  style,
  animated = true,
}: AnimatedProgressProps) {
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    if (animated) {
      progressWidth.value = withSpring(clampedProgress * width, SPRING_PRESETS.default);
    } else {
      progressWidth.value = clampedProgress * width;
    }
  }, [progress, width, animated]);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: progressWidth.value,
  }));

  return (
    <View style={[styles.progressContainer, { width, height, backgroundColor }, style]}>
      <Animated.View
        style={[
          styles.progressBar,
          { height, backgroundColor: progressColor },
          animatedProgressStyle,
        ]}
      />
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  textRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  disabled: {
    opacity: 0.5,
  },
  progressContainer: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    borderRadius: 4,
  },
});

// ============================================================================
// Default Export
// ============================================================================

const AnimatedComponents = {
  AnimatedView,
  AnimatedText,
  AnimatedButton,
  AnimatedList,
  AnimatedImage,
  AnimatedCounter,
  AnimatedProgress,
  ENTERING_PRESETS,
  EXITING_PRESETS,
  LAYOUT_PRESETS,
};

export default AnimatedComponents;
