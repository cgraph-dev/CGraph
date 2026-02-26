import { durations } from '@cgraph/animation-constants';
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions, PanResponder } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback, SpringPresets } from '@/lib/animations/animation-engine';
import { RARITY_CONFIG, type AchievementNotificationData, type Achievement } from '../types';
import { useParticleSystem } from '../use-particle-system';
import { styles, NOTIFICATION_WIDTH, AUTO_DISMISS_DURATION } from '../styles';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface Props {
  data: AchievementNotificationData;
  index: number;
  onDismiss: () => void;
  onViewDetails?: (achievement: Achievement) => void;
}

export function AchievementToast({ data, index, onDismiss, onViewDetails }: Props) {
  const { achievement, isUnlock } = data;
  const config = RARITY_CONFIG[achievement.rarity];

  const translateX = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const dismissProgress = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const { particles, renderKey } = useParticleSystem(
    config.particleCount, [...config.colors, '#ffffff'], isUnlock
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 10,
      onPanResponderMove: (_, gs) => { if (gs.dx > 0) translateX.setValue(gs.dx); },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx > NOTIFICATION_WIDTH * 0.3 || gs.vx > 0.5) {
          HapticFeedback.light();
          Animated.timing(translateX, { toValue: SCREEN_WIDTH, duration: durations.normal.ms, useNativeDriver: true }).start(() => onDismiss());
        } else {
          Animated.spring(translateX, { toValue: 0, ...SpringPresets.snappy, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (isUnlock) { HapticFeedback.celebration(); } else { HapticFeedback.light(); }

    Animated.parallel([
      Animated.spring(translateX, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 100, friction: 10, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: durations.normal.ms, useNativeDriver: true }),
    ]).start();

    const targetProgress = (achievement.progress / achievement.maxProgress) * 100;
    Animated.timing(progressAnim, { toValue: targetProgress, duration: durations.verySlow.ms, useNativeDriver: false }).start();

    if (isUnlock) {
      Animated.loop(Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: durations.verySlow.ms, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: durations.verySlow.ms, useNativeDriver: false }),
      ])).start();
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 5, duration: durations.stagger.ms, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -5, duration: durations.stagger.ms, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 5, duration: durations.stagger.ms, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: durations.stagger.ms, useNativeDriver: true }),
      ]).start();
    }

    Animated.timing(dismissProgress, { toValue: 100, duration: AUTO_DISMISS_DURATION, useNativeDriver: false }).start(() => onDismiss());
    return () => { dismissProgress.stopAnimation(); };
  }, []);

  const progressWidth = progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  const dismissWidth = dismissProgress.interpolate({ inputRange: [0, 100], outputRange: ['100%', '0%'] });
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] });

  return (
    <Animated.View {...panResponder.panHandlers} style={[styles.toastContainer, {
      transform: [{ translateX }, { translateY: Animated.add(translateY, Animated.multiply(index, 8)) }, { scale }, { translateX: shakeAnim }],
      opacity, zIndex: 100 - index,
    }]}>
      {isUnlock && <Animated.View style={[styles.glowOverlay, { opacity: glowOpacity, backgroundColor: config.glowColor }]} />}
      <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
        <LinearGradient colors={[...config.colors, 'rgba(0,0,0,0.8)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientBorder}>
          <View style={styles.innerContainer}>
            <View style={styles.iconSection}>
              <View style={[styles.iconContainer, { backgroundColor: config.colors[0] + '30' }]}>
                <Ionicons name={isUnlock ? 'trophy' : config.iconName} size={28} color={config.colors[0]} />
              </View>
              {isUnlock && particles.map((particle) => (
                <Animated.View key={`${renderKey}-${particle.id}`} style={[styles.particle, {
                  backgroundColor: particle.color,
                  transform: [{ translateX: particle.x }, { translateY: particle.y }, { scale: particle.scale },
                    { rotate: particle.rotation.interpolate({ inputRange: [-4, 4], outputRange: ['-180deg', '180deg'] }) }],
                  opacity: particle.opacity,
                }]} />
              ))}
            </View>
            <View style={styles.contentSection}>
              <View style={styles.header}>
                <Text style={[styles.rarityBadge, { color: config.colors[0] }]}>{achievement.rarity.toUpperCase()}</Text>
                {isUnlock && (
                  <View style={styles.xpBadge}>
                    <Ionicons name="star" size={12} color="#f59e0b" />
                    <Text style={styles.xpText}>+{achievement.xpReward} XP</Text>
                  </View>
                )}
              </View>
              <Text style={styles.title} numberOfLines={1}>{isUnlock ? '🎉 Achievement Unlocked!' : achievement.name}</Text>
              <Text style={styles.description} numberOfLines={2}>{isUnlock ? achievement.name : achievement.description}</Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressBackground}>
                  <Animated.View style={[styles.progressFill, { width: progressWidth, backgroundColor: config.colors[0] }]} />
                </View>
                <Text style={styles.progressText}>{achievement.progress}/{achievement.maxProgress}</Text>
              </View>
            </View>
            <View style={styles.actionSection}>
              <TouchableOpacity onPress={() => { HapticFeedback.light(); onViewDetails?.(achievement); }} style={styles.viewButton}>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                HapticFeedback.light();
                Animated.timing(translateX, { toValue: SCREEN_WIDTH, duration: durations.normal.ms, useNativeDriver: true }).start(() => onDismiss());
              }} style={styles.closeButton}>
                <Ionicons name="close" size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>
          <Animated.View style={[styles.dismissProgressBar, { width: dismissWidth, backgroundColor: config.colors[0] }]} />
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );
}
