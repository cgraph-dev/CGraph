/**
 * useSwipeableNotification - Animation and gesture logic for notification items
 */

import { useEffect, useRef } from 'react';
import { Animated, Dimensions, PanResponder, Easing, PanResponderInstance } from 'react-native';
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
  entryAnim: Animated.Value;
  opacity: Animated.Value;
  // Swipe animations
  swipeX: Animated.Value;
  actionScale: Animated.Value;
  deleteOpacity: Animated.Value;
  readOpacity: Animated.Value;
  // Press animations
  pressScale: Animated.Value;
  glowOpacity: Animated.Value;
  // Unread indicator
  pulseAnim: Animated.Value;
  // Computed interpolations
  entryTranslateY: Animated.AnimatedInterpolation<string | number>;
  entryScale: Animated.AnimatedInterpolation<string | number>;
  // Gesture handler
  panResponder: PanResponderInstance;
  // Press handlers
  handlePressIn: () => void;
  handlePressOut: () => void;
}

export function useSwipeableNotification({
  index,
  isRead,
  onMarkRead,
  onDelete,
}: UseSwipeableNotificationOptions): SwipeableNotificationAnimations {
  // Entry animations
  const entryAnim = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Swipe animations
  const swipeX = useRef(new Animated.Value(0)).current;
  const actionScale = useRef(new Animated.Value(0.5)).current;
  const deleteOpacity = useRef(new Animated.Value(0)).current;
  const readOpacity = useRef(new Animated.Value(0)).current;

  // Press animations
  const pressScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  // Unread indicator pulse
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Entry animation
  useEffect(() => {
    const delay = index * 60;

    Animated.parallel([
      Animated.timing(entryAnim, {
        toValue: 1,
        duration: 500,
        delay,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();

    if (!isRead) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [index, isRead]);

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
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
        swipeX.setValue(clampedX);

        if (gestureState.dx < -20) {
          deleteOpacity.setValue(Math.min(1, Math.abs(gestureState.dx) / SWIPE_THRESHOLD));
          readOpacity.setValue(0);
        } else if (gestureState.dx > 20) {
          readOpacity.setValue(Math.min(1, gestureState.dx / SWIPE_THRESHOLD));
          deleteOpacity.setValue(0);
        }

        const progress = Math.min(1, Math.abs(gestureState.dx) / SWIPE_THRESHOLD);
        actionScale.setValue(0.5 + progress * 0.5);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -SWIPE_THRESHOLD) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          Animated.timing(swipeX, {
            toValue: -SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onDelete();
          });
        } else if (gestureState.dx > SWIPE_THRESHOLD && !isRead) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Animated.spring(swipeX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
          onMarkRead();
        } else {
          Animated.spring(swipeX, {
            toValue: 0,
            tension: 100,
            friction: 10,
            useNativeDriver: true,
          }).start();
        }

        Animated.parallel([
          Animated.timing(deleteOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(readOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(actionScale, { toValue: 0.5, duration: 200, useNativeDriver: true }),
        ]).start();
      },
    })
  ).current;

  // Press handlers
  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(pressScale, { toValue: 0.98, useNativeDriver: true }),
      Animated.timing(glowOpacity, { toValue: 0.3, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(pressScale, { toValue: 1, useNativeDriver: true }),
      Animated.timing(glowOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  // Computed interpolations
  const entryTranslateY = entryAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  const entryScale = entryAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

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
