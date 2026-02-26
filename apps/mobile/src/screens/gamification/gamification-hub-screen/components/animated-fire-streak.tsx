/**
 * AnimatedFireStreak - Animated streak display with fire effects
 *
 * Features:
 * - Animated flame emojis with scale/opacity
 * - Claim button with pulse and shimmer
 * - Haptic feedback on interactions
 */

import { durations } from '@cgraph/animation-constants';
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
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

function FlameEmoji({ index }: { index: number }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.7);
  const translateY = useSharedValue(0);

  useEffect(() => {
    const delay = index * 150;
    const dur = 400 + index * 50;

    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.3 + Math.random() * 0.2, { duration: dur }),
          withTiming(1, { duration: dur })
        ),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: durations.smooth.ms }),
          withTiming(0.7, { duration: durations.smooth.ms })
        ),
        -1,
        false
      )
    );
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-5 - index * 2, { duration: durations.smooth.ms }),
          withTiming(0, { duration: durations.smooth.ms })
        ),
        -1,
        false
      )
    );
  }, []);

  const flameStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  return (
    <Animated.Text
      style={[
        styles.flameEmoji,
        { fontSize: 24 + index * 4 },
        flameStyle,
      ]}
    >
      🔥
    </Animated.Text>
  );
}

/**
 *
 */
export function AnimatedFireStreak({ streak, canClaim, onClaim }: AnimatedFireStreakProps) {
  const claimPulse = useSharedValue(1);
  const shimmerAnim = useSharedValue(0);

  useEffect(() => {
    // Claim button pulse
    if (canClaim) {
      claimPulse.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: durations.extended.ms }),
          withTiming(1, { duration: durations.extended.ms })
        ),
        -1,
        false
      );

      // Shimmer animation
      shimmerAnim.value = withRepeat(
        withTiming(1, { duration: durations.loop.ms }),
        -1,
        false
      );
    }
  }, [canClaim]);

  const claimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: claimPulse.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmerAnim.value, [0, 1], [-100, SCREEN_WIDTH]) }],
  }));

  return (
    <GlassCard variant="neon" intensity="medium" style={styles.card}>
      <View style={styles.content}>
        {/* Animated flames */}
        <View style={styles.flamesContainer}>
          {Array.from({ length: 5 }, (_, i) => (
            <FlameEmoji key={i} index={i} />
          ))}
        </View>

        <View style={styles.info}>
          <Text style={styles.value}>{streak}</Text>
          <Text style={styles.label}>Day Streak</Text>
          <Text style={styles.subLabel}>{streak >= 7 ? '🏆 On fire!' : 'Keep it going!'}</Text>
        </View>

        {canClaim ? (
          <Animated.View style={claimStyle}>
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
                  style={[styles.shimmerOverlay, shimmerStyle]}
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
