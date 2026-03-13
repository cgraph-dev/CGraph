/**
 * ReplyPreview — compact preview of replied-to message above bubble.
 * @module components/chat/reply-preview
 */
import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import Avatar from '../ui/avatar';
import { space, radius } from '../../theme/tokens';

interface ReplyPreviewProps {
  authorName: string;
  authorAvatar?: string;
  content: string;
  onPress?: () => void;
}

/**
 * ReplyPreview — compact pill showing replied-to message.
 * Tap to scroll to original message.
 */
export const ReplyPreview = memo(function ReplyPreview({
  authorName,
  authorAvatar,
  content,
  onPress,
}: ReplyPreviewProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      <View style={styles.accentBar} />
      <Avatar size="xs" name={authorName} src={authorAvatar} />
      <View style={styles.textColumn}>
        <Text style={styles.authorName} numberOfLines={1}>
          {authorName}
        </Text>
        <Text style={styles.content} numberOfLines={1}>
          {content}
        </Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1.5],
    paddingVertical: space[1],
    paddingHorizontal: space[2],
    marginBottom: space[0.5],
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  accentBar: {
    width: 2,
    height: 28,
    borderRadius: 1,
    backgroundColor: '#7C3AED',
  },
  textColumn: {
    flex: 1,
    gap: 1,
  },
  authorName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7C3AED',
  },
  content: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
});

export default ReplyPreview;
