/**
 * RequestCard Component
 *
 * Swipeable friend request card with animations.
 */

import { durations } from '@cgraph/animation-constants';
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
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
import AnimatedAvatar from '../../../../components/ui/animated-avatar';
import { getValidImageUrl } from '../../../../lib/imageUtils';
import { type RequestCardProps, formatTimeAgo } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Request Card component.
 *
 */
export function RequestCard({
  item,
  index,
  onAccept,
  onDecline,
  processingId,
  isIncoming,
}: RequestCardProps) {
  // Entry animations
  const entryAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Swipe animations
  const swipeX = useRef(new Animated.Value(0)).current;
  const acceptBgOpacity = useRef(new Animated.Value(0)).current;
  const declineBgOpacity = useRef(new Animated.Value(0)).current;
  const actionIconScale = useRef(new Animated.Value(0.5)).current;

  // Press animations
  const pressScale = useRef(new Animated.Value(1)).current;
  const acceptScale = useRef(new Animated.Value(1)).current;
  const declineScale = useRef(new Animated.Value(1)).current;

  // Avatar glow animation
  const avatarGlow = useRef(new Animated.Value(0)).current;

  const SWIPE_THRESHOLD = 100;

  useEffect(() => {
    // Staggered entry with bounce
    const delay = index * 80;

    Animated.parallel([
      Animated.timing(entryAnim, {
        toValue: 1,
        duration: durations.dramatic.ms,
        delay,
        easing: Easing.out(Easing.back(1.7)),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: durations.smooth.ms,
        delay,
        useNativeDriver: true,
      }),
    ]).start();

    // Avatar glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(avatarGlow, {
          toValue: 1,
          duration: durations.ambient.ms,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(avatarGlow, {
          toValue: 0,
          duration: durations.ambient.ms,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [index, entryAnim, fadeAnim, avatarGlow]);

  // Pan responder for swipe gestures (only for incoming requests)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          isIncoming &&
          Math.abs(gestureState.dx) > 15 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
        );
      },
      onPanResponderGrant: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (_, gestureState) => {
        const clampedX = Math.max(-150, Math.min(150, gestureState.dx));
        swipeX.setValue(clampedX);

        // Show action backgrounds
        if (gestureState.dx > 20) {
          // Swiping right - Accept
          const progress = Math.min(1, gestureState.dx / SWIPE_THRESHOLD);
          acceptBgOpacity.setValue(progress);
          declineBgOpacity.setValue(0);
          actionIconScale.setValue(0.5 + progress * 0.5);
        } else if (gestureState.dx < -20) {
          // Swiping left - Decline
          const progress = Math.min(1, Math.abs(gestureState.dx) / SWIPE_THRESHOLD);
          declineBgOpacity.setValue(progress);
          acceptBgOpacity.setValue(0);
          actionIconScale.setValue(0.5 + progress * 0.5);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          // Accept
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Animated.timing(swipeX, {
            toValue: SCREEN_WIDTH,
            duration: 250,
            useNativeDriver: true,
          }).start(() => onAccept(item.id));
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          // Decline
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          Animated.timing(swipeX, {
            toValue: -SCREEN_WIDTH,
            duration: 250,
            useNativeDriver: true,
          }).start(() => onDecline(item.id));
        } else {
          // Snap back
          Animated.spring(swipeX, {
            toValue: 0,
            tension: 100,
            friction: 10,
            useNativeDriver: true,
          }).start();
        }

        // Reset backgrounds
        Animated.parallel([
          Animated.timing(acceptBgOpacity, {
            toValue: 0,
            duration: durations.normal.ms,
            useNativeDriver: true,
          }),
          Animated.timing(declineBgOpacity, {
            toValue: 0,
            duration: durations.normal.ms,
            useNativeDriver: true,
          }),
          Animated.timing(actionIconScale, {
            toValue: 0.5,
            duration: durations.normal.ms,
            useNativeDriver: true,
          }),
        ]).start();
      },
    })
  ).current;

  const handleAcceptPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(acceptScale, {
        toValue: 0.85,
        duration: durations.instant.ms,
        useNativeDriver: true,
      }),
      Animated.timing(acceptScale, {
        toValue: 1.1,
        duration: durations.instant.ms,
        useNativeDriver: true,
      }),
      Animated.timing(acceptScale, {
        toValue: 1,
        duration: durations.instant.ms,
        useNativeDriver: true,
      }),
    ]).start(() => onAccept(item.id));
  };

  const handleDeclinePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(declineScale, {
        toValue: 0.85,
        duration: durations.instant.ms,
        useNativeDriver: true,
      }),
      Animated.timing(declineScale, {
        toValue: 1.1,
        duration: durations.instant.ms,
        useNativeDriver: true,
      }),
      Animated.timing(declineScale, {
        toValue: 1,
        duration: durations.instant.ms,
        useNativeDriver: true,
      }),
    ]).start(() => onDecline(item.id));
  };

  const displayName = item.user.display_name || item.user.username || 'Unknown';
  const handle = item.user.username || item.user.id?.slice(0, 8) || 'unknown';
  const isProcessing = processingId === item.id;
  const avatarUrl = getValidImageUrl(item.user.avatar_url);

  const entryTranslateX = entryAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0],
  });

  const entryScale = entryAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  const cardRotate = swipeX.interpolate({
    inputRange: [-150, 0, 150],
    outputRange: ['-3deg', '0deg', '3deg'],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.requestCard,
        {
          opacity: fadeAnim,
          transform: [{ translateX: entryTranslateX }, { scale: entryScale }],
        },
      ]}
    >
      {/* Swipe action backgrounds */}
      {isIncoming && (
        <View style={styles.swipeActionsContainer}>
          {/* Accept background (right swipe) */}
          <Animated.View
            style={[styles.swipeActionBg, styles.acceptActionBg, { opacity: acceptBgOpacity }]}
          >
            <Animated.View style={{ transform: [{ scale: actionIconScale }] }}>
              <Ionicons name="checkmark-circle" size={32} color="#FFF" />
            </Animated.View>
            <Text style={styles.swipeActionLabel}>Accept</Text>
          </Animated.View>

          {/* Decline background (left swipe) */}
          <Animated.View
            style={[styles.swipeActionBg, styles.declineActionBg, { opacity: declineBgOpacity }]}
          >
            <Animated.View style={{ transform: [{ scale: actionIconScale }] }}>
              <Ionicons name="close-circle" size={32} color="#FFF" />
            </Animated.View>
            <Text style={styles.swipeActionLabel}>Decline</Text>
          </Animated.View>
        </View>
      )}

      {/* Main card */}
      <Animated.View
        style={[
          styles.swipeableCardWrapper,
          {
            transform: [{ translateX: swipeX }, { rotate: cardRotate }, { scale: pressScale }],
          },
        ]}
        {...(isIncoming ? panResponder.panHandlers : {})}
      >
        <GlassCard variant="neon" intensity="subtle" style={styles.cardInner}>
          {/* Avatar with glow */}
          <View style={styles.avatarContainer}>
            <Animated.View
              style={[
                styles.avatarGlow,
                {
                  opacity: avatarGlow,
                  backgroundColor: isIncoming ? '#22C55E' : '#3B82F6',
                },
              ]}
            />
            <AnimatedAvatar
              source={
                avatarUrl
                  ? { uri: avatarUrl }
                  : {
                      uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=8B5CF6&color=fff&size=128`,
                    }
              }
              size={56}
              borderAnimation={isIncoming ? 'pulse' : 'gradient'}
              showStatus={true}
              isOnline={item.user.status === 'online'}
              glowIntensity={0.3}
            />
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={styles.displayName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.username} numberOfLines={1}>
              @{handle}
            </Text>
            {item.created_at && (
              <Text style={styles.timestamp}>{formatTimeAgo(item.created_at)}</Text>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {isIncoming ? (
              <>
                <Animated.View style={{ transform: [{ scale: acceptScale }] }}>
                  <TouchableOpacity
                    onPress={handleAcceptPress}
                    disabled={isProcessing}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#22C55E', '#10B981']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.actionButton, styles.acceptButton]}
                    >
                      <Ionicons name="checkmark" size={20} color="#FFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View style={{ transform: [{ scale: declineScale }] }}>
                  <TouchableOpacity
                    onPress={handleDeclinePress}
                    disabled={isProcessing}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.actionButton, styles.declineButton]}>
                      <Ionicons name="close" size={20} color="#EF4444" />
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              </>
            ) : (
              <Animated.View style={{ transform: [{ scale: declineScale }] }}>
                <TouchableOpacity
                  onPress={handleDeclinePress}
                  disabled={isProcessing}
                  activeOpacity={0.8}
                >
                  <View style={[styles.actionButton, styles.cancelButton]}>
                    <Ionicons name="close" size={18} color="#9CA3AF" />
                    <Text style={styles.cancelText}>Cancel</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>

          {/* Swipe hint for incoming */}
          {isIncoming && (
            <View style={styles.swipeHintContainer}>
              <Ionicons name="swap-horizontal" size={12} color="#6B7280" />
            </View>
          )}
        </GlassCard>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  requestCard: {
    marginBottom: 12,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F3F4F6',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#6B7280',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  declineButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(107, 114, 128, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(107, 114, 128, 0.3)',
    paddingHorizontal: 12,
    width: 'auto',
  },
  cancelText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginLeft: 4,
    fontWeight: '500',
  },
  swipeActionsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  swipeActionBg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  acceptActionBg: {
    backgroundColor: '#22C55E',
  },
  declineActionBg: {
    backgroundColor: '#EF4444',
  },
  swipeActionLabel: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  swipeableCardWrapper: {
    position: 'relative',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarGlow: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 34,
    opacity: 0.4,
  },
  swipeHintContainer: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    opacity: 0.5,
  },
});
