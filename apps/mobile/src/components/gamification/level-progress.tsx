/**
 * LevelProgress Component - Mobile
 * 
 * Displays the user's current level, XP progress, and advancement status.
 * Optimized for React Native with native animations and haptics.
 * 
 * Features:
 * - Animated progress bar with gradient fill
 * - Level-up celebration animations with particles
 * - XP gain notifications with floating +XP badges
 * - Streak multiplier indicator with fire animation
 * - Next level preview with required XP
 * - Compact and expanded view modes
 * - Real-time updates via context subscriptions
 * - Spring physics for smooth animations
 * 
 * This widget provides constant positive reinforcement for user actions,
 * making progress visible and rewarding without being intrusive.
 * 
 * @version 1.0.0
 * @since v0.8.1
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback, SpringPresets, AnimationColors } from '@/lib/animations/animation-engine';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// TYPES
// ============================================================================

interface LevelProgressProps {
  level: number;
  currentXP: number;
  totalXP: number;
  loginStreak: number;
  variant?: 'compact' | 'expanded';
  showStreak?: boolean;
  onPress?: () => void;
  className?: string;
}

interface XPGainNotification {
  id: string;
  amount: number;
  source: string;
}

// ============================================================================
// XP CALCULATION
// ============================================================================

function calculateXPForLevel(level: number): number {
  const baseXP = 100;
  return Math.floor(baseXP * Math.pow(level, 1.8));
}

function getStreakMultiplier(streak: number): number {
  if (streak >= 30) return 3.0;
  if (streak >= 14) return 2.5;
  if (streak >= 7) return 2.0;
  if (streak >= 3) return 1.5;
  return 1.0;
}

function getStreakColor(streak: number): string {
  if (streak >= 30) return '#ec4899'; // Pink - legendary
  if (streak >= 14) return '#8b5cf6'; // Purple - epic
  if (streak >= 7) return '#f59e0b'; // Gold
  if (streak >= 3) return '#f97316'; // Orange
  return '#6b7280'; // Gray
}

// ============================================================================
// XP GAIN FLOATING BADGE
// ============================================================================

interface FloatingXPBadgeProps {
  amount: number;
  onComplete: () => void;
}

function FloatingXPBadge({ amount, onComplete }: FloatingXPBadgeProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        tension: 200,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(200),
        Animated.timing(translateY, {
          toValue: -60,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(1200),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => onComplete());
  }, []);

  return (
    <Animated.View
      style={[
        styles.floatingXPBadge,
        {
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
    >
      <LinearGradient
        colors={['#10b981', '#059669']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.floatingXPGradient}
      >
        <Text style={styles.floatingXPText}>+{amount} XP</Text>
      </LinearGradient>
    </Animated.View>
  );
}

// ============================================================================
// ANIMATED LEVEL BADGE
// ============================================================================

interface LevelBadgeProps {
  level: number;
  size?: 'small' | 'medium' | 'large';
}

function LevelBadge({ level, size = 'medium' }: LevelBadgeProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  const dimensions = {
    small: { outer: 40, inner: 36, fontSize: 14, glow: 6 },
    medium: { outer: 52, inner: 46, fontSize: 18, glow: 8 },
    large: { outer: 72, inner: 64, fontSize: 24, glow: 12 },
  }[size];

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.8,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const glowOpacity = glowAnim;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.levelGlow,
          {
            width: dimensions.outer + dimensions.glow * 2,
            height: dimensions.outer + dimensions.glow * 2,
            borderRadius: (dimensions.outer + dimensions.glow * 2) / 2,
            opacity: glowOpacity,
          },
        ]}
      />

      <Animated.View
        style={[
          styles.levelBadgeOuter,
          {
            width: dimensions.outer,
            height: dimensions.outer,
            borderRadius: dimensions.outer / 2,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={[AnimationColors.primary, '#8b5cf6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.levelBadgeGradient,
            {
              width: dimensions.outer,
              height: dimensions.outer,
              borderRadius: dimensions.outer / 2,
            },
          ]}
        >
          <View
            style={[
              styles.levelBadgeInner,
              {
                width: dimensions.inner,
                height: dimensions.inner,
                borderRadius: dimensions.inner / 2,
              },
            ]}
          >
            <Text style={[styles.levelText, { fontSize: dimensions.fontSize }]}>
              {level}
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

// ============================================================================
// STREAK INDICATOR
// ============================================================================

interface StreakIndicatorProps {
  streak: number;
  showMultiplier?: boolean;
}

function StreakIndicator({ streak, showMultiplier = true }: StreakIndicatorProps) {
  const fireAnim = useRef(new Animated.Value(0)).current;
  const multiplier = getStreakMultiplier(streak);
  const color = getStreakColor(streak);

  useEffect(() => {
    if (streak > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(fireAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(fireAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [streak]);

  const fireTranslateY = fireAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -3],
  });

  if (streak === 0) return null;

  return (
    <View style={[styles.streakContainer, { borderColor: color + '50' }]}>
      <Animated.View style={{ transform: [{ translateY: fireTranslateY }] }}>
        <Ionicons name="flame" size={18} color={color} />
      </Animated.View>
      <Text style={[styles.streakNumber, { color }]}>{streak}</Text>
      {showMultiplier && multiplier > 1 && (
        <View style={[styles.multiplierBadge, { backgroundColor: color + '20' }]}>
          <Text style={[styles.multiplierText, { color }]}>{multiplier}x</Text>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 *
 */
