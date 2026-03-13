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
import { useE2EEStore, type E2EEState } from '@/lib/crypto/e2eeStore';
import { useAuthStore } from '@/modules/auth/store';
import { chatLogger as logger } from '@/lib/logger';
import type { Message, ChatState } from './chatStore.types';

type Set = (
  partial: ChatState | Partial<ChatState> | ((s: ChatState) => ChatState | Partial<ChatState>)
) => void;
type Get = () => ChatState;

// ---------------------------------------------------------------------------
// Decrypt helpers
// ---------------------------------------------------------------------------

/**
 * Attempt to decrypt an encrypted message using available methods.
 * Tries Double Ratchet (session manager) first, then falls back to legacy X3DH.
 */
export async function attemptDecrypt(message: Message, e2eeStore: E2EEState): Promise<string> {
  const metadata: Record<string, unknown> = message.metadata || {};

  // Try Double Ratchet / session manager first if a session exists
  if (e2eeStore.hasRatchetSession(message.senderId)) {
    try {
      // Build a SecureMessage-compatible payload for the session manager
      const secureMsg = {
        senderId: message.senderId,
        recipientId: useAuthStore.getState().user?.id || '',
        sessionId: '',
        messageId: message.id,
        timestamp: Date.now(),
        ratchetMessage: {
          header: {
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            dh: (metadata.ratchet_dh as string) || '',
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            pn: (metadata.ratchet_pn as number) || 0,
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            n: (metadata.ratchet_n as number) || 0,
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            sessionId: (metadata.ratchet_session_id as string) || '',
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            timestamp: (metadata.ratchet_timestamp as number) || Date.now(),
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            version: (metadata.ratchet_version as number) || 1,
          },
          ciphertext: message.encryptedContent || message.content,
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          nonce: message.nonce || (metadata.nonce as string) || '',
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          mac: (metadata.ratchet_mac as string) || '',
        },
      };
      const senderIdentityKey =
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        message.senderIdentityKey || (metadata.sender_identity_key as string);
      return await e2eeStore.decryptWithRatchet(secureMsg, senderIdentityKey);
    } catch {
      // Ratchet decryption failed — fall through to legacy X3DH
      logger.warn('Ratchet decryption failed, trying legacy X3DH');
    }
  }

  // Legacy X3DH decryption
  const encryptedPayload = {
    ciphertext: message.encryptedContent || message.content,
    ephemeralPublicKey:
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      message.ephemeralPublicKey || (metadata.ephemeral_public_key as string), // safe downcast — validated below

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    recipientIdentityKeyId: (metadata.recipient_identity_key_id as string) || '', // safe downcast

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    oneTimePreKeyId: metadata.one_time_prekey_id as string | undefined, // safe downcast

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    nonce: message.nonce || (metadata.nonce as string), // safe downcast — validated below
  };

  const senderIdentityKey =
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    message.senderIdentityKey || (metadata.sender_identity_key as string); // safe downcast — validated below

  if (!encryptedPayload.ephemeralPublicKey || !senderIdentityKey || !encryptedPayload.nonce) {
    throw new Error('Missing E2EE metadata for decryption');
  }

  return await e2eeStore.decryptMessage(message.senderId, senderIdentityKey, encryptedPayload);
}

/**
 * Retry decryption after E2EE auto-bootstrap completes.
 * Polls up to 10 times (every 500 ms) waiting for e2eeStore.isInitialized.
 * On success updates the placeholder message via updateMessage.
 */
