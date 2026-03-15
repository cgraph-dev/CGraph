/**
 * ResultItems - Search Result Item Components
 *
 * Renders individual search result items for users, groups, and forums
 * with proper styling and animations.
 *
 * @module screens/search/SearchScreen/components/ResultItems
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../../../components/ui/glass-card';
import AnimatedAvatar from '../../../../components/ui/animated-avatar';
import { AnimatedResultItem } from './animated-result-item';
import type { ThemeColors } from '@/stores';

// ============================================================================
// TYPES
// ============================================================================

export interface SearchUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  status: string;
  is_premium?: boolean;
  is_verified?: boolean;
}

export interface SearchGroup {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  member_count: number;
}

export interface SearchForum {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  post_count: number;
}

// ============================================================================
// USER RESULT ITEM
// ============================================================================

interface UserResultItemProps {
  user: SearchUser;
  index: number;
  colors: ThemeColors;
  onPress?: () => void;
}

/**
 * User Result Item component.
 *
 */
export function UserResultItem({ user, index, colors, onPress }: UserResultItemProps) {
  return (
    <AnimatedResultItem index={index} onPress={onPress || (() => {})}>
      <GlassCard variant="frosted" intensity="subtle" style={styles.resultCard}>
        <View style={styles.resultInner}>
          <AnimatedAvatar
            source={{ uri: user.avatar_url || '' }}
            size={48}
            borderAnimation={
              user.is_premium ? 'holographic' : user.status === 'online' ? 'glow' : 'none'
            }
            isPremium={user.is_premium}
          />
          <View style={styles.resultInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.resultTitle, { color: colors.text }]}>
                {user.display_name || user.username}
              </Text>
              {user.is_verified && (
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color="#3b82f6"
                  style={{ marginLeft: 4 }}
                />
              )}
              {user.is_premium && (
                <LinearGradient
                  colors={['#f59e0b', '#ef4444']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.premiumBadge}
                >
                  <Text style={styles.premiumText}>PRO</Text>
                </LinearGradient>
              )}
            </View>
            <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]}>
              @{user.username}
            </Text>
          </View>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: user.status === 'online' ? '#10b981' : colors.textTertiary },
            ]}
          />
        </View>
      </GlassCard>
    </AnimatedResultItem>
  );
}

// ============================================================================
// GROUP RESULT ITEM
// ============================================================================

interface GroupResultItemProps {
  group: SearchGroup;
  index: number;
  colors: ThemeColors;
  onPress?: () => void;
}

/**
 * Group Result Item component.
 *
 */
export function GroupResultItem({ group, index, colors, onPress }: GroupResultItemProps) {
   
  const gradient = ['#f59e0b', '#f97316'] as [string, string];

  return (
    <AnimatedResultItem index={index} onPress={onPress || (() => {})}>
      <GlassCard variant="frosted" intensity="subtle" style={styles.resultCard}>
        <View style={styles.resultInner}>
          <LinearGradient colors={gradient} style={styles.iconContainer}>
            <Ionicons name="people" size={22} color="#fff" />
          </LinearGradient>
          <View style={styles.resultInfo}>
            <Text style={[styles.resultTitle, { color: colors.text }]}>{group.name}</Text>
            <View style={styles.statRow}>
              <Ionicons name="people-outline" size={12} color={colors.textSecondary} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>
                {(group?.member_count ?? 0).toLocaleString()} members
              </Text>
            </View>
          </View>
          <LinearGradient colors={gradient} style={styles.arrowContainer}>
            <Ionicons name="chevron-forward" size={14} color="#fff" />
          </LinearGradient>
        </View>
      </GlassCard>
    </AnimatedResultItem>
  );
}

// ============================================================================
// FORUM RESULT ITEM
// ============================================================================

interface ForumResultItemProps {
  forum: SearchForum;
  index: number;
  colors: ThemeColors;
  onPress?: () => void;
}

/**
 * Forum Result Item component.
 *
 */
export function ForumResultItem({ forum, index, colors, onPress }: ForumResultItemProps) {
   
  const gradient = ['#ec4899', '#f43f5e'] as [string, string];

  return (
    <AnimatedResultItem index={index} onPress={onPress || (() => {})}>
      <GlassCard variant="frosted" intensity="subtle" style={styles.resultCard}>
        <View style={styles.resultInner}>
          <LinearGradient colors={gradient} style={styles.iconContainer}>
            <Ionicons name="newspaper" size={22} color="#fff" />
          </LinearGradient>
          <View style={styles.resultInfo}>
            <Text style={[styles.resultTitle, { color: colors.text }]}>c/{forum.slug}</Text>
            <View style={styles.statRow}>
              <Ionicons name="document-text-outline" size={12} color={colors.textSecondary} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>
                {(forum?.post_count ?? 0).toLocaleString()} posts
              </Text>
            </View>
          </View>
          <LinearGradient colors={gradient} style={styles.arrowContainer}>
            <Ionicons name="chevron-forward" size={14} color="#fff" />
          </LinearGradient>
        </View>
      </GlassCard>
    </AnimatedResultItem>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  resultCard: {
    marginBottom: 8,
    borderRadius: 14,
    overflow: 'hidden',
  },
  resultInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  resultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  resultSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  premiumBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  arrowContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
