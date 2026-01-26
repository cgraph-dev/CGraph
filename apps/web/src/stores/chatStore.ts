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
  metadata: Record<string, any>;
  reactions: Reaction[];
  sender: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  createdAt: string;
  updatedAt: string;
  // E2EE metadata for decryption
  ephemeralPublicKey?: string;
  nonce?: string;
  senderIdentityKey?: string;
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
        } catch (error) {
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
        } catch (error) {
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
        } catch (error) {
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
          const metadata = message.metadata || {};
          const encryptedPayload = {
            ciphertext: message.encryptedContent || message.content,
            ephemeralPublicKey: message.ephemeralPublicKey || metadata.ephemeral_public_key,
            recipientIdentityKeyId: metadata.recipient_identity_key_id || '',
            oneTimePreKeyId: metadata.one_time_prekey_id,
            nonce: message.nonce || metadata.nonce,
          };

          const senderIdentityKey = message.senderIdentityKey || metadata.sender_identity_key;

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
        } catch (error) {
          logger.error('Failed to decrypt message:', error);
          // Show placeholder for failed decryption
          get().addMessage({ ...message, content: '[Unable to decrypt message]' });
        }
      },

      editMessage: async (messageId: string, content: string) => {
        // Find the conversation that contains this message
        const { messages } = get();
        let conversationId: string | null = null;

        for (const [convId, convMessages] of Object.entries(messages)) {
          if (convMessages.some((msg) => msg.id === messageId)) {
            conversationId = convId;
            break;
          }
        }

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
        // Find the conversation that contains this message
        const { messages } = get();
        let conversationId: string | null = null;

        for (const [convId, convMessages] of Object.entries(messages)) {
          if (convMessages.some((msg) => msg.id === messageId)) {
            conversationId = convId;
            break;
          }
        }

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

          return {
            messages: {
              ...state.messages,
              [message.conversationId]: [...conversationMessages, message],
            },
            messageIdSets: {
              ...state.messageIdSets,
              [message.conversationId]: newIdSet,
            },
            conversations: state.conversations.map((conv) =>
              conv.id === message.conversationId
                ? { ...conv, lastMessage: message, updatedAt: message.createdAt }
                : conv
            ),
          };
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
          const updatedMessages: Record<string, Message[]> = {};

          // Find and update the message in all conversations
          Object.entries(state.messages).forEach(([convId, messages]) => {
            const messageIndex = messages.findIndex((m) => m.id === messageId);
            if (messageIndex !== -1) {
              const message = messages[messageIndex];
              if (!message) {
                updatedMessages[convId] = messages;
                return;
              }
              const existingReactions = message.reactions || [];

              // Check if this reaction already exists from this user
              const existingIndex = existingReactions.findIndex(
                (r) => r.emoji === emoji && r.userId === userId
              );

              if (existingIndex === -1) {
                // Add the new reaction with proper Reaction structure
                const newReaction: Reaction = {
                  id: `${messageId}-${emoji}-${userId}`,
                  emoji,
                  userId,
                  user: {
                    id: userId,
                    username: username || 'User',
                  },
                };

                const newReactions = [...existingReactions, newReaction];
                const updatedMessage: Message = { ...message, reactions: newReactions };
                const updatedList = [...messages];
                updatedList[messageIndex] = updatedMessage;
                updatedMessages[convId] = updatedList;
              } else {
                updatedMessages[convId] = messages;
              }
            } else {
              updatedMessages[convId] = messages;
            }
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
          const updatedMessages: Record<string, Message[]> = {};

          // Find and update the message in all conversations
          Object.entries(state.messages).forEach(([convId, messages]) => {
            const messageIndex = messages.findIndex((m) => m.id === messageId);
            if (messageIndex !== -1) {
              const message = messages[messageIndex];
              if (!message) {
                updatedMessages[convId] = messages;
                return;
              }
              const existingReactions = message.reactions || [];

              // Remove the reaction from this user
              const filteredReactions = existingReactions.filter(
                (r) => !(r.emoji === emoji && r.userId === userId)
              );

              const updatedMessage: Message = { ...message, reactions: filteredReactions };
              const updatedList = [...messages];
              updatedList[messageIndex] = updatedMessage;
              updatedMessages[convId] = updatedList;
            } else {
              updatedMessages[convId] = messages;
            }
          });

          return { messages: { ...state.messages, ...updatedMessages } };
        });
      },
    }),
    {
      name: 'ChatStore',
      enabled: import.meta.env.DEV,
    }
  )
);
