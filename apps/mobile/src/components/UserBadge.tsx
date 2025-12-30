/**
 * UserBadge - Displays user identity with unique ID, username, and status badges
 * 
 * Features:
 * - Unique user ID display (#0001)
 * - Optional username (can be null for new users)
 * - Verification and premium badges
 * - Karma display
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface UserBadgeProps {
  userId?: number;
  userIdDisplay: string;
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  isVerified?: boolean;
  isPremium?: boolean;
  karma?: number;
  size?: 'sm' | 'md' | 'lg';
  showId?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function UserBadge({
  userIdDisplay,
  username,
  displayName,
  avatarUrl,
  isVerified = false,
  isPremium = false,
  karma = 0,
  size = 'md',
  showId = true,
  style,
}: UserBadgeProps) {
  const { colors } = useTheme();

  const sizeStyles = {
    sm: { avatar: 28, fontSize: 12, badgeSize: 14 },
    md: { avatar: 36, fontSize: 14, badgeSize: 16 },
    lg: { avatar: 48, fontSize: 16, badgeSize: 20 },
  };

  const currentSize = sizeStyles[size];
  const displayText = displayName || username || 'Anonymous';
  const initial = displayText.charAt(0).toUpperCase();

  return (
    <View style={[styles.container, style]}>
      {/* Avatar */}
      <View
        style={[
          styles.avatar,
          {
            width: currentSize.avatar,
            height: currentSize.avatar,
            backgroundColor: colors.primary,
          },
        ]}
      >
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={[styles.avatarImage, { width: currentSize.avatar, height: currentSize.avatar }]}
          />
        ) : (
          <Text style={[styles.avatarText, { fontSize: currentSize.fontSize }]}>
            {initial}
          </Text>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text
            style={[styles.name, { color: colors.text, fontSize: currentSize.fontSize }]}
            numberOfLines={1}
          >
            {displayText}
          </Text>
          
          {/* Badges */}
          {isVerified && (
            <View style={[styles.badge, { backgroundColor: colors.primary + '30' }]}>
              <Text style={[styles.badgeIcon, { fontSize: currentSize.badgeSize - 4 }]}>
                ✓
              </Text>
            </View>
          )}
          {isPremium && (
            <View style={[styles.badge, { backgroundColor: '#fbbf2430' }]}>
              <Text style={[styles.badgeIcon, { fontSize: currentSize.badgeSize - 4 }]}>
                ✦
              </Text>
            </View>
          )}
        </View>

        <View style={styles.metaRow}>
          {showId && (
            <View style={[styles.idBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.idText, { color: colors.primary }]}>
                {userIdDisplay}
              </Text>
            </View>
          )}
          
          {username && (
            <Text style={[styles.username, { color: colors.textSecondary }]}>
              @{username}
            </Text>
          )}
          
          {karma > 0 && (
            <Text style={styles.karma}>
              ⚡ {karma.toLocaleString()}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    borderRadius: 999,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '600',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontWeight: '600',
    flexShrink: 1,
  },
  badge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeIcon: {
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  idBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  idText: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '500',
  },
  username: {
    fontSize: 12,
  },
  karma: {
    fontSize: 12,
    color: '#f59e0b',
  },
});
