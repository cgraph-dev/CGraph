/**
 * GamificationHubScreen - Revolutionary Mobile Edition
 *
 * Central hub for all gamification features with next-generation animations.
 *
 * Features:
 * - 3D animated level orb with particle effects
 * - Animated streak fire with dynamic flames
 * - Floating coin counter with physics
 * - Morphing stat cards with spring animations
 * - Quest progress with animated fills
 * - Achievement showcase with holographic effects
 * - Parallax scrolling header
 * - Haptic feedback throughout
 *
 * @version 2.0.0 - Revolutionary Edition
 * @since v0.9.0
 */

import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LevelProgress, TitleBadge } from '@/components/gamification';
import { useGamification } from '@/hooks/useGamification';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import GlassCard from '../../components/ui/GlassCard';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================================
// ANIMATED 3D LEVEL ORB COMPONENT
// ============================================================================

interface LevelOrbProps {
  level: number;
  progress: number; // 0-1
}

function AnimatedLevelOrb({ level, progress }: LevelOrbProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;
  const particleAnims = useRef(
    Array.from({ length: 8 }, () => ({
      y: new Animated.Value(0),
      x: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.5),
    }))
  ).current;

  useEffect(() => {
    // Continuous rotation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.5,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Particle animations
    particleAnims.forEach((particle, i) => {
      const delay = i * 300;
      const angle = (i / 8) * Math.PI * 2;
      const radius = 50;

      const animate = () => {
        particle.y.setValue(0);
        particle.x.setValue(0);
        particle.opacity.setValue(0);
        particle.scale.setValue(0.5);

        Animated.parallel([
          Animated.timing(particle.y, {
            toValue: -60 - Math.random() * 30,
            duration: 2000 + Math.random() * 1000,
            delay,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(particle.x, {
            toValue: Math.cos(angle) * radius + (Math.random() - 0.5) * 20,
            duration: 2000 + Math.random() * 1000,
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

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.levelOrbContainer}>
      {/* Particles */}
      {particleAnims.map((particle, i) => (
        <Animated.View
          key={i}
          style={[
            styles.levelParticle,
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
          <Ionicons name="sparkles" size={12} color="#8B5CF6" />
        </Animated.View>
      ))}

      {/* Glow effect */}
      <Animated.View
        style={[
          styles.levelOrbGlow,
          {
            opacity: glowAnim,
            transform: [{ scale: Animated.add(pulseAnim, 0.2) }],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.4)', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Main orb */}
      <Animated.View
        style={[
          styles.levelOrb,
          {
            transform: [{ scale: pulseAnim }, { rotate }],
          },
        ]}
      >
        <LinearGradient
          colors={['#8B5CF6', '#6366F1', '#4F46E5']}
          style={styles.levelOrbGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Progress ring */}
          <View style={styles.progressRingContainer}>
            <View
              style={[
                styles.progressRing,
                {
                  borderColor: 'rgba(255,255,255,0.3)',
                },
              ]}
            />
            <View
              style={[
                styles.progressRingFill,
                {
                  borderColor: '#FCD34D',
                  borderTopColor: progress > 0.25 ? '#FCD34D' : 'transparent',
                  borderRightColor: progress > 0.5 ? '#FCD34D' : 'transparent',
                  borderBottomColor: progress > 0.75 ? '#FCD34D' : 'transparent',
                  transform: [{ rotate: `${progress * 360}deg` }],
                },
              ]}
            />
          </View>

          <Text style={styles.levelOrbText}>{level}</Text>
          <Text style={styles.levelOrbLabel}>LEVEL</Text>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

// ============================================================================
// ANIMATED FIRE STREAK COMPONENT
// ============================================================================

interface FireStreakProps {
  streak: number;
  canClaim: boolean;
  onClaim: () => void;
}

function AnimatedFireStreak({ streak, canClaim, onClaim }: FireStreakProps) {
  const flameAnims = useRef(
    Array.from({ length: 5 }, () => ({
      scale: new Animated.Value(1),
      opacity: new Animated.Value(0.7),
      translateY: new Animated.Value(0),
    }))
  ).current;
  const claimPulse = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Flame animations
    flameAnims.forEach((flame, i) => {
      const delay = i * 150;
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(flame.scale, {
              toValue: 1.3 + Math.random() * 0.2,
              duration: 400 + i * 50,
              delay,
              useNativeDriver: true,
            }),
            Animated.timing(flame.opacity, {
              toValue: 1,
              duration: 400,
              delay,
              useNativeDriver: true,
            }),
            Animated.timing(flame.translateY, {
              toValue: -5 - i * 2,
              duration: 400,
              delay,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(flame.scale, {
              toValue: 1,
              duration: 400 + i * 50,
              useNativeDriver: true,
            }),
            Animated.timing(flame.opacity, {
              toValue: 0.7,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(flame.translateY, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    });

    // Claim button pulse
    if (canClaim) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(claimPulse, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(claimPulse, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Shimmer animation
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [canClaim]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, SCREEN_WIDTH],
  });

  return (
    <GlassCard variant="neon" intensity="medium" style={styles.streakCardEnhanced}>
      <View style={styles.streakContentEnhanced}>
        {/* Animated flames */}
        <View style={styles.flamesContainer}>
          {flameAnims.map((flame, i) => (
            <Animated.Text
              key={i}
              style={[
                styles.flameEmoji,
                {
                  fontSize: 24 + i * 4,
                  opacity: flame.opacity,
                  transform: [{ scale: flame.scale }, { translateY: flame.translateY }],
                },
              ]}
            >
              🔥
            </Animated.Text>
          ))}
        </View>

        <View style={styles.streakInfoEnhanced}>
          <Text style={styles.streakValueEnhanced}>{streak}</Text>
          <Text style={styles.streakLabelEnhanced}>Day Streak</Text>
          <Text style={styles.streakSubLabel}>
            {streak >= 7 ? '🏆 On fire!' : 'Keep it going!'}
          </Text>
        </View>

        {canClaim ? (
          <Animated.View style={{ transform: [{ scale: claimPulse }] }}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                onClaim();
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#F97316', '#EF4444']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.claimButtonEnhanced}
              >
                {/* Shimmer effect */}
                <Animated.View
                  style={[styles.shimmerOverlay, { transform: [{ translateX: shimmerTranslate }] }]}
                >
                  <LinearGradient
                    colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
                <Ionicons name="gift" size={18} color="#FFF" />
                <Text style={styles.claimButtonTextEnhanced}>Claim!</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View style={styles.claimedBadgeEnhanced}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          </View>
        )}
      </View>
    </GlassCard>
  );
}

// ============================================================================
// ANIMATED STAT CARD COMPONENT
// ============================================================================

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  color: string;
  onPress?: () => void;
  index?: number;
}

function StatCard({ icon, label, value, color, onPress, index = 0 }: StatCardProps) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }),
      Animated.timing(iconRotate, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(iconRotate, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const rotate = iconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '15deg'],
  });

  const content = (
    <Animated.View
      style={[
        styles.statCardWrapper,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.statCardGlow,
          {
            backgroundColor: color,
            opacity: Animated.multiply(glowAnim, 0.3),
          },
        ]}
      />

      <LinearGradient colors={[color + '30', '#1f293780']} style={styles.statCard}>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={28} color={color} />
        </Animated.View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </LinearGradient>
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

// ============================================================================
// QUICK LINK COMPONENT
// ============================================================================

interface QuickLinkProps {
  icon: string;
  label: string;
  description: string;
  color: string;
  onPress: () => void;
}

function QuickLink({ icon, label, description, color, onPress }: QuickLinkProps) {
  return (
    <TouchableOpacity
      style={styles.quickLink}
      onPress={() => {
        HapticFeedback.light();
        onPress();
      }}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={[color + '20', '#1f2937']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.quickLinkGradient}
      >
        <View style={[styles.quickLinkIcon, { backgroundColor: color + '30' }]}>
          <Ionicons name={icon as unknown} size={24} color={color} />
        </View>
        <View style={styles.quickLinkContent}>
          <Text style={styles.quickLinkLabel}>{label}</Text>
          <Text style={styles.quickLinkDescription}>{description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#6b7280" />
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ============================================================================
// MAIN SCREEN
// ============================================================================

export default function GamificationHubScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const {
    stats,
    activeQuests,
    completedAchievements,
    refreshStats,
    refreshAchievements,
    refreshQuests,
    claimStreak,
    canClaimStreak,
    isLoading,
  } = useGamification();

  // Initial load
  useEffect(() => {
    refreshStats();
    refreshAchievements();
    refreshQuests();
  }, []);

  const handleRefresh = useCallback(() => {
    HapticFeedback.light();
    refreshStats();
    refreshAchievements();
    refreshQuests();
  }, [refreshStats, refreshAchievements, refreshQuests]);

  const handleClaimStreak = useCallback(async () => {
    HapticFeedback.medium();
    try {
      const result = await claimStreak();
      if (result) {
        HapticFeedback.success();
        Alert.alert(
          '🔥 Streak Claimed!',
          `+${result.coins} coins! Your streak is now ${result.streak} days.`
        );
      }
    } catch (error) {
      HapticFeedback.error();
      Alert.alert('Error', 'Failed to claim streak bonus');
    }
  }, [claimStreak]);

  const navigateTo = (screen: string) => {
    navigation.navigate(screen);
  };

  // Format values
  const level = stats?.level || 1;
  const xp = stats?.xp || 0;
  const coins = stats?.coins || 0;
  const streak = stats?.streak || 0;
  const achievementsCount = stats?.achievementsUnlocked || 0;
  const totalAchievements = stats?.totalAchievements || 0;
  const questsCompleted = stats?.questsCompleted || 0;
  const currentTitle = stats?.currentTitle || null;

  // Active quests (limit to 2 for preview)
  const previewQuests = activeQuests.filter((q) => q.accepted && !q.completed).slice(0, 2);

  // Recent achievement (last unlocked)
  const recentAchievement = completedAchievements[0] || null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1f2937', '#111827']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Gamification</Text>
          <Text style={styles.headerSubtitle}>Your progress & rewards</Text>
        </View>

        {/* Coins display */}
        <TouchableOpacity style={styles.coinsButton} onPress={() => navigateTo('CoinShop')}>
          <Text style={styles.coinEmoji}>🪙</Text>
          <Text style={styles.coinsText}>{(coins ?? 0).toLocaleString()}</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor="#8b5cf6"
            colors={['#8b5cf6']}
          />
        }
      >
        {/* Level Progress Card */}
        <View style={styles.levelCard}>
          <LinearGradient colors={['#8b5cf620', '#1f2937']} style={styles.levelCardGradient}>
            <View style={styles.levelHeader}>
              <View>
                <Text style={styles.levelLabel}>Level {level}</Text>
                {currentTitle && (
                  <View style={styles.titleRow}>
                    <TitleBadge title={currentTitle} rarity="rare" size="sm" />
                  </View>
                )}
              </View>
              <View style={styles.xpBadge}>
                <Ionicons name="sparkles" size={16} color="#8b5cf6" />
                <Text style={styles.xpText}>{(xp ?? 0).toLocaleString()} XP</Text>
              </View>
            </View>

            <LevelProgress
              level={level}
              currentXP={stats?.levelProgress || 0}
              totalXP={stats?.xpForNextLevel || 1000}
              loginStreak={streak}
            />
          </LinearGradient>
        </View>

        {/* Streak Card */}
        <View style={styles.streakCard}>
          <LinearGradient colors={['#f9731630', '#1f2937']} style={styles.streakCardGradient}>
            <View style={styles.streakContent}>
              <View style={styles.streakInfo}>
                <Text style={styles.streakEmoji}>🔥</Text>
                <View>
                  <Text style={styles.streakValue}>{streak} Day Streak</Text>
                  <Text style={styles.streakLabel}>Keep logging in daily!</Text>
                </View>
              </View>

              {canClaimStreak ? (
                <TouchableOpacity style={styles.claimButton} onPress={handleClaimStreak}>
                  <Text style={styles.claimButtonText}>Claim</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.claimedBadge}>
                  <Ionicons name="checkmark" size={16} color="#10b981" />
                </View>
              )}
            </View>
          </LinearGradient>
        </View>

        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>Stats Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon="trophy"
            label="Achievements"
            value={`${achievementsCount}/${totalAchievements}`}
            color="#f59e0b"
            onPress={() => navigateTo('Achievements')}
          />
          <StatCard
            icon="map"
            label="Quests Done"
            value={questsCompleted}
            color="#10b981"
            onPress={() => navigateTo('Quests')}
          />
          <StatCard
            icon="ribbon"
            label="Titles"
            value={stats?.titles?.length || 0}
            color="#ec4899"
            onPress={() => navigateTo('Titles')}
          />
          <StatCard
            icon="podium"
            label="Leaderboard"
            value="View"
            color="#3b82f6"
            onPress={() => navigateTo('Leaderboard')}
          />
        </View>

        {/* Quick Links */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickLinks}>
          <QuickLink
            icon="trophy"
            label="Achievements"
            description={`${totalAchievements - achievementsCount} left to unlock`}
            color="#f59e0b"
            onPress={() => navigateTo('Achievements')}
          />
          <QuickLink
            icon="map"
            label="Quests"
            description={`${previewQuests.length} active quests`}
            color="#10b981"
            onPress={() => navigateTo('Quests')}
          />
          <QuickLink
            icon="ribbon"
            label="Titles"
            description="Equip and collect titles"
            color="#ec4899"
            onPress={() => navigateTo('Titles')}
          />
          <QuickLink
            icon="cart"
            label="Coin Shop"
            description="Spend your coins"
            color="#f59e0b"
            onPress={() => navigateTo('CoinShop')}
          />
        </View>

        {/* Active Quests Preview */}
        {previewQuests.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Quests</Text>
              <TouchableOpacity onPress={() => navigateTo('Quests')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            {previewQuests.map((q) => {
              const progress = Object.values(q.progress).reduce((a, b) => a + b, 0);
              const target = q.quest.objectives.reduce((a, o) => a + o.targetValue, 0);
              const progressPercent = target > 0 ? Math.round((progress / target) * 100) : 0;
              return (
                <View key={q.id} style={styles.questPreviewCard}>
                  <LinearGradient
                    colors={['#10b98120', '#1f2937']}
                    style={styles.questPreviewGradient}
                  >
                    <View style={styles.questPreviewHeader}>
                      <View style={styles.questIconContainer}>
                        <Ionicons name="map" size={20} color="#10b981" />
                      </View>
                      <View style={styles.questPreviewContent}>
                        <Text style={styles.questPreviewTitle}>{q.quest.name}</Text>
                        <Text style={styles.questPreviewDescription} numberOfLines={1}>
                          {q.quest.description}
                        </Text>
                      </View>
                      <Text style={styles.questPreviewProgress}>{progressPercent}%</Text>
                    </View>
                    <View style={styles.questProgressBar}>
                      <View style={[styles.questProgressFill, { width: `${progressPercent}%` }]} />
                    </View>
                  </LinearGradient>
                </View>
              );
            })}
          </>
        )}

        {/* Recent Achievement */}
        {recentAchievement && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Achievement</Text>
              <TouchableOpacity onPress={() => navigateTo('Achievements')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.recentAchievement}>
              <LinearGradient
                colors={['#f59e0b20', '#1f2937']}
                style={styles.recentAchievementGradient}
              >
                <Text style={styles.achievementIcon}>{recentAchievement.icon || '🏆'}</Text>
                <View style={styles.achievementInfo}>
                  <Text style={styles.achievementName}>{recentAchievement.name}</Text>
                  <Text style={styles.achievementDescription}>{recentAchievement.description}</Text>
                </View>
                <View style={styles.achievementReward}>
                  <Ionicons name="sparkles" size={14} color="#8b5cf6" />
                  <Text style={styles.achievementRewardText}>+{recentAchievement.xpReward} XP</Text>
                </View>
              </LinearGradient>
            </View>
          </>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  coinsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#78350f',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  coinEmoji: {
    fontSize: 16,
  },
  coinsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fcd34d',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  // Level Card
  levelCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  levelCardGradient: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#8b5cf640',
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  levelLabel: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  titleRow: {
    marginTop: 4,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf620',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  xpText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  // Streak Card
  streakCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  streakCardGradient: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f9731640',
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakEmoji: {
    fontSize: 32,
  },
  streakValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  streakLabel: {
    fontSize: 13,
    color: '#9ca3af',
  },
  claimButton: {
    backgroundColor: '#f97316',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  claimButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  claimedBadge: {
    backgroundColor: '#10b98120',
    padding: 10,
    borderRadius: 12,
  },
  // Section title
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: '#8b5cf6',
  },
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCardWrapper: {
    width: (SCREEN_WIDTH - 44) / 2,
  },
  statCard: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  // Quick Links
  quickLinks: {
    gap: 12,
    marginBottom: 24,
  },
  quickLink: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  quickLinkGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  quickLinkIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickLinkContent: {
    flex: 1,
    marginLeft: 12,
  },
  quickLinkLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  quickLinkDescription: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  // Recent Achievement
  recentAchievement: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  recentAchievementGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f59e0b40',
  },
  achievementIcon: {
    fontSize: 32,
  },
  achievementInfo: {
    flex: 1,
    marginLeft: 12,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  achievementDescription: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  achievementReward: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf620',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  achievementRewardText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  // Quest Preview styles
  questPreviewCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  questPreviewGradient: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b98140',
  },
  questPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  questIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#10b98120',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questPreviewContent: {
    flex: 1,
    marginLeft: 10,
  },
  questPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  questPreviewDescription: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  questPreviewProgress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  questProgressBar: {
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    overflow: 'hidden',
  },
  questProgressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 2,
  },
  // ============================================================================
  // ANIMATED LEVEL ORB STYLES
  // ============================================================================
  levelOrbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 160,
    marginVertical: 16,
  },
  levelParticle: {
    position: 'absolute',
  },
  levelOrbGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  levelOrb: {
    width: 100,
    height: 100,
    borderRadius: 50,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  levelOrbGradient: {
    flex: 1,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingContainer: {
    position: 'absolute',
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
  },
  progressRingFill: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderLeftColor: 'transparent',
  },
  levelOrbText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
  },
  levelOrbLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
    marginTop: -4,
  },
  // ============================================================================
  // ANIMATED FIRE STREAK STYLES
  // ============================================================================
  streakCardEnhanced: {
    marginBottom: 20,
    overflow: 'visible',
  },
  streakContentEnhanced: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  flamesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginRight: 12,
  },
  flameEmoji: {
    marginLeft: -8,
  },
  streakInfoEnhanced: {
    flex: 1,
  },
  streakValueEnhanced: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
  },
  streakLabelEnhanced: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  streakSubLabel: {
    fontSize: 12,
    color: '#F97316',
    marginTop: 4,
    fontWeight: '600',
  },
  claimButtonEnhanced: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
    overflow: 'hidden',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 100,
  },
  claimButtonTextEnhanced: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  claimedBadgeEnhanced: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  // ============================================================================
  // STAT CARD GLOW
  // ============================================================================
  statCardGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 26,
    opacity: 0,
  },
});
