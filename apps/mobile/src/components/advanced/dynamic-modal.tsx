/**
 * DynamicModal - Morphing Modal with Multiple Presentation Styles
 *
 * Features:
 * - Multiple presentation modes (fullscreen, half-sheet, card, bottom-sheet)
 * - Smooth morphing between modes
 * - Drag to dismiss with snap points
 * - Backdrop blur with opacity animation
 * - Spring physics for natural feel
 * - Keyboard awareness
 * - Gesture-based interaction
 */

import React, { useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
  Dimensions,
  Platform,
  BackHandler,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
  useAnimatedKeyboard,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

import { SPRING_PRESETS, getSpringConfig } from '../../lib/animations/animation-library';

// ============================================================================
// Types
// ============================================================================

export type ModalPresentation =
  | 'fullscreen'
  | 'pageSheet'
  | 'formSheet'
  | 'bottomSheet'
  | 'card'
  | 'custom';

export interface SnapPoint {
  height: number | string; // Pixel value or percentage
  detent?: 'collapsed' | 'medium' | 'large';
}

export interface DynamicModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;

  // Presentation
  presentation?: ModalPresentation;
  snapPoints?: SnapPoint[];
  initialSnapIndex?: number;

  // Appearance
  backgroundColor?: string;
  backdropColor?: string;
  backdropOpacity?: number;
  borderRadius?: number;
  handleVisible?: boolean;
  handleColor?: string;

  // Behavior
  dismissOnBackdrop?: boolean;
  dismissOnSwipeDown?: boolean;
  dismissThreshold?: number;
  keyboardAware?: boolean;

  // Style
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;

  // Animation
  springPreset?: keyof typeof SPRING_PRESETS;
  animationDuration?: number;

  // Haptics
  hapticFeedback?: boolean;

  // Callbacks
  onSnapChange?: (index: number) => void;
}

// ============================================================================
// Constants
// ============================================================================

const { height: SCREEN_HEIGHT, width: _SCREEN_WIDTH } = Dimensions.get('window');

const PRESENTATION_CONFIGS: Record<ModalPresentation, { height: number; borderRadius: number }> = {
  fullscreen: { height: SCREEN_HEIGHT, borderRadius: 0 },
  pageSheet: { height: SCREEN_HEIGHT * 0.92, borderRadius: 20 },
  formSheet: { height: SCREEN_HEIGHT * 0.6, borderRadius: 20 },
  bottomSheet: { height: SCREEN_HEIGHT * 0.5, borderRadius: 24 },
  card: { height: SCREEN_HEIGHT * 0.4, borderRadius: 28 },
  custom: { height: SCREEN_HEIGHT * 0.5, borderRadius: 20 },
};

const DEFAULT_SNAP_POINTS: SnapPoint[] = [
  { height: '50%', detent: 'medium' },
  { height: '90%', detent: 'large' },
];

// ============================================================================
// Component
// ============================================================================

/**
 * Dynamic Modal component.
 *
 */
