/**
 * TypingIndicator - Revolutionary Multi-Style Typing Animation
 * Features:
 * - 6 animation styles: dots, wave, pulse, bars, bounce, fade
 * - Configurable colors and sizes
 * - Haptic feedback option
 * - User avatars for who's typing
 * - Glassmorphism container
 */

import { durations } from '@cgraph/animation-constants';
import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors, Typography, Spacing, BorderRadius } from '@/lib/design/design-system';

export type TypingIndicatorStyle = 'dots' | 'wave' | 'pulse' | 'bars' | 'bounce' | 'fade';

interface TypingUser {
  id: string;
  name: string;
  avatar?: string;
}

interface TypingIndicatorProps {
  style?: TypingIndicatorStyle;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  users?: TypingUser[];
  showNames?: boolean;
  glass?: boolean;
  containerStyle?: ViewStyle;
}

const DOT_COUNT = 3;

const SIZE_CONFIG = {
  sm: { dot: 6, spacing: 3, bar: 12, container: 24 },
  md: { dot: 8, spacing: 4, bar: 16, container: 32 },
  lg: { dot: 10, spacing: 5, bar: 20, container: 40 },
};

const ANIMATION_CONFIG = {
  dots: { duration: durations.dramatic.ms, delay: 150 },
  wave: { duration: durations.extended.ms, delay: 120 },
  pulse: { duration: durations.verySlow.ms, delay: 0 },
  bars: { duration: durations.slower.ms, delay: 100 },
  bounce: { duration: durations.dramatic.ms, delay: 150 },
  fade: { duration: durations.extended.ms, delay: 200 },
};

/**
 *
 */
