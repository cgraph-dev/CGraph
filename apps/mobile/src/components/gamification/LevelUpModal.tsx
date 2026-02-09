/**
 * LevelUpModal - Epic Level Up Celebration
 * Full-screen celebration with particles, animations, and rewards.
 * Uses Reanimated v4 per ADR-018.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  withDelay,
  interpolate,
  Easing,
  FadeIn,
  FadeInDown,
  ZoomIn,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimationColors, HapticFeedback } from '@/lib/animations/AnimationEngine';
import { SPRING_PRESETS } from '@/lib/animations/AnimationLibrary';
import GlassCard from '../ui/GlassCard';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Reward {
  type: 'title' | 'badge' | 'perk' | 'coins' | 'lore';
  name: string;
  description: string;
  icon: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

interface LevelUpModalProps {
  visible: boolean;
  onClose: () => void;
  level: number;
  xpGained: number;
  rewards: Reward[];
  previousLevel?: number;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
}

export default function LevelUpModal({
  visible,
  onClose,
  level,
  xpGained,
  rewards,
  previousLevel = level - 1,
}: LevelUpModalProps) {
  // ---- Shared values (Reanimated v4) ----
  const badgeScale = useSharedValue(0);
  const badgeRotate = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0.3);

  const [particles, setParticles] = useState<Particle[]>([]);
  const [showRewards, setShowRewards] = useState(false);

  const showRewardsCallback = useCallback(() => {
    setShowRewards(true);
    HapticFeedback.success();
  }, []);

  useEffect(() => {
    if (visible) {
      celebrateSequence();
    } else {
      badgeScale.value = 0;
      badgeRotate.value = 0;
      contentOpacity.value = 0;
      glowOpacity.value = 0.3;
      setShowRewards(false);
      setParticles([]);
    }
  }, [visible]);

  const celebrateSequence = () => {
    HapticFeedback.levelUp();
    generateParticles();

    // Badge entrance: spring scale + 360° rotation + fade
    badgeScale.value = withSpring(1, SPRING_PRESETS.bouncy);
    badgeRotate.value = withTiming(360, { duration: 800, easing: Easing.out(Easing.cubic) });
    contentOpacity.value = withTiming(1, { duration: 500 });

    // Looping glow pulse
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 }),
      ),
      -1, // infinite
      true,
    );

    // Show rewards after 1.2s
    badgeScale.value = withDelay(
      1200,
      withTiming(badgeScale.value, { duration: 0 }, () => {
        runOnJS(showRewardsCallback)();
      }),
    );
    // Fallback: ensure rewards show even if animation callback is skipped
    setTimeout(showRewardsCallback, 1300);
  };

  const generateParticles = () => {
    const colors = [
      AnimationColors.primary,
      AnimationColors.purple,
      AnimationColors.pink,
      AnimationColors.amber,
      AnimationColors.neonCyan,
    ];

    const newParticles: Particle[] = Array.from({ length: 50 }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 5 + 3;
      return {
        id: `p-${i}`,
        x: SCREEN_WIDTH / 2,
        y: SCREEN_HEIGHT / 2,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
      };
    });

    setParticles(newParticles);
    animateParticles();
  };

  const animateParticles = () => {
    let frame = 0;
    const maxFrames = 100;
    const gravity = 0.15;

    const step = () => {
      if (frame >= maxFrames) return;
      setParticles((prev) =>
        prev.map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + gravity,
          rotation: p.rotation + p.rotationSpeed,
        })),
      );
      frame++;
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // ---- Animated styles ----
  const badgeAnimStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [
      { scale: badgeScale.value },
      { rotate: `${badgeRotate.value}deg` },
    ],
  }));

  const glowAnimStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const textAnimStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Particles (JS-driven, not on UI thread — acceptable for confetti) */}
        {particles.map((particle) => (
          <View
            key={particle.id}
            style={[
              styles.particle,
              {
                left: particle.x,
                top: particle.y,
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                transform: [{ rotate: `${particle.rotation}deg` }],
              },
            ]}
          />
        ))}

        {/* Level badge */}
        <Animated.View style={[styles.badgeContainer, badgeAnimStyle]}>
          <Animated.View style={[styles.glowRing, glowAnimStyle]} />
          <LinearGradient
            colors={[AnimationColors.amber, AnimationColors.amberLight, AnimationColors.amber]}
            style={styles.badge}
          >
            <Text style={styles.badgeLabel}>LEVEL</Text>
            <Text style={styles.badgeLevel}>{level}</Text>
          </LinearGradient>
        </Animated.View>

        {/* Level up text */}
        <Animated.View style={[styles.textContainer, textAnimStyle]}>
          <Text style={styles.congratsText}>LEVEL UP!</Text>
          <Text style={styles.levelText}>
            {previousLevel} → {level}
          </Text>
          <View style={styles.xpContainer}>
            <Text style={styles.xpIcon}>✨</Text>
            <Text style={styles.xpText}>+{xpGained} XP</Text>
          </View>
        </Animated.View>

        {/* Rewards section — Reanimated entering animations */}
        {showRewards && (
          <Animated.View
            entering={FadeInDown.springify().damping(18).stiffness(200)}
            style={styles.rewardsContainer}
          >
            <GlassCard variant="frosted" intensity="strong">
              <View style={styles.rewardsContent}>
                <Text style={styles.rewardsTitle}>🎁 New Rewards Unlocked</Text>
                <View style={styles.rewardsList}>
                  {rewards.map((reward, index) => (
                    <Animated.View
                      key={index}
                      entering={FadeInDown.delay(index * 100)
                        .springify()
                        .damping(16)
                        .stiffness(180)}
                      style={styles.rewardItem}
                    >
                      <View style={styles.rewardIconContainer}>
                        <Text style={styles.rewardIcon}>{reward.icon}</Text>
                      </View>
                      <View style={styles.rewardInfo}>
                        <View style={styles.rewardHeader}>
                          <Text style={styles.rewardName}>{reward.name}</Text>
                          {reward.rarity && (
                            <View
                              style={[
                                styles.rarityBadge,
                                { backgroundColor: getRarityColor(reward.rarity) },
                              ]}
                            >
                              <Text style={styles.rarityText}>
                                {reward.rarity.toUpperCase()}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.rewardDescription}>{reward.description}</Text>
                      </View>
                    </Animated.View>
                  ))}
                </View>
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {/* Continue button */}
        {showRewards && (
          <Animated.View entering={ZoomIn.delay(rewards.length * 100 + 200).springify()}>
            <TouchableOpacity
              onPress={() => {
                HapticFeedback.medium();
                onClose();
              }}
              style={styles.continueButton}
            >
              <LinearGradient
                colors={[AnimationColors.primary, AnimationColors.primaryDark]}
                style={styles.continueButtonGradient}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
}

const getRarityColor = (rarity: string): string => {
  const colorMap: Record<string, string> = {
    common: AnimationColors.gray500,
    rare: '#3b82f6',
    epic: '#8b5cf6',
    legendary: '#f59e0b',
  };
  return colorMap[rarity] || AnimationColors.gray500;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  particle: {
    position: 'absolute',
    borderRadius: 4,
  },
  badgeContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  glowRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: AnimationColors.amber,
    shadowColor: AnimationColors.amber,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 40,
    elevation: 20,
  },
  badge: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: AnimationColors.white,
  },
  badgeLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: AnimationColors.white,
    letterSpacing: 2,
  },
  badgeLevel: {
    fontSize: 64,
    fontWeight: '900',
    color: AnimationColors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  congratsText: {
    fontSize: 32,
    fontWeight: '900',
    color: AnimationColors.white,
    letterSpacing: 3,
    textShadowColor: AnimationColors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  levelText: {
    fontSize: 24,
    fontWeight: '700',
    color: AnimationColors.amber,
    marginTop: 8,
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    backgroundColor: AnimationColors.dark700,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  xpIcon: {
    fontSize: 20,
  },
  xpText: {
    fontSize: 18,
    fontWeight: '700',
    color: AnimationColors.white,
  },
  rewardsContainer: {
    width: '100%',
    maxHeight: SCREEN_HEIGHT * 0.4,
  },
  rewardsContent: {
    padding: 20,
  },
  rewardsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AnimationColors.white,
    marginBottom: 16,
    textAlign: 'center',
  },
  rewardsList: {
    gap: 12,
  },
  rewardItem: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: AnimationColors.dark700,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AnimationColors.dark600,
  },
  rewardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AnimationColors.dark600,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardIcon: {
    fontSize: 24,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: '700',
    color: AnimationColors.white,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '700',
    color: AnimationColors.white,
  },
  rewardDescription: {
    fontSize: 13,
    color: AnimationColors.gray400,
    lineHeight: 18,
  },
  continueButton: {
    marginTop: 24,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  continueButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: AnimationColors.white,
    letterSpacing: 1,
  },
});
