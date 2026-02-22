/**
 * SwipeableCard - Multi-Action Swipeable Card Component
 *
 * Features:
 * - Multi-direction swipe (left, right, up, down)
 * - Multiple snap points with actions
 * - Smooth spring physics
 * - Haptic feedback on thresholds
 * - Customizable action buttons
 * - Rubber band effect at edges
 */

import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View, ViewStyle, StyleProp, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

import { SPRING_PRESETS, getSpringConfig } from '../../lib/animations/animation-library';

// ============================================================================
// Types
// ============================================================================

export interface SwipeAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  color: string;
  textColor?: string;
  onPress: () => void;
  threshold?: number; // 0-1, defaults to 0.5
}

export interface SwipeableCardProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  upAction?: SwipeAction;
  downAction?: SwipeAction;
  style?: StyleProp<ViewStyle>;
  cardStyle?: StyleProp<ViewStyle>;

  // Behavior
  enabled?: boolean;
  swipeThreshold?: number;
  maxSwipeDistance?: number;
  rubberBandEffect?: boolean;
  rubberBandFactor?: number;

  // Callbacks
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;

  // Animation
  springPreset?: keyof typeof SPRING_PRESETS;

  // Haptics
  hapticFeedback?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DEFAULT_SWIPE_THRESHOLD = 80;
const DEFAULT_MAX_SWIPE = SCREEN_WIDTH * 0.7;
const DEFAULT_RUBBER_BAND_FACTOR = 0.3;

// ============================================================================
// Component
// ============================================================================

