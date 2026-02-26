/**
 * StickerItem Component - Animated sticker with all 15 animation types
 */

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, interpolate, cancelAnimation, Easing as ReanimatedEasing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Sticker } from '../types';
import { styles } from '../styles';

interface StickerItemProps {
  sticker: Sticker;
  onPress: () => void;
  rarityColor: string;
  isPurchasing: boolean;
}

/**
 *
 */
export function StickerItem({ sticker, onPress, rarityColor, isPurchasing }: StickerItemProps) {
  const scaleAnim = useSharedValue(1);
  const scaleXAnim = useSharedValue(1);
  const rotateAnim = useSharedValue(0);
  const rotateYAnim = useSharedValue(0);
  const translateYAnim = useSharedValue(0);
  const translateXAnim = useSharedValue(0);
  const opacityAnim = useSharedValue(1);

  useEffect(() => {
    // Stop any existing animations
    cancelAnimation(scaleAnim);
    cancelAnimation(scaleXAnim);
    cancelAnimation(rotateAnim);
    cancelAnimation(rotateYAnim);
    cancelAnimation(translateYAnim);
    cancelAnimation(translateXAnim);
    cancelAnimation(opacityAnim);

    // Reset values
    scaleAnim.value = 1;
    scaleXAnim.value = 1;
    rotateAnim.value = 0;
    rotateYAnim.value = 0;
    translateYAnim.value = 0;
    translateXAnim.value = 0;
    opacityAnim.value = 1;

    // Animation based on sticker type - all 15 animations matching web
    switch (sticker.animation) {
      case 'bounce':
        translateYAnim.value = withRepeat(
          withSequence(
            withTiming(-10, { duration: 250, easing: ReanimatedEasing.out(ReanimatedEasing.quad) }),
            withTiming(0, { duration: 250, easing: ReanimatedEasing.in(ReanimatedEasing.quad) })
          ),
          -1
        );
        break;

      case 'pulse':
        scaleAnim.value = withRepeat(
          withSequence(
            withTiming(1.1, { duration: 500 }),
            withTiming(1, { duration: 500 })
          ),
          -1
        );
        break;

      case 'shake':
        translateXAnim.value = withRepeat(
          withSequence(
            withTiming(-5, { duration: 100 }),
            withTiming(5, { duration: 100 }),
            withTiming(-5, { duration: 100 }),
            withTiming(5, { duration: 100 }),
            withTiming(0, { duration: 100 })
          ),
          -1
        );
        break;

      case 'wiggle':
        rotateAnim.value = withRepeat(
          withSequence(
            withTiming(-0.05, { duration: 166 }),
            withTiming(0.05, { duration: 166 }),
            withTiming(-0.05, { duration: 166 })
          ),
          -1
        );
        break;

      case 'float':
        translateYAnim.value = withRepeat(
          withSequence(
            withTiming(-10, { duration: 1000, easing: ReanimatedEasing.inOut(ReanimatedEasing.ease) }),
            withTiming(0, { duration: 1000, easing: ReanimatedEasing.inOut(ReanimatedEasing.ease) })
          ),
          -1
        );
        break;

      case 'pop':
        scaleAnim.value = withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(1.2, { duration: 150, easing: ReanimatedEasing.out(ReanimatedEasing.back(2)) }),
          withTiming(1, { duration: 150 })
        );
        break;

      case 'wave':
        rotateAnim.value = withRepeat(
          withSequence(
            withTiming(0.35, { duration: 250 }),
            withTiming(-0.35, { duration: 500 }),
            withTiming(0, { duration: 250 })
          ),
          -1
        );
        break;

      case 'zoom':
        scaleAnim.value = withRepeat(
          withSequence(
            withTiming(1.1, { duration: 500 }),
            withTiming(1, { duration: 500 })
          ),
          -1
        );
        break;

      case 'flip':
        rotateYAnim.value = withRepeat(
          withTiming(1, { duration: 1000, easing: ReanimatedEasing.linear }),
          -1
        );
        break;

      case 'swing':
        rotateAnim.value = withSequence(
          withTiming(0.26, { duration: 166 }),
          withTiming(-0.175, { duration: 166 }),
          withTiming(0.087, { duration: 166 }),
          withTiming(-0.087, { duration: 166 }),
          withTiming(0, { duration: 166 })
        );
        break;

      case 'jello':
        scaleXAnim.value = withSequence(
          withTiming(1.25, { duration: 142 }),
          withTiming(0.75, { duration: 142 }),
          withTiming(1.15, { duration: 142 }),
          withTiming(0.95, { duration: 142 }),
          withTiming(1.05, { duration: 142 }),
          withTiming(1, { duration: 142 })
        );
        break;

      case 'heartbeat':
        scaleAnim.value = withRepeat(
          withSequence(
            withTiming(1.3, { duration: 150 }),
            withTiming(1, { duration: 150 }),
            withTiming(1.3, { duration: 150 }),
            withTiming(1, { duration: 1050 })
          ),
          -1
        );
        break;

      case 'flash':
        opacityAnim.value = withRepeat(
          withSequence(
            withTiming(0.5, { duration: 250 }),
            withTiming(1, { duration: 250 }),
            withTiming(0.5, { duration: 250 }),
            withTiming(1, { duration: 250 })
          ),
          -1
        );
        break;

      case 'rubberband':
        scaleXAnim.value = withSequence(
          withTiming(1.25, { duration: 142 }),
          withTiming(0.75, { duration: 142 }),
          withTiming(1.15, { duration: 142 }),
          withTiming(0.95, { duration: 142 }),
          withTiming(1.05, { duration: 142 }),
          withTiming(1, { duration: 142 })
        );
        break;

      case 'spin':
        rotateAnim.value = withRepeat(
          withTiming(1, { duration: 1000, easing: ReanimatedEasing.linear }),
          -1
        );
        break;

      case 'none':
      default:
        break;
    }

    return () => {
      cancelAnimation(scaleAnim);
      cancelAnimation(scaleXAnim);
      cancelAnimation(rotateAnim);
      cancelAnimation(rotateYAnim);
      cancelAnimation(translateYAnim);
      cancelAnimation(translateXAnim);
      cancelAnimation(opacityAnim);
    };
  }, [sticker.animation]);

  // Animated style for sticker
  const stickerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scaleAnim.value },
      { scaleX: scaleXAnim.value },
      { rotate: `${interpolate(rotateAnim.value, [0, 1], [0, 360])}deg` },
      { rotateY: `${interpolate(rotateYAnim.value, [0, 1], [0, 360])}deg` },
      { translateX: translateXAnim.value },
      { translateY: translateYAnim.value },
    ],
    opacity: opacityAnim.value,
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isPurchasing}
      style={[styles.stickerItem, { borderColor: rarityColor }]}
    >
      <LinearGradient
        colors={[`${rarityColor}20`, `${rarityColor}10`]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.Text
        style={[
          styles.stickerEmoji,
          stickerAnimatedStyle,
          sticker.isLocked && styles.stickerLocked,
        ]}
      >
        {sticker.emoji}
      </Animated.Text>

      {sticker.isLocked && (
        <View style={styles.lockOverlay}>
          <Text style={styles.lockIcon}>🔒</Text>
          {sticker.price && (
            <View style={styles.priceTag}>
              <Text style={styles.priceText}>{sticker.price}</Text>
              <Text style={styles.priceCoin}>💰</Text>
            </View>
          )}
        </View>
      )}

      {/* Rarity indicator */}
      {sticker.rarity !== 'common' && (
        <View style={[styles.rarityIndicator, { backgroundColor: rarityColor }]} />
      )}
    </TouchableOpacity>
  );
}
