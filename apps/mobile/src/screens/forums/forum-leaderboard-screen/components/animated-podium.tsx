/**
 * AnimatedPodium Component
 *
 * Premium podium display for top 3 leaderboard entries with:
 * - Staggered entry animations with bounce
 * - Continuous glow effects for gold/silver/bronze
 * - Crown bounce animation for first place
 * - Particle effects around the winner
 * - Gradient pedestals with stats
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { LeaderboardForum, TopContributor, LeaderboardType } from '../../forum-leaderboard-screen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// =============================================================================
// TYPES
// =============================================================================

interface PodiumProps {
  items: (LeaderboardForum | TopContributor)[];
  type: LeaderboardType;
  onItemPress: (item: LeaderboardForum | TopContributor) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function AnimatedPodium({ items, type, onItemPress }: PodiumProps) {
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
  }, [firstAnim, secondAnim, thirdAnim, goldGlow, silverGlow, bronzeGlow, crownBounce, particles]);

  const renderPodiumItem = (
    item: LeaderboardForum | TopContributor | undefined,
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

    const name =
      type === 'forums'
        ? `c/${(item as LeaderboardForum).slug}`
        : `u/${(item as TopContributor).user?.username || 'unknown'}`;

    const iconUrl =
      type === 'forums'
        ? (item as LeaderboardForum).icon_url
        : (item as TopContributor).user?.avatar_url;

    const initial =
      type === 'forums'
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
            <Animated.View style={[styles.crownContainer, { transform: [{ scale: crownBounce }] }]}>
              <Text style={styles.crownEmoji}>👑</Text>
            </Animated.View>
          )}

          {/* Avatar */}
          <View style={styles.podiumAvatarWrapper}>
            <LinearGradient colors={colors.gradient} style={styles.podiumAvatarBorder}>
              {iconUrl ? (
                <Image source={{ uri: iconUrl }} style={styles.podiumAvatar} />
              ) : (
                <View style={[styles.podiumAvatar, { backgroundColor: colors.gradient[0] }]}>
                  <Text style={styles.podiumAvatarText}>{initial}</Text>
                </View>
              )}
            </LinearGradient>

            {/* Rank badge */}
            <LinearGradient colors={colors.gradient} style={styles.podiumRankBadge}>
              <Text style={styles.podiumRankText}>{rank}</Text>
            </LinearGradient>
          </View>

          {/* Name */}
          <Text style={styles.podiumName} numberOfLines={1}>
            {name}
          </Text>

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
        {rank === 1 &&
          particles.map((particle, i) => (
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
// STYLES
// =============================================================================

const styles = StyleSheet.create({
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
});
