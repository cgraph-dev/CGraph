/**
 * ChatInputArea Component
 *
 * Message input with attachment button, text input, and send/voice toggle.
 *
 * @module screens/messages/ConversationScreen/components
 */

import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import Animated, { SharedValue, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { VoiceMessageRecorder, MorphingInputButton } from '../../../../components';
import type { Message } from '../../../../types';
import { styles } from '../styles';

interface ChatInputAreaProps {
  inputText: string;
  replyingTo: Message | null;
  isVoiceMode: boolean;
  isSending: boolean;
  showAttachMenu: boolean;
  attachMenuAnim: SharedValue<number>;
  inputRef: React.RefObject<TextInput>;
  colors: {
    primary: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    surface: string;
    surfaceHover: string;
    border: string;
    input: string;
  };
  onTextChange: (text: string) => void;
  onSendMessage: () => void;
  onToggleAttachMenu: () => void;
  onStartVoice: () => void;
  onCancelVoice: () => void;
  onVoiceComplete: (data: { uri: string; duration: number; waveform: number[] }) => void;
  onCancelReply: () => void;
  onGifPress?: () => void;
}

/**
 * Complete chat input area with voice recording support.
 */
export function ChatInputArea({
  inputText,
  replyingTo,
  isVoiceMode,
  isSending,
  showAttachMenu,
  attachMenuAnim,
  inputRef,
  colors,
  onTextChange,
  onSendMessage,
  onToggleAttachMenu,
  onStartVoice,
  onCancelVoice,
  onVoiceComplete,
  onCancelReply,
  onGifPress,
}: ChatInputAreaProps) {
  const getReplyPreviewText = () => {
    if (replyingTo?.content) return replyingTo.content;
    if (!replyingTo) return '';
    switch (replyingTo.type) {
      case 'image':
        return 'Photo';
      case 'voice':
        return 'Voice message';
      default:
        return 'File';
    }
  };

  const attachRotateStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(attachMenuAnim.value, [0, 1], [0, 45])}deg`,
      },
    ],
  }));

  return (
    <>
      {/* Voice Recorder overlay */}
      {isVoiceMode && (
        <View style={[styles.voiceRecorderContainer, { backgroundColor: colors.surface }]}>
          <VoiceMessageRecorder
            onComplete={onVoiceComplete}
            onCancel={onCancelVoice}
            maxDuration={120}
          />
        </View>
      )}

      {/* Reply preview bar */}
      {replyingTo && (
        <View
          style={[
            styles.replyPreviewBar,
            { backgroundColor: colors.surface, borderTopColor: colors.border },
          ]}
        >
          <View style={[styles.replyPreviewLine, { backgroundColor: colors.primary }]} />
          <View style={styles.replyPreviewContent}>
            <Text style={[styles.replyPreviewLabel, { color: colors.primary }]}>
              Replying to {replyingTo.sender?.display_name || replyingTo.sender?.username || 'User'}
            </Text>
            <Text
              style={[styles.replyPreviewText, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {getReplyPreviewText()}
            </Text>
          </View>
          <TouchableOpacity onPress={onCancelReply} style={styles.replyPreviewClose}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Normal input area */}
      {!isVoiceMode && (
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: colors.surface, borderTopColor: colors.border },
          ]}
        >
          <TouchableOpacity style={styles.attachButton} onPress={onToggleAttachMenu}>
            <Animated.View
              style={attachRotateStyle}
            >
              <Ionicons
                name="add-circle"
                size={28}
                color={showAttachMenu ? colors.primary : colors.textSecondary}
              />
            </Animated.View>
          </TouchableOpacity>

          {/* GIF button */}
          {onGifPress && (
            <TouchableOpacity style={styles.attachButton} onPress={onGifPress}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textSecondary }}>GIF</Text>
            </TouchableOpacity>
          )}

          <TextInput
            ref={inputRef}
            style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
            placeholder={replyingTo ? 'Reply...' : 'Message...'}
            placeholderTextColor={colors.textTertiary}
            value={inputText}
            onChangeText={onTextChange}
            multiline
            maxLength={4000}
          />

          {/* Morphing send/mic button with web-parity animations */}
          <MorphingInputButton
            hasText={inputText.trim().length > 0}
            isSending={isSending}
            onSend={onSendMessage}
            onMic={onStartVoice}
            primaryColor={colors.primary}
            surfaceColor={colors.surfaceHover}
            textColor={colors.textSecondary}
            disabled={isSending}
          />
        </View>
      )}
    </>
  );
}

export default ChatInputArea;
