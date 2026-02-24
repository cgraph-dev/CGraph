/**
 * BottomSheet - Premium Animated Bottom Sheet Component
 *
 * A highly customizable bottom sheet with glassmorphism, spring animations,
 * and gesture-based interactions.
 *
 * Features:
 * - Drag-to-dismiss with spring physics
 * - Multiple snap points (partial, half, full)
 * - Glassmorphism backdrop blur
 * - Customizable handle and content
 * - Keyboard-aware positioning
 * - Haptic feedback on interactions
 * - Animated entry/exit
 *
 * @version 1.0.0
 * @since v0.9.0
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  PanResponder,
  Dimensions,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '@/stores';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export type SnapPoint = 'partial' | 'half' | 'full';

export interface BottomSheetProps {
  /** Whether the sheet is visible */
  visible: boolean;
  /** Callback when sheet should close */
  onClose: () => void;
  /** Content to render inside the sheet */
  children: React.ReactNode;
  /** Initial snap point */
  snapPoint?: SnapPoint;
  /** Whether to allow dragging */
  enableDrag?: boolean;
  /** Whether to show the handle */
  showHandle?: boolean;
  /** Custom title for the header */
  title?: string;
  /** Custom height (overrides snap point) */
  height?: number;
  /** Whether backdrop dismisses sheet */
  backdropDismiss?: boolean;
  /** Blur intensity for backdrop */
  backdropBlur?: number;
  /** Callback when snap point changes */
  onSnapChange?: (snapPoint: SnapPoint) => void;
}

const SNAP_POINTS = {
  partial: SCREEN_HEIGHT * 0.35,
  half: SCREEN_HEIGHT * 0.5,
  full: SCREEN_HEIGHT * 0.9,
};

const DRAG_THRESHOLD = 50;
const VELOCITY_THRESHOLD = 0.5;

export default function BottomSheet({
  visible,
  onClose,
  children,
  snapPoint = 'half',
  enableDrag = true,
  showHandle = true,
  title,
  height,
  backdropDismiss = true,
  backdropBlur = 20,
  onSnapChange,
}: BottomSheetProps) {
  const { colors, colorScheme } = useThemeStore();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const [currentSnap, setCurrentSnap] = useState<SnapPoint>(snapPoint);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetHeight = height || SNAP_POINTS[currentSnap];

  // Update snap point
  useEffect(() => {
    setCurrentSnap(snapPoint);
  }, [snapPoint]);

  // Animate in/out
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: SCREEN_HEIGHT - sheetHeight,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, sheetHeight, translateY, backdropOpacity]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss();
    onClose();
  }, [onClose]);

  const snapToPoint = useCallback(
    (point: SnapPoint) => {
      const targetHeight = SNAP_POINTS[point];
      setCurrentSnap(point);
      onSnapChange?.(point);

      Animated.spring(translateY, {
        toValue: SCREEN_HEIGHT - targetHeight,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }).start();
    },
    [translateY, onSnapChange]
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => enableDrag,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        enableDrag && Math.abs(gestureState.dy) > 10,
      onPanResponderGrant: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (_, gestureState) => {
        const newY = SCREEN_HEIGHT - sheetHeight + gestureState.dy;
        if (newY >= SCREEN_HEIGHT - SNAP_POINTS.full) {
          translateY.setValue(newY);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dy, vy } = gestureState;

        // Fast swipe down - close
        if (vy > VELOCITY_THRESHOLD && dy > 0) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          handleClose();
          return;
        }

        // Fast swipe up - expand
        if (vy < -VELOCITY_THRESHOLD && dy < 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          snapToPoint('full');
          return;
        }

        // Slow drag - snap based on position
        const currentY = SCREEN_HEIGHT - sheetHeight + dy;
        const currentHeight = SCREEN_HEIGHT - currentY;

        if (currentHeight < SNAP_POINTS.partial - DRAG_THRESHOLD) {
          handleClose();
        } else if (currentHeight < (SNAP_POINTS.partial + SNAP_POINTS.half) / 2) {
          snapToPoint('partial');
        } else if (currentHeight < (SNAP_POINTS.half + SNAP_POINTS.full) / 2) {
          snapToPoint('half');
        } else {
          snapToPoint('full');
        }
      },
    })
  ).current;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <TouchableWithoutFeedback
          onPress={backdropDismiss ? handleClose : undefined}
        >
          <Animated.View
            style={[
              styles.backdrop,
              { opacity: backdropOpacity },
            ]}
          >
            <BlurView
              intensity={backdropBlur}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </TouchableWithoutFeedback>

        {/* Sheet */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <Animated.View
            style={[
              styles.sheet,
              {
                height: SNAP_POINTS.full,
                backgroundColor: isDark
                  ? 'rgba(17, 24, 39, 0.95)'
                  : 'rgba(255, 255, 255, 0.95)',
                transform: [{ translateY }],
                paddingBottom: insets.bottom,
              },
            ]}
            {...panResponder.panHandlers}
          >
            <BlurView
              intensity={80}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />

            {/* Handle */}
            {showHandle && (
              <View style={styles.handleContainer}>
                <View
                  style={[
                    styles.handle,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.3)'
                        : 'rgba(0, 0, 0, 0.2)',
                    },
                  ]}
                />
              </View>
            )}

            {/* Header with title */}
            {title && (
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>
                  {title}
                </Text>
              </View>
            )}

            {/* Content */}
            <View style={styles.content}>{children}</View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
});
