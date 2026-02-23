/**
 * Live message preview component for chat bubble style customization.
 * @module screens/settings/chat-bubble-settings-screen/components/message-preview
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ChatBubbleStyle } from '../types';

interface MessagePreviewProps {
  style: ChatBubbleStyle;
}

export function MessagePreview({ style }: MessagePreviewProps) {
  const avatarSize = style.avatarSize === 'small' ? 24 : style.avatarSize === 'large' ? 40 : 32;

  return (
    <View style={styles.previewContainer}>
      <BlurView intensity={30} tint="dark" style={styles.previewContent}>
        {/* Received message */}
        <View
          style={[
            styles.messageRow,
            { justifyContent: style.alignReceived === 'left' ? 'flex-start' : 'flex-end' },
          ]}
        >
          {style.showAvatar && (
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: '#8b5cf6',
                  width: avatarSize,
                  height: avatarSize,
                },
              ]}
            />
          )}
          <View
            style={[
              styles.messageBubble,
              {
                backgroundColor: style.otherMessageBg,
                borderRadius: style.borderRadius,
                maxWidth: `${style.maxWidth}%`,
              },
            ]}
          >
            <Text style={[styles.messageText, { color: style.otherMessageText }]}>
              Hey! How's it going?
            </Text>
            {style.showTimestamp && style.timestampPosition === 'inside' && (
              <Text style={styles.timestamp}>12:34 PM</Text>
            )}
          </View>
        </View>

        {/* Sent message */}
        <View
          style={[
            styles.messageRow,
            { justifyContent: style.alignSent === 'right' ? 'flex-end' : 'flex-start' },
          ]}
        >
          <LinearGradient
            colors={
              style.useGradient
                ? [style.ownMessageBg, '#8b5cf6']
                : [style.ownMessageBg, style.ownMessageBg]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.messageBubble,
              {
                borderRadius: style.borderRadius,
                maxWidth: `${style.maxWidth}%`,
              },
            ]}
          >
            <Text style={[styles.messageText, { color: style.ownMessageText }]}>
              Pretty good! Customizing bubbles 🎨
            </Text>
            {style.showTimestamp && style.timestampPosition === 'inside' && (
              <Text style={styles.timestamp}>12:35 PM</Text>
            )}
          </LinearGradient>
          {style.showAvatar && (
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: '#10b981',
                  width: avatarSize,
                  height: avatarSize,
                },
              ]}
            />
          )}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  previewContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  previewContent: {
    padding: 16,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  avatar: {
    borderRadius: 100,
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  messageText: {
    fontSize: 14,
  },
  timestamp: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
});
