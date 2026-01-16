/**
 * ForumLeaderboardScreen - Revolutionary Mobile Edition
 *
 * Premium leaderboard experience with advanced animations.
 *
 * Features:
 * - Animated podium for top 3 with particle effects
 * - Spring physics on list items
 * - Magnetic card interactions with 3D tilt
 * - Animated rank badges with glow effects
 * - Morphing tab indicators
 * - Staggered entry animations
 * - Haptic feedback throughout
 * - Parallax scrolling effects
 *
 * @version 2.0.0 - Revolutionary Edition
 * @since v0.9.0
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Image,
  Animated,
  Easing,
  Dimensions,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../lib/api';
import { ForumsStackParamList, UserBasic } from '../../types';
import GlassCard from '../../components/ui/GlassCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// =============================================================================
// TYPES
// =============================================================================

type Props = {
  navigation: NativeStackNavigationProp<ForumsStackParamList, 'ForumLeaderboard'>;
  route: RouteProp<ForumsStackParamList, 'ForumLeaderboard'>;
};

interface LeaderboardForum {
  id: string;
  name: string;
  slug: string;
  icon_url?: string;
  description?: string;
  member_count: number;
  post_count: number;
  growth_rate: number;
  rank: number;
  previous_rank?: number;
  category?: string;
}

interface TopContributor {
  id: string;
  user: UserBasic;
  xp: number;
  posts: number;
  comments: number;
  karma: number;
  rank: number;
}

type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'all';
type LeaderboardType = 'forums' | 'contributors';
type LeaderboardItem = LeaderboardForum | TopContributor;

// =============================================================================
// ANIMATED PODIUM COMPONENT
// =============================================================================

interface PodiumProps {
  items: (LeaderboardForum | TopContributor)[];
  type: LeaderboardType;
  onItemPress: (item: any) => void;
}

function AnimatedPodium({ items, type, onItemPress }: PodiumProps) {
  const [first, second, third] = [items[0], items[1], items[2]];

  // Entry animations
  const firstAnim = useRef(new Animated.Value(0)).current;
  const secondAnim = useRef(new Animated.Value(0)).current;
  const thirdAnim = useRef(new Animated.Value(0)).current;

  // Glow animations
  const goldGlow = useRef(new Animated.Value(0.5)).current;
  const silverGlow = useRef(new Animated.Value(0.5)).current;
  const bronzeGlow = useRef(new Animated.Value(0.5)).current;

  // Crown bounce
  const crownBounce = useRef(new Animated.Value(1)).current;

  // Particle animations for first place
  const particles = useRef(
    Array.from({ length: 6 }, () => ({
      y: new Animated.Value(0),
      x: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.5),
    }))
  ).current;

  useEffect(() => {
    // Staggered entry with bounce
    Animated.sequence([
      Animated.spring(secondAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(thirdAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(firstAnim, {
        toValue: 1,
        tension: 50,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous glow animations
    const createGlowAnimation = (anim: Animated.Value, duration: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.5,
            duration,
            useNativeDriver: true,
          }),
        ])
      );
    };

    createGlowAnimation(goldGlow, 1500).start();
    createGlowAnimation(silverGlow, 1800).start();
    createGlowAnimation(bronzeGlow, 2000).start();

    // Crown bounce
    Animated.loop(
      Animated.sequence([
        Animated.timing(crownBounce, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(crownBounce, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Particle animations for first place
    particles.forEach((particle, i) => {
      const delay = i * 400;
      const angle = (i / 6) * Math.PI * 2;
      const radius = 40;

      const animate = () => {
        particle.y.setValue(0);
        particle.x.setValue(0);
        particle.opacity.setValue(0);
        particle.scale.setValue(0.5);

        Animated.parallel([
          Animated.timing(particle.y, {
            toValue: -50 - Math.random() * 20,
            duration: 2000,
            delay,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(particle.x, {
            toValue: Math.cos(angle) * radius,
            duration: 2000,
            delay,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(particle.opacity, {
              toValue: 0.8,
              duration: 500,
              delay,
              useNativeDriver: true,
            }),
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(particle.scale, {
            toValue: 1,
            duration: 1000,
            delay,
            useNativeDriver: true,
          }),
        ]).start(() => animate());
      };
      animate();
    });
  }, []);

  const renderPodiumItem = (
    item: any,
    rank: number,
    anim: Animated.Value,
    glow: Animated.Value,
    height: number
  ) => {
    if (!item) return null;

    const colors = {
      1: { gradient: ['#FFD700', '#FFA500'] as const, border: '#FFD700', shadow: '#FFD700' },
      2: { gradient: ['#C0C0C0', '#A0A0A0'] as const, border: '#C0C0C0', shadow: '#C0C0C0' },
      3: { gradient: ['#CD7F32', '#A0522D'] as const, border: '#CD7F32', shadow: '#CD7F32' },
    }[rank]!;

    const translateY = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [100, 0],
    });

    const scale = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 1],
    });

    const name = type === 'forums'
      ? `c/${(item as LeaderboardForum).slug}`
      : `u/${(item as TopContributor).user?.username || 'unknown'}`;

    const iconUrl = type === 'forums'
      ? (item as LeaderboardForum).icon_url
      : (item as TopContributor).user?.avatar_url;

    const initial = type === 'forums'
      ? (item as LeaderboardForum).name.charAt(0)
      : (item as TopContributor).user?.username?.charAt(0).toUpperCase() || '?';

    return (
      <Animated.View
        style={[
          styles.podiumItemContainer,
          {
            opacity: anim,
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onItemPress(item);
          }}
          activeOpacity={0.8}
        >
          {/* Glow effect */}
          <Animated.View
            style={[
              styles.podiumGlow,
              {
                backgroundColor: colors.shadow,
                opacity: glow,
              },
            ]}
          />

          {/* Crown for first place */}
          {rank === 1 && (
            <Animated.View
              style={[
                styles.crownContainer,
                { transform: [{ scale: crownBounce }] },
              ]}
            >
              <Text style={styles.crownEmoji}>👑</Text>
            </Animated.View>
          )}

          {/* Avatar */}
          <View style={styles.podiumAvatarWrapper}>
            <LinearGradient
              colors={colors.gradient}
              style={styles.podiumAvatarBorder}
            >
              {iconUrl ? (
                <Image source={{ uri: iconUrl }} style={styles.podiumAvatar} />
              ) : (
                <View style={[styles.podiumAvatar, { backgroundColor: colors.gradient[0] }]}>
                  <Text style={styles.podiumAvatarText}>{initial}</Text>
                </View>
              )}
            </LinearGradient>

            {/* Rank badge */}
            <LinearGradient
              colors={colors.gradient}
              style={styles.podiumRankBadge}
            >
              <Text style={styles.podiumRankText}>{rank}</Text>
            </LinearGradient>
          </View>

          {/* Name */}
          <Text style={styles.podiumName} numberOfLines={1}>{name}</Text>

          {/* Pedestal */}
          <LinearGradient
            colors={[colors.gradient[0], colors.gradient[1], colors.gradient[1] + '80'] as const}
            style={[styles.pedestal, { height }]}
          >
            {type === 'contributors' && (
              <Text style={styles.pedestalXp}>
                {((item as TopContributor).xp || 0).toLocaleString()} XP
              </Text>
            )}
            {type === 'forums' && (
              <Text style={styles.pedestalXp}>
                {((item as LeaderboardForum).member_count || 0).toLocaleString()}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Particles for first place */}
        {rank === 1 && particles.map((particle, i) => (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                opacity: particle.opacity,
                transform: [
                  { translateY: particle.y },
                  { translateX: particle.x },
                  { scale: particle.scale },
                ],
              },
            ]}
          >
            <Text style={styles.particleEmoji}>✨</Text>
          </Animated.View>
        ))}
      </Animated.View>
    );
  };

  if (!first) return null;

  return (
    <View style={styles.podiumContainer}>
      {/* Second place - left */}
      {second && renderPodiumItem(second, 2, secondAnim, silverGlow, 60)}

      {/* First place - center */}
      {renderPodiumItem(first, 1, firstAnim, goldGlow, 80)}

      {/* Third place - right */}
      {third && renderPodiumItem(third, 3, thirdAnim, bronzeGlow, 40)}
    </View>
  );
}

