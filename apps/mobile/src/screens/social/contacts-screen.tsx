/**
 * ContactsScreen - Mobile contacts list with real-time presence indicators.
 *
 * Displays the user's friends in Online/Offline sections with presence dots,
 * avatars, display names, usernames, and optional status messages.
 * Powered by the useContactsPresence hook for real-time WebSocket updates.
 *
 * @module screens/social/contacts-screen
 * @version 1.0.0
 */

import React, { useEffect, useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  Image,
  SectionList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  type SectionListData,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeStore } from '@/stores';
import { useFriendStore, type Friend } from '@/stores/friendStore';
import { useContactsPresence } from '@/hooks/useContactsPresence';

/** Section data shape for SectionList */
interface ContactSection {
  title: string;
  data: Friend[];
}

/** Props for the contacts screen */
interface ContactsScreenProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any;
}

/**
 * Presence dot overlay for an avatar.
 * Green dot with subtle opacity animation for online, gray for offline.
 */
function PresenceDot({ isOnline }: { isOnline: boolean }) {
  return (
    <View
      style={[
        styles.presenceDot,
        { backgroundColor: isOnline ? '#22c55e' : '#9ca3af' },
        isOnline && styles.presenceDotOnline,
      ]}
    />
  );
}

/**
 * Avatar with presence dot overlay.
 */
function ContactAvatar({ friend, isOnline }: { friend: Friend; isOnline: boolean }) {
  const { colors } = useThemeStore();
  const initials = (friend.displayName || friend.username || '?').charAt(0).toUpperCase();

  return (
    <View style={styles.avatarContainer}>
      {friend.avatarUrl ? (
        <Image source={{ uri: friend.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatarFallback, { backgroundColor: colors.card }]}>
          <Text style={[styles.avatarInitials, { color: colors.text }]}>{initials}</Text>
        </View>
      )}
      <PresenceDot isOnline={isOnline} />
    </View>
  );
}

/**
 * Single contact row in the list.
 */
function ContactRow({
  friend,
  isOnline,
  statusMessage,
  onPress,
}: {
  friend: Friend;
  isOnline: boolean;
  statusMessage?: string;
  onPress: (friend: Friend) => void;
}) {
  const { colors } = useThemeStore();
  const displayStatus = statusMessage || friend.customStatus;

  return (
    <TouchableOpacity
      style={[styles.contactRow, { borderBottomColor: colors.border }]}
      onPress={() => onPress(friend)}
      activeOpacity={0.7}
    >
      <ContactAvatar friend={friend} isOnline={isOnline} />

      <View style={styles.contactInfo}>
        <View style={styles.nameRow}>
          <Text style={[styles.displayName, { color: colors.text }]} numberOfLines={1}>
            {friend.displayName || friend.username}
          </Text>
          <Text style={[styles.username, { color: colors.textSecondary }]} numberOfLines={1}>
            @{friend.username}
          </Text>
        </View>
        {displayStatus ? (
          <Text style={[styles.statusMessage, { color: colors.textSecondary }]} numberOfLines={1}>
            {displayStatus}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

/**
 * ContactsScreen - Displays all friends with real-time presence.
 *
 * Features:
 * - SectionList with "Online" and "Offline" sections
 * - Real-time presence dots via WebSocket
 * - Status messages beneath usernames
 * - Pull-to-refresh to reload friends list
 * - Empty state when no friends
 */
export default function ContactsScreen({ navigation }: ContactsScreenProps) {
  const { colors } = useThemeStore();
  const { friends, fetchFriends, isLoading } = useFriendStore();
  const { isOnline, onlineFriends, statusMessages } = useContactsPresence();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch friends on mount
  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  // Split friends into online/offline sections
  const sections: ContactSection[] = useMemo(() => {
    const online: Friend[] = [];
    const offline: Friend[] = [];

    const sortedFriends = [...friends].sort((a, b) => {
      const aName = (a.displayName || a.username).toLowerCase();
      const bName = (b.displayName || b.username).toLowerCase();
      return aName.localeCompare(bName);
    });

    for (const friend of sortedFriends) {
      if (isOnline(friend.friendId || friend.id)) {
        online.push(friend);
      } else {
        offline.push(friend);
      }
    }

    const result: ContactSection[] = [];
    if (online.length > 0) {
      result.push({ title: `Online — ${online.length}`, data: online });
    }
    if (offline.length > 0) {
      result.push({ title: 'Offline', data: offline });
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friends, isOnline, onlineFriends]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFriends();
    setRefreshing(false);
  }, [fetchFriends]);

  const handleContactPress = useCallback(
    (friend: Friend) => {
      navigation.navigate('Profile', { userId: friend.friendId || friend.id });
    },
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }: { item: Friend }) => {
      const friendId = item.friendId || item.id;
      return (
        <ContactRow
          friend={item}
          isOnline={isOnline(friendId)}
          statusMessage={statusMessages.get(friendId)}
          onPress={handleContactPress}
        />
      );
    },
    [isOnline, statusMessages, handleContactPress]
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionListData<Friend, ContactSection> }) => (
      <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{section.title}</Text>
      </View>
    ),
    [colors]
  );

  const keyExtractor = useCallback((item: Friend) => item.id, []);

  if (friends.length === 0 && !isLoading) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Animated.View entering={FadeInDown.springify()} style={styles.emptyContent}>
          <Text style={styles.emptyEmoji}>👋</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No contacts yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Add friends to see them here
          </Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SectionList<Friend, ContactSection>
        sections={sections}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={friends.length === 0 ? styles.listEmpty : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listEmpty: {
    flexGrow: 1,
  },
  // Section headers
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  // Contact row
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  // Avatar
  avatarContainer: {
    position: 'relative',
    width: 40,
    height: 40,
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Presence dot
  presenceDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  presenceDotOnline: {
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 2,
  },
  // Contact info
  contactInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  displayName: {
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  username: {
    fontSize: 13,
    flexShrink: 0,
  },
  statusMessage: {
    fontSize: 13,
    marginTop: 2,
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContent: {
    alignItems: 'center',
    padding: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});
