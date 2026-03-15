/**
 * MorphingButton - Shape-Shifting Button with State Transitions
 *
 * Features:
 * - Shape morphing (pill, circle, square, icon-only)
 * - State transitions (idle, loading, success, error)
 * - Smooth animated transitions
 * - Icon support with rotation/scale
 * - Gradient backgrounds
 * - Haptic feedback
 */

import { durations } from '@cgraph/animation-constants';
import React, { useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, ViewStyle, StyleProp, TextStyle, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  interpolateColor,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { SPRING_PRESETS, getSpringConfig } from '../../lib/animations/animation-library';

// ============================================================================
// Types
// ============================================================================

export type ButtonShape = 'pill' | 'circle' | 'rounded' | 'square';
export type ButtonState = 'idle' | 'loading' | 'success' | 'error' | 'disabled';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export interface MorphingButtonProps {
  // Content
  label?: string;
  icon?: React.ReactNode;
  successIcon?: React.ReactNode;
  errorIcon?: React.ReactNode;
  loadingIcon?: React.ReactNode;

  // Appearance
  shape?: ButtonShape;
  size?: ButtonSize;
  state?: ButtonState;
  variant?: 'solid' | 'outline' | 'ghost' | 'gradient';

  // Colors
  color?: string;
  textColor?: string;
  successColor?: string;
  errorColor?: string;
  gradientColors?: string[];

  // Style
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;

  // Behavior
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  hapticFeedback?: boolean;

  // Animation
  morphDuration?: number;
  pressScale?: number;
  springPreset?: keyof typeof SPRING_PRESETS;

  // Loading
  autoResetAfterSuccess?: boolean;
  autoResetAfterError?: boolean;
  resetDelay?: number;
}

// ============================================================================
// Constants
// ============================================================================

const SIZE_CONFIG: Record<
  ButtonSize,
  { height: number; padding: number; fontSize: number; iconSize: number }
> = {
  sm: { height: 36, padding: 16, fontSize: 14, iconSize: 16 },
  md: { height: 44, padding: 20, fontSize: 16, iconSize: 20 },
  lg: { height: 52, padding: 24, fontSize: 18, iconSize: 24 },
  xl: { height: 60, padding: 28, fontSize: 20, iconSize: 28 },
};

const SHAPE_RADIUS: Record<ButtonShape, (height: number) => number> = {
  pill: (height) => height / 2,
  circle: (height) => height / 2,
  rounded: () => 12,
  square: () => 0,
};

const STATE_COLORS = {
  idle: '#10b981',
  loading: '#6366f1',
  success: '#22c55e',
  error: '#ef4444',
  disabled: '#6b7280',
};

// ============================================================================
// Component
// ============================================================================

/**
 * Morphing Button component.
 *
 */
export function MorphingButton({
  label,
  icon,
  successIcon,
  errorIcon,
  loadingIcon,
  shape = 'pill',
  size = 'md',
  state = 'idle',
  variant = 'solid',
  color,
  textColor = '#ffffff',
  successColor = STATE_COLORS.success,
  errorColor = STATE_COLORS.error,
  gradientColors,
  style,
  textStyle,
  onPress,
  onLongPress,
  disabled = false,
  hapticFeedback = true,
  morphDuration = 300,
  pressScale = 0.95,
  springPreset = 'snappy',
  autoResetAfterSuccess = true,
  autoResetAfterError = true,
  resetDelay = 2000,
}: MorphingButtonProps) {
  // Animation values
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const morphProgress = useSharedValue(0); // 0 = expanded, 1 = collapsed to icon
  const _stateProgress = useSharedValue(0); // For color transitions
  const loadingRotation = useSharedValue(0);

  const springConfig = SPRING_PRESETS[springPreset];
  const sizeConfig = SIZE_CONFIG[size];
  const baseColor = color || STATE_COLORS.idle;

  // Current state determines target color
  const targetColor = useMemo(() => {
    switch (state) {
      case 'success':
        return successColor;
      case 'error':
        return errorColor;
      case 'loading':
        return STATE_COLORS.loading;
      case 'disabled':
        return STATE_COLORS.disabled;
      default:
        return baseColor;
    }
  }, [state, successColor, errorColor, baseColor]);

  // Handle state changes
  useEffect(() => {
    const cfg = getSpringConfig(springConfig);

    // Morph to circle when loading or showing success/error
    if (state === 'loading' || state === 'success' || state === 'error') {
      morphProgress.value = withSpring(1, cfg);
    } else {
      morphProgress.value = withSpring(0, cfg);
    }

    // Start loading animation
    if (state === 'loading') {
      loadingRotation.value = withRepeat(
        withTiming(360, { duration: durations.verySlow.ms, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      cancelAnimation(loadingRotation);
      loadingRotation.value = 0;
    }

    // Success/error shake or bounce
    if (state === 'success') {
      scale.value = withSequence(withSpring(1.1, { damping: 5 }), withSpring(1, cfg));

      if (autoResetAfterSuccess) {
        setTimeout(() => {
          // This would need to be controlled externally
        }, resetDelay);
      }
    } else if (state === 'error') {
      rotation.value = withSequence(
        withTiming(-5, { duration: durations.stagger.ms }),
        withTiming(5, { duration: durations.stagger.ms }),
        withTiming(-5, { duration: durations.stagger.ms }),
        withTiming(5, { duration: durations.stagger.ms }),
        withTiming(0, { duration: durations.stagger.ms })
      );

      if (autoResetAfterError) {
        setTimeout(() => {
          // This would need to be controlled externally
        }, resetDelay);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Press handlers
  const handlePressIn = useCallback(() => {
    scale.value = withSpring(pressScale, getSpringConfig(springConfig));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pressScale, springConfig]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, getSpringConfig(springConfig));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [springConfig]);

  const handlePress = useCallback(() => {
    if (disabled || state === 'loading') return;

    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onPress?.();
  }, [disabled, state, hapticFeedback, onPress]);

  const handleLongPress = useCallback(() => {
    if (disabled || state === 'loading') return;

    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    onLongPress?.();
  }, [disabled, state, hapticFeedback, onLongPress]);

  // Animated container style
  const containerStyle = useAnimatedStyle(() => {
    const { height } = sizeConfig;
    const expandedWidth = sizeConfig.padding * 2 + 100; // Approximate text width
    const collapsedWidth = height; // Circle when collapsed

    const width = interpolate(morphProgress.value, [0, 1], [expandedWidth, collapsedWidth]);

    const borderRadius = SHAPE_RADIUS[shape](height);

    return {
      width: shape === 'circle' ? height : width,
      height,
      borderRadius,
      transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
    };
  });

  // Animated background style
  const backgroundStyle = useAnimatedStyle(() => {
    const currentColor = interpolateColor(morphProgress.value, [0, 1], [baseColor, targetColor]);

    return {
      backgroundColor: variant === 'solid' ? currentColor : 'transparent',
      borderColor: variant === 'outline' ? currentColor : 'transparent',
      borderWidth: variant === 'outline' ? 2 : 0,
    };
  });

  // Animated text style
  const animatedTextStyle = useAnimatedStyle(() => {
    const opacity = interpolate(morphProgress.value, [0, 0.5], [1, 0]);

    return {
      opacity,
    };
  });

  // Animated icon style
  const iconStyle = useAnimatedStyle(() => {
    const iconOpacity = interpolate(morphProgress.value, [0.5, 1], [0, 1]);

    return {
      opacity: iconOpacity,
      transform: [{ rotate: `${loadingRotation.value}deg` }],
    };
  });

  // Render current icon based on state
  const renderStateIcon = () => {
    switch (state) {
      case 'loading':
        return loadingIcon || <LoadingSpinner size={sizeConfig.iconSize} color={textColor} />;
      case 'success':
        return successIcon || <CheckIcon size={sizeConfig.iconSize} color={textColor} />;
      case 'error':
        return errorIcon || <CrossIcon size={sizeConfig.iconSize} color={textColor} />;
      default:
        return icon;
    }
  };

  const content =
    variant === 'gradient' && gradientColors ? (
      <LinearGradient
         
        colors={gradientColors as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[StyleSheet.absoluteFill, { borderRadius: SHAPE_RADIUS[shape](sizeConfig.height) }]}
      />
    ) : null;

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || state === 'loading'}
    >
      <Animated.View style={[styles.container, containerStyle, backgroundStyle, style]}>
        {content}

        {/* Text content (visible when not morphed) */}
        {label && (
          <Animated.Text
            style={[
              styles.label,
              { color: textColor, fontSize: sizeConfig.fontSize },
              textStyle,
              animatedTextStyle,
            ]}
          >
            {label}
          </Animated.Text>
        )}

        {/* Icon content (visible when morphed or shape is circle) */}
        {(state !== 'idle' || shape === 'circle') && (
          <Animated.View style={[styles.iconContainer, iconStyle]}>
            {renderStateIcon()}
          </Animated.View>
        )}
      </Animated.View>
    </Pressable>
  );
}

// ============================================================================
// Icon Components
// ============================================================================

interface IconProps {
  size: number;
  color: string;
}

function LoadingSpinner({ size, color }: IconProps) {
  return (
    <Animated.View
      style={[
        styles.loadingSpinner,
        {
          width: size,
          height: size,
          borderWidth: size / 8,
          borderColor: color,
          borderTopColor: 'transparent',
        },
      ]}
    />
  );
}

function CheckIcon({ size, color }: IconProps) {
  return <Animated.Text style={[styles.iconText, { fontSize: size, color }]}>✓</Animated.Text>;
}

function CrossIcon({ size, color }: IconProps) {
  return <Animated.Text style={[styles.iconText, { fontSize: size, color }]}>✕</Animated.Text>;
}

// ============================================================================
// Convenience Components
// ============================================================================

export interface LoadingButtonProps extends Omit<MorphingButtonProps, 'state'> {
  isLoading?: boolean;
}

/**
 * Loading Button component.
 *
 */
export function LoadingButton({ isLoading, ...props }: LoadingButtonProps) {
  return <MorphingButton {...props} state={isLoading ? 'loading' : 'idle'} />;
}

export interface SubmitButtonProps extends Omit<MorphingButtonProps, 'state'> {
  status: 'idle' | 'loading' | 'success' | 'error';
}

/**
 * Submit Button component.
 *
 */
export function SubmitButton({ status, ...props }: SubmitButtonProps) {
  return <MorphingButton {...props} state={status} />;
}

export interface ActionButtonProps extends Omit<MorphingButtonProps, 'shape' | 'label'> {
  icon: React.ReactNode;
}

/**
 * Action Button component.
 *
 */
export function ActionButton({ icon, ...props }: ActionButtonProps) {
  return <MorphingButton {...props} shape="circle" icon={icon} />;
}

// ============================================================================
// Preset Buttons
// ============================================================================

/**
 * Primary Button component.
 *
 */
export function PrimaryButton(props: MorphingButtonProps) {
  return <MorphingButton {...props} color="#10b981" variant="solid" />;
}

/**
 * Secondary Button component.
 *
 */
export function SecondaryButton(props: MorphingButtonProps) {
  return <MorphingButton {...props} color="#6366f1" variant="solid" />;
}

/**
 * Danger Button component.
 *
 */
export function DangerButton(props: MorphingButtonProps) {
  return <MorphingButton {...props} color="#ef4444" variant="solid" />;
}

/**
 * Ghost Button component.
 *
 */
export function GhostButton(props: MorphingButtonProps) {
  return <MorphingButton {...props} variant="ghost" textColor="#e5e7eb" />;
}

/**
 * Gradient Button component.
 *
 */
export function GradientButton(props: MorphingButtonProps) {
  return (
    <MorphingButton
      {...props}
      variant="gradient"
      gradientColors={props.gradientColors || ['#10b981', '#8b5cf6', '#ec4899']}
    />
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  label: {
    fontWeight: '600',
    textAlign: 'center',
  },
  iconContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontWeight: '700',
  },
  loadingSpinner: {
    borderRadius: 100,
  },
});

export default MorphingButton;
