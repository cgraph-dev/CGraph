/**
 * useConversationSocket Hook
 *
 * Manages WebSocket connection and real-time message handling for conversations.
 * Handles new messages, updates, reactions, pins, and deletions.
 *
 * @module screens/messages/ConversationScreen/hooks
 */

import { useEffect, useRef, useCallback } from 'react';
import socketManager from '../../../../lib/socket';
import { normalizeMessage } from '../../../../lib/normalizers';
import { createLogger } from '../../../../lib/logger';
import type { Message } from '../../../../types';

const logger = createLogger('useConversationSocket');

interface UseConversationSocketOptions {
  conversationId: string;
  userId: string | undefined;
  showReadReceipts?: boolean;
  onNewMessage: (message: Message) => void;
  onMessageUpdated: (message: Message) => void;
  onMessageDeleted: (messageId: string) => void;
  onMessagePinned: (messageId: string, pinnedAt: string, pinnedById: string) => void;
  onMessageUnpinned: (messageId: string) => void;
  onMessageRead: (messageId: string, userId: string) => void;
  onMessageDelivered: (messageId: string) => void;
  onReactionAdded: (data: ReactionData) => void;
  onReactionRemoved: (data: ReactionData) => void;
}

interface ReactionData {
  messageId: string;
  emoji: string;
  userId: string;
  user?: {
    id: string;
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
}

/**
 * Hook for managing conversation WebSocket connection and events.
 */
export function useConversationSocket({
  conversationId,
  userId,
  showReadReceipts = true,
  onNewMessage,
  onMessageUpdated,
  onMessageDeleted,
  onMessagePinned,
  onMessageUnpinned,
  onMessageRead,
  onMessageDelivered,
  onReactionAdded,
  onReactionRemoved,
}: UseConversationSocketOptions) {
  const isMountedRef = useRef(true);
  const cleanupRef = useRef<(() => void) | null>(null);
  const deletedMessageIdsRef = useRef<Set<string>>(new Set());

  // Mark a message as deleted (to prevent re-adding)
  const markMessageDeleted = useCallback((messageId: string) => {
    deletedMessageIdsRef.current.add(messageId);
  }, []);

  // Check if a message was deleted
  const isMessageDeleted = useCallback((messageId: string) => {
    return deletedMessageIdsRef.current.has(messageId);
  }, []);

  // Mark message as read
  const markMessageRead = useCallback(
    (messageId: string) => {
      const channelTopic = `conversation:${conversationId}`;
      const channel = socketManager.getChannel(channelTopic);
      if (channel) {
        channel.push('mark_read', { message_id: messageId });
      }
    },
    [conversationId]
  );

  // Send typing indicator
  const sendTyping = useCallback(
    (isTyping: boolean) => {
      const channelTopic = `conversation:${conversationId}`;
      socketManager.sendTyping(channelTopic, isTyping);
    },
    [conversationId]
  );

  useEffect(() => {
    isMountedRef.current = true;
    const channelTopic = `conversation:${conversationId}`;

    const initializeSocket = async () => {
      await socketManager.connect();
      if (!isMountedRef.current) return;

      socketManager.joinChannel(channelTopic);

      const unsubscribe = socketManager.onChannelMessage(channelTopic, (event, payload) => {
        if (!isMountedRef.current) return;

        // Handle message read event
        if (event === 'message_read') {
           
          const data = payload as { user_id: string; message_id: string };
          if (data.message_id && data.user_id !== userId) {
            onMessageRead(data.message_id, data.user_id);
          }
          return;
        }

        // Handle delivery receipt event
        if (event === 'msg_delivered') {
           
          const data = payload as { message_id: string; delivered_at?: string };
          if (data.message_id) {
            onMessageDelivered(data.message_id);
          }
          return;
        }

        // Handle message deleted
        if (event === 'message_deleted') {
           
          const data = payload as { message_id?: string; message?: { id: string } };
          const messageId = data.message_id || data.message?.id;
          if (messageId) {
            markMessageDeleted(messageId);
            onMessageDeleted(messageId);
          }
          return;
        }

        // Handle message unpinned
        if (event === 'message_unpinned') {
           
          const data = payload as { message_id?: string; message?: { id: string } };
          const messageId = data.message_id || data.message?.id;
          if (messageId) {
            onMessageUnpinned(messageId);
          }
          return;
        }

        // Handle link preview updated
        if (event === 'link_preview_updated') {
           
          const data = payload as { message: Record<string, unknown> };
          if (data.message) {
            const normalized = normalizeMessage(data.message);
            onMessageUpdated(normalized);
          }
          return;
        }

        // Handle reaction added
        if (event === 'reaction_added') {
           
          const data = payload as {
            message_id: string;
            emoji: string;
            user_id: string;
            user?: { id: string; username?: string; display_name?: string; avatar_url?: string };
          };
          if (data.message_id && data.emoji) {
            onReactionAdded({
              messageId: data.message_id,
              emoji: data.emoji,
              userId: data.user_id,
              user: data.user,
            });
          }
          return;
        }

        // Handle reaction removed
        if (event === 'reaction_removed') {
           
          const data = payload as { message_id: string; emoji: string; user_id: string };
          if (data.message_id && data.emoji) {
            onReactionRemoved({
              messageId: data.message_id,
              emoji: data.emoji,
              userId: data.user_id,
            });
          }
          return;
        }

        // Handle message events (new, updated, pinned)
         
        const data = payload as { message: Record<string, unknown> };

        if (!data.message || !data.message.id) {
          if (__DEV__) {
            logger.debug('Skipping invalid message payload:', data);
          }
          return;
        }

        const normalized = normalizeMessage(data.message);

        // Skip messages without sender (except for pin events)
        if (event !== 'message_pinned' && !normalized.sender_id && !normalized.sender?.id) {
          if (__DEV__) {
            logger.debug('Skipping message without sender:', normalized.id);
          }
          return;
        }

        // Validate message has content (except for pin events)
        if (event !== 'message_pinned') {
          const hasContent =
            normalized.content?.trim().length > 0 && normalized.content !== '[Voice Message]';
          const hasMedia = normalized.metadata?.url || normalized.file_url;
          if (!hasContent && !hasMedia) {
            if (__DEV__) {
              logger.debug('Skipping empty message:', normalized.id);
            }
            return;
          }
        }

        switch (event) {
          case 'new_message':
            if (!isMessageDeleted(normalized.id)) {
              onNewMessage(normalized);
              // Mark as read if from someone else (gated by privacy setting)
              if (showReadReceipts && normalized.sender_id !== userId) {
                markMessageRead(normalized.id);
              }
            }
            break;

          case 'message_updated':
            if (!isMessageDeleted(normalized.id)) {
              onMessageUpdated(normalized);
            }
            break;

          case 'message_pinned':
            onMessagePinned(
              normalized.id,
              normalized.pinned_at || new Date().toISOString(),
              normalized.pinned_by_id || ''
            );
            break;
        }
      });

      cleanupRef.current = unsubscribe;
    };

    initializeSocket();

    return () => {
      isMountedRef.current = false;
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      sendTyping(false);
    };
  }, [
    conversationId,
    userId,
    showReadReceipts,
    onNewMessage,
    onMessageUpdated,
    onMessageDeleted,
    onMessagePinned,
    onMessageUnpinned,
    onMessageRead,
    onMessageDelivered,
    onReactionAdded,
    onReactionRemoved,
    markMessageDeleted,
    isMessageDeleted,
    markMessageRead,
    sendTyping,
  ]);

  return {
    markMessageRead,
    markMessageDeleted,
    isMessageDeleted,
    sendTyping,
  };
}

/**
 * Auto-read hook: marks messages as read when they become visible in the viewport.
 * Debounces to max once per 2s. Respects showReadReceipts privacy toggle.
 */
export function useAutoReadOnVisibility({
  conversationId,
  userId,
  showReadReceipts,
}: {
  conversationId: string;
  userId: string | undefined;
  showReadReceipts: boolean;
}) {
  const lastAutoReadRef = useRef<number>(0);
  const initialReadDone = useRef(false);

  // Mark visible messages as read with 2s debounce
  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ item: Message }> }) => {
      if (!showReadReceipts || !userId) return;

      const now = Date.now();
      if (now - lastAutoReadRef.current < 2000) return;

      // Find the latest unread message from the other user
      const latestUnread = viewableItems
        .map((v) => v.item)
        .filter((m) => m.sender_id !== userId && !m.read_at)
        .sort((a, b) => new Date(b.inserted_at || b.created_at).getTime() - new Date(a.inserted_at || a.created_at).getTime())[0];

      if (latestUnread) {
        const channel = socketManager.getChannel(`conversation:${conversationId}`);
        if (channel) {
          channel.push('mark_read', { message_id: latestUnread.id });
          lastAutoReadRef.current = now;
        }
      }
    },
    [conversationId, userId, showReadReceipts]
  );

  // Initial read on conversation open (500ms delay)
  const triggerInitialRead = useCallback(
    (messages: Message[]) => {
      if (initialReadDone.current || !showReadReceipts || !userId) return;
      initialReadDone.current = true;

      setTimeout(() => {
        const latestUnread = messages.find((m) => m.sender_id !== userId && !m.read_at);
        if (latestUnread) {
          const channel = socketManager.getChannel(`conversation:${conversationId}`);
          if (channel) {
            channel.push('mark_read', { message_id: latestUnread.id });
          }
        }
      }, 500);
    },
    [conversationId, userId, showReadReceipts]
  );

  return { handleViewableItemsChanged, triggerInitialRead };
}

export default useConversationSocket;
