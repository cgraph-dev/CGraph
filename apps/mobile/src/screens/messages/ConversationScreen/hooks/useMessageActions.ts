/**
 * useMessageActions Hook
 *
 * Manages message action menu state and animations.
 *
 * @module screens/messages/ConversationScreen/hooks
 */

import { useState, useRef, useCallback } from 'react';
import { Animated, Easing } from 'react-native';
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
  backdropAnim: Animated.Value;
  menuScaleAnim: Animated.Value;
  messageActionsAnim: Animated.Value;
  actionItemAnims: Animated.Value[];
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
  const messageActionsAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const menuScaleAnim = useRef(new Animated.Value(0.9)).current;
  const actionItemAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  /**
   * Handle long press on message to show actions.
   */
  const handleMessageLongPress = useCallback(
    (message: Message) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setSelectedMessage(message);
      setShowMessageActions(true);

      // Reset all animations
      backdropAnim.setValue(0);
      menuScaleAnim.setValue(0.9);
      messageActionsAnim.setValue(0);
      actionItemAnims.forEach((anim) => anim.setValue(0));

      // Staggered entrance animation
      Animated.parallel([
        // Backdrop fade in
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        // Menu scale — bouncier spring for Telegram-like feel
        Animated.spring(menuScaleAnim, {
          toValue: 1,
          tension: 180,
          friction: 10,
          useNativeDriver: true,
        }),
        // Menu slide up with overshoot
        Animated.spring(messageActionsAnim, {
          toValue: 1,
          tension: 120,
          friction: 9,
          useNativeDriver: true,
        }),
        // Staggered action items — faster cascade
        ...actionItemAnims.map((anim, index) =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 180,
            delay: 40 + index * 25,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          })
        ),
      ]).start();
    },
    [backdropAnim, menuScaleAnim, messageActionsAnim, actionItemAnims]
  );

  /**
   * Close message actions menu with animation.
   */
  const closeMessageActions = useCallback(() => {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(menuScaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(messageActionsAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowMessageActions(false);
      setSelectedMessage(null);
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
