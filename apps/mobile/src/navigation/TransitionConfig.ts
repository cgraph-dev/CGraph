/**
 * TransitionConfig - Screen Transition Animations
 *
 * Features:
 * - Custom screen transitions
 * - Shared element transitions (conceptual)
 * - Hero animations
 * - Modal presentations
 * - Stack-based transitions with depth
 */

import { Platform } from 'react-native';
import {
  StackCardInterpolatedStyle,
  StackCardInterpolationProps,
  TransitionPresets,
  TransitionSpec,
} from '@react-navigation/stack';
import { Easing } from 'react-native-reanimated';

// ============================================================================
// Types
// ============================================================================

export type TransitionType =
  | 'slide'
  | 'fade'
  | 'scale'
  | 'modal'
  | 'slideFromBottom'
  | 'slideFromRight'
  | 'flip'
  | 'none';

export interface TransitionOptions {
  type: TransitionType;
  duration?: number;
  gestureEnabled?: boolean;
}

// ============================================================================
// Timing Configs
// ============================================================================

const timingConfigFast: TransitionSpec = {
  animation: 'timing',
  config: {
    duration: 250,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  },
};

const timingConfigMedium: TransitionSpec = {
  animation: 'timing',
  config: {
    duration: 350,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  },
};

const timingConfigSlow: TransitionSpec = {
  animation: 'timing',
  config: {
    duration: 500,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  },
};

const springConfig: TransitionSpec = {
  animation: 'spring',
  config: {
    stiffness: 1000,
    damping: 500,
    mass: 3,
    overshootClamping: true,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
};

const bouncySpringConfig: TransitionSpec = {
  animation: 'spring',
  config: {
    stiffness: 300,
    damping: 30,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
};

// ============================================================================
// Custom Interpolators
// ============================================================================

/**
 * Horizontal slide with depth effect
 */
export function forHorizontalSlide({
  current,
  next,
  layouts: { screen },
}: StackCardInterpolationProps): StackCardInterpolatedStyle {
  const translateX = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [screen.width, 0],
  });

  const scale = next
    ? next.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.95],
      })
    : 1;

  const opacity = next
    ? next.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.7],
      })
    : 1;

  return {
    cardStyle: {
      transform: [{ translateX }, { scale }],
      opacity,
    },
  };
}

/**
 * Fade transition
 */
export function forFade({
  current,
}: StackCardInterpolationProps): StackCardInterpolatedStyle {
  const opacity = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return {
    cardStyle: {
      opacity,
    },
  };
}

/**
 * Scale from center
 */
export function forScaleFromCenter({
  current,
  closing,
}: StackCardInterpolationProps): StackCardInterpolatedStyle {
  const scale = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1],
  });

  const opacity = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return {
    cardStyle: {
      opacity,
      transform: [{ scale }],
    },
  };
}

/**
 * Modal slide from bottom with backdrop
 */
export function forModalSlideFromBottom({
  current,
  next,
  layouts: { screen },
}: StackCardInterpolationProps): StackCardInterpolatedStyle {
  const translateY = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [screen.height, 0],
  });

  const scale = next
    ? next.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.92],
      })
    : 1;

  const borderRadius = next
    ? next.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 20],
      })
    : 0;

  return {
    cardStyle: {
      transform: [{ translateY }, { scale }],
      borderTopLeftRadius: borderRadius,
      borderTopRightRadius: borderRadius,
    },
    overlayStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.5],
      }),
    },
  };
}

/**
 * Flip transition (horizontal)
 */
export function forFlipHorizontal({
  current,
  layouts: { screen },
}: StackCardInterpolationProps): StackCardInterpolatedStyle {
  const rotateY = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['90deg', '0deg'],
  });

  const opacity = current.progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return {
    cardStyle: {
      opacity,
      transform: [
        { perspective: 1000 },
        { rotateY },
      ],
    },
  };
}

/**
 * Stack with depth (cards stack with scale/opacity)
 */
export function forStackWithDepth({
  current,
  next,
  layouts: { screen },
}: StackCardInterpolationProps): StackCardInterpolatedStyle {
  const translateX = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [screen.width, 0],
  });

  // Previous card effect
  const prevScale = next
    ? next.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.9],
      })
    : 1;

  const prevTranslateX = next
    ? next.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -screen.width * 0.3],
      })
    : 0;

  const prevOpacity = next
    ? next.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.5],
      })
    : 1;

  return {
    cardStyle: {
      transform: [
        { translateX },
        { translateX: prevTranslateX },
        { scale: prevScale },
      ],
      opacity: prevOpacity,
    },
  };
}

/**
 * Reveal from center
 */
export function forRevealFromCenter({
  current,
  layouts: { screen },
}: StackCardInterpolationProps): StackCardInterpolatedStyle {
  const scale = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const opacity = current.progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1, 1],
  });

  return {
    cardStyle: {
      opacity,
      transform: [{ scale }],
    },
  };
}

/**
 * Slide up with bounce
 */
export function forSlideUpWithBounce({
  current,
  layouts: { screen },
}: StackCardInterpolationProps): StackCardInterpolatedStyle {
  const translateY = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [screen.height, 0],
  });

  return {
    cardStyle: {
      transform: [{ translateY }],
    },
  };
}

