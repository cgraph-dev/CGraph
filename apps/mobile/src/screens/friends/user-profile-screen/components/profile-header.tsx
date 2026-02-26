/**
 * Profile header card with avatar, name, badges, bio, and gamification stats.
 * @module screens/friends/user-profile-screen/components/profile-header
 */
import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from '../../../../components';
import { TitleBadge } from '../../../../components/gamification';
import { formatKarma, type UserProfile } from '../types';
import { styles } from '../styles';

interface ProfileHeaderProps {
  user: UserProfile;
  colors: Record<string, string>;
}

export function ProfileHeader({ user, colors }: ProfileHeaderProps) {
  return (
    <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
      <Avatar
        source={user.avatar_url}
        name={user.display_name || user.username || 'Unknown'}
        size="xl"
        status={user.status as 'online' | 'offline'}
      />
      <Text style={[styles.displayName, { color: colors.text }]}>
        {user.display_name || user.username || 'Unknown'}
      </Text>
      <Text style={[styles.username, { color: colors.textSecondary }]}>
        @{user.username || 'unknown'}
      </Text>

      {/* Karma & Verified Badge */}
      <View style={styles.badgesRow}>
        {user.karma !== undefined && (
          <View style={[styles.karmaBadge, { backgroundColor: colors.surfaceHover }]}>
            <Ionicons name="trophy" size={16} color="#F59E0B" />
            <Text style={[styles.karmaText, { color: colors.text }]}>
              {formatKarma(user.karma)} karma
            </Text>
          </View>
        )}
        {user.is_verified && (
          <View style={[styles.verifiedBadge, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
            <Text style={[styles.verifiedText, { color: colors.primary }]}>Verified</Text>
          </View>
        )}
      </View>

      {user.bio && <Text style={[styles.bio, { color: colors.text }]}>{user.bio}</Text>}

      {/* Gamification Stats Section */}
      {(user.level || user.current_title || user.achievements_count) && (
        <View style={styles.gamificationSection}>
          {user.current_title && (
            <View style={styles.titleContainer}>
              <TitleBadge title={user.current_title} rarity="rare" size="md" />
            </View>
          )}

          {user.level && (
            <View style={styles.levelContainer}>
              <LinearGradient colors={['#8b5cf620', 'transparent']} style={styles.levelGradient}>
                <View style={styles.levelHeader}>
                  <View style={styles.levelBadge}>
                    <Ionicons name="sparkles" size={16} color="#8b5cf6" />
                    <Text style={styles.levelText}>Level {user.level}</Text>
                  </View>
                  {user.xp !== undefined && (
                    <Text style={styles.xpText}>{(user.xp ?? 0).toLocaleString()} XP</Text>
                  )}
                </View>
              </LinearGradient>
            </View>
          )}

          <View style={styles.statsRow}>
            {user.achievements_count !== undefined && (
              <View style={[styles.statItem, { backgroundColor: colors.surfaceHover }]}>
                <Ionicons name="trophy" size={18} color="#f59e0b" />
                <Text style={[styles.statValue, { color: colors.text }]}>{user.achievements_count}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Achievements</Text>
              </View>
            )}
            {user.streak !== undefined && user.streak > 0 && (
              <View style={[styles.statItem, { backgroundColor: colors.surfaceHover }]}>
                <Text style={styles.streakEmoji}>🔥</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>{user.streak}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Day Streak</Text>
              </View>
            )}
            {user.titles && user.titles.length > 0 && (
              <View style={[styles.statItem, { backgroundColor: colors.surfaceHover }]}>
                <Ionicons name="ribbon" size={18} color="#ec4899" />
                <Text style={[styles.statValue, { color: colors.text }]}>{user.titles.length}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Titles</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Private Profile Notice */}
      {user.is_profile_private && user.username === 'Unknown' && (
        <View style={[styles.privateNotice, { backgroundColor: colors.surfaceHover }]}>
          <Ionicons name="lock-closed" size={18} color={colors.textSecondary} />
          <Text style={[styles.privateNoticeText, { color: colors.textSecondary }]}>
            This profile is private. Send a friend request to see more info.
          </Text>
        </View>
      )}
    </View>
  );
}
