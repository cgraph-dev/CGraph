/**
 * Chat Store
 *
 * Manages messaging state including conversations, messages, typing indicators,
 * reactions, and real-time updates. Core store for all chat functionality.
 *
 * ## Features
 * - Real-time message sync via Phoenix Channels
 * - End-to-end encryption (E2EE) support
 * - Message reactions and threading
 * - Typing indicators with debouncing
 * - Optimistic updates with rollback
 * - Virtualized message rendering support
 *
 * ## Usage
 *
 * ```tsx
 * import { useChatStore } from '@/stores/chatStore';
 *
 * function MessageList({ conversationId }) {
 *   const messages = useChatStore((s) => s.messages[conversationId] || []);
 *   const sendMessage = useChatStore((s) => s.sendMessage);
 *
 *   return (
 *     <div>
 *       {messages.map((msg) => (
 *         <Message key={msg.id} message={msg} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 *
 * ## State
 * - `conversations` - List of user's conversations
 * - `messages` - Messages indexed by conversation ID
 * - `activeConversationId` - Currently open conversation
 * - `typingUsers` - Users currently typing per conversation
 *
 * ## Actions
 * - `fetchConversations()` - Load conversation list
 * - `fetchMessages(conversationId)` - Load messages for conversation
 * - `sendMessage(conversationId, content, options)` - Send a message
 * - `addReactionToMessage(messageId, emoji)` - Add reaction
 * - `setTyping(conversationId, isTyping)` - Broadcast typing status
 *
 * @module stores/chatStore
 * @version 0.9.9
 * @since v0.1.0
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { api } from '@/lib/api';
import { createIdempotencyKey } from '@cgraph/utils';
import {
  ensureArray,
  ensureObject,
  normalizeMessage,
  normalizeConversations,
} from '@/lib/apiUtils';
import { useE2EEStore } from '@/lib/crypto/e2eeStore';
import { useAuthStore } from '@/stores/authStore';
import { chatLogger as logger } from '@/lib/logger';

/**
 * Finds the conversation ID that contains a given message.
 * Returns null if the message is not found in any conversation.
 */
function findConversationForMessage(
  messages: Record<string, { id: string }[]>,
  messageId: string
): string | null {
  for (const [convId, convMessages] of Object.entries(messages)) {
    if (convMessages.some((msg) => msg.id === messageId)) {
      return convId;
    }
  }
  return null;
}

/**
 * Updates a message's reactions across all conversations.
 * Returns a new messages object with the updated message.
 */
function updateMessageReactions(
  messages: Record<string, Message[]>,
  messageId: string,
  updateFn: (reactions: Reaction[]) => Reaction[]
): Record<string, Message[]> {
  const updatedMessages: Record<string, Message[]> = {};

  for (const [convId, convMessages] of Object.entries(messages)) {
    const messageIndex = convMessages.findIndex((m) => m.id === messageId);

    if (messageIndex === -1) {
      updatedMessages[convId] = convMessages;
      continue;
    }

    const message = convMessages[messageIndex];
    if (!message) {
      updatedMessages[convId] = convMessages;
      continue;
    }

    const updatedReactions = updateFn(message.reactions || []);
    const updatedMessage: Message = { ...message, reactions: updatedReactions };
    const updatedList = [...convMessages];
    updatedList[messageIndex] = updatedMessage;
    updatedMessages[convId] = updatedList;
  }

  return updatedMessages;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  encryptedContent: string | null;
  isEncrypted: boolean;
  messageType:
    | 'text'
    | 'image'
    | 'video'
    | 'file'
    | 'audio'
    | 'voice'
    | 'sticker'
    | 'gif'
    | 'system';
  replyToId: string | null;
  replyTo: Message | null;
  isPinned: boolean;
  isEdited: boolean;
  deletedAt: string | null;
  metadata: MessageMetadata;
  reactions: Reaction[];
  sender: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    avatarBorderId?: string | null;
    // Sender theme for customization
    theme?: string | null;
  };
  // Sender theme (may also be at root level)
  senderTheme?: string | null;
  createdAt: string;
  updatedAt: string;
  // E2EE metadata for decryption
  ephemeralPublicKey?: string;
  nonce?: string;
  senderIdentityKey?: string;
  // Message scheduling
  scheduledAt?: string | null;
  scheduleStatus?: 'immediate' | 'scheduled' | 'sent' | 'cancelled';
}