export function SwipeableCard({
  children,
  leftActions = [],
  rightActions = [],
  upAction,
  downAction,
  style,
  cardStyle,
  enabled = true,
  swipeThreshold = DEFAULT_SWIPE_THRESHOLD,
  maxSwipeDistance = DEFAULT_MAX_SWIPE,
  rubberBandEffect = true,
  rubberBandFactor = DEFAULT_RUBBER_BAND_FACTOR,
  onSwipeStart,
  onSwipeEnd,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  springPreset = 'snappy',
  hapticFeedback = true,
}: SwipeableCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isActive = useSharedValue(false);

  const springConfig = SPRING_PRESETS[springPreset];

  // Haptic feedback helper
  const triggerHaptic = useCallback(() => {
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [hapticFeedback]);

  // Calculate action widths
  const leftActionWidth = useMemo(() => {
    return leftActions.length * 80;
  }, [leftActions.length]);

  const rightActionWidth = useMemo(() => {
    return rightActions.length * 80;
  }, [rightActions.length]);

  // Context for gesture tracking
  const gestureContext = useSharedValue({ startX: 0, startY: 0, triggeredThreshold: false });

  // Helper to create spring config
  const springCfg = getSpringConfig(springConfig);

  // Gesture handler using new Gesture API
  const panGesture = Gesture.Pan()
    .enabled(enabled)
    .onStart(() => {
      'worklet';
      gestureContext.value = {
        startX: translateX.value,
        startY: translateY.value,
        triggeredThreshold: false,
      };
      isActive.value = true;

      if (onSwipeStart) {
        runOnJS(onSwipeStart)();
      }
    })
    .onUpdate((event) => {
      'worklet';
      // Determine primary direction
      const absX = Math.abs(event.translationX);
      const absY = Math.abs(event.translationY);

      if (absX > absY) {
        // Horizontal swipe
        let newX = gestureContext.value.startX + event.translationX;

        // Apply rubber band effect at edges
        if (rubberBandEffect) {
          if (newX > maxSwipeDistance) {
            const overflow = newX - maxSwipeDistance;
            newX = maxSwipeDistance + overflow * rubberBandFactor;
          } else if (newX < -maxSwipeDistance) {
            const overflow = -maxSwipeDistance - newX;
            newX = -maxSwipeDistance - overflow * rubberBandFactor;
          }
        } else {
          newX = Math.max(-maxSwipeDistance, Math.min(maxSwipeDistance, newX));
        }

        translateX.value = newX;
        translateY.value = 0;

        // Trigger haptic at threshold
        if (!gestureContext.value.triggeredThreshold && Math.abs(newX) >= swipeThreshold) {
          gestureContext.value = { ...gestureContext.value, triggeredThreshold: true };
          if (hapticFeedback) {
            runOnJS(triggerHaptic)();
          }
        }
      } else if (upAction || downAction) {
        // Vertical swipe
        let newY = gestureContext.value.startY + event.translationY;

        if (rubberBandEffect) {
          const maxY = 100;
          if (newY > maxY) {
            const overflow = newY - maxY;
            newY = maxY + overflow * rubberBandFactor;
          } else if (newY < -maxY) {
            const overflow = -maxY - newY;
            newY = -maxY - overflow * rubberBandFactor;
          }
        }

        translateY.value = newY;
        translateX.value = 0;
      }
    })
    .onEnd(() => {
      'worklet';
      isActive.value = false;

      const absX = Math.abs(translateX.value);
      const absY = Math.abs(translateY.value);

      if (absX > absY) {
        // Horizontal gesture end
        if (translateX.value > swipeThreshold && rightActions.length > 0) {
          // Snap to show right actions
          translateX.value = withSpring(rightActionWidth, springCfg);
          if (onSwipeRight) {
            runOnJS(onSwipeRight)();
          }
        } else if (translateX.value < -swipeThreshold && leftActions.length > 0) {
          // Snap to show left actions
          translateX.value = withSpring(-leftActionWidth, springCfg);
          if (onSwipeLeft) {
            runOnJS(onSwipeLeft)();
          }
        } else {
          // Snap back to center
          translateX.value = withSpring(0, springCfg);
        }
      } else {
        // Vertical gesture end
        if (translateY.value < -swipeThreshold && upAction) {
          if (onSwipeUp) {
            runOnJS(onSwipeUp)();
          }
          if (upAction.onPress) {
            runOnJS(upAction.onPress)();
          }
        } else if (translateY.value > swipeThreshold && downAction) {
          if (onSwipeDown) {
            runOnJS(onSwipeDown)();
          }
          if (downAction.onPress) {
            runOnJS(downAction.onPress)();
          }
        }
        translateY.value = withSpring(0, springCfg);
      }

      translateY.value = withSpring(0, springCfg);

      if (onSwipeEnd) {
        runOnJS(onSwipeEnd)();
      }
    });

  // Animated styles
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }] as const,
  }));

  // Left actions style (revealed when swiping right)
  const leftActionsStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      translateX.value,
      [0, rightActionWidth],
      [0, 1],
      Extrapolate.CLAMP
    );

    return {
      opacity: progress,
      transform: [{ scale: interpolate(progress, [0, 1], [0.8, 1]) }],
    };
  });

  // Right actions style (revealed when swiping left)
  const rightActionsStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      translateX.value,
      [-leftActionWidth, 0],
      [1, 0],
      Extrapolate.CLAMP
    );

    return {
      opacity: progress,
      transform: [{ scale: interpolate(progress, [0, 1], [0.8, 1]) }],
    };
  });

  // Close swipe
  const close = useCallback(() => {
    translateX.value = withSpring(0, springCfg);
    translateY.value = withSpring(0, springCfg);
  }, [springCfg]);

  return (
    <View style={[styles.container, style]}>
      {/* Left Actions (shown when swiping right) */}
      {rightActions.length > 0 && (
        <Animated.View style={[styles.actionsContainer, styles.leftActions, leftActionsStyle]}>
          {rightActions.map((action, index) => (
            <ActionButton
              key={action.key}
              action={action}
              index={index}
              onPress={() => {
                action.onPress();
                close();
              }}
            />
          ))}
        </Animated.View>
      )}

      {/* Right Actions (shown when swiping left) */}
      {leftActions.length > 0 && (
        <Animated.View style={[styles.actionsContainer, styles.rightActions, rightActionsStyle]}>
          {leftActions.map((action, index) => (
            <ActionButton
              key={action.key}
              action={action}
              index={index}
              onPress={() => {
                action.onPress();
                close();
              }}
            />
          ))}
        </Animated.View>
      )}

      {/* Main Card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.card, cardStyle, cardAnimatedStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

// ============================================================================
// Action Button Component
// ============================================================================

interface ActionButtonProps {
  action: SwipeAction;
  index: number;
  onPress: () => void;
}

function ActionButton({ action, index, onPress }: ActionButtonProps) {
  // Stagger animation delay based on index
  const staggerDelay = index * 50;

  return (
    <Animated.View
      entering={require('react-native-reanimated').FadeInRight.delay(staggerDelay).springify()}
      style={[styles.actionButton, { backgroundColor: action.color }]}
    >
      <Animated.Text
        style={[styles.actionText, { color: action.textColor || '#fff' }]}
        onPress={onPress}
      >
        {action.icon}
        {action.label}
      </Animated.Text>
    </Animated.View>
  );
}

// ============================================================================
// Convenience Components
// ============================================================================

export interface SwipeToDeleteProps {
  children: React.ReactNode;
  onDelete: () => void;
  deleteLabel?: string;
  deleteColor?: string;
  style?: StyleProp<ViewStyle>;
}

export function SwipeToDelete({
  children,
  onDelete,
  deleteLabel = 'Delete',
  deleteColor = '#ef4444',
  style,
}: SwipeToDeleteProps) {
  return (
    <SwipeableCard
      style={style}
      leftActions={[
        {
          key: 'delete',
          label: deleteLabel,
          color: deleteColor,
          onPress: onDelete,
        },
      ]}
    >
      {children}
    </SwipeableCard>
  );
}

export interface SwipeToArchiveProps {
  children: React.ReactNode;
  onArchive: () => void;
  onDelete?: () => void;
  archiveLabel?: string;
  archiveColor?: string;
  style?: StyleProp<ViewStyle>;
}

export function SwipeToArchive({
  children,
  onArchive,
  onDelete,
  archiveLabel = 'Archive',
  archiveColor = '#10b981',
  style,
}: SwipeToArchiveProps) {
  const leftActions: SwipeAction[] = [];

  if (onDelete) {
    leftActions.push({
      key: 'delete',
      label: 'Delete',
      color: '#ef4444',
      onPress: onDelete,
    });
  }

  return (
    <SwipeableCard
      style={style}
      leftActions={leftActions}
      rightActions={[
        {
          key: 'archive',
          label: archiveLabel,
          color: archiveColor,
          onPress: onArchive,
        },
      ]}
    >
      {children}
    </SwipeableCard>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  card: {
    backgroundColor: '#1f2937',
    zIndex: 1,
  },
  actionsContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftActions: {
    left: 0,
  },
  rightActions: {
    right: 0,
  },
  actionButton: {
    width: 80,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default SwipeableCard;
