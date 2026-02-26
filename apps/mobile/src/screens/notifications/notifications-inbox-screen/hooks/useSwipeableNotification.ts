/**
 * useSwipeableNotification - Animation and gesture logic for notification items
 */

import { durations } from '@cgraph/animation-constants';
import { useEffect } from 'react';
import { Dimensions, PanResponder, PanResponderInstance } from 'react-native';
import {
  useSharedValue,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  useDerivedValue,
  interpolate,
  runOnJS,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 80;

export interface UseSwipeableNotificationOptions {
  index: number;
  isRead: boolean;
  onMarkRead: () => void;
  onDelete: () => void;
}

export interface SwipeableNotificationAnimations {
  // Entry animations
  entryAnim: SharedValue<number>;
  opacity: SharedValue<number>;
  // Swipe animations
  swipeX: SharedValue<number>;
  actionScale: SharedValue<number>;
  deleteOpacity: SharedValue<number>;
  readOpacity: SharedValue<number>;
  // Press animations
  pressScale: SharedValue<number>;
  glowOpacity: SharedValue<number>;
  // Unread indicator
  pulseAnim: SharedValue<number>;
  // Computed interpolations
  entryTranslateY: SharedValue<number>;
  entryScale: SharedValue<number>;
  // Gesture handler
  panResponder: PanResponderInstance;
  // Press handlers
  handlePressIn: () => void;
  handlePressOut: () => void;
}

/**
 *
 */
export function useSwipeableNotification({
  index,
  isRead,
  onMarkRead,
  onDelete,
}: UseSwipeableNotificationOptions): SwipeableNotificationAnimations {
  // Entry animations
  const entryAnim = useSharedValue(0);
  const opacity = useSharedValue(0);

  // Swipe animations
  const swipeX = useSharedValue(0);
  const actionScale = useSharedValue(0.5);
  const deleteOpacity = useSharedValue(0);
  const readOpacity = useSharedValue(0);

  // Press animations
  const pressScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  // Unread indicator pulse
  const pulseAnim = useSharedValue(1);

  // Entry animation
  useEffect(() => {
    const delay = index * 60;

    entryAnim.value = withDelay(delay, withTiming(1, { duration: durations.slower.ms, easing: Easing.out(Easing.back(1.5)) }));
    opacity.value = withDelay(delay, withTiming(1, { duration: durations.smooth.ms }));

    if (!isRead) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: durations.verySlow.ms, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: durations.verySlow.ms, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }
  }, [index, isRead]);

  // Pan responder for swipe gestures
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return (
        Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
      );
    },
    onPanResponderGrant: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    onPanResponderMove: (_, gestureState) => {
      const clampedX = Math.max(-120, Math.min(120, gestureState.dx));
      swipeX.value = clampedX;

      if (gestureState.dx < -20) {
        deleteOpacity.value = Math.min(1, Math.abs(gestureState.dx) / SWIPE_THRESHOLD);
        readOpacity.value = 0;
      } else if (gestureState.dx > 20) {
        readOpacity.value = Math.min(1, gestureState.dx / SWIPE_THRESHOLD);
        deleteOpacity.value = 0;
      }

      const progress = Math.min(1, Math.abs(gestureState.dx) / SWIPE_THRESHOLD);
      actionScale.value = 0.5 + progress * 0.5;
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx < -SWIPE_THRESHOLD) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        swipeX.value = withTiming(-SCREEN_WIDTH, { duration: durations.normal.ms }, (finished) => {
          if (finished) runOnJS(onDelete)();
        });
      } else if (gestureState.dx > SWIPE_THRESHOLD && !isRead) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        swipeX.value = withSpring(0);
        onMarkRead();
      } else {
        swipeX.value = withSpring(0, { stiffness: 100, damping: 10 });
      }

      deleteOpacity.value = withTiming(0, { duration: durations.normal.ms });
      readOpacity.value = withTiming(0, { duration: durations.normal.ms });
      actionScale.value = withTiming(0.5, { duration: durations.normal.ms });
    },
  });

  // Press handlers
  const handlePressIn = () => {
    pressScale.value = withSpring(0.98);
    glowOpacity.value = withTiming(0.3, { duration: durations.fast.ms });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1);
    glowOpacity.value = withTiming(0, { duration: durations.fast.ms });
  };

  // Computed interpolations
  const entryTranslateY = useDerivedValue(() => interpolate(entryAnim.value, [0, 1], [50, 0]));
  const entryScale = useDerivedValue(() => interpolate(entryAnim.value, [0, 1], [0.8, 1]));

  return {
    entryAnim,
    opacity,
    swipeX,
    actionScale,
    deleteOpacity,
    readOpacity,
    pressScale,
    glowOpacity,
    pulseAnim,
    entryTranslateY,
    entryScale,
    panResponder,
    handlePressIn,
    handlePressOut,
  };
}
