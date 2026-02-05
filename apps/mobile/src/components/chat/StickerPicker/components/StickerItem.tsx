/**
 * StickerItem Component - Animated sticker with all 15 animation types
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sticker } from '../types';
import { styles } from '../styles';

interface StickerItemProps {
  sticker: Sticker;
  onPress: () => void;
  rarityColor: string;
  isPurchasing: boolean;
}

export function StickerItem({ sticker, onPress, rarityColor, isPurchasing }: StickerItemProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const scaleXAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const rotateYAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const translateXAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Stop any existing animations
    const anims = [
      scaleAnim,
      scaleXAnim,
      rotateAnim,
      rotateYAnim,
      translateYAnim,
      translateXAnim,
      opacityAnim,
    ];
    anims.forEach((anim) => anim.stopAnimation());

    // Reset values
    scaleAnim.setValue(1);
    scaleXAnim.setValue(1);
    rotateAnim.setValue(0);
    rotateYAnim.setValue(0);
    translateYAnim.setValue(0);
    translateXAnim.setValue(0);
    opacityAnim.setValue(1);

    // Animation based on sticker type - all 15 animations matching web
    switch (sticker.animation) {
      case 'bounce':
        Animated.loop(
          Animated.sequence([
            Animated.timing(translateYAnim, {
              toValue: -10,
              duration: 250,
              useNativeDriver: true,
              easing: Easing.out(Easing.quad),
            }),
            Animated.timing(translateYAnim, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
              easing: Easing.in(Easing.quad),
            }),
          ])
        ).start();
        break;

      case 'pulse':
        Animated.loop(
          Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 1.1, duration: 500, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          ])
        ).start();
        break;

      case 'shake':
        Animated.loop(
          Animated.sequence([
            Animated.timing(translateXAnim, { toValue: -5, duration: 100, useNativeDriver: true }),
            Animated.timing(translateXAnim, { toValue: 5, duration: 100, useNativeDriver: true }),
            Animated.timing(translateXAnim, { toValue: -5, duration: 100, useNativeDriver: true }),
            Animated.timing(translateXAnim, { toValue: 5, duration: 100, useNativeDriver: true }),
            Animated.timing(translateXAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
          ])
        ).start();
        break;

      case 'wiggle':
        Animated.loop(
          Animated.sequence([
            Animated.timing(rotateAnim, { toValue: -0.05, duration: 166, useNativeDriver: true }),
            Animated.timing(rotateAnim, { toValue: 0.05, duration: 166, useNativeDriver: true }),
            Animated.timing(rotateAnim, { toValue: -0.05, duration: 166, useNativeDriver: true }),
          ])
        ).start();
        break;

      case 'float':
        Animated.loop(
          Animated.sequence([
            Animated.timing(translateYAnim, {
              toValue: -10,
              duration: 1000,
              useNativeDriver: true,
              easing: Easing.inOut(Easing.ease),
            }),
            Animated.timing(translateYAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
              easing: Easing.inOut(Easing.ease),
            }),
          ])
        ).start();
        break;

      case 'pop':
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 150,
            useNativeDriver: true,
            easing: Easing.out(Easing.back(2)),
          }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();
        break;

      case 'wave':
        Animated.loop(
          Animated.sequence([
            Animated.timing(rotateAnim, { toValue: 0.35, duration: 250, useNativeDriver: true }),
            Animated.timing(rotateAnim, { toValue: -0.35, duration: 500, useNativeDriver: true }),
            Animated.timing(rotateAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
          ])
        ).start();
        break;

      case 'zoom':
        Animated.loop(
          Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 1.1, duration: 500, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          ])
        ).start();
        break;

      case 'flip':
        Animated.loop(
          Animated.timing(rotateYAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
            easing: Easing.linear,
          })
        ).start();
        break;

      case 'swing':
        Animated.sequence([
          Animated.timing(rotateAnim, { toValue: 0.26, duration: 166, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: -0.175, duration: 166, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: 0.087, duration: 166, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: -0.087, duration: 166, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: 0, duration: 166, useNativeDriver: true }),
        ]).start();
        break;

      case 'jello':
        Animated.sequence([
          Animated.timing(scaleXAnim, { toValue: 1.25, duration: 142, useNativeDriver: true }),
          Animated.timing(scaleXAnim, { toValue: 0.75, duration: 142, useNativeDriver: true }),
          Animated.timing(scaleXAnim, { toValue: 1.15, duration: 142, useNativeDriver: true }),
          Animated.timing(scaleXAnim, { toValue: 0.95, duration: 142, useNativeDriver: true }),
          Animated.timing(scaleXAnim, { toValue: 1.05, duration: 142, useNativeDriver: true }),
          Animated.timing(scaleXAnim, { toValue: 1, duration: 142, useNativeDriver: true }),
        ]).start();
        break;

      case 'heartbeat':
        Animated.loop(
          Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 1.3, duration: 150, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1.3, duration: 150, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1, duration: 1050, useNativeDriver: true }),
          ])
        ).start();
        break;

      case 'flash':
        Animated.loop(
          Animated.sequence([
            Animated.timing(opacityAnim, { toValue: 0.5, duration: 250, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 0.5, duration: 250, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
          ])
        ).start();
        break;

      case 'rubberband':
        Animated.sequence([
          Animated.timing(scaleXAnim, { toValue: 1.25, duration: 142, useNativeDriver: true }),
          Animated.timing(scaleXAnim, { toValue: 0.75, duration: 142, useNativeDriver: true }),
          Animated.timing(scaleXAnim, { toValue: 1.15, duration: 142, useNativeDriver: true }),
          Animated.timing(scaleXAnim, { toValue: 0.95, duration: 142, useNativeDriver: true }),
          Animated.timing(scaleXAnim, { toValue: 1.05, duration: 142, useNativeDriver: true }),
          Animated.timing(scaleXAnim, { toValue: 1, duration: 142, useNativeDriver: true }),
        ]).start();
        break;

      case 'spin':
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
            easing: Easing.linear,
          })
        ).start();
        break;

      case 'none':
      default:
        break;
    }

    return () => {
      anims.forEach((anim) => anim.stopAnimation());
    };
  }, [sticker.animation]);

  // Interpolations
  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const rotationY = rotateYAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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
          {
            transform: [
              { scale: scaleAnim },
              { scaleX: scaleXAnim },
              { rotate: rotation },
              { rotateY: rotationY },
              { translateX: translateXAnim },
              { translateY: translateYAnim },
            ],
            opacity: opacityAnim,
          },
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