/**
 * Message metadata - extensible with typed common properties
 */
export interface MessageMetadata {
  // File/media metadata
  url?: string;
  filename?: string;
  size?: number;
  mimeType?: string;
  thumbnailUrl?: string;
  duration?: number;
  waveform?: number[];
  width?: number;
  height?: number;
  // Read receipts
  readBy?: Array<{ userId: string; readAt: string }>;
  // Sticker metadata
  stickerId?: string;
  stickerPackId?: string;
  // GIF metadata
  gifId?: string;
  gifUrl?: string;
  // Allow additional properties
  [key: string]: unknown;
}

export interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  user: {
    id: string;
    username: string;
  };
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name: string | null;
  avatarUrl: string | null;
  participants: ConversationParticipant[];
  lastMessage: Message | null;
  unreadCount: number;
  isGroup?: boolean; // Convenience property (derived from type === 'group')
  isPinned?: boolean; // Whether the conversation is pinned
  isMuted?: boolean; // Whether notifications are muted
  createdAt: string;
  updatedAt: string;
}

export interface ConversationParticipant {
  id: string;
  userId: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    status: string;
    lastSeenAt?: string | null;
    avatarBorderId?: string | null;
    // Gamification fields (optional - may not be present in all contexts)
    level?: number;
    xp?: number;
    karma?: number;
    streak?: number;
    bio?: string | null;
    badges?: string[];
    theme?: string | null;
    sharedForums?: Array<{ id: string; name: string }>;
  };
  nickname: string | null;
  isMuted: boolean;
  mutedUntil: string | null;
  joinedAt: string;
}

// Typing user with timestamp for accurate display
export interface TypingUserInfo {
  userId: string;
  startedAt?: string;
}

export interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  // O(1) message ID lookup for deduplication - scales to millions of messages
  messageIdSets: Record<string, Set<string>>;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  typingUsers: Record<string, string[]>;
  typingUsersInfo: Record<string, TypingUserInfo[]>;
  hasMoreMessages: Record<string, boolean>;
  // TTL cache to prevent repeated fetchConversations calls (scales to high traffic)
  conversationsLastFetchedAt: number | null;
  // Scheduled messages
  scheduledMessages: Record<string, Message[]>;
  isLoadingScheduledMessages: boolean;

  // Actions
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string, before?: string) => Promise<void>;
  sendMessage: (
    conversationId: string,
    content: string,
    replyToId?: string,
    options?: { type?: string; metadata?: Record<string, any>; forceUnencrypted?: boolean }
  ) => Promise<void>;
  sendEncryptedMessage: (
    conversationId: string,
    recipientId: string,
    content: string,
    replyToId?: string
  ) => Promise<void>;
  decryptAndAddMessage: (message: Message) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
  setActiveConversation: (conversationId: string | null) => void;
  addMessage: (message: Message) => void;
  updateMessage: (message: Message) => void;
  removeMessage: (messageId: string, conversationId: string) => void;
  setTypingUser: (
    conversationId: string,
    userId: string,
    isTyping: boolean,
    startedAt?: string
  ) => void;
  markAsRead: (conversationId: string) => Promise<void>;
  createConversation: (userIds: string[]) => Promise<Conversation>;
  getRecipientId: (conversationId: string, currentUserId: string) => string | null;
  // Real-time conversation updates from socket
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversation: Partial<Conversation> & { id: string }) => void;
  // Real-time reaction updates from socket
  addReactionToMessage: (
    messageId: string,
    emoji: string,
    userId: string,
    username?: string
  ) => void;
  removeReactionFromMessage: (messageId: string, emoji: string, userId: string) => void;
  // Message scheduling
  fetchScheduledMessages: (conversationId: string) => Promise<void>;
  scheduleMessage: (
    conversationId: string,
    content: string,
    scheduledAt: Date,
    options?: { type?: string; metadata?: Record<string, any>; replyToId?: string }
  ) => Promise<void>;
  cancelScheduledMessage: (messageId: string) => Promise<void>;
  rescheduleMessage: (messageId: string, newScheduledAt: Date) => Promise<void>;
}

