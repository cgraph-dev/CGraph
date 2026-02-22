/**
 * FeedbackSystem Types
 */

import { StyleProp, ViewStyle, PressableProps, DimensionValue } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SPRING_PRESETS } from '../../animations/animation-library';

export type PressStyle = 'scale' | 'opacity' | 'glow' | 'shadow' | 'lift' | 'none';
export type FeedbackIntensity = 'light' | 'medium' | 'heavy';

export interface PressableFeedbackProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  pressStyle?: PressStyle | PressStyle[];
  scaleAmount?: number;
  opacityAmount?: number;
  glowColor?: string;
  hapticFeedback?: boolean;
  hapticStyle?: Haptics.ImpactFeedbackStyle;
  springPreset?: keyof typeof SPRING_PRESETS;
  style?: StyleProp<ViewStyle>;
}

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  shimmerColor?: string;
  backgroundColor?: string;
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
}

export interface SkeletonGroupProps {
  count?: number;
  variant?: 'text' | 'card' | 'avatar' | 'list-item';
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
}

export interface SuccessAnimationProps {
  visible: boolean;
  size?: number;
  color?: string;
  onComplete?: () => void;
  style?: StyleProp<ViewStyle>;
}

export interface ErrorAnimationProps {
  visible: boolean;
  size?: number;
  color?: string;
  shake?: boolean;
  onComplete?: () => void;
  style?: StyleProp<ViewStyle>;
}

export interface LoadingAnimationProps {
  visible: boolean;
  size?: number;
  color?: string;
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars';
  style?: StyleProp<ViewStyle>;
}

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
}

export interface RippleProps {
  color?: string;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  onPress?: () => void;
}