// =============================================================================
// ANIMATED LIST ITEM COMPONENT
// =============================================================================

interface ListItemProps {
  item: LeaderboardForum | TopContributor;
  index: number;
  type: LeaderboardType;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}

function AnimatedListItem({ item, index, type, onPress, colors }: ListItemProps) {
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
        duration: 500,
        delay,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  // Pan responder for magnetic tilt
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => false,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const cardWidth = SCREEN_WIDTH - 32;
        const cardHeight = 80;

        const tiltXValue = ((locationY / cardHeight) - 0.5) * 8;
        const tiltYValue = ((locationX / cardWidth) - 0.5) * -6;

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
            duration: 150,
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
            duration: 300,
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

  const rank = type === 'forums'
    ? (item as LeaderboardForum).rank
    : (item as TopContributor).rank;

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
            <LinearGradient
              colors={getRankColor(rank)}
              style={styles.rankBadge}
            >
              <Text style={styles.rankText}>{rank}</Text>
            </LinearGradient>

            {/* Forum icon */}
            {forum.icon_url ? (
              <Image source={{ uri: forum.icon_url }} style={styles.itemIcon} />
            ) : (
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                style={styles.itemIcon}
              >
                <Text style={styles.itemIconText}>{forum.name.charAt(0)}</Text>
              </LinearGradient>
            )}

            {/* Info */}
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={1}>c/{forum.slug}</Text>
              {forum.category && (
                <Text style={styles.itemCategory}>{forum.category}</Text>
              )}
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
                  <View style={[styles.growthBadge, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
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
              <Ionicons name={rankChange.icon as any} size={18} color={rankChange.color} />
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
          <LinearGradient
            colors={getRankColor(rank)}
            style={styles.rankBadge}
          >
            <Text style={styles.rankText}>{rank}</Text>
          </LinearGradient>

          {/* Avatar */}
          {contributor.user?.avatar_url ? (
            <Image source={{ uri: contributor.user.avatar_url }} style={styles.itemAvatar} />
          ) : (
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.itemAvatar}
            >
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
// ANIMATED TAB BAR
// =============================================================================

interface TabBarProps {
  activeTab: LeaderboardType;
  onTabChange: (tab: LeaderboardType) => void;
  colors: ReturnType<typeof useTheme>['colors'];
}

function AnimatedTabBar({ activeTab, onTabChange, colors }: TabBarProps) {
  const indicatorAnim = useRef(new Animated.Value(activeTab === 'forums' ? 0 : 1)).current;
  const forumsScale = useRef(new Animated.Value(activeTab === 'forums' ? 1.1 : 1)).current;
  const contributorsScale = useRef(new Animated.Value(activeTab === 'contributors' ? 1.1 : 1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(indicatorAnim, {
        toValue: activeTab === 'forums' ? 0 : 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.spring(forumsScale, {
        toValue: activeTab === 'forums' ? 1.1 : 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.spring(contributorsScale, {
        toValue: activeTab === 'contributors' ? 1.1 : 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeTab]);

  const indicatorTranslate = indicatorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, (SCREEN_WIDTH - 32) / 2],
  });

  return (
    <View style={styles.tabBarContainer}>
      {/* Animated indicator */}
      <Animated.View
        style={[
          styles.tabIndicator,
          {
            transform: [{ translateX: indicatorTranslate }],
          },
        ]}
      >
        <LinearGradient
          colors={['#8B5CF6', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.tabIndicatorGradient}
        />
      </Animated.View>

      {/* Forums tab */}
      <TouchableOpacity
        style={styles.tab}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onTabChange('forums');
        }}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ scale: forumsScale }] }}>
          <Ionicons
            name="grid"
            size={20}
            color={activeTab === 'forums' ? '#FFF' : '#9CA3AF'}
          />
        </Animated.View>
        <Text style={[styles.tabLabel, activeTab === 'forums' && styles.tabLabelActive]}>
          Top Forums
        </Text>
      </TouchableOpacity>

      {/* Contributors tab */}
      <TouchableOpacity
        style={styles.tab}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onTabChange('contributors');
        }}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ scale: contributorsScale }] }}>
          <Ionicons
            name="trophy"
            size={20}
            color={activeTab === 'contributors' ? '#FFF' : '#9CA3AF'}
          />
        </Animated.View>
        <Text style={[styles.tabLabel, activeTab === 'contributors' && styles.tabLabelActive]}>
          Top Users
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// =============================================================================
// PERIOD SELECTOR
// =============================================================================