// ============================================================================
// Transition Presets
// ============================================================================

export const CustomTransitionPresets = {
  /**
   * Slide from right with depth
   */
  SlideFromRight: {
    gestureDirection: 'horizontal' as const,
    transitionSpec: {
      open: springConfig,
      close: springConfig,
    },
    cardStyleInterpolator: forHorizontalSlide,
    headerStyleInterpolator: undefined,
  },

  /**
   * Fade transition
   */
  FadeTransition: {
    gestureDirection: 'vertical' as const,
    transitionSpec: {
      open: timingConfigMedium,
      close: timingConfigMedium,
    },
    cardStyleInterpolator: forFade,
    headerStyleInterpolator: undefined,
  },

  /**
   * Scale from center
   */
  ScaleFromCenter: {
    gestureDirection: 'vertical' as const,
    transitionSpec: {
      open: bouncySpringConfig,
      close: timingConfigFast,
    },
    cardStyleInterpolator: forScaleFromCenter,
    headerStyleInterpolator: undefined,
  },

  /**
   * Modal slide from bottom
   */
  ModalSlideFromBottom: {
    gestureDirection: 'vertical' as const,
    transitionSpec: {
      open: springConfig,
      close: timingConfigMedium,
    },
    cardStyleInterpolator: forModalSlideFromBottom,
    headerStyleInterpolator: undefined,
  },

  /**
   * Flip horizontal
   */
  FlipHorizontal: {
    gestureDirection: 'horizontal' as const,
    transitionSpec: {
      open: timingConfigMedium,
      close: timingConfigMedium,
    },
    cardStyleInterpolator: forFlipHorizontal,
    headerStyleInterpolator: undefined,
  },

  /**
   * Stack with depth
   */
  StackWithDepth: {
    gestureDirection: 'horizontal' as const,
    transitionSpec: {
      open: springConfig,
      close: springConfig,
    },
    cardStyleInterpolator: forStackWithDepth,
    headerStyleInterpolator: undefined,
  },

  /**
   * Reveal from center
   */
  RevealFromCenter: {
    gestureDirection: 'vertical' as const,
    transitionSpec: {
      open: bouncySpringConfig,
      close: timingConfigFast,
    },
    cardStyleInterpolator: forRevealFromCenter,
    headerStyleInterpolator: undefined,
  },

  /**
   * Slide up with bounce (for modals)
   */
  SlideUpWithBounce: {
    gestureDirection: 'vertical' as const,
    transitionSpec: {
      open: bouncySpringConfig,
      close: timingConfigMedium,
    },
    cardStyleInterpolator: forSlideUpWithBounce,
    headerStyleInterpolator: undefined,
  },

  /**
   * No animation
   */
  None: {
    transitionSpec: {
      open: { animation: 'timing' as const, config: { duration: 0 } },
      close: { animation: 'timing' as const, config: { duration: 0 } },
    },
    cardStyleInterpolator: ({ current }: StackCardInterpolationProps) => ({
      cardStyle: { opacity: current.progress },
    }),
    headerStyleInterpolator: undefined,
  },
};

// ============================================================================
// Get Transition Options
// ============================================================================

export function getTransitionOptions(options: TransitionOptions) {
  const { type, duration, gestureEnabled = true } = options;

  switch (type) {
    case 'slide':
      return {
        ...CustomTransitionPresets.SlideFromRight,
        gestureEnabled,
      };

    case 'fade':
      return {
        ...CustomTransitionPresets.FadeTransition,
        gestureEnabled,
      };

    case 'scale':
      return {
        ...CustomTransitionPresets.ScaleFromCenter,
        gestureEnabled,
      };

    case 'modal':
      return {
        ...CustomTransitionPresets.ModalSlideFromBottom,
        gestureEnabled,
      };

    case 'slideFromBottom':
      return {
        ...CustomTransitionPresets.SlideUpWithBounce,
        gestureEnabled,
      };

    case 'slideFromRight':
      return {
        ...CustomTransitionPresets.StackWithDepth,
        gestureEnabled,
      };

    case 'flip':
      return {
        ...CustomTransitionPresets.FlipHorizontal,
        gestureEnabled,
      };

    case 'none':
      return {
        ...CustomTransitionPresets.None,
        gestureEnabled: false,
      };

    default:
      return {
        ...TransitionPresets.SlideFromRightIOS,
        gestureEnabled,
      };
  }
}

// ============================================================================
// Platform-Specific Defaults
// ============================================================================

export const PlatformTransitionPreset = Platform.select({
  ios: TransitionPresets.SlideFromRightIOS,
  android: CustomTransitionPresets.SlideFromRight,
  default: CustomTransitionPresets.SlideFromRight,
});

export const ModalTransitionPreset = Platform.select({
  ios: TransitionPresets.ModalPresentationIOS,
  android: CustomTransitionPresets.ModalSlideFromBottom,
  default: CustomTransitionPresets.ModalSlideFromBottom,
});

// ============================================================================
// Default Export
// ============================================================================

export default {
  CustomTransitionPresets,
  getTransitionOptions,
  PlatformTransitionPreset,
  ModalTransitionPreset,
};
