/**
 * Member list item with avatar, name, role badge, and stats.
 * @module screens/community/member-list-screen/components/member-item
 */
import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { Member } from '../types';
import { styles } from '../styles';

interface MemberItemProps {
  member: Member;
  onPress: () => void;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

/** Description. */
/** Member Item component. */
export function MemberItem({ member, onPress }: MemberItemProps) {
  return (
    <TouchableOpacity
      style={styles.memberItem}
      onPress={() => {
        HapticFeedback.light();
        onPress();
      }}
      activeOpacity={0.7}
    >
      <View style={styles.memberAvatar}>
        {member.avatarUrl ? (
          <Image source={{ uri: member.avatarUrl }} style={styles.avatarImage} />
        ) : (
          <LinearGradient
            colors={[member.userGroupColor || '#10b981', '#059669']}
            style={styles.avatarPlaceholder}
          >
            <Text style={styles.avatarInitial}>
              {(member.displayName || member.username)[0].toUpperCase()}
            </Text>
          </LinearGradient>
        )}
        {member.isOnline && <View style={styles.onlineIndicator} />}
      </View>

      <View style={styles.memberInfo}>
        <View style={styles.memberNameRow}>
          <Text style={styles.memberName} numberOfLines={1}>
            {member.displayName || member.username}
          </Text>
          <View
            style={[
              styles.groupBadge,
              { backgroundColor: (member.userGroupColor || '#6b7280') + '30' },
            ]}
          >
            <Text style={[styles.groupBadgeText, { color: member.userGroupColor || '#6b7280' }]}>
              {member.userGroup}
            </Text>
          </View>
        </View>
        <Text style={styles.memberUsername}>@{member.username}</Text>
        <View style={styles.memberStats}>
          <Text style={styles.memberStat}>
            <Ionicons name="document-text" size={12} color="#9ca3af" /> {member.postCount} posts
          </Text>
          <Text style={styles.memberStat}>
            <Ionicons name="star" size={12} color="#f59e0b" /> {member.reputation}
          </Text>
          <Text style={styles.memberStat}>Joined {formatDate(member.joinedAt)}</Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#6b7280" />
    </TouchableOpacity>
  );
}
