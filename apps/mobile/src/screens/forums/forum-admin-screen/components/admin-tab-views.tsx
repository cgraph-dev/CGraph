import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ForumStats, ModerationItem, BannedUser, Moderator } from '../types';
import { styles } from '../styles';

interface ColorsType {
  text: string;
  textSecondary: string;
  surface: string;
  primary: string;
  secondary: string;
  warning: string;
  success: string;
  error: string;
}

export function OverviewGrid({ stats, colors }: { stats: ForumStats | null; colors: ColorsType }) {
  return (
    <View style={styles.statsGrid}>
      <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
        <Ionicons name="document-text-outline" size={28} color={colors.primary} />
        <Text style={[styles.statValue, { color: colors.text }]}>
          {(stats?.total_posts ?? 0).toLocaleString()}
        </Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Posts</Text>
      </View>
      <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
        <Ionicons name="chatbubbles-outline" size={28} color={colors.primary} />
        <Text style={[styles.statValue, { color: colors.text }]}>
          {(stats?.total_comments ?? 0).toLocaleString()}
        </Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Comments</Text>
      </View>
      <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
        <Ionicons name="people-outline" size={28} color={colors.primary} />
        <Text style={[styles.statValue, { color: colors.text }]}>
          {(stats?.total_members ?? 0).toLocaleString()}
        </Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Members</Text>
      </View>
      <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
        <Ionicons name="flag-outline" size={28} color={colors.warning} />
        <Text style={[styles.statValue, { color: colors.text }]}>{stats?.pending_reports}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending Reports</Text>
      </View>
      <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
        <Ionicons name="trending-up-outline" size={28} color={colors.success} />
        <Text style={[styles.statValue, { color: colors.text }]}>{stats?.posts_today}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Posts Today</Text>
      </View>
      <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
        <Ionicons name="pulse-outline" size={28} color={colors.success} />
        <Text style={[styles.statValue, { color: colors.text }]}>{stats?.active_users_24h}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active (24h)</Text>
      </View>
    </View>
  );
}

export function ModQueueItem({
  item, colors, onApprove, onRemove,
}: {
  item: ModerationItem; colors: ColorsType;
  onApprove: (item: ModerationItem) => void;
  onRemove: (item: ModerationItem) => void;
}) {
  return (
    <View style={[styles.modItem, { backgroundColor: colors.surface }]}>
      <View style={styles.modItemHeader}>
        <View style={[styles.typeBadge, { backgroundColor: item.type === 'post' ? colors.primary : colors.secondary }]}>
          <Text style={styles.typeBadgeText}>{item.type}</Text>
        </View>
        <Text style={[styles.modItemDate, { color: colors.textSecondary }]}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      <Text style={[styles.modItemContent, { color: colors.text }]} numberOfLines={3}>{item.content}</Text>
      <View style={styles.modItemMeta}>
        <Text style={[styles.modItemAuthor, { color: colors.textSecondary }]}>
          By u/{item.author?.username || 'unknown'}
        </Text>
        <Text style={[styles.modItemReason, { color: colors.warning }]}>Reason: {item.reason}</Text>
      </View>
      <View style={styles.modItemActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton, { backgroundColor: colors.success }]}
          onPress={() => onApprove(item)}
        >
          <Ionicons name="checkmark" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.removeButton, { backgroundColor: colors.error }]}
          onPress={() => onRemove(item)}
        >
          <Ionicons name="trash-outline" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function BannedUserItem({
  item, colors, onUnban,
}: { item: BannedUser; colors: ColorsType; onUnban: (userId: string) => void }) {
  return (
    <View style={[styles.userItem, { backgroundColor: colors.surface }]}>
      <View style={styles.userInfo}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{item.user?.username?.charAt(0).toUpperCase() || '?'}</Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={[styles.username, { color: colors.text }]}>u/{item.user?.username || 'unknown'}</Text>
          <Text style={[styles.banReason, { color: colors.textSecondary }]}>{item.reason}</Text>
          <Text style={[styles.banDate, { color: colors.textSecondary }]}>
            Banned {new Date(item.banned_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <TouchableOpacity style={[styles.unbanButton, { borderColor: colors.success }]} onPress={() => onUnban(item.user.id)}>
        <Text style={[styles.unbanButtonText, { color: colors.success }]}>Unban</Text>
      </TouchableOpacity>
    </View>
  );
}

export function ModeratorItem({ item, colors }: { item: Moderator; colors: ColorsType }) {
  return (
    <View style={[styles.userItem, { backgroundColor: colors.surface }]}>
      <View style={styles.userInfo}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{item.user?.username?.charAt(0).toUpperCase() || '?'}</Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={[styles.username, { color: colors.text }]}>u/{item.user?.username || 'unknown'}</Text>
          <Text style={[styles.modPermissions, { color: colors.textSecondary }]}>
            {item.permissions?.join(', ') || 'Full permissions'}
          </Text>
        </View>
      </View>
      <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
    </View>
  );
}
