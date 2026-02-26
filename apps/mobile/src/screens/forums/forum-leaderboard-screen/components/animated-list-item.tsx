/**
 * AnimatedListItem Component
 *
 * Interactive list item for leaderboard entries with:
 * - Staggered entry animations with back easing
 * - PanResponder for magnetic 3D tilt effect on touch
 * - Glow effect on interaction
 * - Different layouts for forums vs contributors
 * - Haptic feedback
 */

import { durations } from '@cgraph/animation-constants';
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Image,
  PanResponder,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/stores';
import GlassCard from '../../../../components/ui/glass-card';
import { LeaderboardForum, TopContributor, LeaderboardType } from '../../forum-leaderboard-screen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// =============================================================================
// TYPES
// =============================================================================

interface ListItemProps {
  item: LeaderboardForum | TopContributor;
  index: number;
  type: LeaderboardType;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const getRankColor = (r: number): readonly [string, string] => {
  if (r <= 3) return ['#8B5CF6', '#7C3AED'] as const;
  if (r <= 10) return ['#3B82F6', '#2563EB'] as const;
  return ['#6B7280', '#4B5563'] as const;
};

const getRankChange = (current: number, previous?: number) => {
  if (!previous) return { icon: 'remove', color: '#9CA3AF' };
  if (current < previous) return { icon: 'arrow-up', color: '#10B981' };
  if (current > previous) return { icon: 'arrow-down', color: '#EF4444' };
  return { icon: 'remove', color: '#9CA3AF' };
};

// =============================================================================
// COMPONENT
// =============================================================================

/**
 *
 */
export function AnimatedListItem({ item, index, type, onPress, colors }: ListItemProps) {
  // Entry animations
  const entryAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Interactive animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const tiltX = useRef(new Animated.Value(0)).current;
  const tiltY = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = index * 60;

    Animated.parallel([
      Animated.timing(entryAnim, {
        toValue: 1,
        duration: durations.slower.ms,
        delay,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: durations.smooth.ms,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, entryAnim, fadeAnim]);

  // Pan responder for magnetic tilt
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => false,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const cardWidth = SCREEN_WIDTH - 32;
        const cardHeight = 80;

        const tiltXValue = (locationY / cardHeight - 0.5) * 8;
        const tiltYValue = (locationX / cardWidth - 0.5) * -6;

        Animated.parallel([
          Animated.spring(tiltX, {
            toValue: tiltXValue,
            friction: 8,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.spring(tiltY, {
            toValue: tiltYValue,
            friction: 8,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1.02,
            friction: 8,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.5,
            duration: durations.fast.ms,
            useNativeDriver: true,
          }),
        ]).start();

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderRelease: () => {
        Animated.parallel([
          Animated.spring(tiltX, {
            toValue: 0,
            friction: 5,
            tension: 80,
            useNativeDriver: true,
          }),
          Animated.spring(tiltY, {
            toValue: 0,
            friction: 5,
            tension: 80,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 5,
            tension: 80,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0,
            duration: durations.slow.ms,
            useNativeDriver: true,
          }),
        ]).start();

        onPress();
      },
    })
  ).current;

  const translateX = entryAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [80, 0],
  });

  const rotateX = tiltX.interpolate({
    inputRange: [-8, 8],
    outputRange: ['-8deg', '8deg'],
  });

  const rotateY = tiltY.interpolate({
    inputRange: [-6, 6],
    outputRange: ['-6deg', '6deg'],
  });

   
  const rank = type === 'forums' ? (item as LeaderboardForum).rank : (item as TopContributor).rank;

