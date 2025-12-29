import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import Avatar from './Avatar';
import { UserBasic } from '../types';

interface UserListItemProps {
  /** User data */
  user: UserBasic;
  /** Subtitle text */
  subtitle?: string;
  /** Right side content */
  rightContent?: React.ReactNode;
  /** Press handler */
  onPress?: () => void;
  /** Long press handler */
  onLongPress?: () => void;
  /** Show status indicator */
  showStatus?: boolean;
  /** Additional styles */
  style?: ViewStyle;
}

export default function UserListItem({
  user,
  subtitle,
  rightContent,
  onPress,
  onLongPress,
  showStatus = true,
  style,
}: UserListItemProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={!onPress && !onLongPress}
      activeOpacity={0.7}
      style={[styles.container, { backgroundColor: colors.surface }, style]}
    >
      <Avatar
        source={user.avatar_url}
        name={user.display_name || user.username}
        size="md"
        status={showStatus ? (user.status as 'online' | 'idle' | 'dnd' | 'offline') : undefined}
        showStatus={showStatus}
      />
      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {user.display_name || user.username}
        </Text>
        {subtitle && (
          <Text
            style={[styles.subtitle, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {rightContent && <View style={styles.rightContent}>{rightContent}</View>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  rightContent: {
    marginLeft: 12,
  },
});
