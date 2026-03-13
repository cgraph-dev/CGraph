/**
 * MessageGroup — groups consecutive messages from the same author (Messenger-style).
 * @module components/chat/message-group
 */
import React, { memo, type ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Avatar from '../ui/avatar';
import { space } from '../../theme/tokens';

interface Author {
  id: string;
  name: string;
  avatarUrl?: string;
  color?: string;
}

interface MessageGroupProps {
  author: Author;
  timestamp: string;
  isOwnMessage?: boolean;
  children: ReactNode;
}

/**
 * MessageGroup — first message shows avatar + name + time; subsequent
 * messages are indented with no header (same 5-min window logic).
 */
export const MessageGroup = memo(function MessageGroup({
  author,
  timestamp,
  isOwnMessage = false,
  children,
}: MessageGroupProps) {
  if (isOwnMessage) {
    return (
      <View style={styles.ownGroup}>
        <View style={styles.ownHeader}>
          <Text style={styles.timestamp}>{timestamp}</Text>
        </View>
        <View style={styles.ownMessages}>{children}</View>
      </View>
    );
  }

  return (
    <View style={styles.otherGroup}>
      <Avatar size="sm" name={author.name} src={author.avatarUrl} />
      <View style={styles.otherContent}>
        <View style={styles.otherHeader}>
          <Text style={[styles.authorName, author.color ? { color: author.color } : undefined]}>
            {author.name}
          </Text>
          <Text style={styles.timestamp}>{timestamp}</Text>
        </View>
        <View style={styles.otherMessages}>{children}</View>
      </View>
    </View>
  );
});

/**
 * GroupedMessage — continuation message within a group (no avatar/name).
 */
interface GroupedMessageProps {
  children: ReactNode;
  isOwnMessage?: boolean;
}

export const GroupedMessage = memo(function GroupedMessage({
  children,
  isOwnMessage = false,
}: GroupedMessageProps) {
  return <View style={isOwnMessage ? styles.ownGrouped : styles.otherGrouped}>{children}</View>;
});

const styles = StyleSheet.create({
  // Other's messages (left-aligned with avatar)
  otherGroup: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[2],
    paddingHorizontal: space[3],
    paddingVertical: space[0.5],
    marginTop: space[3],
  },
  otherContent: {
    flex: 1,
    gap: space[0.5],
  },
  otherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  otherMessages: {
    gap: space[0.5],
  },
  otherGrouped: {
    paddingLeft: space[3] + 36 + space[2], // avatar column offset
    paddingRight: space[3],
    paddingVertical: 1,
  },

  // Own messages (right-aligned)
  ownGroup: {
    alignItems: 'flex-end',
    paddingHorizontal: space[3],
    paddingVertical: space[0.5],
    marginTop: space[3],
  },
  ownHeader: {
    marginBottom: space[0.5],
  },
  ownMessages: {
    alignItems: 'flex-end',
    gap: space[0.5],
  },
  ownGrouped: {
    alignItems: 'flex-end',
    paddingHorizontal: space[3],
    paddingVertical: 1,
  },

  authorName: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  timestamp: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
  },
});

export default MessageGroup;
