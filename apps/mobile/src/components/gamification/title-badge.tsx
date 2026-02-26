/**
 * TitleBadge Component - Animated Title System with Rarity
 * 7 rarity levels with 8 unique animation types
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimationColors } from '@/lib/animations/animation-engine';

type TitleRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'unique';

type TitleAnimation =
  | 'none'
  | 'shimmer'
  | 'glow'
  | 'pulse'
  | 'rainbow'
  | 'wave'
  | 'sparkle'
  | 'bounce'
  | 'float';

interface TitleBadgeProps {
  title: string;
  rarity: TitleRarity;
  animation?: TitleAnimation;
  size?: 'sm' | 'md' | 'lg';
  showSparkles?: boolean;
  style?: ViewStyle;
}

/**
 *
 */
export default function TitleBadge({
  title,
  rarity,
  animation = 'none',
  size = 'md',
  showSparkles = false,
  style,
}: TitleBadgeProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Shimmer animation - gradient sweep
    if (animation === 'shimmer') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    // Pulse animation - scale breathing
    if (animation === 'pulse' || animation === 'glow') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
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
    }

    // Bounce animation - Y-axis spring
    if (animation === 'bounce') {
      Animated.loop(
        Animated.sequence([
          Animated.spring(bounceAnim, {
            toValue: -4,
            tension: 180,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(bounceAnim, {
            toValue: 0,
            tension: 180,
            friction: 8,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    // Float animation - smooth Y oscillation
    if (animation === 'float') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -6,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    // Sparkle animation
    if (animation === 'sparkle' || showSparkles) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [animation, showSparkles]);

  const getRarityColors = (): [string, string] => {
    const colorMap: Record<TitleRarity, [string, string]> = {
      common: [AnimationColors.gray500, AnimationColors.gray400],
      uncommon: ['#10b981', '#34d399'], // Green
      rare: ['#3b82f6', '#60a5fa'], // Blue
      epic: ['#8b5cf6', '#a78bfa'], // Purple
      legendary: ['#f59e0b', '#fbbf24'], // Amber/Gold
      mythic: ['#ec4899', '#f472b6'], // Pink/Magenta
      unique: ['#ef4444', '#fca5a5'], // Red
    };
    return colorMap[rarity];
  };

  const getSizeStyles = () => {
    const sizeMap = {
      sm: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        fontSize: 11,
        iconSize: 10,
      },
      md: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        fontSize: 13,
        iconSize: 12,
      },
      lg: {
        paddingHorizontal: 16,
        paddingVertical: 7,
        fontSize: 15,
        iconSize: 14,
      },
    };
    return sizeMap[size];
  };

  const getGlowStyle = (): ViewStyle => {
    if (animation === 'glow' || ['legendary', 'mythic'].includes(rarity)) {
      return {
        shadowColor: getRarityColors()[0],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 8,
      };
    }
    return {};
  };

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  const sparkleOpacity = sparkleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1, 0],
  });

  const sparkleScale = sparkleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 1.2, 0.5],
  });

  const sizeStyles = getSizeStyles();
  const colors = getRarityColors();

  // Show sparkles for legendary+
  const shouldShowSparkles = showSparkles || ['legendary', 'mythic', 'divine'].includes(rarity);

  return (
    <Animated.View
      style={[
        styles.container,
        getGlowStyle(),
        style,
        {
          transform: [
            { scale: pulseAnim },
            { translateY: animation === 'bounce' ? bounceAnim : floatAnim },
          ],
        },
      ]}
    >
      {/* Background gradient */}
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.gradient,
          {
            paddingHorizontal: sizeStyles.paddingHorizontal,
            paddingVertical: sizeStyles.paddingVertical,
          },
        ]}
      >
        {/* Shimmer overlay */}
        {animation === 'shimmer' && (
          <Animated.View
            style={[
              styles.shimmerOverlay,
              {
                transform: [{ translateX: shimmerTranslate }],
              },
            ]}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        )}

        {/* Title text */}
        <View style={styles.content}>
          {shouldShowSparkles && (
            <Animated.Text
              style={[
                styles.sparkleIcon,
                {
                  fontSize: sizeStyles.iconSize,
                  opacity: sparkleOpacity,
                  transform: [{ scale: sparkleScale }],
                },
              ]}
            >
              ✨
            </Animated.Text>
          )}
          <Text
            style={[
              styles.titleText,
              {
                fontSize: sizeStyles.fontSize,
              },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {shouldShowSparkles && (
            <Animated.Text
              style={[
                styles.sparkleIcon,
                {
                  fontSize: sizeStyles.iconSize,
                  opacity: sparkleOpacity,
                  transform: [{ scale: sparkleScale }],
                },
              ]}
            >
              ✨
            </Animated.Text>
          )}
        </View>
      </LinearGradient>

      {/* Rainbow border (for rainbow animation) */}
      {animation === 'rainbow' && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: 12,
              borderWidth: 2,
              borderColor: 'transparent',
            },
          ]}
        >
          <LinearGradient
            colors={[
              '#ff0000',
              '#ff7f00',
              '#ffff00',
              '#00ff00',
              '#0000ff',
              '#4b0082',
              '#9400d3',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 12 }]}
          />
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
  gradient: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: -200,
    right: 0,
    bottom: 0,
    width: 200,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  titleText: {
    color: AnimationColors.white,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sparkleIcon: {
    color: AnimationColors.white,
  },
});
