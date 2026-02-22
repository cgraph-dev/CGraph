/**
 * MorphingGroupCard Component
 *
 * Group card with 3D perspective, magnetic effects, and animations.
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  PanResponder,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../../../components/ui/glass-card';
import type { MorphingGroupCardProps } from '../types';
import { FloatingParticles } from './floating-particles';
import { MemberAvatarStack } from './member-avatar-stack';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function MorphingGroupCard({
  item,
  index,
  onPress,
  colors,
  isDark,
}: MorphingGroupCardProps) {
  // Entry animations
  const slideAnim = useRef(new Animated.Value(80)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const rotateYAnim = useRef(new Animated.Value(-15)).current;

  // Interactive animations
  const tiltX = useRef(new Animated.Value(0)).current;
  const tiltY = useRef(new Animated.Value(0)).current;
  const magnetScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const arrowTranslate = useRef(new Animated.Value(0)).current;

  // Icon morph animation for active groups
  const iconMorphScale = useRef(new Animated.Value(1)).current;
  const iconMorphRotate = useRef(new Animated.Value(0)).current;

  const memberCount = item.member_count || 0;
  const isLargeGroup = memberCount > 100;
  const isActiveGroup = memberCount > 50;

  useEffect(() => {
    // Staggered entry with 3D flip
    const delay = index * 80;

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 50,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(rotateYAnim, {
        toValue: 0,
        duration: 600,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous subtle animation for active groups
    if (isActiveGroup) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(iconMorphScale, {
            toValue: 1.1,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(iconMorphScale, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(iconMorphRotate, {
            toValue: 5,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(iconMorphRotate, {
            toValue: -5,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [
    index,
    isActiveGroup,
    slideAnim,
    fadeAnim,
    scaleAnim,
    rotateYAnim,
    iconMorphScale,
    iconMorphRotate,
  ]);

  // Pan responder for magnetic tilt effect
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => false,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const cardWidth = SCREEN_WIDTH - 32;
        const cardHeight = 90;

        // Calculate tilt based on touch position
        const tiltXValue = (locationY / cardHeight - 0.5) * 10;
        const tiltYValue = (locationX / cardWidth - 0.5) * -8;

        Animated.parallel([
          Animated.spring(tiltX, {
            toValue: tiltXValue,
            friction: 8,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.spring(tiltY, {
            toValue: tiltYValue,
            friction: 8,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.spring(magnetScale, {
            toValue: 1.02,
            friction: 8,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(arrowTranslate, {
            toValue: 5,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderRelease: () => {
        Animated.parallel([
          Animated.spring(tiltX, {
            toValue: 0,
            friction: 5,
            tension: 80,
            useNativeDriver: true,
          }),
          Animated.spring(tiltY, {
            toValue: 0,
            friction: 5,
            tension: 80,
            useNativeDriver: true,
          }),
          Animated.spring(magnetScale, {
            toValue: 1,
            friction: 5,
            tension: 80,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(arrowTranslate, {
            toValue: 0,
            friction: 5,
            tension: 80,
            useNativeDriver: true,
          }),
        ]).start();
      },
    })
  ).current;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Morphing press animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(iconRotate, {
          toValue: 15,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.spring(iconRotate, {
          toValue: 0,
          friction: 4,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    onPress();
  };

  // Transform interpolations
  const rotateX = tiltX.interpolate({
    inputRange: [-10, 10],
    outputRange: ['-10deg', '10deg'],
  });

  const rotateY = tiltY.interpolate({
    inputRange: [-10, 10],
    outputRange: ['-10deg', '10deg'],
  });

  const entryRotateY = rotateYAnim.interpolate({
    inputRange: [-15, 0],
    outputRange: ['-15deg', '0deg'],
  });

  const iconRotation = iconRotate.interpolate({
    inputRange: [0, 15],
    outputRange: ['0deg', '15deg'],
  });

  const iconMorphRotation = iconMorphRotate.interpolate({
    inputRange: [-5, 5],
    outputRange: ['-5deg', '5deg'],
  });

  return (
    <Animated.View
      style={[
        styles.groupItemWrapper,
        {
          opacity: fadeAnim,
          transform: [
            { perspective: 1000 },
            { translateX: slideAnim },
            { scale: Animated.multiply(scaleAnim, magnetScale) },
            { rotateY: entryRotateY },
            { rotateX: rotateX },
            { rotateY: rotateY },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity activeOpacity={1} onPress={handlePress}>
        {/* Glow effect layer */}
        <Animated.View
          style={[
            styles.glowLayer,
            {
              opacity: glowOpacity,
              backgroundColor: isActiveGroup ? '#8b5cf6' : '#10b981',
            },
          ]}
        />

        <GlassCard
          variant={isActiveGroup ? 'neon' : 'frosted'}
          intensity="subtle"
          style={styles.groupCard}
          glowColor={isActiveGroup ? '#8b5cf6' : undefined}
        >
          <View style={styles.groupInner}>
            {/* Floating particles for active groups */}
            <FloatingParticles isActive={isActiveGroup} />

            {/* Group Icon with morph animation */}
            <View style={styles.groupIconSection}>
              <Animated.View
                style={{
                  transform: [
                    { rotate: iconRotation },
                    { scale: iconMorphScale },
                    { rotate: iconMorphRotation },
                  ],
                }}
              >
                {item.icon_url ? (
                  <Image source={{ uri: item.icon_url }} style={styles.groupIconImage} />
                ) : (
                  <LinearGradient
                    colors={isLargeGroup ? ['#8b5cf6', '#ec4899'] : ['#10b981', '#059669']}
                    style={styles.groupIconPlaceholder}
                  >
                    <Text style={styles.groupIconText}>{item.name.charAt(0).toUpperCase()}</Text>
                  </LinearGradient>
                )}
              </Animated.View>

              {/* Animated active indicator */}
              {isActiveGroup && (
                <Animated.View
                  style={[
                    styles.activeIndicator,
                    {
                      transform: [{ scale: iconMorphScale }],
                    },
                  ]}
                >
                  <View style={styles.activeDot} />
                </Animated.View>
              )}
            </View>

            {/* Group Info */}
            <View style={styles.groupInfo}>
              <View style={styles.groupNameRow}>
                <Text style={[styles.groupName, { color: colors.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                {isLargeGroup && (
                  <Animated.View
                    style={{
                      transform: [{ scale: iconMorphScale }],
                    }}
                  >
                    <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.verifiedBadge}>
                      <Ionicons name="flame" size={10} color="#fff" />
                    </LinearGradient>
                  </Animated.View>
                )}
              </View>

              <View style={styles.groupMeta}>
                <MemberAvatarStack memberCount={memberCount} colors={colors} />
                <Text style={[styles.groupMembers, { color: colors.textSecondary }]}>
                  {memberCount.toLocaleString()} members
                </Text>
              </View>

              {item.description && (
                <Text
                  style={[styles.groupDescription, { color: colors.textTertiary }]}
                  numberOfLines={1}
                >
                  {item.description}
                </Text>
              )}
            </View>

            {/* Animated Arrow */}
            <Animated.View
              style={[
                styles.arrowContainer,
                {
                  transform: [{ translateX: arrowTranslate }],
                },
              ]}
            >
              <LinearGradient
                colors={isActiveGroup ? ['#8b5cf6', '#7c3aed'] : [colors.surface, colors.surface]}
                style={styles.arrowGradient}
              >
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={isActiveGroup ? '#fff' : colors.textTertiary}
                />
              </LinearGradient>
            </Animated.View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  groupItemWrapper: {
    marginBottom: 4,
  },
  glowLayer: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 18,
    opacity: 0.3,
  },
  groupCard: {
    borderRadius: 16,
    padding: 0,
    overflow: 'hidden',
  },
  groupInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  groupIconSection: {
    position: 'relative',
    marginRight: 14,
  },
  groupIconImage: {
    width: 52,
    height: 52,
    borderRadius: 14,
  },
  groupIconPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  groupIconText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 3,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  groupInfo: {
    flex: 1,
  },
  groupNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupMembers: {
    fontSize: 13,
  },
  groupDescription: {
    fontSize: 12,
    marginTop: 4,
  },
  arrowContainer: {
    marginLeft: 8,
  },
  arrowGradient: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
