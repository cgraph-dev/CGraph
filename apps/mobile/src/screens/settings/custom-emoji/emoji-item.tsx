/**
 * EmojiItem - Grid item component for emoji display
 *
 * @version 1.0.0
 */

import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { LottieRenderer } from '@/lib/lottie';
import type { CustomEmoji } from './types';
import { styles } from './styles';

interface EmojiItemProps {
  emoji: CustomEmoji;
  onPress: () => void;
  onLongPress: () => void;
}

/**
 *
 */
export function EmojiItem({ emoji, onPress, onLongPress }: EmojiItemProps) {
  return (
    <TouchableOpacity
      style={styles.emojiItem}
      onPress={() => {
        HapticFeedback.light();
        onPress();
      }}
      onLongPress={() => {
        HapticFeedback.medium();
        onLongPress();
      }}
      activeOpacity={0.7}
    >
      <View style={styles.emojiPreview}>
        {emoji.animationFormat === 'lottie' && emoji.lottieUrl ? (
          <LottieRenderer
            url={emoji.lottieUrl}
            size={48}
            autoplay
            loop
            fallbackSrc={emoji.imageUrl || undefined}
          />
        ) : emoji.imageUrl ? (
          <Image source={{ uri: emoji.imageUrl }} style={styles.emojiImage} />
        ) : (
          <LinearGradient colors={['#10b981', '#059669']} style={styles.emojiPlaceholder}>
            <Text style={styles.emojiPlaceholderText}>:{emoji.shortcode.substring(0, 2)}:</Text>
          </LinearGradient>
        )}
        {emoji.isAnimated && (
          <View style={styles.animatedBadge}>
            {emoji.animationFormat === 'lottie' ? (
              <Text style={{ fontSize: 6, color: '#fff', fontWeight: '700' }}>L</Text>
            ) : (
              <Ionicons name="play" size={8} color="#fff" />
            )}
          </View>
        )}
      </View>
      <Text style={styles.emojiName} numberOfLines={1}>
        {emoji.name}
      </Text>
      <Text style={styles.emojiShortcode}>:{emoji.shortcode}:</Text>
    </TouchableOpacity>
  );
}
