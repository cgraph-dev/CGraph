import { durations } from '@cgraph/animation-constants';
import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import AnimatedAvatar from '../../../../components/ui/animated-avatar';
import GlassCard from '../../../../components/ui/glass-card';
import type { FriendItem, ThemeColors } from '../types';
import { styles } from '../styles';

interface Props {
  item: FriendItem;
  index: number;
  onPress: () => void;
  colors: ThemeColors;
  isOnline: boolean;
}

/** Description. */
/** Animated Friend Item component. */
export function AnimatedFriendItem({ item, index, onPress, colors, isOnline }: Props) {
  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: durations.smooth.ms,
        delay: index * 40,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        delay: index * 40,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        delay: index * 40,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: durations.instant.ms,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  const displayName = item.user.display_name || item.user.username || 'User';
  const avatarUrl = item.user.avatar_url;
   
  const isPremium = !!(item.user as Record<string, unknown>).is_premium;

  const getBorderAnimation = (): 'none' | 'glow' | 'holographic' | 'rainbow' => {
    if (isPremium) return 'holographic';
    if (isOnline) return 'glow';
    return 'none';
  };

  return (
    <Animated.View
      style={[
        styles.friendItemWrapper,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity activeOpacity={0.8} onPress={handlePress}>
        <GlassCard
          variant={isOnline ? 'neon' : 'frosted'}
          intensity="subtle"
          style={styles.friendCard}
          glowColor={isOnline ? '#22c55e' : undefined}
        >
          <View style={styles.friendInner}>
            <View style={styles.avatarSection}>
              {avatarUrl ? (
                <AnimatedAvatar
                  source={{ uri: avatarUrl }}
                  size={50}
                  borderAnimation={getBorderAnimation()}
                  shape="circle"
                  showStatus={true}
                  isOnline={isOnline}
                  isPremium={isPremium}
                  glowIntensity={0.6}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <LinearGradient
                    colors={isPremium ? ['#8b5cf6', '#ec4899'] : ['#10b981', '#059669']}
                    style={styles.avatarGradient}
                  >
                    <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
                  </LinearGradient>
                  {isOnline && <View style={styles.onlineIndicator} />}
                </View>
              )}
            </View>

            <View style={styles.friendInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.friendName, { color: colors.text }]} numberOfLines={1}>
                  {displayName}
                </Text>
                {isPremium && (
                  <LinearGradient colors={['#8b5cf6', '#ec4899']} style={styles.premiumBadge}>
                    <Ionicons name="diamond" size={10} color="#fff" />
                  </LinearGradient>
                )}
              </View>
              <Text
                style={[styles.friendUsername, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                @{item.user.username || item.user.id?.slice(0, 8) || 'unknown'}
              </Text>
            </View>

            <View style={styles.statusSection}>
              {isOnline ? (
                <View style={styles.onlineStatus}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.onlineText}>Online</Text>
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              )}
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
}
