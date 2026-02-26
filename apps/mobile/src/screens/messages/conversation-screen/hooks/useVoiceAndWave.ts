/**
 * useVoiceAndWave Hook
 *
 * Manages voice message recording/sending and wave greeting functionality.
 *
 * @module screens/messages/ConversationScreen/hooks
 */

import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useSharedValue, withSequence, withTiming, type SharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import api from '../../../../lib/api';
import { normalizeMessage } from '../../../../lib/normalizers';
import { createLogger } from '../../../../lib/logger';
import type { Message } from '../../../../types';

const logger = createLogger('useVoiceAndWave');

// Fun waving emojis for empty conversation
const WAVE_EMOJIS = ['👋', '✨', '💬', '🎉', '🌟'];

interface VoiceData {
  uri: string;
  duration: number;
  waveform: number[];
}

interface UseVoiceAndWaveOptions {
  conversationId: string;
  setIsSending: (sending: boolean) => void;
  setIsVoiceMode: (voiceMode: boolean) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onScrollToBottom: () => void;
}

export interface UseVoiceAndWaveReturn {
  waveAnim: SharedValue<number>;
  handleVoiceComplete: (voiceData: VoiceData) => Promise<void>;
  handleSendWave: () => Promise<void>;
}

/**
 * Hook for managing voice messages and wave greetings.
 */
export function useVoiceAndWave({
  conversationId,
  setIsSending,
  setIsVoiceMode,
  setMessages,
  onScrollToBottom,
}: UseVoiceAndWaveOptions): UseVoiceAndWaveReturn {
  // Animation for wave greeting
  const waveAnim = useSharedValue(0);

  // Handle voice message completion - upload and send as a message
  const handleVoiceComplete = useCallback(
    async (voiceData: VoiceData) => {
      setIsSending(true);
      setIsVoiceMode(false);

      try {
        // Create form data for upload
        const formData = new FormData();
         
        formData.append('audio', {
          uri: voiceData.uri,
          name: `voice_${Date.now()}.m4a`,
          type: 'audio/m4a',
        } as unknown);
        formData.append('duration', String(Math.round(voiceData.duration)));
        formData.append('waveform', JSON.stringify(voiceData.waveform));
        formData.append('conversation_id', conversationId);

        // Upload voice message
        const response = await api.post('/api/v1/voice-messages', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const rawMessage = response.data.data || response.data.message || response.data;

        // Validate message has required fields before adding
        if (!rawMessage || !rawMessage.id) {
          logger.warn('Invalid message response:', rawMessage);
          return;
        }

        const normalized = normalizeMessage(rawMessage);

        // Add with deduplication - socket may also deliver this message
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === normalized.id);
          if (exists) return prev;
          return [normalized, ...prev];
        });

        // Scroll to the new voice message
        onScrollToBottom();

        // Clean up the temporary file
        await FileSystem.deleteAsync(voiceData.uri, { idempotent: true });
      } catch (error) {
        logger.error('Error sending voice message:', error);
        Alert.alert('Error', 'Failed to send voice message. Please try again.');
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, setIsSending, setIsVoiceMode, setMessages, onScrollToBottom]
  );

  // Send a wave greeting
  const handleSendWave = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const emoji = WAVE_EMOJIS[Math.floor(Math.random() * WAVE_EMOJIS.length)];

    // Trigger wave animation
    waveAnim.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(0, { duration: 200 })
    );

    // Send the wave message directly
    try {
      const response = await api.post(`/api/v1/conversations/${conversationId}/messages`, {
        content: emoji,
        type: 'text',
      });

      const rawMessage = response.data.data || response.data.message || response.data;
      if (rawMessage?.id) {
        const normalized = normalizeMessage(rawMessage);
        // Prepend for inverted list (newest first)
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === normalized.id);
          if (exists) return prev;
          return [normalized, ...prev];
        });
        onScrollToBottom();
      }
    } catch (error) {
      logger.error('Error sending wave:', error);
    }
  }, [conversationId, waveAnim, setMessages, onScrollToBottom]);

  return {
    waveAnim,
    handleVoiceComplete,
    handleSendWave,
  };
}

export default useVoiceAndWave;