export default function LevelProgress({
  level,
  currentXP,
  totalXP,
  loginStreak,
  variant = 'compact',
  showStreak = true,
  onPress,
}: LevelProgressProps) {
  const [xpNotifications, setXpNotifications] = useState<XPGainNotification[]>([]);
  const [prevTotalXP, setPrevTotalXP] = useState(totalXP);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Calculate XP values
  const xpForCurrentLevel = calculateXPForLevel(level);
  const xpForNextLevel = calculateXPForLevel(level + 1);
  const neededXP = xpForNextLevel - xpForCurrentLevel;
  const progressXP = currentXP;
  const progressPercent = neededXP > 0 ? Math.min((progressXP / neededXP) * 100, 100) : 0;

  // Animate progress bar
  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: progressPercent,
      tension: 50,
      friction: 10,
      useNativeDriver: false,
    }).start();
  }, [progressPercent]);

  // Detect XP gains
  useEffect(() => {
    if (totalXP > prevTotalXP) {
      const gained = totalXP - prevTotalXP;
      HapticFeedback.success();
      
      const notification: XPGainNotification = {
        id: Date.now().toString(),
        amount: gained,
        source: 'Action completed',
      };
      
      setXpNotifications(prev => [...prev, notification]);
    }
    setPrevTotalXP(totalXP);
  }, [totalXP, prevTotalXP]);

  const handleRemoveNotification = (id: string) => {
    setXpNotifications(prev => prev.filter(n => n.id !== id));
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  if (variant === 'compact') {
    return (
      <TouchableOpacity 
        onPress={onPress} 
        activeOpacity={0.9}
        disabled={!onPress}
      >
        <BlurView intensity={60} tint="dark" style={styles.compactContainer}>
          <View style={styles.compactContent}>
            {/* Level Badge */}
            <LevelBadge level={level} size="medium" />

            {/* Progress Info */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.levelLabel}>Level {level}</Text>
                <Text style={styles.xpLabel}>
                  {progressXP.toLocaleString()} / {neededXP.toLocaleString()} XP
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarContainer}>
                <Animated.View style={[styles.progressBarFill, { width: progressWidth }]}>
                  <LinearGradient
                    colors={[AnimationColors.primary, '#8b5cf6', '#ec4899']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.progressGradient}
                  />
                </Animated.View>
                
                {/* Shimmer effect */}
                <Animated.View style={styles.shimmerEffect} />
              </View>
            </View>

            {/* Streak */}
            {showStreak && loginStreak > 0 && (
              <StreakIndicator streak={loginStreak} showMultiplier={true} />
            )}
          </View>

          {/* XP Gain Notifications */}
          <View style={styles.notificationContainer}>
            {xpNotifications.map(notification => (
              <FloatingXPBadge
                key={notification.id}
                amount={notification.amount}
                onComplete={() => handleRemoveNotification(notification.id)}
              />
            ))}
          </View>
        </BlurView>
      </TouchableOpacity>
    );
  }

  // Expanded variant
  return (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.9}
      disabled={!onPress}
    >
      <BlurView intensity={60} tint="dark" style={styles.expandedContainer}>
        <View style={styles.expandedHeader}>
          <LevelBadge level={level} size="large" />
          
          <View style={styles.expandedInfo}>
            <Text style={styles.expandedLevelText}>Level {level}</Text>
            <Text style={styles.expandedXPText}>
              Total XP: {totalXP.toLocaleString()}
            </Text>
            
            {showStreak && loginStreak > 0 && (
              <StreakIndicator streak={loginStreak} showMultiplier={true} />
            )}
          </View>
        </View>

        {/* Large Progress Bar */}
        <View style={styles.expandedProgressSection}>
          <View style={styles.expandedProgressHeader}>
            <Text style={styles.nextLevelText}>Next: Level {level + 1}</Text>
            <Text style={styles.remainingXPText}>
              {(neededXP - progressXP).toLocaleString()} XP remaining
            </Text>
          </View>

          <View style={styles.expandedProgressBar}>
            <Animated.View style={[styles.progressBarFill, { width: progressWidth }]}>
              <LinearGradient
                colors={[AnimationColors.primary, '#8b5cf6', '#ec4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.progressGradient}
              />
            </Animated.View>
          </View>

          <View style={styles.progressLabels}>
            <Text style={styles.progressLabelStart}>0</Text>
            <Text style={styles.progressLabelCurrent}>{progressXP.toLocaleString()}</Text>
            <Text style={styles.progressLabelEnd}>{neededXP.toLocaleString()}</Text>
          </View>
        </View>

        {/* Multiplier Info */}
        {loginStreak >= 3 && (
          <View style={styles.multiplierInfo}>
            <Ionicons name="trending-up" size={16} color={AnimationColors.primary} />
            <Text style={styles.multiplierInfoText}>
              {getStreakMultiplier(loginStreak)}x XP bonus active!
            </Text>
          </View>
        )}

        {/* XP Gain Notifications */}
        <View style={styles.notificationContainer}>
          {xpNotifications.map(notification => (
            <FloatingXPBadge
              key={notification.id}
              amount={notification.amount}
              onComplete={() => handleRemoveNotification(notification.id)}
            />
          ))}
        </View>
      </BlurView>
    </TouchableOpacity>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Compact variant
  compactContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },

  // Level Badge
  levelGlow: {
    position: 'absolute',
    backgroundColor: AnimationColors.primary,
  },
  levelBadgeOuter: {
    shadowColor: AnimationColors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  levelBadgeGradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadgeInner: {
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: {
    fontWeight: '800',
    color: '#ffffff',
    textShadowColor: AnimationColors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },

  // Progress section
  progressSection: {
    flex: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  levelLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  xpLabel: {
    fontSize: 11,
    color: '#9ca3af',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressGradient: {
    flex: 1,
  },
  shimmerEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Streak
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
  },
  streakNumber: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
  },
  multiplierBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  multiplierText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Floating XP
  floatingXPBadge: {
    position: 'absolute',
    top: 0,
    right: 12,
    zIndex: 100,
  },
  floatingXPGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingXPText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },

  notificationContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
  },

  // Expanded variant
  expandedContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
    padding: 20,
  },
  expandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  expandedInfo: {
    marginLeft: 20,
    flex: 1,
  },
  expandedLevelText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  expandedXPText: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
  },
  expandedProgressSection: {
    marginBottom: 16,
  },
  expandedProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  nextLevelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  remainingXPText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  expandedProgressBar: {
    height: 12,
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressLabelStart: {
    fontSize: 10,
    color: '#6b7280',
  },
  progressLabelCurrent: {
    fontSize: 10,
    color: AnimationColors.primary,
    fontWeight: '600',
  },
  progressLabelEnd: {
    fontSize: 10,
    color: '#6b7280',
  },
  multiplierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
    gap: 6,
  },
  multiplierInfoText: {
    fontSize: 12,
    fontWeight: '600',
    color: AnimationColors.primary,
  },
});
