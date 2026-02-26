/**
 * EmptyConversation Component
 *
 * Beautiful animated empty conversation state.
 * Inspired by modern messaging welcome screens.
 *
 * @module screens/messages/ConversationScreen/components
 */

import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import Animated, { SharedValue, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import type { UserBasic } from '../../../../types';
import { styles } from '../styles';

interface EmptyConversationProps {
  otherUser: UserBasic | null;
  colors: {
    primary: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    surface: string;
    border: string;
  };
  waveAnim: SharedValue<number>;
  onSendWave: () => void;
  onSetInputText: (text: string) => void;
}

/**
 * Empty conversation state with profile, wave button, and conversation starters.
 */
export function EmptyConversation({
  otherUser,
  colors,
  waveAnim,
  onSendWave,
  onSetInputText,
}: EmptyConversationProps) {
  const otherName = otherUser?.display_name || otherUser?.username || 'this person';
  const otherAvatar = otherUser?.avatar_url;
  const otherInitial = otherName.charAt(0).toUpperCase();

  // Animated wave hand for the greeting
  const waveStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(
          waveAnim.value,
          [0, 0.5, 1],
          [0, 20, 0]
        )}deg`,
      },
    ],
  }));

  return (
    <View style={styles.emptyStateWrapper}>
      {/* Large profile avatar */}
      <View style={styles.emptyProfileSection}>
        {otherAvatar ? (
          <Image source={{ uri: otherAvatar }} style={styles.emptyAvatar} />
        ) : (
          <View style={[styles.emptyAvatarPlaceholder, { backgroundColor: colors.primary }]}>
            <Text style={styles.emptyAvatarText}>{otherInitial}</Text>
          </View>
        )}
        <View style={styles.emptyOnlineIndicator} />
      </View>

      {/* User name and info */}
      <Text style={[styles.emptyUserName, { color: colors.text }]}>{otherName}</Text>

      {/* Cute message with animated emoji */}
      <View style={styles.emptyMessageRow}>
        <Animated.Text style={[styles.emptyWaveEmoji, waveStyle]}>
          👋
        </Animated.Text>
        <Text style={[styles.emptyMessageText, { color: colors.textSecondary }]}>
          This is the very beginning of your{'\n'}conversation with {otherName}
        </Text>
      </View>

      {/* Action buttons */}
      <View style={styles.emptyActions}>
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

      {/* Fun conversation starters */}
      <View style={styles.conversationStarters}>
        <Text style={[styles.startersTitle, { color: colors.textTertiary }]}>Quick starters</Text>
        <View style={styles.startersRow}>
          {['Hello! 👋', "What's up? 🤔", 'Nice to meet you! ✨'].map((starter, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.starterChip,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
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
}

export default EmptyConversation;
