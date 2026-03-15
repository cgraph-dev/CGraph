/**
 * Community Card — Mobile
 *
 * Reusable card component for displaying a community (group or forum)
 * in the mobile explore screen. Shows avatar, name, description,
 * member count, type badge, and category.
 *
 * @module screens/explore/community-card
 */
import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores';

export interface Community {
  id: string;
  type: 'group' | 'forum';
  name: string;
  description: string | null;
  member_count: number;
  avatar_url: string | null;
  category: string | null;
  created_at: string;
  is_verified: boolean;
}

interface CommunityCardProps {
  community: Community;
  onPress: (community: Community) => void;
}

/**
 * Community card component for explore listings on mobile.
 */
export default function CommunityCard({ community, onPress }: CommunityCardProps) {
  const { colors } = useThemeStore();

  const typeIcon = community.type === 'group' ? 'people' : 'chatbubbles';
  const typeLabel = community.type === 'group' ? 'Group' : 'Forum';
  const typeColor = community.type === 'group' ? '#3b82f6' : '#10b981';

  return (
    <TouchableOpacity
      onPress={() => onPress(community)}
      activeOpacity={0.7}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {community.avatar_url ? (
            <Image source={{ uri: community.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: typeColor + '33' }]}>
              <Text style={[styles.avatarLetter, { color: typeColor }]}>
                {community.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {community.name}
            </Text>
            {community.is_verified && (
              <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
            )}
          </View>

          <View style={styles.meta}>
            <View style={[styles.badge, { backgroundColor: typeColor + '22' }]}>
              { }
              <Ionicons name={typeIcon as 'people' | 'chatbubbles'} size={10} color={typeColor} />
              <Text style={[styles.badgeText, { color: typeColor }]}>{typeLabel}</Text>
            </View>
            <Ionicons name="people-outline" size={12} color={colors.textSecondary} />
            <Text style={[styles.memberCount, { color: colors.textSecondary }]}>
              {community.member_count.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Description */}
      {community.description ? (
        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
          {community.description}
        </Text>
      ) : null}

      {/* Footer */}
      <View style={styles.footer}>
        {community.category ? (
          <View style={[styles.categoryBadge, { backgroundColor: colors.background }]}>
            <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
              {community.category}
            </Text>
          </View>
        ) : (
          <View />
        )}

        <TouchableOpacity
          style={[styles.viewButton, { backgroundColor: colors.primary }]}
          onPress={() => onPress(community)}
        >
          <Text style={styles.viewButtonText}>View</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerText: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  memberCount: {
    fontSize: 12,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  viewButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
