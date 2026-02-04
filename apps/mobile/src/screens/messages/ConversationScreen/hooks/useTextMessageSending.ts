/**
 * useTextMessageSending Hook
 *
 * Manages text message sending with E2EE encryption support.
 *
 * @module screens/messages/ConversationScreen/hooks
 */

import { useState, useCallback, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import api from '../../../../lib/api';
import { normalizeMessage } from '../../../../lib/normalizers';
import { createLogger } from '../../../../lib/logger';
import type { Message } from '../../../../types';

const logger = createLogger('useTextMessageSending');

interface EncryptedMessage {
  ciphertext: string;
  ephemeralPublicKey: string;
  nonce: string;
  recipientIdentityKeyId: string;
  oneTimePreKeyId?: string;
}

interface UseTextMessageSendingOptions {
  conversationId: string;
  isSending: boolean;
  setIsSending: React.Dispatch<React.SetStateAction<boolean>>;
  isE2EEInitialized: boolean;
  otherParticipantId: string | null;
  encryptMessage: (recipientId: string, plaintext: string) => Promise<EncryptedMessage>;
  replyingTo: Message | null;
  setReplyingTo: (message: Message | null) => void;
  stopTypingIndicator: () => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setNewMessageIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  onScrollToBottom: () => void;
}

interface UseTextMessageSendingReturn {
  inputText: string;
  setInputText: (text: string) => void;
  sendButtonAnim: Animated.Value;
  sendMessage: () => Promise<void>;
}

/**
 * Hook for sending text messages with E2EE support.
 */
export function useTextMessageSending({
  conversationId,
  isSending,
  setIsSending,
  isE2EEInitialized,
  otherParticipantId,
  encryptMessage,
  replyingTo,
  setReplyingTo,
  stopTypingIndicator,
  setMessages,
  setNewMessageIds,
  onScrollToBottom,
}: UseTextMessageSendingOptions): UseTextMessageSendingReturn {
  const [inputText, setInputText] = useState('');
  const sendButtonAnim = useRef(new Animated.Value(1)).current;

  // Animated send button press effect
  const animateSendButton = useCallback(() => {
    Animated.sequence([
      Animated.timing(sendButtonAnim, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.spring(sendButtonAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 10,
      }),
    ]).start();
  }, [sendButtonAnim]);

  // Send text message
  const sendMessage = useCallback(async () => {
    const content = inputText.trim();
    if (!content || isSending) return;

    // Trigger animation and haptic feedback
    animateSendButton();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setIsSending(true);
    setInputText('');
    const currentReplyTo = replyingTo;
    setReplyingTo(null);
    stopTypingIndicator();

    try {
      const clientMessageId = Crypto.randomUUID();
      let messagePayload: Record<string, unknown> = {
        content,
        client_message_id: clientMessageId,
      };
      if (currentReplyTo) {
        messagePayload.reply_to_id = currentReplyTo.id;
      }

      // E2EE: Encrypt message for direct conversations
      const plaintextForLocal = content;
      if (isE2EEInitialized && otherParticipantId) {
        try {
          const encryptedMsg = await encryptMessage(otherParticipantId, content);
          messagePayload = {
            content: encryptedMsg.ciphertext,
            is_encrypted: true,
            ephemeral_public_key: encryptedMsg.ephemeralPublicKey,
            nonce: encryptedMsg.nonce,
            recipient_identity_key_id: encryptedMsg.recipientIdentityKeyId,
            one_time_prekey_id: encryptedMsg.oneTimePreKeyId,
            client_message_id: clientMessageId,
          };
          if (currentReplyTo) {
            messagePayload.reply_to_id = currentReplyTo.id;
          }
          logger.log('Sent E2EE encrypted message');
        } catch (encryptError) {
          logger.error('E2EE encryption failed, falling back to plaintext:', encryptError);
        }
      }

      const response = await api.post(
        `/api/v1/conversations/${conversationId}/messages`,
        messagePayload
      );
      const rawMessage = response.data.data || response.data.message || response.data;
      const normalized = normalizeMessage(rawMessage);

      // For encrypted messages, store plaintext locally
      if (messagePayload.is_encrypted) {
        normalized.content = plaintextForLocal;
      }

      // Mark as new message for entrance animation
      setNewMessageIds((prev) => new Set(prev).add(normalized.id));

      // Add with deduplication (prepend for inverted list)
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === normalized.id);
        if (exists) return prev;
        return [normalized, ...prev];
      });

      onScrollToBottom();

      // Clear animation flag after completion
      setTimeout(() => {
        setNewMessageIds((prev) => {
          const next = new Set(prev);
          next.delete(normalized.id);
          return next;
        });
      }, 500);
    } catch (error) {
      logger.error('Error sending message:', error);
      setInputText(content);
      if (currentReplyTo) setReplyingTo(currentReplyTo);
    } finally {
      setIsSending(false);
    }
  }, [
    inputText,
    isSending,
    replyingTo,
    conversationId,
    isE2EEInitialized,
    otherParticipantId,
    encryptMessage,
    setIsSending,
    setReplyingTo,
    stopTypingIndicator,
    setMessages,
    setNewMessageIds,
    onScrollToBottom,
    animateSendButton,
  ]);

  return {
    inputText,
    setInputText,
    sendButtonAnim,
    sendMessage,
  };
}

export default useTextMessageSending;