export function DynamicModal({
  visible,
  onClose,
  children,
  presentation = 'bottomSheet',
  snapPoints,
  initialSnapIndex = 0,
  backgroundColor = '#1f2937',
  backdropColor = '#000000',
  backdropOpacity = 0.5,
  borderRadius,
  handleVisible = true,
  handleColor = '#4b5563',
  dismissOnBackdrop = true,
  dismissOnSwipeDown = true,
  dismissThreshold = 150,
  keyboardAware = true,
  style,
  contentStyle,
  springPreset = 'bouncy',
  animationDuration = 300,
  hapticFeedback = true,
  onSnapChange,
}: DynamicModalProps) {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropProgress = useSharedValue(0);
  const currentSnapIndex = useSharedValue(initialSnapIndex);
  const isDragging = useSharedValue(false);

  const springConfig = SPRING_PRESETS[springPreset];
  const presentationConfig = PRESENTATION_CONFIGS[presentation];
  const effectiveBorderRadius = borderRadius ?? presentationConfig.borderRadius;

  // Calculate snap point heights
  const snapPointHeights = useMemo(() => {
    const points = snapPoints || DEFAULT_SNAP_POINTS;
    return points.map((point) => {
      if (typeof point.height === 'string' && point.height.endsWith('%')) {
        const percentage = parseFloat(point.height) / 100;
        return SCREEN_HEIGHT * percentage;
      }

       
      return point.height as number;
    });
  }, [snapPoints]);

  // Get current modal height
  const getModalHeight = useCallback(
    (snapIndex: number) => {
      if (presentation !== 'custom' && !snapPoints) {
        return presentationConfig.height;
      }
      return snapPointHeights[snapIndex] || snapPointHeights[0] || presentationConfig.height;
    },
    [presentation, snapPoints, snapPointHeights, presentationConfig]
  );

  // Keyboard handling
  const keyboard = useAnimatedKeyboard();

  // Handle Android back button
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (visible) {
        onClose();
        return true;
      }
      return false;
    });

    return () => handler.remove();
  }, [visible, onClose]);

  const springCfg = getSpringConfig(springConfig);

  // Animate visibility
  useEffect(() => {
    if (visible) {
      const targetY = SCREEN_HEIGHT - getModalHeight(initialSnapIndex);
      translateY.value = withSpring(targetY, springCfg);
      backdropProgress.value = withTiming(1, { duration: animationDuration });
      currentSnapIndex.value = initialSnapIndex;
    } else {
      translateY.value = withSpring(SCREEN_HEIGHT, springCfg);
      backdropProgress.value = withTiming(0, { duration: animationDuration });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, initialSnapIndex]);

  // Haptic feedback helper
  const triggerHaptic = useCallback(
    (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
      if (hapticFeedback) {
        Haptics.impactAsync(style);
      }
    },
    [hapticFeedback]
  );

  // Close modal
  const close = useCallback(() => {
    translateY.value = withSpring(SCREEN_HEIGHT, springCfg);
    backdropProgress.value = withTiming(0, { duration: animationDuration }, () => {
      runOnJS(onClose)();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [springCfg, animationDuration, onClose]);

  // Snap to index
  const snapToIndex = useCallback(
    (index: number) => {
      const height = getModalHeight(index);
      const targetY = SCREEN_HEIGHT - height;

      translateY.value = withSpring(targetY, springCfg);
      currentSnapIndex.value = index;

      if (onSnapChange) {
        runOnJS(onSnapChange)(index);
      }

      runOnJS(triggerHaptic)(Haptics.ImpactFeedbackStyle.Light);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getModalHeight, springConfig, onSnapChange, triggerHaptic]
  );

  // Context for gesture tracking
  const gestureContext = useSharedValue({ startY: 0, currentSnapIndex: 0 });

  // Gesture handler using new Gesture API
  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      gestureContext.value = {
        startY: translateY.value,
        currentSnapIndex: currentSnapIndex.value,
      };
      isDragging.value = true;
    })
    .onUpdate((event) => {
      'worklet';
      // Only allow dragging down (positive Y) or within bounds
      const newY = gestureContext.value.startY + event.translationY;
      const minY = SCREEN_HEIGHT - getModalHeight(snapPointHeights.length - 1);
      const maxY = SCREEN_HEIGHT;

      translateY.value = Math.max(minY, Math.min(maxY, newY));

      // Update backdrop based on position
      const progress = interpolate(
        translateY.value,
        [SCREEN_HEIGHT - getModalHeight(0), SCREEN_HEIGHT],
        [1, 0],
        Extrapolate.CLAMP
      );
      backdropProgress.value = progress;
    })
    .onEnd((event) => {
      'worklet';
      isDragging.value = false;

      // Check if should dismiss
      if (dismissOnSwipeDown && event.translationY > dismissThreshold) {
        runOnJS(close)();
        return;
      }

      // Find nearest snap point
      const currentY = translateY.value;
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      snapPointHeights.forEach((height, index) => {
        const snapY = SCREEN_HEIGHT - height;
        const distance = Math.abs(currentY - snapY);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      // Factor in velocity
      if (Math.abs(event.velocityY) > 500) {
        if (event.velocityY > 0) {
          // Swiping down - go to smaller snap point or dismiss
          nearestIndex = Math.max(0, nearestIndex - 1);
          if (nearestIndex === 0 && event.velocityY > 1000 && dismissOnSwipeDown) {
            runOnJS(close)();
            return;
          }
        } else {
          // Swiping up - go to larger snap point
          nearestIndex = Math.min(snapPointHeights.length - 1, nearestIndex + 1);
        }
      }

      runOnJS(snapToIndex)(nearestIndex);
    });

  // Animated styles
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(backdropProgress.value, [0, 1], [0, backdropOpacity]),
    backgroundColor: backdropColor,
  }));

  const modalStyle = useAnimatedStyle(() => {
    let translateYValue = translateY.value;

    // Adjust for keyboard if needed
    if (keyboardAware) {
      const keyboardHeight = keyboard.height.value;
      if (keyboardHeight > 0) {
        translateYValue -= keyboardHeight;
      }
    }

    return {
      transform: [{ translateY: translateYValue }],
    };
  });

  if (!visible && backdropProgress.value === 0) {
    return null;
  }

  // Backdrop tap gesture
  const backdropTap = Gesture.Tap().onEnd(() => {
    'worklet';
    if (dismissOnBackdrop) {
      runOnJS(close)();
    }
  });

  return (
    <View style={styles.overlay} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Backdrop */}
      <GestureDetector gesture={backdropTap}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
      </GestureDetector>

      {/* Modal */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.modal,
            {
              backgroundColor,
              borderTopLeftRadius: effectiveBorderRadius,
              borderTopRightRadius: effectiveBorderRadius,
            },
            modalStyle,
            style,
          ]}
        >
          {/* Handle */}
          {handleVisible && (
            <View style={styles.handleContainer}>
              <View style={[styles.handle, { backgroundColor: handleColor }]} />
            </View>
          )}

          {/* Content */}
          <View style={[styles.content, contentStyle]}>{children}</View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

