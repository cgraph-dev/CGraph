/**
 * AchievementNotification Component - Mobile
 * 
 * A toast-style notification that celebrates achievement unlocks on mobile.
 * Implements the same features as web but optimized for React Native:
 * 
 * Features:
 * - Slide-in animation from right with spring physics
 * - Rarity-based gradient styling (common to mythic)
 * - Progress bar animation for partial completion
 * - Native haptic celebration on unlock
 * - Auto-dismiss with circular progress indicator
 * - Swipe to dismiss gesture
 * - Queue system for multiple achievements
 * - Particle burst effect using native animations
 * 
 * The notification appears at the top of the screen and creates
 * a satisfying moment of recognition without disrupting the user's flow.
 * 
 * @version 1.0.0
 * @since v0.8.1
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback, SpringPresets } from '@/lib/animations/animation-engine';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NOTIFICATION_WIDTH = SCREEN_WIDTH - 32;
const AUTO_DISMISS_DURATION = 5000;

// ============================================================================
// TYPES
// ============================================================================

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  xpReward: number;
  maxProgress: number;
  category: string;
}

export interface AchievementNotificationData {
  achievement: Achievement & {
    progress: number;
    unlocked: boolean;
    unlockedAt?: string;
  };
  isUnlock: boolean;
}

interface AchievementNotificationProps {
  notifications: AchievementNotificationData[];
  onDismiss: (index: number) => void;
  onViewDetails?: (achievement: Achievement) => void;
}

// ============================================================================
// RARITY CONFIGURATION
// ============================================================================

const RARITY_CONFIG: Record<AchievementRarity, {
  colors: [string, string];
  glowColor: string;
  particleCount: number;
  iconName: keyof typeof Ionicons.glyphMap;
}> = {
  common: {
    colors: ['#6b7280', '#4b5563'],
    glowColor: 'rgba(107, 114, 128, 0.5)',
    particleCount: 8,
    iconName: 'ribbon-outline',
  },
  uncommon: {
    colors: ['#10b981', '#059669'],
    glowColor: 'rgba(16, 185, 129, 0.5)',
    particleCount: 12,
    iconName: 'ribbon',
  },
  rare: {
    colors: ['#3b82f6', '#2563eb'],
    glowColor: 'rgba(59, 130, 246, 0.5)',
    particleCount: 16,
    iconName: 'medal-outline',
  },
  epic: {
    colors: ['#8b5cf6', '#7c3aed'],
    glowColor: 'rgba(139, 92, 246, 0.5)',
    particleCount: 20,
    iconName: 'medal',
  },
  legendary: {
    colors: ['#f59e0b', '#d97706'],
    glowColor: 'rgba(245, 158, 11, 0.5)',
    particleCount: 30,
    iconName: 'trophy',
  },
  mythic: {
    colors: ['#ec4899', '#db2777'],
    glowColor: 'rgba(236, 72, 153, 0.5)',
    particleCount: 40,
    iconName: 'diamond',
  },
};

// ============================================================================
// PARTICLE SYSTEM
// ============================================================================

interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  rotation: Animated.Value;
  color: string;
}

function useParticleSystem(count: number, colors: string[], trigger: boolean) {
  const particles = useRef<Particle[]>([]);
  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    if (!trigger) return;

    // Create particles
    particles.current = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      scale: new Animated.Value(0),
      opacity: new Animated.Value(1),
      rotation: new Animated.Value(0),
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    setRenderKey(prev => prev + 1);

    // Animate particles
    particles.current.forEach((particle, index) => {
      const angle = (index / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const distance = 80 + Math.random() * 60;
      const targetX = Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance;

      Animated.parallel([
        Animated.spring(particle.x, {
          toValue: targetX,
          tension: 40,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.spring(particle.y, {
          toValue: targetY,
          tension: 40,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.spring(particle.scale, {
            toValue: 1 + Math.random() * 0.5,
            tension: 200,
            friction: 10,
            useNativeDriver: true,
          }),
          Animated.timing(particle.scale, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(300),
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(particle.rotation, {
          toValue: (Math.random() - 0.5) * 4,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [trigger, count, colors]);

  return { particles: particles.current, renderKey };
}

// ============================================================================
// ACHIEVEMENT TOAST COMPONENT
// ============================================================================

interface AchievementToastProps {
  data: AchievementNotificationData;
  index: number;
  onDismiss: () => void;
  onViewDetails?: (achievement: Achievement) => void;
}

function AchievementToast({ data, index, onDismiss, onViewDetails }: AchievementToastProps) {
  const { achievement, isUnlock } = data;
  const config = RARITY_CONFIG[achievement.rarity];
  
  // Animation values
  const translateX = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const dismissProgress = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  
  // Particle system
  const { particles, renderKey } = useParticleSystem(
    config.particleCount,
    [...config.colors, '#ffffff'],
    isUnlock
  );

  // Pan responder for swipe to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => 
        Math.abs(gestureState.dx) > 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > NOTIFICATION_WIDTH * 0.3 || gestureState.vx > 0.5) {
          // Dismiss
          HapticFeedback.light();
          Animated.timing(translateX, {
            toValue: SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => onDismiss());
        } else {
          // Snap back
          Animated.spring(translateX, {
            toValue: 0,
            ...SpringPresets.snappy,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Entrance animation
  useEffect(() => {
    // Haptic feedback
    if (isUnlock) {
      HapticFeedback.celebration();
    } else {
      HapticFeedback.light();
    }

    // Entrance animation sequence
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        tension: 80,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        tension: 80,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Progress animation
    const targetProgress = (achievement.progress / achievement.maxProgress) * 100;
    Animated.timing(progressAnim, {
      toValue: targetProgress,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    // Glow animation for unlocks
    if (isUnlock) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      ).start();

      // Shake animation
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -5, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }

    // Auto-dismiss
    Animated.timing(dismissProgress, {
      toValue: 100,
      duration: AUTO_DISMISS_DURATION,
      useNativeDriver: false,
    }).start(() => onDismiss());

    return () => {
      dismissProgress.stopAnimation();
    };
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const dismissWidth = dismissProgress.interpolate({
    inputRange: [0, 100],
    outputRange: ['100%', '0%'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.toastContainer,
        {
          transform: [
            { translateX },
            { translateY: Animated.add(translateY, Animated.multiply(index, 8)) },
            { scale },
            { translateX: shakeAnim },
          ],
          opacity,
          zIndex: 100 - index,
        },
      ]}
    >
      {/* Glow effect for unlocks */}
      {isUnlock && (
        <Animated.View
          style={[
            styles.glowOverlay,
            {
              opacity: glowOpacity,
              backgroundColor: config.glowColor,
            },
          ]}
        />
      )}

      {/* Main card */}
      <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
        <LinearGradient
          colors={[...config.colors, 'rgba(0,0,0,0.8)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBorder}
        >
          <View style={styles.innerContainer}>
            {/* Icon container with particles */}
            <View style={styles.iconSection}>
              <View style={[styles.iconContainer, { backgroundColor: config.colors[0] + '30' }]}>
                <Ionicons
                  name={isUnlock ? 'trophy' : config.iconName}
                  size={28}
                  color={config.colors[0]}
                />
              </View>

              {/* Particles */}
              {isUnlock && particles.map((particle) => (
                <Animated.View
                  key={`${renderKey}-${particle.id}`}
                  style={[
                    styles.particle,
                    {
                      backgroundColor: particle.color,
                      transform: [
                        { translateX: particle.x },
                        { translateY: particle.y },
                        { scale: particle.scale },
                        { rotate: particle.rotation.interpolate({
                          inputRange: [-4, 4],
                          outputRange: ['-180deg', '180deg'],
                        })},
                      ],
                      opacity: particle.opacity,
                    },
                  ]}
                />
              ))}
            </View>

            {/* Content */}
            <View style={styles.contentSection}>
              <View style={styles.header}>
                <Text style={[styles.rarityBadge, { color: config.colors[0] }]}>
                  {achievement.rarity.toUpperCase()}
                </Text>
                {isUnlock && (
                  <View style={styles.xpBadge}>
                    <Ionicons name="star" size={12} color="#f59e0b" />
                    <Text style={styles.xpText}>+{achievement.xpReward} XP</Text>
                  </View>
                )}
              </View>

              <Text style={styles.title} numberOfLines={1}>
                {isUnlock ? '🎉 Achievement Unlocked!' : achievement.name}
              </Text>

              <Text style={styles.description} numberOfLines={2}>
                {isUnlock ? achievement.name : achievement.description}
              </Text>

              {/* Progress bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBackground}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        width: progressWidth,
                        backgroundColor: config.colors[0],
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {achievement.progress}/{achievement.maxProgress}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionSection}>
              <TouchableOpacity
                onPress={() => {
                  HapticFeedback.light();
                  onViewDetails?.(achievement);
                }}
                style={styles.viewButton}
              >
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  HapticFeedback.light();
                  Animated.timing(translateX, {
                    toValue: SCREEN_WIDTH,
                    duration: 200,
                    useNativeDriver: true,
                  }).start(() => onDismiss());
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Auto-dismiss progress bar */}
          <Animated.View
            style={[
              styles.dismissProgressBar,
              {
                width: dismissWidth,
                backgroundColor: config.colors[0],
              },
            ]}
          />
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 *
 */
export default function AchievementNotification({
  notifications,
  onDismiss,
  onViewDetails,
}: AchievementNotificationProps) {
  return (
    <View style={styles.container} pointerEvents="box-none">
      {notifications.map((notification, index) => (
        <AchievementToast
          key={`${notification.achievement.id}-${index}`}
          data={notification}
          index={index}
          onDismiss={() => onDismiss(index)}
          onViewDetails={onViewDetails}
        />
      ))}
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    right: 16,
    left: 16,
    zIndex: 9999,
  },
  toastContainer: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    transform: [{ scale: 1.1 }],
  },
  blurContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientBorder: {
    padding: 1.5,
    borderRadius: 16,
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderRadius: 14,
    padding: 12,
  },
  iconSection: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  contentSection: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rarityBadge: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 8,
  },
  xpText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#f59e0b',
    marginLeft: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
    lineHeight: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBackground: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(75, 85, 99, 0.5)',
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7280',
    minWidth: 40,
    textAlign: 'right',
  },
  actionSection: {
    marginLeft: 8,
  },
  viewButton: {
    padding: 4,
    marginBottom: 4,
  },
  closeButton: {
    padding: 4,
  },
  dismissProgressBar: {
    height: 2,
    backgroundColor: '#10b981',
  },
});
