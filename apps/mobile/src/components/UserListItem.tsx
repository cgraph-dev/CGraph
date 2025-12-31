import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Animated,
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
  /** Animation delay for stagger effect */
  animationDelay?: number;
}

export default function UserListItem({
  user,
  subtitle,
  rightContent,
  onPress,
  onLongPress,
  showStatus = true,
  style,
  animationDelay = 0,
}: UserListItemProps) {
  const { colors } = useTheme();
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;
  const translateYValue = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 300,
        delay: animationDelay,
        useNativeDriver: true,
      }),
      Animated.timing(translateYValue, {
        toValue: 0,
        duration: 300,
        delay: animationDelay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [animationDelay]);

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={{
        opacity: opacityValue,
        transform: [{ translateY: translateYValue }, { scale: scaleValue }],
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!onPress && !onLongPress}
        activeOpacity={0.9}
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
    </Animated.View>
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