// ============================================================================
// Convenience Components
// ============================================================================

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Bottom Sheet component.
 *
 */
export function BottomSheet({ visible, onClose, children, title, style }: BottomSheetProps) {
  return (
    <DynamicModal visible={visible} onClose={onClose} presentation="bottomSheet" style={style}>
      {title && (
        <View style={styles.sheetHeader}>
          <Animated.Text style={styles.sheetTitle}>{title}</Animated.Text>
        </View>
      )}
      {children}
    </DynamicModal>
  );
}

export interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  actions: Array<{
    label: string;
    onPress: () => void;
    destructive?: boolean;
  }>;
  cancelLabel?: string;
}

/**
 * Action Sheet component.
 *
 */
export function ActionSheet({
  visible,
  onClose,
  actions,
  cancelLabel = 'Cancel',
}: ActionSheetProps) {
  return (
    <DynamicModal visible={visible} onClose={onClose} presentation="card">
      <View style={styles.actionSheet}>
        {actions.map((action, index) => (
          <Animated.Text
            key={index}
            style={[styles.actionItem, action.destructive && styles.destructiveAction]}
            onPress={() => {
              action.onPress();
              onClose();
            }}
          >
            {action.label}
          </Animated.Text>
        ))}

        <View style={styles.actionSeparator} />

        <Animated.Text style={styles.cancelAction} onPress={onClose}>
          {cancelLabel}
        </Animated.Text>
      </View>
    </DynamicModal>
  );
}

export interface AlertModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  destructive?: boolean;
}

/**
 * Alert Modal component.
 *
 */
export function AlertModal({
  visible,
  onClose,
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  onConfirm,
  destructive = false,
}: AlertModalProps) {
  return (
    <DynamicModal
      visible={visible}
      onClose={onClose}
      presentation="card"
      dismissOnSwipeDown={false}
    >
      <View style={styles.alertContent}>
        <Animated.Text style={styles.alertTitle}>{title}</Animated.Text>
        {message && <Animated.Text style={styles.alertMessage}>{message}</Animated.Text>}

        <View style={styles.alertButtons}>
          <Animated.Text style={styles.alertCancelButton} onPress={onClose}>
            {cancelLabel}
          </Animated.Text>
          <Animated.Text
            style={[styles.alertConfirmButton, destructive && styles.destructiveAction]}
            onPress={() => {
              onConfirm?.();
              onClose();
            }}
          >
            {confirmLabel}
          </Animated.Text>
        </View>
      </View>
    </DynamicModal>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 24,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sheetHeader: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  actionSheet: {
    gap: 8,
  },
  actionItem: {
    fontSize: 18,
    color: '#10b981',
    textAlign: 'center',
    paddingVertical: 16,
    backgroundColor: '#374151',
    borderRadius: 12,
    overflow: 'hidden',
  },
  destructiveAction: {
    color: '#ef4444',
  },
  actionSeparator: {
    height: 8,
  },
  cancelAction: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    paddingVertical: 16,
    backgroundColor: '#374151',
    borderRadius: 12,
    overflow: 'hidden',
  },
  alertContent: {
    alignItems: 'center',
    gap: 12,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 22,
  },
  alertButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  alertCancelButton: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 14,
    backgroundColor: '#374151',
    borderRadius: 10,
    overflow: 'hidden',
  },
  alertConfirmButton: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    textAlign: 'center',
    paddingVertical: 14,
    backgroundColor: '#374151',
    borderRadius: 10,
    overflow: 'hidden',
  },
});

export default DynamicModal;
