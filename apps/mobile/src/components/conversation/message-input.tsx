/**
 * MessageInput Component
 *
 * Full-featured message composition input with attachments and emoji support.
 * The primary text input for conversations.
 *
 * @module components/conversation/MessageInput
 * @since v0.7.29
 */

import React, { memo, useCallback, useRef, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
  Keyboard,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface MessageInputProps {
  /** Current message text value */
  value: string;
  /** Callback when text changes */
  onChangeText: (text: string) => void;
  /** Callback when send button is pressed */
  onSend: () => void;
  /** Callback to open attachment picker */
  onAttachmentPress: () => void;
  /** Callback to open emoji picker */
  onEmojiPress?: () => void;
  /** Whether a message is currently sending */
  isSending?: boolean;
  /** Whether there are pending attachments */
  hasAttachments?: boolean;
  /** Number of pending attachments */
  attachmentCount?: number;
  /** Callback when typing starts */
  onTypingStart?: () => void;
  /** Callback when typing ends */
  onTypingEnd?: () => void;
  /** Background color for the input container */
  backgroundColor: string;
  /** Background color for the input field */
  inputBackgroundColor: string;
  /** Text color */
  textColor: string;
  /** Placeholder text color */
  placeholderColor: string;
  /** Primary accent color */
  accentColor: string;
  /** Placeholder text */
  placeholder?: string;
  /** Maximum height for multiline expansion */
  maxHeight?: number;
  /** Additional TextInput props */
  inputProps?: TextInputProps;
}

/**
 * Message composition input with attachment and emoji support.
 *
 * Features:
 * - Multiline auto-expanding input
 * - Attachment button with badge count
 * - Send button with disabled state
 * - Optional emoji picker button
 * - Typing indicator callbacks
 * - Keyboard aware with proper submit handling
 *
 * @example
 * ```tsx
 * <MessageInput
 *   value={message}
 *   onChangeText={setMessage}
 *   onSend={handleSend}
 *   onAttachmentPress={openPicker}
 *   backgroundColor="#1a1a2e"
 *   inputBackgroundColor="#2a2a3e"
 *   textColor="#fff"
 *   placeholderColor="#666"
 *   accentColor="#818cf8"
 * />
 * ```
 */
export const MessageInput = memo(function MessageInput({
  value,
  onChangeText,
  onSend,
  onAttachmentPress,
  onEmojiPress,
  isSending = false,
  hasAttachments = false,
  attachmentCount = 0,
  onTypingStart,
  onTypingEnd,
  backgroundColor,
  inputBackgroundColor,
  textColor,
  placeholderColor,
  accentColor,
  placeholder = 'Type a message...',
  maxHeight = 120,
  inputProps,
}: MessageInputProps) {
  const inputRef = useRef<TextInput>(null);
  const sendButtonScale = useRef(new Animated.Value(1)).current;
  const [inputHeight, setInputHeight] = useState(40);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canSend = (value.trim().length > 0 || hasAttachments) && !isSending;

  const handleTextChange = useCallback(
    (text: string) => {
      onChangeText(text);

      // Handle typing indicators
      if (onTypingStart && text.length > 0) {
        onTypingStart();
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (onTypingEnd) {
        typingTimeoutRef.current = setTimeout(() => {
          onTypingEnd();
        }, 2000);
      }
    },
    [onChangeText, onTypingStart, onTypingEnd]
  );

  const handleSend = useCallback(() => {
    if (!canSend) return;

    // Animate send button
    Animated.sequence([
      Animated.timing(sendButtonScale, {
        toValue: 0.85,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(sendButtonScale, {
        toValue: 1,
        tension: 200,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    onSend();
    Keyboard.dismiss();

    if (onTypingEnd) {
      onTypingEnd();
    }
  }, [canSend, onSend, sendButtonScale, onTypingEnd]);

  const handleContentSizeChange = useCallback(
    (event: { nativeEvent: { contentSize: { height: number } } }) => {
      const height = event.nativeEvent.contentSize.height;
      setInputHeight(Math.min(Math.max(40, height), maxHeight));
    },
    [maxHeight]
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Attachment button */}
      <TouchableOpacity
        style={styles.iconButton}
        onPress={onAttachmentPress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel="Add attachment"
      >
        <View style={styles.attachmentButtonWrapper}>
          <Ionicons name="add-circle" size={28} color={accentColor} />
          {attachmentCount > 0 && (
            <View style={[styles.attachmentBadge, { backgroundColor: accentColor }]}>
              <Animated.Text style={styles.attachmentBadgeText}>
                {attachmentCount > 9 ? '9+' : attachmentCount}
              </Animated.Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Text input */}
      <View style={[styles.inputContainer, { backgroundColor: inputBackgroundColor }]}>
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: textColor, height: inputHeight }]}
          value={value}
          onChangeText={handleTextChange}
          onContentSizeChange={handleContentSizeChange}
          placeholder={placeholder}
          placeholderTextColor={placeholderColor}
          multiline
          maxLength={4000}
          returnKeyType="default"
          blurOnSubmit={false}
          textAlignVertical="center"
          {...inputProps}
        />

        {/* Emoji button */}
        {onEmojiPress && (
          <TouchableOpacity
            style={styles.emojiButton}
            onPress={onEmojiPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="happy-outline" size={24} color={placeholderColor} />
          </TouchableOpacity>
        )}
      </View>

      {/* Send button */}
      <Animated.View style={{ transform: [{ scale: sendButtonScale }] }}>
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: canSend ? accentColor : placeholderColor + '40' },
          ]}
          onPress={handleSend}
          disabled={!canSend}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Send message"
          accessibilityState={{ disabled: !canSend }}
        >
          <Ionicons name="send" size={20} color={canSend ? '#fff' : placeholderColor} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 8 : 12,
    gap: 8,
  },
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 6,
  },
  attachmentButtonWrapper: {
    position: 'relative',
  },
  attachmentBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  attachmentBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : 6,
    paddingBottom: Platform.OS === 'ios' ? 8 : 6,
    maxHeight: 120,
  },
  emojiButton: {
    paddingLeft: 8,
    paddingBottom: 6,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MessageInput;