interface PeriodSelectorProps {
  period: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
}

function AnimatedPeriodSelector({ period, onPeriodChange }: PeriodSelectorProps) {
  const periods: { key: TimePeriod; label: string }[] = [
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
    { key: 'all', label: 'All Time' },
  ];

  return (
    <View style={styles.periodContainer}>
      <GlassCard variant="frosted" intensity="subtle" style={styles.periodCard}>
        <View style={styles.periodButtons}>
          {periods.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[
                styles.periodButton,
                period === p.key && styles.periodButtonActive,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onPeriodChange(p.key);
              }}
              activeOpacity={0.8}
            >
              {period === p.key ? (
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  style={styles.periodButtonGradient}
                >
                  <Text style={styles.periodButtonTextActive}>{p.label}</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.periodButtonText}>{p.label}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </GlassCard>
    </View>
  );
}

// =============================================================================
// EMPTY STATE
// =============================================================================

function EmptyState() {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.emptyContainer}>
      <Animated.View
        style={{
          transform: [
            { translateY: floatAnim },
            { scale: pulseAnim },
          ],
        }}
      >
        <LinearGradient
          colors={['#374151', '#1F2937']}
          style={styles.emptyIconContainer}
        >
          <Ionicons name="trophy" size={48} color="#9CA3AF" />
        </LinearGradient>
      </Animated.View>
      <Text style={styles.emptyTitle}>No Rankings Yet</Text>
      <Text style={styles.emptySubtitle}>Check back later for leaderboard updates</Text>
    </View>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ForumLeaderboardScreen({ navigation, route }: Props) {
  const { forumId } = route.params || {};
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<LeaderboardType>('forums');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('weekly');
  const [forums, setForums] = useState<LeaderboardForum[]>([]);
  const [contributors, setContributors] = useState<TopContributor[]>([]);

  // Header animation
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    navigation.setOptions({
      title: forumId ? 'Leaderboard' : 'Forum Rankings',
      headerStyle: {
        backgroundColor: '#111827',
      },
      headerTitleStyle: {
        color: '#FFF',
        fontWeight: '700',
      },
    });

    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(headerSlide, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    fetchLeaderboardData();
  }, [forumId, activeTab, timePeriod]);

  const fetchLeaderboardData = async () => {
    try {
      if (activeTab === 'forums') {
        const response = await api.get('/api/v1/forums/leaderboard', {
          params: { period: timePeriod },
        });
        setForums(response.data?.data || []);
      } else {
        const endpoint = forumId
          ? `/api/v1/forums/${forumId}/contributors`
          : '/api/v1/users/leaderboard';
        const response = await api.get(endpoint, {
          params: { period: timePeriod },
        });
        setContributors(response.data?.data || []);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchLeaderboardData();
  }, [activeTab, timePeriod, forumId]);

  const handleTabChange = (tab: LeaderboardType) => {
    setActiveTab(tab);
    setIsLoading(true);
  };

  const handlePeriodChange = (period: TimePeriod) => {
    setTimePeriod(period);
    setIsLoading(true);
  };

  const handleForumPress = (forum: LeaderboardForum) => {
    navigation.navigate('Forum', { forumId: forum.id });
  };

  const handleContributorPress = (contributor: TopContributor) => {
    // Navigate to user profile
    console.log('Navigate to user:', contributor.user?.username);
  };

  const currentData: LeaderboardItem[] = activeTab === 'forums' ? forums : contributors;
  const topThree = currentData.slice(0, 3);
  const restOfList = currentData.slice(3);

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#111827', '#0F172A', '#111827']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingSpinner}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
        <Text style={styles.loadingText}>Loading rankings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background */}
      <LinearGradient
        colors={['#111827', '#0F172A', '#111827']}
        style={StyleSheet.absoluteFill}
      />

      {/* Tab bar */}
      {!forumId && (
        <AnimatedTabBar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          colors={colors}
        />
      )}

      <FlatList<LeaderboardItem>
        data={restOfList}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <AnimatedListItem
            item={item}
            index={index}
            type={activeTab}
            onPress={() => activeTab === 'forums'
              ? handleForumPress(item as LeaderboardForum)
              : handleContributorPress(item as TopContributor)
            }
            colors={colors}
          />
        )}
        ListHeaderComponent={
          <>
            {/* Period selector */}
            <AnimatedPeriodSelector
              period={timePeriod}
              onPeriodChange={handlePeriodChange}
            />

            {/* Podium for top 3 */}
            {topThree.length > 0 && (
              <AnimatedPodium
                items={topThree}
                type={activeTab}
                onItemPress={(item) => activeTab === 'forums'
                  ? handleForumPress(item as LeaderboardForum)
                  : handleContributorPress(item as TopContributor)
                }
              />
            )}

            {/* Section divider */}
            {restOfList.length > 0 && (
              <View style={styles.sectionDivider}>
                <Text style={styles.sectionTitle}>Rankings</Text>
                <View style={styles.sectionLine} />
              </View>
            )}
          </>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8B5CF6"
          />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<EmptyState />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  loadingSpinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#9CA3AF',
  },
  // Tab bar
  tabBarContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 4,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: (SCREEN_WIDTH - 32 - 8) / 2,
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tabIndicatorGradient: {
    flex: 1,
    borderRadius: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    zIndex: 1,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabLabelActive: {
    color: '#FFF',
  },
  // Period selector
  periodContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  periodCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  periodButtons: {
    flexDirection: 'row',
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    overflow: 'hidden',
  },
  periodButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  periodButtonTextActive: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  // Podium
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 8,
  },
  podiumItemContainer: {
    alignItems: 'center',
    width: (SCREEN_WIDTH - 64) / 3,
  },
  podiumGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 50,
    opacity: 0.3,
  },
  crownContainer: {
    position: 'absolute',
    top: -30,
    zIndex: 10,
  },
  crownEmoji: {
    fontSize: 24,
  },
  podiumAvatarWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  podiumAvatarBorder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumAvatarText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '700',
  },
  podiumRankBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#111827',
  },
  podiumRankText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  podiumName: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  pedestal: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pedestalXp: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  particle: {
    position: 'absolute',
    top: 20,
  },
  particleEmoji: {
    fontSize: 12,
  },
  // Section divider
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  // List content
  listContent: {
    paddingBottom: 40,
  },
  // List item
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
  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
