/**
 * useMessageSending Hook
 *
 * Manages message sending functionality including text messages,
 * voice messages, file uploads, and wave greetings.
 *
 * @module screens/messages/ConversationScreen/hooks
 */

import { useState, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import { useSharedValue, withTiming, withSpring, withSequence, Easing, type SharedValue } from 'react-native-reanimated';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import api from '../../../../lib/api';
import socketManager from '../../../../lib/socket';
import { normalizeMessage } from '../../../../lib/normalizers';
import { createLogger } from '../../../../lib/logger';
import { getMimeType } from '../utils';
import type { Message } from '../../../../types';

const logger = createLogger('useMessageSending');

// Fun waving emojis for empty conversation
const WAVE_EMOJIS = ['👋', '✨', '💬', '🎉', '🌟'];

interface VoiceData {
  uri: string;
  duration: number;
}

interface EncryptedMessage {
  ciphertext: string;
  ephemeralPublicKey: string;
  nonce: string;
  recipientIdentityKeyId: string;
  oneTimePreKeyId?: string;
}

interface UseMessageSendingOptions {
  conversationId: string;
  userId: string | undefined;
  isE2EEInitialized: boolean;
  otherParticipantId: string | null;
  encryptMessage: (recipientId: string, plaintext: string) => Promise<EncryptedMessage>;
  replyingTo: Message | null;
  setReplyingTo: (message: Message | null) => void;
  onMessageSent: (message: Message) => void;
  onScrollToBottom: () => void;
}

export interface UseMessageSendingReturn {
  inputText: string;
  setInputText: (text: string) => void;
  isSending: boolean;
  sendButtonAnim: SharedValue<number>;
  waveAnim: SharedValue<number>;
  sendMessage: () => Promise<void>;
  handleVoiceComplete: (voiceData: VoiceData) => Promise<void>;
  handleSendWave: () => Promise<void>;
  handleTextChange: (text: string) => void;
  stopTypingIndicator: () => void;
  uploadAndSendFile: (
    uri: string,
    fileName: string,
    mimeType: string,
    messageType: 'image' | 'video' | 'file'
  ) => Promise<void>;
  sendPendingAttachments: (
    attachments: Array<{
      uri: string;
      type: 'image' | 'video' | 'file';
      name?: string;
      mimeType?: string;
    }>,
    caption: string
  ) => Promise<void>;
}

/**
 * Hook for managing message sending functionality.
 */
export function useMessageSending({
  conversationId,
  userId,
  isE2EEInitialized,
  otherParticipantId,
  encryptMessage,
  replyingTo,
  setReplyingTo,
  onMessageSent,
  onScrollToBottom,
}: UseMessageSendingOptions): UseMessageSendingReturn {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Animation refs
  const sendButtonAnim = useSharedValue(1);
  const waveAnim = useSharedValue(0);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animated send button press effect
  const animateSendButton = useCallback(() => {
    sendButtonAnim.value = withSequence(
      withTiming(0.85, { duration: 100, easing: Easing.out(Easing.quad) }),
      withSpring(1, { stiffness: 200, damping: 10 })
    );
  }, [sendButtonAnim]);

  // Stop typing indicator
  const stopTypingIndicator = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    socketManager.sendTyping(`conversation:${conversationId}`, false);
  }, [conversationId]);

  // Handle text input changes with typing indicator
  const handleTextChange = useCallback(
    (text: string) => {
      setInputText(text);

      const channelTopic = `conversation:${conversationId}`;

      if (text.length > 0) {
        socketManager.sendTyping(channelTopic, true);

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
          socketManager.sendTyping(channelTopic, false);
        }, 5000);
      }
    },
    [conversationId]
  );

  // Send text message
  const sendMessage = useCallback(async () => {
    const content = inputText.trim();
    if (!content || isSending) return;

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

      // E2EE encryption if available
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

      // Store plaintext locally for encrypted messages
      if (messagePayload.is_encrypted) {
        normalized.content = plaintextForLocal;
      }

      onMessageSent(normalized);
      onScrollToBottom();
    } catch (error) {
      logger.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      setInputText(content); // Restore text on error
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
    animateSendButton,
    stopTypingIndicator,
    setReplyingTo,
    onMessageSent,
    onScrollToBottom,
  ]);

  // Handle voice message completion
  const handleVoiceComplete = useCallback(
    async (voiceData: VoiceData) => {
      if (!voiceData.uri) return;

      setIsSending(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      try {
        const formData = new FormData();
        const fileName = `voice_${Date.now()}.m4a`;

        formData.append('file', {
          uri: voiceData.uri,
          type: 'audio/m4a',
          name: fileName,
        } as unknown);

        const uploadResponse = await api.post('/api/v1/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const uploadedUrl = uploadResponse.data.url || uploadResponse.data.file_url;

        if (!uploadedUrl) {
          throw new Error('Upload failed - no URL returned');
        }

        const response = await api.post(`/api/v1/conversations/${conversationId}/messages`, {
          content: '[Voice Message]',
          type: 'voice',
          file_url: uploadedUrl,
          metadata: {
            duration: voiceData.duration,
            mimeType: 'audio/m4a',
          },
        });

        const rawMessage = response.data.data || response.data.message || response.data;
        const normalized = normalizeMessage(rawMessage);
        onMessageSent(normalized);
        onScrollToBottom();
      } catch (error) {
        logger.error('Error sending voice message:', error);
        Alert.alert('Error', 'Failed to send voice message. Please try again.');
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, onMessageSent, onScrollToBottom]
  );

  // Send wave greeting
  const handleSendWave = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const emoji = WAVE_EMOJIS[Math.floor(Math.random() * WAVE_EMOJIS.length)];

    waveAnim.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(0, { duration: 200 })
    );

    try {
      const response = await api.post(`/api/v1/conversations/${conversationId}/messages`, {
        content: emoji,
        type: 'text',
      });

      const rawMessage = response.data.data || response.data.message || response.data;
      if (rawMessage?.id) {
        const normalized = normalizeMessage(rawMessage);
        onMessageSent(normalized);
        onScrollToBottom();
      }
    } catch (error) {
      logger.error('Error sending wave:', error);
    }
  }, [conversationId, waveAnim, onMessageSent, onScrollToBottom]);

  // Upload and send file
  const uploadAndSendFile = useCallback(
    async (
      uri: string,
      fileName: string,
      mimeType: string,
      messageType: 'image' | 'video' | 'file'
    ) => {
      setIsSending(true);

      try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (!fileInfo.exists) {
          Alert.alert('Error', 'File not found');
          return;
        }

        const fileMimeType = mimeType || getMimeType(fileName, 'application/octet-stream');

        const formData = new FormData();
        formData.append('file', {
          uri,
          type: fileMimeType,
          name: fileName,
        } as unknown);

        const uploadResponse = await api.post('/api/v1/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const uploadedUrl = uploadResponse.data.url || uploadResponse.data.file_url;
        if (!uploadedUrl) {
          throw new Error('Upload failed - no URL returned');
        }

        const response = await api.post(`/api/v1/conversations/${conversationId}/messages`, {
          content: fileName,
          type: messageType,
          file_url: uploadedUrl,
          metadata: {
            fileName,
            mimeType: fileMimeType,
            fileSize: 'size' in fileInfo ? fileInfo.size : undefined,
          },
        });

        const rawMessage = response.data.data || response.data.message || response.data;
        const normalized = normalizeMessage(rawMessage);
        onMessageSent(normalized);
        onScrollToBottom();
      } catch (error: unknown) {
        const err = error as {
          response?: { data?: { error?: { message?: string } } };
          message?: string;
        };
        logger.error('Error uploading file:', err?.response?.data || err?.message || error);
        const errorMessage =
          err?.response?.data?.error?.message ||
          err?.message ||
          'Failed to send file. Please try again.';
        Alert.alert('Upload Error', errorMessage);
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, onMessageSent, onScrollToBottom]
  );

  // Send pending attachments
  const sendPendingAttachments = useCallback(
    async (
      attachments: Array<{
        uri: string;
        type: 'image' | 'video' | 'file';
        name?: string;
        mimeType?: string;
      }>,
      caption: string
    ) => {
      if (attachments.length === 0) return;

      setIsSending(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      try {
        const uploadedUrls: string[] = [];

        for (const attachment of attachments) {
          const formData = new FormData();
          const fileName =
            attachment.name ||
            `${attachment.type}_${Date.now()}.${attachment.type === 'video' ? 'mp4' : 'jpg'}`;
          const mimeType =
            attachment.mimeType || (attachment.type === 'video' ? 'video/mp4' : 'image/jpeg');

          formData.append('file', {
            uri: attachment.uri,
            type: mimeType,
            name: fileName,
          } as unknown);

          const uploadResponse = await api.post('/api/v1/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          const uploadedUrl = uploadResponse.data.url || uploadResponse.data.file_url;
          if (uploadedUrl) {
            uploadedUrls.push(uploadedUrl);
          }
        }

        // Send messages for each uploaded file
        for (let i = 0; i < uploadedUrls.length; i++) {
          const url = uploadedUrls[i];
          const attachment = attachments[i];
          const isLast = i === uploadedUrls.length - 1;

          const response = await api.post(`/api/v1/conversations/${conversationId}/messages`, {
            content: isLast && caption ? caption : attachment.name || '',
            type: attachment.type,
            file_url: url,
            metadata: {
              mimeType: attachment.mimeType,
              fileName: attachment.name,
            },
          });

          const rawMessage = response.data.data || response.data.message || response.data;
          const normalized = normalizeMessage(rawMessage);
          onMessageSent(normalized);
        }

        onScrollToBottom();
      } catch (error) {
        logger.error('Error sending attachments:', error);
        Alert.alert('Error', 'Failed to send attachments. Please try again.');
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, onMessageSent, onScrollToBottom]
  );

  return {
    inputText,
    setInputText,
    isSending,
    sendButtonAnim,
    waveAnim,
    sendMessage,
    handleVoiceComplete,
    handleSendWave,
    handleTextChange,
    stopTypingIndicator,
    uploadAndSendFile,
    sendPendingAttachments,
  };
}
