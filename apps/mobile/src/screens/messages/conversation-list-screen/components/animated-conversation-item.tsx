import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft, Layout } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import type { ThemeColors } from '@/stores';
import { safeFormatConversationTime } from '@/lib/dateUtils';
import { Conversation } from '@/types';
import AnimatedAvatar from '@/components/ui/animated-avatar';
import GlassCard from '@/components/ui/glass-card';
import { styles } from '../styles';

interface Props {
  item: Conversation;
  index: number;
  onPress: () => void;
  colors: ThemeColors;
  displayName: string;
  avatarUrl: string | undefined;
  isOnline: boolean;
  isPremium?: boolean;
}

export function AnimatedConversationItem({
  item, index, onPress, colors, displayName, avatarUrl, isOnline, isPremium,
}: Props) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const getBorderAnimation = ():
    | 'none' | 'solid' | 'gradient' | 'pulse' | 'rainbow' | 'glow' | 'neon' | 'holographic' => {
    if (isPremium) return 'holographic';
    if (isOnline) return 'glow';
    if (item.unread_count > 0) return 'pulse';
    return 'none';
  };

  return (
    <Animated.View style={styles.animatedWrapper}
      entering={FadeInRight.springify().damping(18).stiffness(200).delay(index * 40)}
      exiting={FadeOutLeft.duration(200)} layout={Layout.springify()}>
      <TouchableOpacity activeOpacity={0.8} onPress={handlePress} style={styles.conversationTouchable}>
        <GlassCard variant={item.unread_count > 0 ? 'neon' : 'frosted'} intensity="subtle"
          style={[styles.conversationCard, item.unread_count > 0 && styles.unreadCard] as any}
          glowColor={item.unread_count > 0 ? '#10b981' : undefined}>
          <View style={styles.conversationInner}>
            <View style={styles.avatarSection}>
              {avatarUrl ? (
                <AnimatedAvatar source={{ uri: avatarUrl }} size={56}
                  borderAnimation={getBorderAnimation()} shape="circle" showStatus={true}
                  isOnline={isOnline} isPremium={isPremium}
                  glowIntensity={item.unread_count > 0 ? 0.8 : 0.5} />
              ) : (
                <View style={styles.avatarFallback}>
                  <LinearGradient
                    colors={isPremium ? ['#8b5cf6', '#ec4899'] : ['#10b981', '#059669']}
                    style={styles.avatarGradient}>
                    <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
                  </LinearGradient>
                  {isOnline && <View style={styles.onlineIndicator} />}
                </View>
              )}
              {item.unread_count > 0 && (
                <View style={styles.unreadBadgeContainer}>
                  <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.unreadBadge}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Text style={styles.unreadText}>
                      {item.unread_count > 99 ? '99+' : item.unread_count}
                    </Text>
                  </LinearGradient>
                </View>
              )}
            </View>

            <View style={styles.conversationContent}>
              <View style={styles.conversationHeader}>
                <Text style={[styles.conversationName, { color: colors.text },
                  item.unread_count > 0 && styles.unreadName]} numberOfLines={1}>
                  {displayName}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  {!!(item as unknown as Record<string, unknown>).is_muted && (
                    <Ionicons name="notifications-off" size={14} color={colors.textTertiary} />
                  )}
                  {item.last_message && (
                    <View style={styles.timeContainer}>
                      <Text style={[styles.time, { color: colors.textTertiary }]}>
                        {safeFormatConversationTime(item.last_message.inserted_at)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              {item.last_message && (
                <View style={styles.messagePreview}>
                  {item.last_message.type === 'image' && (
                    <Ionicons name="image" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
                  )}
                  {item.last_message.type === 'video' && (
                    <Ionicons name="videocam" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
                  )}
                  {item.last_message.type === 'voice' && (
                    <Ionicons name="mic" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
                  )}
                  <Text style={[styles.lastMessage,
                    { color: item.unread_count > 0 ? colors.text : colors.textSecondary }]} numberOfLines={1}>
                    {item.last_message.content || 'Media message'}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.arrowContainer}>
              <Ionicons name="chevron-forward" size={20}
                color={item.unread_count > 0 ? colors.primary : colors.textTertiary} />
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
}
