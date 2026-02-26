/**
 * SwipeableMessage Component - Next-Gen Message Interactions
 * Swipe to reply, long-press for context menu, haptic feedback
 */

import { durations } from '@cgraph/animation-constants';
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimationColors, HapticFeedback } from '@/lib/animations/animation-engine';

interface SwipeableMessageProps {
  messageId: string;
  content: string;
  isMine: boolean;
  timestamp: string;
  senderName?: string;
  senderAvatar?: string;
  onReply?: (messageId: string) => void;
  onLongPress?: (messageId: string) => void;
  showReactions?: boolean;
  reactions?: Array<{ emoji: string; count: number; users: string[] }>;
  style?: ViewStyle;
}

/**
 *
 */
export default function SwipeableMessage({
  messageId,
  content,
  isMine,
  timestamp,
  senderName,
  onReply,
  onLongPress,
  showReactions = false,
  reactions = [],
  style,
}: SwipeableMessageProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const replyIconOpacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const [isLongPressing, setIsLongPressing] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const SWIPE_THRESHOLD = 60;
  const MAX_SWIPE = 100;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only start pan if horizontal movement is greater than vertical
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },

      onPanResponderGrant: () => {
        // Start long press timer
        longPressTimer.current = setTimeout(() => {
          setIsLongPressing(true);
          HapticFeedback.longPressConfirm();

          // Scale animation for long press
          Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
          }).start();

          if (onLongPress) {
            onLongPress(messageId);
          }
        }, 500);
      },

      onPanResponderMove: (_, gestureState) => {
        // Clear long press timer if user starts swiping
        if (Math.abs(gestureState.dx) > 10 && longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }

        // Swipe logic - only allow swipe in correct direction
        const direction = isMine ? -1 : 1; // Swipe left for my messages, right for others
        const dx = gestureState.dx * direction;

        if (dx > 0) {
          // Clamp swipe distance
          const clampedDx = Math.min(dx, MAX_SWIPE);
          translateX.setValue(clampedDx * direction);

          // Fade in reply icon
          const opacity = Math.min(clampedDx / SWIPE_THRESHOLD, 1);
          replyIconOpacity.setValue(opacity);

          // Haptic feedback at threshold
          if (clampedDx >= SWIPE_THRESHOLD && clampedDx < SWIPE_THRESHOLD + 5) {
            HapticFeedback.medium();
          }
        }
      },

      onPanResponderRelease: (_, gestureState) => {
        // Clear long press timer
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }

        // Reset scale
        if (isLongPressing) {
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
          }).start();
          setIsLongPressing(false);
        }

        const direction = isMine ? -1 : 1;
        const dx = gestureState.dx * direction;

        // Check if swipe threshold was met
        if (dx >= SWIPE_THRESHOLD && onReply) {
          HapticFeedback.success();
          onReply(messageId);
        }

        // Animate back to original position
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 180,
            friction: 20,
          }),
          Animated.timing(replyIconOpacity, {
            toValue: 0,
            duration: durations.normal.ms,
            useNativeDriver: true,
          }),
        ]).start();
      },
    })
  ).current;

  return (
    <View style={[styles.container, isMine ? styles.myMessage : styles.theirMessage, style]}>
      {/* Reply icon indicator */}
      <Animated.View
        style={[
          styles.replyIcon,
          isMine ? styles.replyIconLeft : styles.replyIconRight,
          {
            opacity: replyIconOpacity,
          },
        ]}
      >
        <Text style={styles.replyIconText}>↩️</Text>
      </Animated.View>

      {/* Message bubble */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          {
            transform: [
              { translateX },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() => HapticFeedback.light()}
        >
          {isMine ? (
            // My message - gradient background
            <LinearGradient
              colors={[AnimationColors.primary, AnimationColors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.messageBubble, styles.myMessageBubble]}
            >
              <Text style={styles.messageText}>{content}</Text>
              <Text style={styles.timestamp}>{timestamp}</Text>
            </LinearGradient>
          ) : (
            // Their message - solid background
            <View style={[styles.messageBubble, styles.theirMessageBubble]}>
              {senderName && (
                <Text style={styles.senderName}>{senderName}</Text>
              )}
              <Text style={[styles.messageText, styles.theirMessageText]}>{content}</Text>
              <Text style={[styles.timestamp, styles.theirTimestamp]}>{timestamp}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Reactions */}
        {showReactions && reactions.length > 0 && (
          <View style={[styles.reactions, isMine ? styles.myReactions : styles.theirReactions]}>
            {reactions.slice(0, 3).map((reaction, i) => (
              <View key={i} style={styles.reaction}>
                <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                {reaction.count > 1 && (
                  <Text style={styles.reactionCount}>{reaction.count}</Text>
                )}
              </View>
            ))}
            {reactions.length > 3 && (
              <Text style={styles.moreReactions}>+{reactions.length - 3}</Text>
            )}
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 16,
    position: 'relative',
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  theirMessage: {
    alignItems: 'flex-start',
  },
  replyIcon: {
    position: 'absolute',
    top: '50%',
    marginTop: -15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  replyIconLeft: {
    left: 8,
  },
  replyIconRight: {
    right: 8,
  },
  replyIconText: {
    fontSize: 20,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  myMessageBubble: {
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    backgroundColor: AnimationColors.dark700,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    color: AnimationColors.white,
  },
  theirMessageText: {
    color: AnimationColors.gray300,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  theirTimestamp: {
    color: AnimationColors.gray500,
  },
  senderName: {
    fontSize: 13,
    fontWeight: '600',
    color: AnimationColors.primary,
    marginBottom: 4,
  },
  reactions: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  myReactions: {
    justifyContent: 'flex-end',
  },
  theirReactions: {
    justifyContent: 'flex-start',
  },
  reaction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AnimationColors.dark600,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 11,
    color: AnimationColors.gray400,
    fontWeight: '600',
  },
  moreReactions: {
    fontSize: 11,
    color: AnimationColors.gray500,
    alignSelf: 'center',
    paddingHorizontal: 6,
  },
});
