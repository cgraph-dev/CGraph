import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Easing,
  Dimensions,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface OnlineUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  userGroup: string;
  userGroupColor: string | null;
  lastActivity: string;
  currentActivity: string | null;
}

interface MagneticUserCardProps {
  user: OnlineUser;
  index: number;
  onPress: () => void;
  scrollY: Animated.Value;
}

/**
 * MagneticUserCard - Interactive user card with tilt/parallax effects
 * Features magnetic hover effect and scroll-based parallax
 */
export function MagneticUserCard({ user, index, onPress, scrollY }: MagneticUserCardProps) {
  const slideAnim = useRef(new Animated.Value(100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const tiltX = useRef(new Animated.Value(0)).current;
  const tiltY = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const statusPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const delay = index * 60;

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
    ]).start();

    // Continuous status pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(statusPulse, {
          toValue: 1.4,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(statusPulse, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [index, slideAnim, fadeAnim, scaleAnim, statusPulse]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => false,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const cardWidth = SCREEN_WIDTH - 32;
        const cardHeight = 70;

        const tiltXValue = (locationY / cardHeight - 0.5) * 8;
        const tiltYValue = (locationX / cardWidth - 0.5) * -6;

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
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 150,
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
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();

        onPress();
      },
    })
  ).current;

  // Parallax effect based on scroll
  const parallaxTranslate = scrollY.interpolate({
    inputRange: [-100, 0, 100 * (index + 1)],
    outputRange: [20, 0, -10 * (index + 1) * 0.1],
    extrapolate: 'clamp',
  });

  const parallaxScale = scrollY.interpolate({
    inputRange: [0, 100 * (index + 1)],
    outputRange: [1, 0.98],
    extrapolate: 'clamp',
  });

  const rotateX = tiltX.interpolate({
    inputRange: [-8, 8],
    outputRange: ['-8deg', '8deg'],
  });

  const rotateY = tiltY.interpolate({
    inputRange: [-6, 6],
    outputRange: ['-6deg', '6deg'],
  });

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <Animated.View
      style={[
        styles.magneticCardWrapper,
        {
          opacity: fadeAnim,
          transform: [
            { perspective: 1000 },
            { translateY: Animated.add(slideAnim, parallaxTranslate) },
            { scale: Animated.multiply(scaleAnim, parallaxScale) },
            { rotateX: rotateX },
            { rotateY: rotateY },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.cardGlow,
          {
            opacity: glowAnim,
            backgroundColor: user.userGroupColor || '#10b981',
          },
        ]}
      />

      <BlurView intensity={30} tint="dark" style={styles.userItemEnhanced}>
        <View style={styles.userAvatar}>
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <LinearGradient
              colors={[user.userGroupColor || '#10b981', '#059669']}
              style={styles.avatarPlaceholder}
            >
              <Text style={styles.avatarInitial}>
                {(user.displayName || user.username)[0].toUpperCase()}
              </Text>
            </LinearGradient>
          )}

          {/* Animated online indicator */}
          <View style={styles.onlineIndicatorWrapper}>
            <Animated.View
              style={[styles.onlineIndicatorPulse, { transform: [{ scale: statusPulse }] }]}
            />
            <View style={styles.onlineIndicator} />
          </View>
        </View>

        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text
              style={[styles.userName, { color: user.userGroupColor || '#fff' }]}
              numberOfLines={1}
            >
              {user.displayName || user.username}
            </Text>
            <View style={styles.userGroupBadge}>
              <Text style={[styles.userGroupText, { color: user.userGroupColor || '#9ca3af' }]}>
                {user.userGroup}
              </Text>
            </View>
          </View>
          <View style={styles.userMetaRow}>
            {user.currentActivity && (
              <Text style={styles.userActivity} numberOfLines={1}>
                {user.currentActivity}
              </Text>
            )}
            <Text style={styles.userTime}>{getTimeAgo(user.lastActivity)}</Text>
          </View>
        </View>

        {/* Activity indicator */}
        <View style={styles.activityIndicator}>
          <Ionicons name="chevron-forward" size={18} color="#6b7280" />
        </View>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  magneticCardWrapper: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 18,
    opacity: 0.3,
  },
  userItemEnhanced: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  userAvatar: {
    width: 48,
    height: 48,
    marginRight: 12,
    position: 'relative',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  onlineIndicatorWrapper: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicatorPulse: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(16, 185, 129, 0.4)',
  },
  onlineIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#111827',
  },
  userInfo: {
    flex: 1,
    marginRight: 8,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    marginRight: 8,
  },
  userGroupBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  userGroupText: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  userMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userActivity: {
    fontSize: 12,
    color: '#9ca3af',
    marginRight: 8,
    flex: 1,
  },
  userTime: {
    fontSize: 11,
    color: '#6b7280',
  },
  activityIndicator: {
    opacity: 0.5,
  },
});
