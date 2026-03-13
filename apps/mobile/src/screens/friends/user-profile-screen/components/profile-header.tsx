/**
 * Profile header card with avatar, name, badges, and bio.
 * @module screens/friends/user-profile-screen/components/profile-header
 */
import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../../../components';
import { formatKarma, type UserProfile } from '../types';
import { styles } from '../styles';
import type { ThemeColors } from '@/stores';

interface ProfileHeaderProps {
  user: UserProfile;
  colors: ThemeColors;
}

/** Profile header card with avatar, name, badges, and bio. */
export function ProfileHeader({ user, colors }: ProfileHeaderProps) {
  return (
    <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
      <Avatar
        source={user.avatar_url}
        name={user.display_name || user.username || 'Unknown'}
        size="xl"
        status={user.status === 'online' ? 'online' : 'offline'}
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
