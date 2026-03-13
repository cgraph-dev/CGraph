/**
 * SwipeableNotificationItem - Notification card with swipe gestures
 *
 * Features:
 * - Swipe left to delete
 * - Swipe right to mark as read
 * - Spring physics animations
 * - Staggered entry with bounce
 * - Haptic feedback
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../../../components/ui/glass-card';
import AnimatedAvatar from '../../../../components/ui/animated-avatar';
import { safeFormatDistanceToNow } from '../../../../lib/dateUtils';
import { typeGradients, typeIcons } from '../types';
import type { Notification } from '../types';
import { useSwipeableNotification } from '../hooks';

export interface SwipeableNotificationItemProps {
  item: Notification;
  index: number;
  colors: {
    text: string;
    textSecondary: string;
    textTertiary: string;
    surface: string;
  };
  onPress: () => void;
  onMarkRead: () => void;
  onDelete: () => void;
}

/**
 *
 */
export function SwipeableNotificationItem({
  item,
  index,
  colors,
  onPress,
  onMarkRead,
  onDelete,
}: SwipeableNotificationItemProps) {
  const {
    opacity,
    swipeX,
    actionScale,
    deleteOpacity,
    readOpacity,
    pressScale,
    glowOpacity,
    pulseAnim,
    entryTranslateY,
    entryScale,
    panResponder,
    handlePressIn,
    handlePressOut,
  } = useSwipeableNotification({
    index,
    isRead: item.read,
    onMarkRead,
    onDelete,
  });

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const wrapperStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: entryTranslateY.value }, { scale: entryScale.value }],
  }));

  const deleteActionStyle = useAnimatedStyle(() => ({
    opacity: deleteOpacity.value,
    transform: [{ scale: actionScale.value }],
  }));

  const readActionStyle = useAnimatedStyle(() => ({
    opacity: readOpacity.value,
    transform: [{ scale: actionScale.value }],
  }));

  const swipeableCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: swipeX.value }, { scale: pressScale.value }],
  }));

  const cardGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.wrapper,
        wrapperStyle,
      ]}
    >
      {/* Background actions */}
      <View style={styles.actionsContainer}>
        <Animated.View
          style={[
            styles.action,
            styles.deleteAction,
            deleteActionStyle,
          ]}
        >
          <Ionicons name="trash" size={24} color="#FFF" />
          <Text style={styles.actionText}>Delete</Text>
        </Animated.View>

        {!item.read && (
          <Animated.View
            style={[
              styles.action,
              styles.readAction,
              readActionStyle,
            ]}
          >
            <Ionicons name="checkmark-circle" size={24} color="#FFF" />
            <Text style={styles.actionText}>Mark Read</Text>
          </Animated.View>
        )}
      </View>

      {/* Main card */}
      <Animated.View
        style={[
          styles.swipeableCard,
          swipeableCardStyle,
        ]}
        {...panResponder.panHandlers}
      >
        <Animated.View
          style={[
            styles.cardGlow,
            { backgroundColor: typeGradients[item.type][0] },
            cardGlowStyle,
          ]}
        />

        <GlassCard
          variant={item.read ? 'frosted' : 'neon'}
          intensity={item.read ? 'subtle' : 'medium'}
          style={styles.card}
        >
          <TouchableOpacity
            style={styles.inner}
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
          >
            <LinearGradient
              colors={typeGradients[item.type]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconContainer}
            >
              <Ionicons name={typeIcons[item.type]} size={20} color="#fff" />
            </LinearGradient>

            <View style={styles.content}>
              <View style={styles.header}>
                <Text
                  style={[
                    styles.title,
                    { color: colors.text, fontWeight: item.read ? '500' : '700' },
                  ]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                {!item.read && (
                  <Animated.View style={pulseStyle}>
                    <LinearGradient
                      colors={['#3b82f6', '#8b5cf6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.unreadDot}
                    />
                  </Animated.View>
                )}
              </View>

              <Text style={[styles.body, { color: colors.textSecondary }]} numberOfLines={2}>
                {item.body}
              </Text>

              <View style={styles.footer}>
                <Text style={[styles.time, { color: colors.textTertiary }]}>
                  {safeFormatDistanceToNow(item.createdAt)}
                </Text>

                {item.sender?.avatarUrl && (
                  <View style={styles.senderInfo}>
                    <AnimatedAvatar
                      source={{ uri: item.sender.avatarUrl }}
                      size={20}
                      borderAnimation="none"
                    />
                    <Text style={[styles.senderName, { color: colors.textTertiary }]}>
                      {item.sender.username}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.swipeHint}>
              <Ionicons
                name={item.read ? 'trash-outline' : 'checkmark-circle-outline'}
                size={16}
                color={colors.textTertiary}
              />
            </View>
          </TouchableOpacity>
        </GlassCard>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  actionsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  action: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: '80%',
    borderRadius: 12,
  },
  deleteAction: {
    backgroundColor: '#EF4444',
    marginLeft: 'auto',
  },
  readAction: {
    backgroundColor: '#10B981',
    marginRight: 'auto',
  },
  actionText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  swipeableCard: {
    position: 'relative',
  },
  cardGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 20,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 15,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  time: {
    fontSize: 11,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  senderName: {
    fontSize: 11,
  },
  swipeHint: {
    marginLeft: 8,
    opacity: 0.5,
  },
});

export default SwipeableNotificationItem;
