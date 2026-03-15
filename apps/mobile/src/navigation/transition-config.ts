/**
 * TransitionConfig - Screen Transition Configuration for Native Stack
 *
 * Note: @react-navigation/native-stack uses native platform animations,
 * so custom JavaScript interpolators are not supported. This file provides
 * animation configuration options that work with native-stack.
 *
 * Features:
 * - Screen transition animation types
 * - Platform-specific animation configurations
 * - Modal presentation styles
 */

import { Platform } from 'react-native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

// ============================================================================
// Types
// ============================================================================

export type TransitionType = 'slide' | 'fade' | 'modal' | 'slideFromBottom' | 'none' | 'default';

export interface TransitionOptions {
  type: TransitionType;
  gestureEnabled?: boolean;
}

// ============================================================================
// Animation Options
// ============================================================================

/**
 * Slide from right animation (default iOS style)
 */
export const slideFromRight: NativeStackNavigationOptions = {
  animation: 'slide_from_right',
  gestureEnabled: true,
};

/**
 * Fade animation
 */
export const fadeAnimation: NativeStackNavigationOptions = {
  animation: 'fade',
  gestureEnabled: true,
};

/**
 * Slide from bottom animation
 */
export const slideFromBottom: NativeStackNavigationOptions = {
  animation: 'slide_from_bottom',
  gestureEnabled: true,
};

/**
 * Modal presentation (iOS card style)
 */
export const modalPresentation: NativeStackNavigationOptions = {
  presentation: 'modal',
  animation: 'slide_from_bottom',
  gestureEnabled: true,
};

/**
 * Fullscreen modal (covers entire screen)
 */
export const fullscreenModal: NativeStackNavigationOptions = {
  presentation: 'fullScreenModal',
  animation: 'slide_from_bottom',
  gestureEnabled: true,
};

/**
 * Transparent modal (for custom overlays)
 */
export const transparentModal: NativeStackNavigationOptions = {
  presentation: 'transparentModal',
  animation: 'fade',
  gestureEnabled: true,
};

/**
 * No animation
 */
export const noAnimation: NativeStackNavigationOptions = {
  animation: 'none',
  gestureEnabled: false,
};

/**
 * iOS-style form sheet
 */
export const formSheet: NativeStackNavigationOptions = {
  presentation: 'formSheet',
  animation: 'slide_from_bottom',
  gestureEnabled: true,
};

// ============================================================================
// Transition Presets
// ============================================================================

export const TransitionPresets = {
  SlideFromRight: slideFromRight,
  Fade: fadeAnimation,
  SlideFromBottom: slideFromBottom,
  Modal: modalPresentation,
  FullscreenModal: fullscreenModal,
  TransparentModal: transparentModal,
  None: noAnimation,
  FormSheet: formSheet,
};

// ============================================================================
// Get Transition Options
// ============================================================================

/**
 * Gets transition options.
 *
 */
export function getTransitionOptions(options: TransitionOptions): NativeStackNavigationOptions {
  const { type, gestureEnabled = true } = options;

  switch (type) {
    case 'slide':
      return {
        ...slideFromRight,
        gestureEnabled,
      };

    case 'fade':
      return {
        ...fadeAnimation,
        gestureEnabled,
      };

    case 'modal':
      return {
        ...modalPresentation,
        gestureEnabled,
      };

    case 'slideFromBottom':
      return {
        ...slideFromBottom,
        gestureEnabled,
      };

    case 'none':
      return {
        ...noAnimation,
        gestureEnabled: false,
      };

    case 'default':
    default:
      return {
        animation: 'default',
        gestureEnabled,
      };
  }
}

// ============================================================================
// Platform-Specific Defaults
// ============================================================================

 
export const PlatformTransitionPreset: NativeStackNavigationOptions = Platform.select({
  ios: slideFromRight,
  android: {
    animation: 'slide_from_right',
    gestureEnabled: true,
  },
  default: slideFromRight,
}) as NativeStackNavigationOptions;

 
export const ModalTransitionPreset: NativeStackNavigationOptions = Platform.select({
  ios: modalPresentation,
  android: {
    presentation: 'modal',
    animation: 'slide_from_bottom',
    gestureEnabled: true,
  },
  default: modalPresentation,
}) as NativeStackNavigationOptions;

// ============================================================================
// Default Export
// ============================================================================

export default {
  TransitionPresets,
  getTransitionOptions,
  PlatformTransitionPreset,
  ModalTransitionPreset,
};
