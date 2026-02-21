/**
 * Chat Store — Messaging Actions
 *
 * Send, encrypt, and decrypt messages with E2EE support.
 *
 * @module modules/chat/store/chatStore.messaging
 */

import { api } from '@/lib/api';
import { createIdempotencyKey } from '@cgraph/utils';
import { ensureObject, normalizeMessage } from '@/lib/apiUtils';
import { useE2EEStore } from '@/lib/crypto/e2eeStore';
import { useAuthStore } from '@/modules/auth/store';
import { chatLogger as logger } from '@/lib/logger';
import type { Message, ChatState } from './chatStore.types';

type Set = (
  partial: ChatState | Partial<ChatState> | ((s: ChatState) => ChatState | Partial<ChatState>)
) => void;
type Get = () => ChatState;

/** Create messaging actions for the chat store. */
export function createMessagingActions(_set: Set, get: Get) {
  return {
    sendMessage: async (
      conversationId: string,
      content: string,
      replyToId?: string,
      options?: { type?: string; metadata?: Record<string, unknown>; forceUnencrypted?: boolean }
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
            const errorMsg = encryptError instanceof Error ? encryptError.message : 'Unknown error';

            throw new Error(
              `Failed to encrypt message: ${errorMsg}. ` +
                'Please try again or check your encryption keys. ' +
                'Your message was NOT sent to protect your privacy.'
            );
          }
        }
      }

      // Fallback: Send plaintext (for group chats or when E2EE not available)
      const payload: Record<string, unknown> = {
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

      // Optimistic update: add message to state before API call
      const currentUser = useAuthStore.getState().user;
      const optimisticMessage: Message = {
        id: clientMessageId,
        conversationId,
        senderId: currentUser?.id || '',
        content,
        encryptedContent: null,
        isEncrypted: false,
        messageType: (contentType as Message['messageType']) || 'text',
        replyToId: replyToId || null,
        replyTo: null,
        isPinned: false,
        isEdited: false,
        deletedAt: null,
        metadata: (metadata || {}) as Message['metadata'],
        reactions: [],
        sender: {
          id: currentUser?.id || '',
          username: currentUser?.username || '',
          displayName: currentUser?.displayName || null,
          avatarUrl: currentUser?.avatarUrl || null,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      get().addMessage(optimisticMessage);

      try {
        const response = await api.post(`/api/v1/conversations/${conversationId}/messages`, payload);
        const rawMessage = ensureObject<Record<string, unknown>>(response.data, 'message');
        if (rawMessage) {
          const message = normalizeMessage(rawMessage) as unknown as Message;
          // Replace the optimistic message with the real server response
          get().removeMessage(clientMessageId, conversationId);
          get().addMessage(message);
        }
      } catch (error: unknown) {
        // Rollback: remove the optimistic message on failure
        get().removeMessage(clientMessageId, conversationId);
        logger.error('Failed to send message:', error);
        throw error;
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

        if (!encryptedPayload.ephemeralPublicKey || !senderIdentityKey || !encryptedPayload.nonce) {
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
  };
}