export default function TypingIndicator({
  style = 'dots',
  color = Colors.primary[500],
  size = 'md',
  users = [],
  showNames = true,
  glass = true,
  containerStyle,
}: TypingIndicatorProps) {
  const config = SIZE_CONFIG[size];
  const animConfig = ANIMATION_CONFIG[style];

  // Create animated values for each element
  const animations = useRef(
    Array(DOT_COUNT)
      .fill(0)
      .map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const createAnimation = (index: number): Animated.CompositeAnimation => {
      const anim = animations[index];

      switch (style) {
        case 'dots':
          return Animated.loop(
            Animated.sequence([
              Animated.timing(anim, {
                toValue: 1,
                duration: animConfig.duration / 2,
                delay: index * animConfig.delay,
                useNativeDriver: true,
                easing: Easing.ease,
              }),
              Animated.timing(anim, {
                toValue: 0,
                duration: animConfig.duration / 2,
                useNativeDriver: true,
                easing: Easing.ease,
              }),
            ])
          );

        case 'wave':
          return Animated.loop(
            Animated.sequence([
              Animated.timing(anim, {
                toValue: 1,
                duration: animConfig.duration / 2,
                delay: index * animConfig.delay,
                useNativeDriver: true,
                easing: Easing.sin,
              }),
              Animated.timing(anim, {
                toValue: 0,
                duration: animConfig.duration / 2,
                useNativeDriver: true,
                easing: Easing.sin,
              }),
            ])
          );

        case 'pulse':
          return Animated.loop(
            Animated.sequence([
              Animated.timing(anim, {
                toValue: 1,
                duration: animConfig.duration / 2,
                useNativeDriver: true,
                easing: Easing.out(Easing.ease),
              }),
              Animated.timing(anim, {
                toValue: 0,
                duration: animConfig.duration / 2,
                useNativeDriver: true,
                easing: Easing.in(Easing.ease),
              }),
            ])
          );

        case 'bars':
          return Animated.loop(
            Animated.sequence([
              Animated.timing(anim, {
                toValue: 1,
                duration: animConfig.duration / 2,
                delay: index * animConfig.delay,
                useNativeDriver: true,
                easing: Easing.linear,
              }),
              Animated.timing(anim, {
                toValue: 0,
                duration: animConfig.duration / 2,
                useNativeDriver: true,
                easing: Easing.linear,
              }),
            ])
          );

        case 'bounce':
          return Animated.loop(
            Animated.sequence([
              Animated.spring(anim, {
                toValue: 1,
                tension: 100,
                friction: 5,
                delay: index * animConfig.delay,
                useNativeDriver: true,
              }),
              Animated.spring(anim, {
                toValue: 0,
                tension: 100,
                friction: 5,
                useNativeDriver: true,
              }),
            ])
          );

        case 'fade':
          return Animated.loop(
            Animated.sequence([
              Animated.timing(anim, {
                toValue: 1,
                duration: animConfig.duration / 2,
                delay: index * animConfig.delay,
                useNativeDriver: true,
                easing: Easing.ease,
              }),
              Animated.timing(anim, {
                toValue: 0,
                duration: animConfig.duration / 2,
                useNativeDriver: true,
                easing: Easing.ease,
              }),
            ])
          );

        default:
          return Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true });
      }
    };

    // Start all animations
    const animationInstances = animations.map((_, i) => createAnimation(i));
    animationInstances.forEach(anim => anim.start());

    return () => {
      animationInstances.forEach(anim => anim.stop());
    };
  }, [style, animations, animConfig]);

  const getAnimatedStyle = (index: number): ViewStyle => {
    const anim = animations[index];

    switch (style) {
      case 'dots':
        return {
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -config.dot],
              }),
            },
          ],
        };

      case 'wave':
        return {
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -config.dot * 1.5],
              }),
            },
          ],
        };

      case 'pulse':
        return {
          transform: [
            {
              scale: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1.2],
              }),
            },
          ],
          opacity: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 1],
          }),
        };

      case 'bars':
        return {
          transform: [
            {
              scaleY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.4, 1],
              }),
            },
          ],
        };

      case 'bounce':
        return {
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -config.dot * 2],
              }),
            },
            {
              scale: anim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [1, 0.8, 1],
              }),
            },
          ],
        };

      case 'fade':
        return {
          opacity: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.2, 1],
          }),
        };

      default:
        return {};
    }
  };

  const renderDot = (index: number) => {
    const animStyle = getAnimatedStyle(index);

    if (style === 'bars') {
      return (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            {
              width: config.dot * 0.6,
              height: config.bar,
              backgroundColor: color,
              marginHorizontal: config.spacing / 2,
            },
            animStyle,
          ]}
        />
      );
    }

    return (
      <Animated.View
        key={index}
        style={[
          styles.dot,
          {
            width: config.dot,
            height: config.dot,
            backgroundColor: color,
            marginHorizontal: config.spacing,
          },
          animStyle,
        ]}
      />
    );
  };

  const getTypingText = useMemo(() => {
    if (users.length === 0) return 'typing...';
    if (users.length === 1) return `${users[0].name} is typing...`;
    if (users.length === 2) return `${users[0].name} and ${users[1].name} are typing...`;
    return `${users[0].name} and ${users.length - 1} others are typing...`;
  }, [users]);

  const content = (
    <View style={styles.innerContainer}>
      <View
        style={[
          styles.dotsContainer,
          { height: config.container, paddingHorizontal: config.spacing * 2 },
        ]}
      >
        {Array(DOT_COUNT)
          .fill(0)
          .map((_, i) => renderDot(i))}
      </View>

      {showNames && (
        <Text style={[styles.typingText, { marginLeft: Spacing[2] }]}>{getTypingText}</Text>
      )}
    </View>
  );

  if (glass) {
    return (
      <View style={[styles.container, containerStyle]}>
        <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
          <LinearGradient
            colors={['rgba(31, 41, 55, 0.8)', 'rgba(31, 41, 55, 0.6)']}
            style={styles.gradientOverlay}
          />
          {content}
        </BlurView>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.solidContainer, containerStyle]}>{content}</View>
  );
}

// Compact version for inline use
/**
 *
 */
export function TypingDotsCompact({
  color = Colors.dark[400],
  size = 4,
}: {
  color?: string;
  size?: number;
}) {
  const animations = useRef(
    Array(3)
      .fill(0)
      .map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const animationInstances = animations.map((anim, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: durations.slow.ms,
            delay: index * 100,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: durations.slow.ms,
            useNativeDriver: true,
          }),
        ])
      )
    );

    animationInstances.forEach(anim => anim.start());

    return () => {
      animationInstances.forEach(anim => anim.stop());
    };
  }, []);

  return (
    <View style={styles.compactContainer}>
      {animations.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.compactDot,
            {
              width: size,
              height: size,
              backgroundColor: color,
              transform: [
                {
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -size],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  blurContainer: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  solidContainer: {
    backgroundColor: Colors.dark[800],
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    borderRadius: 999,
  },
  bar: {
    borderRadius: 2,
  },
  typingText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.dark[400],
    fontStyle: 'italic',
  },

  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  compactDot: {
    borderRadius: 999,
    marginHorizontal: 1,
  },
});
