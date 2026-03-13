/**
 * MessageBubble — Messenger-style chat bubble with connected corners.
 * @module components/chat/message-bubble
 */
import React, { memo, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, _Linking, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { space, radius } from '../../theme/tokens';

type BubblePosition = 'single' | 'first' | 'middle' | 'last';

interface MessageBubbleProps {
  content: string;
  isOwnMessage?: boolean;
  /** Position in a consecutive group for connected-corner styling */
  position?: BubblePosition;
  isEdited?: boolean;
  onLongPress?: () => void;
  style?: ViewStyle;
}

const BRAND_GRADIENT = ['#7C3AED', '#6D28D9'] as const;

/**
 * MessageBubble — rounded Messenger-style bubble.
 * Own messages: right, brand gradient.
 * Others: left, dark glass.
 * Connected corners reduce radius on consecutive messages from same sender.
 */
export const MessageBubble = memo(function MessageBubble({
  content,
  isOwnMessage = false,
  position = 'single',
  isEdited = false,
  onLongPress,
  style,
}: MessageBubbleProps) {
  const handleLongPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress?.();
  }, [onLongPress]);

  const bubbleRadius = getBubbleRadius(isOwnMessage, position);

  const bubbleStyle: ViewStyle = {
    ...styles.bubble,
    ...bubbleRadius,
    ...(isOwnMessage ? styles.ownBubble : styles.otherBubble),
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    ...(style as object),
  };

  const inner = (
    <>
      <Text style={isOwnMessage ? styles.ownText : styles.otherText}>{content}</Text>
      {isEdited && <Text style={styles.editedLabel}>(edited)</Text>}
    </>
  );

  return (
    <Pressable
      onLongPress={handleLongPress}
      delayLongPress={400}
      style={({ pressed }) => [bubbleStyle, pressed && styles.pressed]}
    >
      {isOwnMessage ? (
        <LinearGradient
          colors={[...BRAND_GRADIENT]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, bubbleRadius]}
        >
          {inner}
        </LinearGradient>
      ) : (
        <View style={styles.innerPad}>{inner}</View>
      )}
    </Pressable>
  );
});

/** Compute border radii for connected-corner effect */
function getBubbleRadius(isOwn: boolean, position: BubblePosition) {
  const full = radius.xl; // 16
  const small = radius.sm; // 4

  // Which corner connects to the next/prev bubble
  if (isOwn) {
    // Right side connects
    switch (position) {
      case 'first':
        return {
          borderTopLeftRadius: full,
          borderTopRightRadius: full,
          borderBottomLeftRadius: full,
          borderBottomRightRadius: small,
        };
      case 'middle':
        return {
          borderTopLeftRadius: full,
          borderTopRightRadius: small,
          borderBottomLeftRadius: full,
          borderBottomRightRadius: small,
        };
      case 'last':
        return {
          borderTopLeftRadius: full,
          borderTopRightRadius: small,
          borderBottomLeftRadius: full,
          borderBottomRightRadius: full,
        };
      default: // single
        return {
          borderTopLeftRadius: full,
          borderTopRightRadius: full,
          borderBottomLeftRadius: full,
          borderBottomRightRadius: full,
        };
    }
  } else {
    // Left side connects
    switch (position) {
      case 'first':
        return {
          borderTopLeftRadius: full,
          borderTopRightRadius: full,
          borderBottomLeftRadius: small,
          borderBottomRightRadius: full,
        };
      case 'middle':
        return {
          borderTopLeftRadius: small,
          borderTopRightRadius: full,
          borderBottomLeftRadius: small,
          borderBottomRightRadius: full,
        };
      case 'last':
        return {
          borderTopLeftRadius: full,
          borderTopRightRadius: full,
          borderBottomLeftRadius: full,
          borderBottomRightRadius: full,
        };
      default:
        return {
          borderTopLeftRadius: full,
          borderTopRightRadius: full,
          borderBottomLeftRadius: full,
          borderBottomRightRadius: full,
        };
    }
  }
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '80%',
    overflow: 'hidden',
  },
  ownBubble: {
    alignSelf: 'flex-end',
  },
  otherBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  gradient: {
    paddingHorizontal: space[3],
    paddingVertical: space[2],
  },
  innerPad: {
    paddingHorizontal: space[3],
    paddingVertical: space[2],
  },
  ownText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  otherText: {
    fontSize: 15,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.85)',
  },
  editedLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 2,
  },
  pressed: {
    opacity: 0.85,
  },
});

export default MessageBubble;
