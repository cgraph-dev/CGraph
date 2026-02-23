/**
 * EntryRow - Leaderboard entry item
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { AnimationColors } from '@/lib/animations/animation-engine';
import type { LeaderboardEntry, CategoryConfig } from '../types';
import { RANK_CONFIGS, formatValue } from '../types';
import { RankChangeIndicator } from './rank-change-indicator';

export interface EntryRowProps {
  entry: LeaderboardEntry;
  category: CategoryConfig;
  isCurrentUser: boolean;
  onPress: (userId: string) => void;
}

export function EntryRow({ entry, category, isCurrentUser, onPress }: EntryRowProps) {
  const scaleAnim = useSharedValue(1);
  const config = RANK_CONFIGS[entry.rank];

  const handlePressIn = () => {
    scaleAnim.value = withSpring(0.98, { stiffness: 150, damping: 10 });
  };

  const handlePressOut = () => {
    scaleAnim.value = withSpring(1, { stiffness: 150, damping: 10 });
  };

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  return (
    <TouchableOpacity
      onPress={() => onPress(entry.userId)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View style={scaleStyle}>
        <BlurView
          intensity={isCurrentUser ? 80 : 40}
          tint="dark"
          style={[
            styles.entryRow,
            isCurrentUser && styles.entryRowCurrentUser,
            config && styles.entryRowTop3,
          ]}
        >
          {/* Rank */}
          <View style={styles.rankContainer}>
            {config ? (
              <LinearGradient colors={config.colors} style={styles.rankBadgeTop3}>
                <Text style={styles.rankTextTop3}>{entry.rank}</Text>
              </LinearGradient>
            ) : (
              <Text style={styles.rankText}>{entry.rank}</Text>
            )}
            <RankChangeIndicator current={entry.rank} previous={entry.previousRank} />
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              {entry.avatarUrl ? (
                <Image source={{ uri: entry.avatarUrl }} style={styles.avatar} />
              ) : (
                <LinearGradient colors={category.colors} style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {entry.displayName?.[0] || entry.username[0]}
                  </Text>
                </LinearGradient>
              )}
              {entry.isOnline && <View style={styles.onlineBadge} />}
              {entry.isPremium && (
                <View style={styles.premiumBadge}>
                  <Ionicons name="star" size={8} color="#fbbf24" />
                </View>
              )}
            </View>

            <View style={styles.nameContainer}>
              <View style={styles.nameRow}>
                <Text
                  style={[styles.username, isCurrentUser && styles.usernameCurrentUser]}
                  numberOfLines={1}
                >
                  {entry.displayName || entry.username}
                </Text>
                {entry.isVerified && <Ionicons name="checkmark-circle" size={14} color="#3b82f6" />}
              </View>
              {entry.title && <Text style={styles.userTitle}>{entry.title}</Text>}
            </View>
          </View>

          {/* Level Badge */}
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Lv {entry.level}</Text>
          </View>

          {/* Value */}
          <View style={styles.valueContainer}>
            <Text style={[styles.value, config && { color: config.colors[0] }]}>
              {formatValue(entry.value)}
            </Text>
          </View>
        </BlurView>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
    overflow: 'hidden',
  },
  entryRowCurrentUser: {
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  entryRowTop3: {
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  rankContainer: {
    width: 60,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9ca3af',
  },
  rankBadgeTop3: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankTextTop3: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#111827',
  },
  premiumBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  username: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    maxWidth: 120,
  },
  usernameCurrentUser: {
    color: AnimationColors.primary,
  },
  userTitle: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  levelBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 12,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  valueContainer: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  value: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
});

export default EntryRow;
