/**
 * PinnedMessagesBar Component
 *
 * Shows pinned message preview with navigation for multiple pins.
 *
 * @module screens/messages/ConversationScreen/components
 */

import React from 'react';
import { View, Text, Image, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { Message } from '../../../../types';
import { styles } from '../styles';

interface PinnedMessagesBarProps {
  pinnedMessages: Message[];
  currentPinnedMessage: Message;
  currentPinnedIndex: number;
  colors: {
    primary: string;
    text: string;
    textSecondary: string;
    surface: string;
    border: string;
    input: string;
  };
  onScrollToMessage: (messageId: string) => void;
  onSetCurrentIndex: (index: number) => void;
  onNavigate: (direction: 'next' | 'prev') => void;
}

/**
 * Enhanced pinned messages bar with navigation.
 */
export function PinnedMessagesBar({
  pinnedMessages,
  currentPinnedMessage,
  currentPinnedIndex,
  colors,
  onScrollToMessage,
  onSetCurrentIndex,
  onNavigate,
}: PinnedMessagesBarProps) {
  const getMessagePreviewText = () => {
    const msg = currentPinnedMessage;
    if (msg.content && !msg.content.match(/^(📷 Photo|Photo|🎥 Video|Video|\d+ photos?)$/)) {
      return msg.content;
    }
    switch (msg.type) {
      case 'image':
        return 'Photo';
      case 'video':
        return '🎬 Video';
      case 'voice':
        return '🎤 Voice message';
      case 'file':
        return `📎 ${msg.metadata?.filename || 'File'}`;
      default:
        return 'Message';
    }
  };

  return (
    <Animated.View
      style={[
        styles.pinnedBarEnhanced,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.pinnedBarTouchable}
        onPress={() => onScrollToMessage(currentPinnedMessage.id)}
        activeOpacity={0.8}
      >
        {/* Animated gradient indicator */}
        <LinearGradient
          colors={[colors.primary, `${colors.primary}80`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.pinnedBarGradient}
        />

        {/* Media preview thumbnail */}
        <MediaPreviewThumbnail message={currentPinnedMessage} colors={colors} />

        {/* Content */}
        <View style={styles.pinnedBarContentEnhanced}>
          <View style={styles.pinnedBarHeaderRow}>
            <View style={styles.pinnedIconContainer}>
              <Ionicons name="pin" size={12} color={colors.primary} />
            </View>
            <Text style={[styles.pinnedBarLabelEnhanced, { color: colors.primary }]}>
              Pinned
              {pinnedMessages.length > 1 && (
                <Text style={styles.pinnedBarCounter}>
                  {' '}
                  · {currentPinnedIndex + 1}/{pinnedMessages.length}
                </Text>
              )}
            </Text>
            {currentPinnedMessage.sender && (
              <Text
                style={[styles.pinnedBarSender, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                by{' '}
                {currentPinnedMessage.sender.display_name || currentPinnedMessage.sender.username}
              </Text>
            )}
          </View>
          <Text style={[styles.pinnedBarTextEnhanced, { color: colors.text }]} numberOfLines={1}>
            {getMessagePreviewText()}
          </Text>
        </View>

        {/* Progress dots for multiple pins */}
        {pinnedMessages.length > 1 && (
          <View style={styles.pinnedProgressContainer}>
            {pinnedMessages.map((_, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => {
                  onSetCurrentIndex(idx);
                  Haptics.selectionAsync();
                }}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <View
                  style={[
                    styles.pinnedProgressDot,
                    {
                      backgroundColor: idx === currentPinnedIndex ? colors.primary : colors.border,
                    },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Navigation arrows */}
        {pinnedMessages.length > 1 && (
          <View style={styles.pinnedBarNavEnhanced}>
            <TouchableOpacity
              onPress={() => onNavigate('prev')}
              style={[styles.pinnedNavBtn, { backgroundColor: colors.input }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-up" size={16} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onNavigate('next')}
              style={[styles.pinnedNavBtn, { backgroundColor: colors.input }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-down" size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// Sub-component for media preview thumbnail
function MediaPreviewThumbnail({
  message,
  colors,
}: {
  message: Message;
  colors: { primary: string };
}) {
  if ((message.type === 'image' || message.type === 'video') && message.metadata?.url) {
    return (
      <View style={styles.pinnedMediaPreview}>
        <Image
          source={{ uri: message.metadata.thumbnail || message.metadata.url }}
          style={styles.pinnedMediaThumbnail}
        />
        {message.type === 'video' && (
          <View style={styles.pinnedVideoIcon}>
            <Ionicons name="play" size={10} color="#fff" />
          </View>
        )}
      </View>
    );
  }

  if (message.type === 'voice' || message.type === 'audio') {
    return (
      <View style={[styles.pinnedVoiceIndicator, { backgroundColor: colors.primary + '20' }]}>
        <Ionicons name="mic" size={18} color={colors.primary} />
      </View>
    );
  }

  if (message.type === 'file') {
    return (
      <View style={[styles.pinnedFileIndicator, { backgroundColor: colors.primary + '20' }]}>
        <Ionicons name="document-attach" size={18} color={colors.primary} />
      </View>
    );
  }

  return null;
}

export default PinnedMessagesBar;
