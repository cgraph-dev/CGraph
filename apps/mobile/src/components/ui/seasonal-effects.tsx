/**
 * SeasonalEffects - Configurable seasonal overlay effects (Mobile)
 * Snowfall, hearts, fireworks, cherry blossoms using Reanimated v4
 */
import React, { memo, useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ── Types ──────────────────────────────────────────────────
export type SeasonalTheme = 'snow' | 'hearts' | 'cherry-blossoms' | 'confetti' | 'none';

interface SeasonalEffectsProps {
  theme: SeasonalTheme;
  intensity?: 'light' | 'medium' | 'heavy';
}

// ── Config ─────────────────────────────────────────────────
const INTENSITY_COUNTS = { light: 12, medium: 24, heavy: 40 } as const;

interface ParticleConfig {
  emoji: string;
  size: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration: number;
  delay: number;
  opacity: number;
  rotation: number;
}

function buildParticles(theme: SeasonalTheme, count: number): ParticleConfig[] {
  const particles: ParticleConfig[] = [];

  for (let i = 0; i < count; i++) {
    const startX = Math.random() * SCREEN_W;
    const delay = Math.random() * 4000;

    switch (theme) {
      case 'snow':
        particles.push({
          emoji: '❄️',
          size: 10 + Math.random() * 12,
          startX,
          startY: -30,
          endX: startX + (Math.random() - 0.5) * 80,
          endY: SCREEN_H + 30,
          duration: 4000 + Math.random() * 4000,
          delay,
          opacity: 0.3 + Math.random() * 0.4,
          rotation: Math.random() * 360,
        });
        break;

      case 'hearts':
        particles.push({
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          emoji: ['❤️', '💕', '💖', '💗', '💘'][Math.floor(Math.random() * 5)] as string,
          size: 14 + Math.random() * 12,
          startX,
          startY: SCREEN_H + 30,
          endX: startX + (Math.random() - 0.5) * 60,
          endY: -40,
          duration: 5000 + Math.random() * 3000,
          delay,
          opacity: 0.3 + Math.random() * 0.5,
          rotation: (Math.random() - 0.5) * 30,
        });
        break;

      case 'cherry-blossoms':
        particles.push({
          emoji: '🌸',
          size: 12 + Math.random() * 10,
          startX: -20,
          startY: Math.random() * SCREEN_H * 0.3,
          endX: SCREEN_W + 30,
          endY: SCREEN_H + 30,
          duration: 5000 + Math.random() * 4000,
          delay,
          opacity: 0.3 + Math.random() * 0.5,
          rotation: Math.random() * 360,
        });
        break;

      case 'confetti':
        particles.push({
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          emoji: ['🎊', '🎉', '✨', '⭐'][Math.floor(Math.random() * 4)] as string,
          size: 12 + Math.random() * 8,
          startX,
          startY: -30,
          endX: startX + (Math.random() - 0.5) * 120,
          endY: SCREEN_H + 30,
          duration: 3000 + Math.random() * 3000,
          delay,
          opacity: 0.5 + Math.random() * 0.4,
          rotation: Math.random() * 720,
        });
        break;

      default:
        break;
    }
  }

  return particles;
}

// ── Single Particle ────────────────────────────────────────
const FloatingParticle = memo(function FloatingParticle({ config }: { config: ParticleConfig }) {
  const translateX = useSharedValue(config.startX);
  const translateY = useSharedValue(config.startY);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    const dur = config.duration;

    translateX.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(config.startX, { duration: 0 }),
          withTiming(config.endX, {
            duration: dur,
            easing: Easing.linear,
          })
        ),
        -1,
        false
      )
    );

    translateY.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(config.startY, { duration: 0 }),
          withTiming(config.endY, {
            duration: dur,
            easing: Easing.linear,
          })
        ),
        -1,
        false
      )
    );

    opacity.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(config.opacity, { duration: dur * 0.1 }),
          withTiming(config.opacity, { duration: dur * 0.7 }),
          withTiming(0, { duration: dur * 0.2 }),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      )
    );

    rotate.value = withDelay(
      config.delay,
      withRepeat(
        withTiming(config.rotation, {
          duration: config.duration,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[styles.particle, { fontSize: config.size }, animatedStyle]}>
      {config.emoji}
    </Animated.Text>
  );
});

// ── Main Component ─────────────────────────────────────────
export const SeasonalEffects = memo(function SeasonalEffects({
  theme,
  intensity = 'medium',
}: SeasonalEffectsProps) {
  const count = INTENSITY_COUNTS[intensity];
  const particles = useMemo(() => buildParticles(theme, count), [theme, count]);

  if (theme === 'none' || particles.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((config, i) => (
        <FloatingParticle key={`${theme}-${i}`} config={config} />
      ))}
    </View>
  );
});

// ── Auto Theme ─────────────────────────────────────────────
/**
 * Gets auto seasonal theme.
 *
 */
export function getAutoSeasonalTheme(): SeasonalTheme {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  if (month === 12 && day >= 15) return 'snow';
  if (month === 1 && day <= 5) return 'snow';
  if (month === 2 && day >= 13 && day <= 15) return 'hearts';
  if ((month === 3 && day >= 20) || (month === 4 && day <= 15)) {
    return 'cherry-blossoms';
  }

  return 'none';
}

// ── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  particle: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