export const useChatStore = create<ChatState>()(
  devtools(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      messages: {},
      messageIdSets: {},
      isLoadingConversations: false,
      isLoadingMessages: false,
      typingUsers: {},
      typingUsersInfo: {},
      hasMoreMessages: {},
      conversationsLastFetchedAt: null,
      scheduledMessages: {},
      isLoadingScheduledMessages: false,

      fetchConversations: async () => {
        const { conversationsLastFetchedAt, isLoadingConversations } = get();
        const now = Date.now();
        const CACHE_TTL = 30000; // 30 seconds

        // Skip if already loading or recently fetched (TTL cache)
        if (isLoadingConversations) return;
        if (conversationsLastFetchedAt && now - conversationsLastFetchedAt < CACHE_TTL) {
          return; // Cache still valid
        }

        set({ isLoadingConversations: true });
        try {
          const response = await api.get('/api/v1/conversations');
          const rawConversations = ensureArray<Record<string, unknown>>(
            response.data,
            'conversations'
          );
          const normalizedConversations = normalizeConversations(
            rawConversations
          ) as unknown as Conversation[];
          set({
            conversations: normalizedConversations,
            isLoadingConversations: false,
            conversationsLastFetchedAt: now,
          });
        } catch (error: unknown) {
          set({ isLoadingConversations: false });
          throw error;
        }
      },

      fetchMessages: async (conversationId: string, before?: string) => {
        set({ isLoadingMessages: true });
        try {
          const params = before ? { before, limit: 50 } : { limit: 50 };
          const response = await api.get(`/api/v1/conversations/${conversationId}/messages`, {
            params,
          });
          const rawMessages = ensureArray<Record<string, unknown>>(response.data, 'messages');
          const newMessages = rawMessages.map((m) => normalizeMessage(m)) as unknown as Message[];
          const hasMore = newMessages.length === 50;

          set((state) => {
            // Build message ID set for O(1) deduplication
            const existingIds = state.messageIdSets[conversationId] || new Set<string>();
            const newIdSet = new Set(existingIds);
            newMessages.forEach((m) => newIdSet.add(m.id));

            return {
              messages: {
                ...state.messages,
                [conversationId]: before
                  ? [...newMessages, ...(state.messages[conversationId] || [])]
                  : newMessages,
              },
              messageIdSets: {
                ...state.messageIdSets,
                [conversationId]: newIdSet,
              },
              hasMoreMessages: {
                ...state.hasMoreMessages,
                [conversationId]: hasMore,
              },
              isLoadingMessages: false,
            };
          });
        } catch (error: unknown) {
          set({ isLoadingMessages: false });
          throw error;
        }
      },

      sendMessage: async (
        conversationId: string,
        content: string,
        replyToId?: string,
        options?: { type?: string; metadata?: Record<string, any>; forceUnencrypted?: boolean }
      ) => {
        // Check if E2EE is available and get recipient for encryption
        const e2eeStore = useE2EEStore.getState();
        const clientMessageId = createIdempotencyKey();
        const { conversations } = get();
        const conversation = conversations.find((c) => c.id === conversationId);
        const contentType = options?.type || 'text';
        const metadata = options?.metadata || {};
        const forceUnencrypted = options?.forceUnencrypted || false;

        // Get current user ID from auth store for recipient detection
        // For direct conversations, encrypt if E2EE is initialized (unless user explicitly chose unencrypted)
        if (e2eeStore.isInitialized && conversation?.type === 'direct' && !forceUnencrypted) {
          const currentUserId = useAuthStore.getState().user?.id;

          // Find recipient (the other participant)
          const recipientParticipant = currentUserId
            ? conversation.participants.find((p) => p.userId !== currentUserId)
            : conversation.participants.find(
                (p) => p.userId !== conversation.participants[0]?.userId
              ) || conversation.participants[1];

          if (recipientParticipant) {
            try {
              // Encrypt the message using E2EE
              const encryptedMsg = await e2eeStore.encryptMessage(
                recipientParticipant.userId,
                content
              );

              const payload: Record<string, unknown> = {
                content: encryptedMsg.ciphertext,
                is_encrypted: true,
                ephemeral_public_key: encryptedMsg.ephemeralPublicKey,
                nonce: encryptedMsg.nonce,
                recipient_identity_key_id: encryptedMsg.recipientIdentityKeyId,
                one_time_prekey_id: encryptedMsg.oneTimePreKeyId,
                client_message_id: clientMessageId,
              };
              if (replyToId) payload.reply_to_id = replyToId;

              const response = await api.post(
                `/api/v1/conversations/${conversationId}/messages`,
                payload
              );
              const rawMessage = ensureObject<Record<string, unknown>>(response.data, 'message');
              if (rawMessage) {
                const message = normalizeMessage(rawMessage) as unknown as Message;
                // Store plaintext locally for sender (we know what we sent)
                message.content = content;
                get().addMessage(message);
              }

              logger.log('Sent E2EE encrypted message');
              return;
            } catch (encryptError) {
              logger.error('E2EE encryption failed:', encryptError);

              // SECURITY: Do NOT silently fall back to plaintext!
              // This is a direct conversation with E2EE initialized - the user expects encryption.
              // Sending plaintext would violate their security expectations.

              const errorMsg =
                encryptError instanceof Error ? encryptError.message : 'Unknown error';

              // Show user-friendly error message
              throw new Error(
                `Failed to encrypt message: ${errorMsg}. ` +
                  'Please try again or check your encryption keys. ' +
                  'Your message was NOT sent to protect your privacy.'
              );
            }
          }
        }

        // Fallback: Send plaintext (for group chats or when E2EE not available)
        // This path should ONLY be reached for:
        // - Group conversations (not direct)
        // - Direct conversations where E2EE is not initialized
        const payload: Record<string, any> = {
          content,
          client_message_id: clientMessageId,
          content_type: contentType,
        };
        if (replyToId) payload.reply_to_id = replyToId;

        // Add file metadata if provided
        if (metadata.fileUrl) {
          payload.file_url = metadata.fileUrl;
          payload.file_name = metadata.fileName;
          payload.file_size = metadata.fileSize;
          payload.file_mime_type = metadata.fileMimeType;
          if (metadata.thumbnailUrl) payload.thumbnail_url = metadata.thumbnailUrl;
        }

        // Add other metadata
        if (metadata && Object.keys(metadata).length > 0) {
          payload.metadata = metadata;
        }

        const response = await api.post(
          `/api/v1/conversations/${conversationId}/messages`,
          payload
        );
        const rawMessage = ensureObject<Record<string, unknown>>(response.data, 'message');
        if (rawMessage) {
          const message = normalizeMessage(rawMessage) as unknown as Message;
          get().addMessage(message);
        }
      },

      /**
       * Send an encrypted message with explicit recipient ID
       * Used when caller already knows the recipient
       */
      sendEncryptedMessage: async (
        conversationId: string,
        recipientId: string,
        content: string,
        replyToId?: string
      ) => {
        const e2eeStore = useE2EEStore.getState();

        if (!e2eeStore.isInitialized) {
          throw new Error('E2EE not initialized - cannot send encrypted message');
        }

        try {
          const encryptedMsg = await e2eeStore.encryptMessage(recipientId, content);

          const payload: Record<string, unknown> = {
            content: encryptedMsg.ciphertext,
            is_encrypted: true,
            ephemeral_public_key: encryptedMsg.ephemeralPublicKey,
            nonce: encryptedMsg.nonce,
            recipient_identity_key_id: encryptedMsg.recipientIdentityKeyId,
            one_time_prekey_id: encryptedMsg.oneTimePreKeyId,
            client_message_id: createIdempotencyKey(),
          };
          if (replyToId) payload.reply_to_id = replyToId;

          const response = await api.post(
            `/api/v1/conversations/${conversationId}/messages`,
            payload
          );
          const rawMessage = ensureObject<Record<string, unknown>>(response.data, 'message');
          if (rawMessage) {
            const message = normalizeMessage(rawMessage) as unknown as Message;
            // Store plaintext locally for sender
            message.content = content;
            get().addMessage(message);
          }

          logger.log('Sent E2EE encrypted message via sendEncryptedMessage');
        } catch (error: unknown) {
          logger.error('Failed to send encrypted message:', error);
          throw error;
        }
      },

      /**
       * Decrypt an incoming encrypted message and add it to the store
       */
      decryptAndAddMessage: async (message: Message) => {
        const e2eeStore = useE2EEStore.getState();

        // If not encrypted or E2EE not initialized, just add as-is
        if (!message.isEncrypted || !e2eeStore.isInitialized) {
          get().addMessage(message);
          return;
        }

        try {
          // We need the sender's identity key and the encrypted message details
          // These should be in the message metadata from the server
          const metadata = (message.metadata || {}) as Record<string, unknown>;
          const encryptedPayload = {
            ciphertext: message.encryptedContent || message.content,
            ephemeralPublicKey:
              message.ephemeralPublicKey || (metadata.ephemeral_public_key as string),
            recipientIdentityKeyId: (metadata.recipient_identity_key_id as string) || '',
            oneTimePreKeyId: metadata.one_time_prekey_id as string | undefined,
            nonce: message.nonce || (metadata.nonce as string),
          };

          const senderIdentityKey =
            message.senderIdentityKey || (metadata.sender_identity_key as string);

          if (
            !encryptedPayload.ephemeralPublicKey ||
            !senderIdentityKey ||
            !encryptedPayload.nonce
          ) {
            logger.warn('Missing E2EE metadata for decryption, showing encrypted message');
            get().addMessage({ ...message, content: '[Encrypted message - unable to decrypt]' });
            return;
          }

          const plaintext = await e2eeStore.decryptMessage(
            message.senderId,
            senderIdentityKey,
            encryptedPayload
          );

          // Add decrypted message
          get().addMessage({ ...message, content: plaintext });
          logger.log('Decrypted and added E2EE message');
        } catch (error: unknown) {
          logger.error('Failed to decrypt message:', error);
          // Show placeholder for failed decryption
          get().addMessage({ ...message, content: '[Unable to decrypt message]' });
        }
      },

      editMessage: async (messageId: string, content: string) => {
        const conversationId = findConversationForMessage(get().messages, messageId);
        if (!conversationId) {
          throw new Error('Message not found in any conversation');
        }

        const response = await api.patch(
          `/api/v1/conversations/${conversationId}/messages/${messageId}`,
          { content }
        );
        const rawMessage = ensureObject<Record<string, unknown>>(response.data, 'message');
        if (rawMessage) {
          const message = normalizeMessage(rawMessage) as unknown as Message;
          get().updateMessage(message);
        }
      },

      deleteMessage: async (messageId: string) => {
        const conversationId = findConversationForMessage(get().messages, messageId);
        if (!conversationId) {
          throw new Error('Message not found in any conversation');
        }

        await api.delete(`/api/v1/conversations/${conversationId}/messages/${messageId}`);
        get().removeMessage(messageId, conversationId);
      },

      addReaction: async (messageId: string, emoji: string) => {
        await api.post(`/api/v1/messages/${messageId}/reactions`, { emoji });
      },

      removeReaction: async (messageId: string, emoji: string) => {
        await api.delete(`/api/v1/messages/${messageId}/reactions/${emoji}`);
      },

      setActiveConversation: (conversationId: string | null) => {
        set({ activeConversationId: conversationId });
      },

      addMessage: (message: Message) => {
        // Use queueMicrotask to batch rapid message updates
        // This prevents UI freeze from cascading re-renders when receiving
        // multiple real-time messages in quick succession
        queueMicrotask(() => {
          set((state) => {
            const conversationMessages = state.messages[message.conversationId] || [];
            const idSet = state.messageIdSets[message.conversationId] || new Set<string>();

            // O(1) deduplication check - scales to millions of messages
            if (idSet.has(message.id)) {
              return state;
            }

            // Create new Set with the message ID added
            const newIdSet = new Set(idSet);
            newIdSet.add(message.id);

            // Only update lastMessage if this is the newest message
            const shouldUpdateLastMessage =
              !state.conversations.find((c) => c.id === message.conversationId)?.lastMessage ||
              new Date(message.createdAt) >
                new Date(
                  state.conversations.find((c) => c.id === message.conversationId)?.lastMessage
                    ?.createdAt || 0
                );

            return {
              messages: {
                ...state.messages,
                [message.conversationId]: [...conversationMessages, message],
              },
              messageIdSets: {
                ...state.messageIdSets,
                [message.conversationId]: newIdSet,
              },
              // Only update conversations array if necessary (reduces re-renders)
              conversations: shouldUpdateLastMessage
                ? state.conversations.map((conv) =>
                    conv.id === message.conversationId
                      ? { ...conv, lastMessage: message, updatedAt: message.createdAt }
                      : conv
                  )
                : state.conversations,
            };
          });
        });
      },

      updateMessage: (message: Message) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [message.conversationId]: (state.messages[message.conversationId] || []).map((m) =>
              m.id === message.id ? message : m
            ),
          },
        }));
      },

      removeMessage: (messageId: string, conversationId: string) => {
        set((state) => {
          // Remove from ID set for O(1) deduplication consistency
          const idSet = state.messageIdSets[conversationId];
          if (idSet) {
            const newIdSet = new Set(idSet);
            newIdSet.delete(messageId);
            return {
              messages: {
                ...state.messages,
                [conversationId]: (state.messages[conversationId] || []).filter(
                  (m) => m.id !== messageId
                ),
              },
              messageIdSets: {
                ...state.messageIdSets,
                [conversationId]: newIdSet,
              },
            };
          }
          return {
            messages: {
              ...state.messages,
              [conversationId]: (state.messages[conversationId] || []).filter(
                (m) => m.id !== messageId
              ),
            },
          };
        });
      },

      setTypingUser: (
        conversationId: string,
        userId: string,
        isTyping: boolean,
        startedAt?: string
      ) => {
        set((state) => {
          const currentIds = state.typingUsers[conversationId] || [];
          const currentInfo = state.typingUsersInfo[conversationId] || [];

          const updatedIds = isTyping
            ? [...new Set([...currentIds, userId])]
            : currentIds.filter((id) => id !== userId);

          const updatedInfo = isTyping
            ? [...currentInfo.filter((u) => u.userId !== userId), { userId, startedAt }]
            : currentInfo.filter((u) => u.userId !== userId);

          return {
            typingUsers: {
              ...state.typingUsers,
              [conversationId]: updatedIds,
            },
            typingUsersInfo: {
              ...state.typingUsersInfo,
              [conversationId]: updatedInfo,
            },
          };
        });
      },

      markAsRead: async (conversationId: string) => {
        try {
          await api.post(`/api/v1/conversations/${conversationId}/read`);
          set((state) => ({
            conversations: state.conversations.map((conv) =>
              conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
            ),
          }));
        } catch (_error) {
          // Ignore read receipt errors
        }
      },

      createConversation: async (userIds: string[]) => {
        const response = await api.post('/api/v1/conversations', {
          participant_ids: userIds,
        });
        const conversation = ensureObject<Conversation>(response.data, 'conversation');
        if (conversation) {
          set((state) => ({
            conversations: [conversation, ...state.conversations],
          }));
          return conversation;
        }
        throw new Error('Failed to create conversation');
      },

      /**
       * Add a new conversation from real-time socket event
       * Prevents duplicates by checking existing conversations
       */
      addConversation: (conversation: Conversation) => {
        set((state) => {
          // Check if conversation already exists
          if (state.conversations.some((c) => c.id === conversation.id)) {
            return state;
          }
          return {
            conversations: [conversation, ...state.conversations],
          };
        });
      },

      /**
       * Update an existing conversation from real-time socket event
       * Used for last message updates, unread counts, etc.
       */
      updateConversation: (updates: Partial<Conversation> & { id: string }) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === updates.id ? { ...conv, ...updates } : conv
          ),
        }));
      },

      /**
       * Get the recipient ID for a direct conversation
       * Returns null for group conversations or if recipient not found
       */
      getRecipientId: (conversationId: string, currentUserId: string): string | null => {
        const { conversations } = get();
        const conversation = conversations.find((c) => c.id === conversationId);

        if (!conversation || conversation.type !== 'direct') {
          return null;
        }

        const recipient = conversation.participants.find((p) => p.userId !== currentUserId);

        return recipient?.userId || null;
      },

      /**
       * Add a reaction to a message (from socket event)
       * Used for real-time reaction sync across clients
       */
      addReactionToMessage: (
        messageId: string,
        emoji: string,
        userId: string,
        username?: string
      ) => {
        set((state) => {
          const updatedMessages = updateMessageReactions(state.messages, messageId, (reactions) => {
            const alreadyExists = reactions.some((r) => r.emoji === emoji && r.userId === userId);
            if (alreadyExists) return reactions;

            const newReaction: Reaction = {
              id: `${messageId}-${emoji}-${userId}`,
              emoji,
              userId,
              user: { id: userId, username: username || 'User' },
            };
            return [...reactions, newReaction];
          });
          return { messages: { ...state.messages, ...updatedMessages } };
        });
      },

      /**
       * Remove a reaction from a message (from socket event)
       * Used for real-time reaction sync across clients
       */
      removeReactionFromMessage: (messageId: string, emoji: string, userId: string) => {
        set((state) => {
          const updatedMessages = updateMessageReactions(state.messages, messageId, (reactions) =>
            reactions.filter((r) => !(r.emoji === emoji && r.userId === userId))
          );
          return { messages: { ...state.messages, ...updatedMessages } };
        });
      },

      /**
       * Fetch scheduled messages for a conversation
       */
      fetchScheduledMessages: async (conversationId: string) => {
        set({ isLoadingScheduledMessages: true });
        try {
          const response = await api.get(`/conversations/${conversationId}/scheduled-messages`);
          const scheduledMessages = ensureArray<Message>(response.data?.messages || response.data);

          set((state) => ({
            scheduledMessages: {
              ...state.scheduledMessages,
              [conversationId]: scheduledMessages,
            },
            isLoadingScheduledMessages: false,
          }));
        } catch (error: unknown) {
          logger.error('Failed to fetch scheduled messages:', error);
          set({ isLoadingScheduledMessages: false });
          throw error;
        }
      },

      /**
       * Schedule a message for future delivery
       */
      scheduleMessage: async (
        conversationId: string,
        content: string,
        scheduledAt: Date,
        options: { type?: string; metadata?: Record<string, any>; replyToId?: string } = {}
      ) => {
        try {
          const payload: any = {
            content,
            content_type: options.type || 'text',
            scheduled_at: scheduledAt.toISOString(),
          };

          if (options.replyToId) {
            payload.reply_to_id = options.replyToId;
          }

          if (options.metadata) {
            payload.metadata = options.metadata;
          }

          const response = await api.post(`/conversations/${conversationId}/messages`, payload);
          const scheduledMessage = normalizeMessage(
            response.data?.message || response.data
          ) as unknown as Message;

          // Add to scheduled messages list
          set((state) => {
            const existingScheduled = state.scheduledMessages[conversationId] || [];
            return {
              scheduledMessages: {
                ...state.scheduledMessages,
                [conversationId]: [...existingScheduled, scheduledMessage],
              },
            };
          });

          logger.info('Message scheduled successfully:', scheduledMessage.id);
        } catch (error: unknown) {
          logger.error('Failed to schedule message:', error);
          throw error;
        }
      },

      /**
       * Cancel a scheduled message
       */
      cancelScheduledMessage: async (messageId: string) => {
        try {
          await api.delete(`/messages/${messageId}/cancel-schedule`);

          // Remove from scheduled messages
          set((state) => {
            const updatedScheduledMessages: Record<string, Message[]> = {};
            Object.entries(state.scheduledMessages).forEach(([convId, messages]) => {
              updatedScheduledMessages[convId] = messages.filter((m) => m.id !== messageId);
            });
            return { scheduledMessages: updatedScheduledMessages };
          });

          logger.info('Scheduled message cancelled:', messageId);
        } catch (error: unknown) {
          logger.error('Failed to cancel scheduled message:', error);
          throw error;
        }
      },

      /**
       * Reschedule a message to a new time
       */
      rescheduleMessage: async (messageId: string, newScheduledAt: Date) => {
        try {
          const response = await api.patch(`/messages/${messageId}/reschedule`, {
            scheduled_at: newScheduledAt.toISOString(),
          });
          const updatedMessage = normalizeMessage(
            response.data?.message || response.data
          ) as unknown as Message;

          // Update in scheduled messages list
          set((state) => {
            const updatedScheduledMessages: Record<string, Message[]> = {};
            Object.entries(state.scheduledMessages).forEach(([convId, messages]) => {
              updatedScheduledMessages[convId] = messages.map((m) =>
                m.id === messageId ? updatedMessage : m
              );
            });
            return { scheduledMessages: updatedScheduledMessages };
          });

          logger.info('Message rescheduled:', messageId);
        } catch (error: unknown) {
          logger.error('Failed to reschedule message:', error);
          throw error;
        }
      },
    }),
    {
      name: 'ChatStore',
      enabled: import.meta.env.DEV,
    }
  )
);
