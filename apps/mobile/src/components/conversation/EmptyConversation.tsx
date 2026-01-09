/**
 * EmptyConversation Component
 * 
 * Beautiful animated empty state for new conversations.
 * Encourages users to start chatting with wave buttons and quick starters.
 * 
 * @module components/conversation/EmptyConversation
 * @since v0.7.29
 */

import React, { memo } from 'react';
import { View, Text, Image, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { UserBasic } from '../../types';

export interface EmptyConversationProps {
  /** The other user in the conversation */
  otherUser: UserBasic | null;
  /** Theme colors */
  colors: {
    primary: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    surface: string;
    border: string;
  };
  /** Animation value for wave animation */
  waveAnim: Animated.Value;
  /** Callback when wave button is pressed */
  onSendWave: () => void;
  /** Callback to set input text with a starter message */
  onSetInputText: (text: string) => void;
}

/** Conversation starter suggestions */
const QUICK_STARTERS = ['Hello! 👋', "What's up? 🤔", 'Nice to meet you! ✨'];

/**
 * Empty state component displayed when a conversation has no messages.
 * 
 * Features:
 * - User avatar with online indicator
 * - Animated waving hand emoji
 * - "Wave" button to send greeting
 * - "Say Hi" button with preset message
 * - Quick starter chips for common greetings
 * 
 * Design inspired by Discord and Telegram's friendly empty states.
 * 
 * @example
 * ```tsx
 * <EmptyConversation
 *   otherUser={participant}
 *   colors={themeColors}
 *   waveAnim={waveAnimValue}
 *   onSendWave={handleWave}
 *   onSetInputText={setInputText}
 * />
 * ```
 */
export const EmptyConversation = memo(function EmptyConversation({
  otherUser,
  colors,
  waveAnim,
  onSendWave,
  onSetInputText,
}: EmptyConversationProps) {
  const otherName = otherUser?.display_name || otherUser?.username || 'this person';
  const otherAvatar = otherUser?.avatar_url;
  const otherInitial = otherName.charAt(0).toUpperCase();

  // Animated wave rotation
  const waveRotate = waveAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '20deg', '0deg'],
  });

  return (
    <View style={styles.wrapper}>
      {/* Large profile avatar */}
      <View style={styles.profileSection}>
        {otherAvatar ? (
          <Image source={{ uri: otherAvatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{otherInitial}</Text>
          </View>
        )}
        <View style={styles.onlineIndicator} />
      </View>

      {/* User name */}
      <Text style={[styles.userName, { color: colors.text }]}>{otherName}</Text>

      {/* Cute message with animated emoji */}
      <View style={styles.messageRow}>
        <Animated.Text style={[styles.waveEmoji, { transform: [{ rotate: waveRotate }] }]}>
          👋
        </Animated.Text>
        <Text style={[styles.messageText, { color: colors.textSecondary }]}>
          This is the very beginning of your{'\n'}conversation with {otherName}
        </Text>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.waveButton, { backgroundColor: colors.primary }]}
          onPress={onSendWave}
          activeOpacity={0.8}
        >
          <Text style={styles.waveButtonText}>👋 Wave to {otherName}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sayHiButton, { borderColor: colors.border }]}
          onPress={() => onSetInputText('Hey! How are you? 😊')}
          activeOpacity={0.8}
        >
          <Text style={[styles.sayHiButtonText, { color: colors.text }]}>💬 Say Hi</Text>
        </TouchableOpacity>
      </View>

      {/* Quick conversation starters */}
      <View style={styles.starters}>
        <Text style={[styles.startersTitle, { color: colors.textTertiary }]}>Quick starters</Text>
        <View style={styles.startersRow}>
          {QUICK_STARTERS.map((starter, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.starterChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => onSetInputText(starter)}
              activeOpacity={0.7}
            >
              <Text style={[styles.starterText, { color: colors.text }]}>{starter}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  profileSection: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#22c55e',
    borderWidth: 3,
    borderColor: '#1a1a2e',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  waveEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  messageText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    width: '100%',
    maxWidth: 280,
    gap: 12,
    marginBottom: 24,
  },
  waveButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
  },
  waveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sayHiButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    borderWidth: 1,
    alignItems: 'center',
  },
  sayHiButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  starters: {
    alignItems: 'center',
    marginTop: 8,
  },
  startersTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  startersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  starterChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  starterText: {
    fontSize: 13,
  },
});

export default EmptyConversation;
