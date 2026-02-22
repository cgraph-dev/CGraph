/**
 * AnimatedFireStreak - Animated streak display with fire effects
 *
 * Features:
 * - Animated flame emojis with scale/opacity
 * - Claim button with pulse and shimmer
 * - Haptic feedback on interactions
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../../../components/ui/glass-card';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface AnimatedFireStreakProps {
  streak: number;
  canClaim: boolean;
  onClaim: () => void;
}

export function AnimatedFireStreak({ streak, canClaim, onClaim }: AnimatedFireStreakProps) {
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
    <GlassCard variant="neon" intensity="medium" style={styles.card}>
      <View style={styles.content}>
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

        <View style={styles.info}>
          <Text style={styles.value}>{streak}</Text>
          <Text style={styles.label}>Day Streak</Text>
          <Text style={styles.subLabel}>{streak >= 7 ? '🏆 On fire!' : 'Keep it going!'}</Text>
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
                style={styles.claimButton}
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
                <Text style={styles.claimButtonText}>Claim!</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View style={styles.claimedBadge}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          </View>
        )}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 20,
    overflow: 'visible',
  },
  content: {
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
  info: {
    flex: 1,
  },
  value: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
  },
  label: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  subLabel: {
    fontSize: 12,
    color: '#F97316',
    marginTop: 4,
    fontWeight: '600',
  },
  claimButton: {
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
  claimButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  claimedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
});

export default AnimatedFireStreak;