  if (type === 'forums') {
     
    const forum = item as LeaderboardForum;
    const rankChange = getRankChange(forum.rank, forum.previous_rank);

    return (
      <Animated.View
        style={[
          styles.listItemWrapper,
          {
            opacity: fadeAnim,
            transform: [
              { perspective: 1000 },
              { translateX },
              { scale: scaleAnim },
              { rotateX },
              { rotateY },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Glow effect */}
        <Animated.View
          style={[
            styles.itemGlow,
            {
              opacity: glowOpacity,
              backgroundColor: getRankColor(rank)[0],
            },
          ]}
        />

        <GlassCard variant="frosted" intensity="subtle" style={styles.listItem}>
          <View style={styles.listItemContent}>
            {/* Rank badge */}
            <LinearGradient colors={getRankColor(rank)} style={styles.rankBadge}>
              <Text style={styles.rankText}>{rank}</Text>
            </LinearGradient>

            {/* Forum icon */}
            {forum.icon_url ? (
              <Image source={{ uri: forum.icon_url }} style={styles.itemIcon} />
            ) : (
              <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.itemIcon}>
                <Text style={styles.itemIconText}>{forum.name.charAt(0)}</Text>
              </LinearGradient>
            )}

            {/* Info */}
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={1}>
                c/{forum.slug}
              </Text>
              {forum.category && <Text style={styles.itemCategory}>{forum.category}</Text>}
              <View style={styles.itemStats}>
                <View style={styles.statBadge}>
                  <Ionicons name="people" size={12} color="#9CA3AF" />
                  <Text style={styles.statText}>{(forum?.member_count ?? 0).toLocaleString()}</Text>
                </View>
                <View style={styles.statBadge}>
                  <Ionicons name="document-text" size={12} color="#9CA3AF" />
                  <Text style={styles.statText}>{(forum?.post_count ?? 0).toLocaleString()}</Text>
                </View>
                {forum.growth_rate > 0 && (
                  <View
                    style={[styles.growthBadge, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}
                  >
                    <Ionicons name="trending-up" size={10} color="#10B981" />
                    <Text style={[styles.statText, { color: '#10B981' }]}>
                      +{forum.growth_rate.toFixed(1)}%
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Rank change */}
            <View style={styles.rankChangeContainer}>
              <Ionicons
                 
                name={rankChange.icon as 'arrow-up' | 'arrow-down' | 'remove'}
                size={18}
                color={rankChange.color}
              />
            </View>
          </View>
        </GlassCard>
      </Animated.View>
    );
  }

  // Contributor item
   
  const contributor = item as TopContributor;

  return (
    <Animated.View
      style={[
        styles.listItemWrapper,
        {
          opacity: fadeAnim,
          transform: [
            { perspective: 1000 },
            { translateX },
            { scale: scaleAnim },
            { rotateX },
            { rotateY },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <Animated.View
        style={[
          styles.itemGlow,
          {
            opacity: glowOpacity,
            backgroundColor: getRankColor(rank)[0],
          },
        ]}
      />

      <GlassCard variant="frosted" intensity="subtle" style={styles.listItem}>
        <View style={styles.listItemContent}>
          {/* Rank badge */}
          <LinearGradient colors={getRankColor(rank)} style={styles.rankBadge}>
            <Text style={styles.rankText}>{rank}</Text>
          </LinearGradient>

          {/* Avatar */}
          {contributor.user?.avatar_url ? (
            <Image source={{ uri: contributor.user.avatar_url }} style={styles.itemAvatar} />
          ) : (
            <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.itemAvatar}>
              <Text style={styles.itemAvatarText}>
                {contributor.user?.username?.charAt(0).toUpperCase() || '?'}
              </Text>
            </LinearGradient>
          )}

          {/* Info */}
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={1}>
              u/{contributor.user?.username || 'unknown'}
            </Text>
            <Text style={styles.xpText}>{(contributor?.xp ?? 0).toLocaleString()} XP</Text>
            <View style={styles.itemStats}>
              <View style={styles.statBadge}>
                <Ionicons name="document-text" size={12} color="#9CA3AF" />
                <Text style={styles.statText}>{contributor.posts}</Text>
              </View>
              <View style={styles.statBadge}>
                <Ionicons name="chatbubble" size={12} color="#9CA3AF" />
                <Text style={styles.statText}>{contributor.comments}</Text>
              </View>
              <View style={styles.statBadge}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={[styles.statText, { color: '#F59E0B' }]}>{contributor.karma}</Text>
              </View>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={18} color="#6B7280" />
        </View>
      </GlassCard>
    </Animated.View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  listItemWrapper: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  itemGlow: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 19,
    opacity: 0,
  },
  listItem: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIconText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  itemAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemAvatarText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemCategory: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 6,
  },
  xpText: {
    color: '#8B5CF6',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  itemStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  rankChangeContainer: {
    marginLeft: 8,
  },
});