async function retryDecryptAfterInit(message: Message, get: Get) {
  const TIMEOUT_MS = 15_000; // 15s timeout (E2EE auto-bootstrap can take time)

  return new Promise<void>((resolve) => {
    // eslint-disable-next-line prefer-const
    let timeoutId: ReturnType<typeof setTimeout>;

    const tryDecrypt = (state: E2EEState) => {
      attemptDecrypt(message, state)
        .then((plaintext) => {
          let protocolVersion: string | undefined;
          try {
            const proto = state.getSessionProtocol(message.senderId);
            if (proto) protocolVersion = String(proto);
          } catch {
            /* Non-critical */
          }

          get().updateMessage({
            ...message,
            content: plaintext,
            isEncrypted: true,
            decryptionFailed: false,
            protocolVersion,
          });
          logger.log('Decrypted queued E2EE message after init');
        })
        .catch((error: unknown) => {
          logger.error('Retry decryption failed after init:', error);
          get().updateMessage({
            ...message,
            content: '⚠️ Unable to decrypt this message',
            isEncrypted: true,
            decryptionFailed: true,
          });
        })
        .finally(resolve);
    };

    const unsubscribe = useE2EEStore.subscribe((state) => {
      if (!state.isInitialized) return;

      // E2EE ready — attempt decryption
      unsubscribe();
      clearTimeout(timeoutId);
      tryDecrypt(state);
    });

    // Timeout: if E2EE never initializes, mark as failed
    timeoutId = setTimeout(() => {
      unsubscribe();
      logger.error('E2EE did not initialize within timeout, marking message as decrypt-failed');
      get().updateMessage({
        ...message,
        content: '⚠️ Unable to decrypt this message',
        isEncrypted: true,
        decryptionFailed: true,
      });
      resolve();
    }, TIMEOUT_MS);

    // Check if already initialized (race condition: init completed between
    // the if-check in decryptAndAddMessage and subscribing here)
    const currentState = useE2EEStore.getState();
    if (currentState.isInitialized) {
      unsubscribe();
      clearTimeout(timeoutId);
      tryDecrypt(currentState);
    }
  });
}

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
          // Attempt encryption separately so a failure doesn't block plaintext fallback
          let encryptedMsg: Awaited<ReturnType<typeof e2eeStore.encryptMessage>> | null = null;
          try {
            encryptedMsg = await e2eeStore.encryptMessage(recipientParticipant.userId, content);
          } catch (encryptError) {
            // Encryption failed — typically the recipient has no E2EE bundle (404)
            // or backend E2EE endpoints are unavailable. Fall back to plaintext
            // rather than blocking all communication.
            logger.warn('E2EE encryption failed, sending as plaintext:', encryptError);
          }

          if (encryptedMsg) {
            // Encryption succeeded — send the encrypted payload
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
              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              const message = normalizeMessage(rawMessage) as unknown as Message; // safe downcast
              // Store plaintext locally for sender (we know what we sent)
              message.content = content;
              get().addMessage(message);
            }

            logger.log('Sent E2EE encrypted message');
            return;
          }
          // Encryption failed — fall through to plaintext send below
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

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        messageType: (contentType as Message['messageType']) || 'text', // safe downcast
        replyToId: replyToId || null,
        replyTo: null,
        isPinned: false,
        isEdited: false,
        deletedAt: null,

        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        metadata: (metadata || {}) as Message['metadata'], // safe downcast
        reactions: [],
        sender: {
          id: currentUser?.id || '',
          username: currentUser?.username || '',
          displayName: currentUser?.displayName || null,
          avatarUrl: currentUser?.avatarUrl || null,
        },
        deliveryStatus: 'sending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      get().addMessage(optimisticMessage);

      try {
        const response = await api.post(
          `/api/v1/conversations/${conversationId}/messages`,
          payload
        );
        const rawMessage = ensureObject<Record<string, unknown>>(response.data, 'message');
        if (rawMessage) {
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          const message = normalizeMessage(rawMessage) as unknown as Message; // safe downcast
          // Replace the optimistic message with the real server response
          get().removeMessage(clientMessageId, conversationId);
          get().addMessage({ ...message, deliveryStatus: 'sent' });
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
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          const message = normalizeMessage(rawMessage) as unknown as Message; // safe downcast
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
     * Decrypt an incoming encrypted message and add it to the store.
     *
     * - Skips decryption for own messages (sender already has plaintext).
     * - Tries Double Ratchet first, then legacy X3DH.
     * - Queues messages that arrive before E2EE init completes.
     * - NEVER displays ciphertext: shows error placeholder on failure.
     */
    decryptAndAddMessage: async (message: Message) => {
      // Unencrypted messages pass through directly
      if (!message.isEncrypted) {
        get().addMessage(message);
        return;
      }

      // Own encrypted messages already have plaintext content set by sender flow
      const currentUserId = useAuthStore.getState().user?.id;
      if (currentUserId && message.senderId === currentUserId) {
        get().addMessage({ ...message, isEncrypted: true });
        return;
      }

      const e2eeStore = useE2EEStore.getState();

      // E2EE not yet initialized — queue for retry after auto-bootstrap completes
      if (!e2eeStore.isInitialized) {
        logger.warn('E2EE not initialized, queuing encrypted message for retry');

        // Add placeholder immediately so user sees *something*
        get().addMessage({
          ...message,
          content: '🔒 Decrypting…',
          isEncrypted: true,
          decryptionFailed: false,
        });

        // Retry in background until E2EE becomes available
        retryDecryptAfterInit(message, get);
        return;
      }

      // --- Attempt decryption ---
      try {
        const plaintext = await attemptDecrypt(message, e2eeStore);

        // Determine protocol version from session (best-effort)
        let protocolVersion: string | undefined;
        try {
          const proto = e2eeStore.getSessionProtocol(message.senderId);
          if (proto) protocolVersion = String(proto);
        } catch {
          // Non-critical — just omit
        }

        get().addMessage({
          ...message,
          content: plaintext,
          isEncrypted: true,
          decryptionFailed: false,
          protocolVersion,
        });
        logger.log('Decrypted and added E2EE message');
      } catch (error: unknown) {
        logger.error('Failed to decrypt message:', error);
        // CRITICAL: Never show ciphertext — display error placeholder
        get().addMessage({
          ...message,
          content: '⚠️ Unable to decrypt this message',
          isEncrypted: true,
          decryptionFailed: true,
        });
      }
    },
  };
}
