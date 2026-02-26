/**
 * useMessageActions Hook
 *
 * Manages message action menu state and animations.
 *
 * @module screens/messages/ConversationScreen/hooks
 */

import { durations } from '@cgraph/animation-constants';
import { useState, useCallback } from 'react';
import { useSharedValue, withTiming, withSpring, withDelay, runOnJS, Easing, type SharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { Alert } from 'react-native';
import type { Message } from '../../../../types';
import { createLogger } from '../../../../lib/logger';

const logger = createLogger('useMessageActions');

export interface MessageActionsState {
  selectedMessage: Message | null;
  showMessageActions: boolean;
  replyingTo: Message | null;
}

export interface UseMessageActionsReturn extends MessageActionsState {
  // Animations
  backdropAnim: SharedValue<number>;
  menuScaleAnim: SharedValue<number>;
  messageActionsAnim: SharedValue<number>;
  actionItemAnims: SharedValue<number>[];
  // Actions
  handleMessageLongPress: (message: Message) => void;
  closeMessageActions: () => void;
  setReplyingTo: (message: Message | null) => void;
  handleCopyMessage: (content: string) => Promise<void>;
  clearReply: () => void;
}

/**
 * Hook for managing message action menu state and behavior.
 */
export function useMessageActions(): UseMessageActionsReturn {
  // State
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMessageActions, setShowMessageActions] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  // Animation refs
  const messageActionsAnim = useSharedValue(0);
  const backdropAnim = useSharedValue(0);
  const menuScaleAnim = useSharedValue(0.9);
  const actionItemAnim0 = useSharedValue(0);
  const actionItemAnim1 = useSharedValue(0);
  const actionItemAnim2 = useSharedValue(0);
  const actionItemAnim3 = useSharedValue(0);
  const actionItemAnims = [actionItemAnim0, actionItemAnim1, actionItemAnim2, actionItemAnim3];

  /**
   * Handle long press on message to show actions.
   */
  const handleMessageLongPress = useCallback(
    (message: Message) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setSelectedMessage(message);
      setShowMessageActions(true);

      // Reset all animations
      backdropAnim.value = 0;
      menuScaleAnim.value = 0.9;
      messageActionsAnim.value = 0;
      actionItemAnims.forEach((anim) => (anim.value = 0));

      // Staggered entrance animation
      backdropAnim.value = withTiming(1, { duration: durations.normal.ms, easing: Easing.out(Easing.cubic) });
      menuScaleAnim.value = withSpring(1, { stiffness: 180, damping: 10 });
      messageActionsAnim.value = withSpring(1, { stiffness: 120, damping: 9 });
      actionItemAnims.forEach((anim, index) => {
        anim.value = withDelay(
          40 + index * 25,
          withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) })
        );
      });
    },
    [backdropAnim, menuScaleAnim, messageActionsAnim, actionItemAnims]
  );

  /**
   * Close message actions menu with animation.
   */
  const closeMessageActions = useCallback(() => {
    backdropAnim.value = withTiming(0, { duration: durations.normal.ms });
    menuScaleAnim.value = withTiming(0.9, { duration: durations.normal.ms });
    const afterClose = () => {
      setShowMessageActions(false);
      setSelectedMessage(null);
    };
    messageActionsAnim.value = withTiming(0, { duration: durations.normal.ms }, (finished) => {
      if (finished) runOnJS(afterClose)();
    });
  }, [backdropAnim, menuScaleAnim, messageActionsAnim]);

  /**
   * Copy message content to clipboard.
   */
  const handleCopyMessage = useCallback(async (content: string) => {
    try {
      await Clipboard.setStringAsync(content);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      logger.error('Failed to copy message:', error);
      Alert.alert('Error', 'Failed to copy message');
    }
  }, []);

  /**
   * Clear reply state.
   */
  const clearReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  return {
    // State
    selectedMessage,
    showMessageActions,
    replyingTo,
    // Animations
    backdropAnim,
    menuScaleAnim,
    messageActionsAnim,
    actionItemAnims,
    // Actions
    handleMessageLongPress,
    closeMessageActions,
    setReplyingTo,
    handleCopyMessage,
    clearReply,
  };
}

export default useMessageActions;
