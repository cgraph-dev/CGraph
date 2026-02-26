/**
 * usePinAndDelete Hook
 *
 * Handles message pin/unpin and delete operations via WebSocket.
 *
 * @module screens/messages/ConversationScreen/hooks
 */

import { useCallback } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import socketManager from '../../../../lib/socket';
import { createLogger } from '../../../../lib/logger';
import type { Message } from '../../../../types';

const logger = createLogger('usePinAndDelete');

interface UsePinAndDeleteOptions {
  conversationId: string;
  userId: string | undefined;
  onMessagePinned: (
    messageId: string,
    isPinned: boolean,
    pinnedAt?: string,
    pinnedById?: string
  ) => void;
  onMessageDeleted: (messageId: string) => void;
  onActionComplete: () => void;
}

interface UsePinAndDeleteReturn {
  handleTogglePin: (message: Message) => void;
  handleUnsend: (message: Message) => void;
}

/**
 * Hook for handling message pin/unpin and delete operations.
 */
export function usePinAndDelete({
  conversationId,
  userId,
  onMessagePinned,
  onMessageDeleted,
  onActionComplete,
}: UsePinAndDeleteOptions): UsePinAndDeleteReturn {
  // Handle pin/unpin message
  const handleTogglePin = useCallback(
    (message: Message) => {
      const channelTopic = `conversation:${conversationId}`;
      const channel = socketManager.getChannel(channelTopic);
      if (!channel) {
        Alert.alert('Error', 'Not connected to conversation');
        onActionComplete();
        return;
      }

      const isPinned = message.is_pinned;
      const event = isPinned ? 'unpin_message' : 'pin_message';

      channel
        .push(event, { message_id: message.id })
        .receive('ok', (response?: unknown) => {
           
          const res = response as Record<string, unknown> | undefined;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onMessagePinned(
            message.id,
            !isPinned,
             
            !isPinned ? (res?.pinned_at as string) || new Date().toISOString() : undefined,
             
            !isPinned ? (res?.pinned_by_id as string) || userId : undefined
          );
        })
        .receive('error', (err: unknown) => {
          const reason =
            typeof err === 'string'
              ? err
               
              : (err as Record<string, unknown>)?.reason ||
                 
                (err as Record<string, unknown>)?.error ||
                '';
          logger.warn('Pin error:', reason);

          let errorMsg = `Failed to ${isPinned ? 'unpin' : 'pin'} message`;

          if (
            reason === 'pin_limit_reached' ||
            (typeof reason === 'string' && reason.includes('limit'))
          ) {
            errorMsg = 'You can only pin up to 3 messages. Unpin a message first.';
          } else if (reason === 'already_pinned') {
            errorMsg = 'This message is already pinned.';
          } else if (reason === 'unauthorized' || reason === 'not_authorized') {
            errorMsg = 'You do not have permission to pin messages.';
          } else if (reason === 'not_found') {
            errorMsg = 'Message not found.';
          }

          Alert.alert('Pin Error', errorMsg);
        });

      onActionComplete();
    },
    [conversationId, userId, onMessagePinned, onActionComplete]
  );

  // Handle unsend/delete message
  const handleUnsend = useCallback(
    (message: Message) => {
      const isOwnMessage = String(userId) === String(message.sender_id);
      if (!isOwnMessage) {
        Alert.alert('Error', 'You can only unsend your own messages');
        onActionComplete();
        return;
      }

      Alert.alert(
        'Unsend Message',
        'This message will be deleted for everyone in this conversation. This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unsend',
            style: 'destructive',
            onPress: () => {
              const channelTopic = `conversation:${conversationId}`;
              const channel = socketManager.getChannel(channelTopic);
              if (!channel) {
                Alert.alert('Error', 'Not connected to conversation');
                return;
              }

              channel
                .push('delete_message', { message_id: message.id })
                .receive('ok', () => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  onMessageDeleted(message.id);
                })
                .receive('error', (err: unknown) => {
                  logger.error('Failed to unsend message:', err);
                  Alert.alert('Error', 'Failed to unsend message');
                });
            },
          },
        ]
      );

      onActionComplete();
    },
    [conversationId, userId, onMessageDeleted, onActionComplete]
  );

  return {
    handleTogglePin,
    handleUnsend,
  };
}

export default usePinAndDelete;
