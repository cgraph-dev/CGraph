/**
 * ChannelList Component (Mobile)
 *
 * Mobile-optimized channel listing for groups/servers.
 * Features:
 * - Category grouping with collapse (SectionList for virtualization)
 * - Channel type icons
 * - Active/unread states
 * - getItemLayout for smooth scrolling
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, SectionList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'announcement' | 'forum' | 'stage';
  categoryId?: string;
  unreadCount?: number;
  hasUnreadMention?: boolean;
  isPrivate?: boolean;
  isActive?: boolean;
  memberCount?: number; // For voice channels
}

export interface ChannelCategory {
  id: string;
  name: string;
  isCollapsed?: boolean;
}

export interface ChannelListProps {
  channels: Channel[];
  categories?: ChannelCategory[];
  activeChannelId?: string;
  showVoiceMembers?: boolean;
  onChannelPress?: (channel: Channel) => void;
  onCategoryToggle?: (categoryId: string) => void;
}

const CHANNEL_ICONS: Record<Channel['type'], keyof typeof MaterialCommunityIcons.glyphMap> = {
  text: 'pound',
  voice: 'volume-high',
  announcement: 'bullhorn',
  forum: 'forum',
  stage: 'access-point',
};

/**
 * Channel List component.
 *
 */
export function ChannelList({
  channels,
  categories = [],
  activeChannelId,
  showVoiceMembers = true,
  onChannelPress,
  onCategoryToggle,
}: ChannelListProps): React.ReactElement | null {
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const handleCategoryToggle = useCallback(
    (categoryId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCollapsedCategories((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(categoryId)) {
          newSet.delete(categoryId);
        } else {
          newSet.add(categoryId);
        }
        return newSet;
      });
      onCategoryToggle?.(categoryId);
    },
    [onCategoryToggle]
  );

  const handleChannelPress = useCallback(
    (channel: Channel) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChannelPress?.(channel);
    },
    [onChannelPress]
  );

  // Build SectionList data from categories + channels
  const sections = useMemo(() => {
    const uncategorized = channels.filter((c) => !c.categoryId);
    const result: { key: string; title: string; categoryId: string | null; data: Channel[] }[] = [];

    // Uncategorized channels first (no header)
    if (uncategorized.length > 0) {
      result.push({ key: '__uncategorized', title: '', categoryId: null, data: uncategorized });
    }

    // Categorized channels
    for (const category of categories) {
      const isCollapsed = collapsedCategories.has(category.id);
      const categoryChannels = channels.filter((c) => c.categoryId === category.id);
      result.push({
        key: category.id,
        title: category.name,
        categoryId: category.id,
        data: isCollapsed ? [] : categoryChannels,
      });
    }

    return result;
  }, [channels, categories, collapsedCategories]);

  const CHANNEL_ITEM_HEIGHT = 40;
  const _SECTION_HEADER_HEIGHT = 36;

  const renderChannel = useCallback(
    ({ item: channel }: { item: Channel }) => {
      const isActive = channel.id === activeChannelId;
      const hasUnread = (channel.unreadCount || 0) > 0;

      return (
        <Pressable
          onPress={() => handleChannelPress(channel)}
          style={({ pressed }) => [
            styles.channelItem,
            isActive && styles.channelItemActive,
            pressed && { opacity: 0.7 },
          ]}
        >
          <View style={styles.channelContent}>
            {/* Unread indicator */}
            {hasUnread && !isActive && <View style={styles.unreadIndicator} />}

            {/* Lock icon for private */}
            {channel.isPrivate ? (
              <MaterialCommunityIcons
                name="lock"
                size={16}
                color={isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)'}
              />
            ) : (
              <MaterialCommunityIcons
                name={CHANNEL_ICONS[channel.type]}
                size={18}
                color={isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)'}
              />
            )}

            {/* Channel name */}
            <Text
              style={[
                styles.channelName,
                isActive && styles.channelNameActive,
                hasUnread && !isActive && styles.channelNameUnread,
              ]}
              numberOfLines={1}
            >
              {channel.name}
            </Text>

            {/* Voice channel member count */}
            {channel.type === 'voice' &&
              showVoiceMembers &&
              channel.memberCount !== undefined &&
              channel.memberCount > 0 && (
                <View style={styles.voiceMemberBadge}>
                  <MaterialCommunityIcons name="account" size={12} color="#10B981" />
                  <Text style={styles.voiceMemberCount}>{channel.memberCount}</Text>
                </View>
              )}

            {/* Unread count badge */}
            {hasUnread && !isActive && (
              <View style={[styles.unreadBadge, channel.hasUnreadMention && styles.mentionBadge]}>
                <Text style={styles.unreadBadgeText}>
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  {channel.unreadCount! > 99 ? '99+' : channel.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      );
    },
    [activeChannelId, handleChannelPress, showVoiceMembers]
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: { title: string; categoryId: string | null } }) => {
      if (!section.categoryId) return null;

      const isCollapsed = collapsedCategories.has(section.categoryId);
      return (
        <Pressable
          onPress={() => handleCategoryToggle(section.categoryId!)}
          style={styles.categoryHeader}
        >
          <MaterialCommunityIcons
            name={isCollapsed ? 'chevron-right' : 'chevron-down'}
            size={14}
            color="rgba(255, 255, 255, 0.5)"
          />
          <Text style={styles.categoryName}>{section.title.toUpperCase()}</Text>
        </Pressable>
      );
    },
    [collapsedCategories, handleCategoryToggle]
  );

  const getItemLayout = useCallback(
    (_data: unknown, index: number) => ({
      length: CHANNEL_ITEM_HEIGHT,
      offset: CHANNEL_ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  const keyExtractor = useCallback((item: Channel) => item.id, []);

  return (
    <SectionList
      sections={sections}
      renderItem={renderChannel}
      renderSectionHeader={renderSectionHeader}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      stickySectionHeadersEnabled={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      windowSize={10}
      maxToRenderPerBatch={15}
      initialNumToRender={20}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.5,
  },
  channelItem: {
    marginHorizontal: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    position: 'relative',
  },
  channelItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  channelContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unreadIndicator: {
    position: 'absolute',
    left: -8,
    width: 4,
    height: 8,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  channelName: {
    flex: 1,
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  channelNameActive: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  channelNameUnread: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  voiceMemberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  voiceMemberCount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  unreadBadge: {
    backgroundColor: '#6B7280',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  mentionBadge: {
    backgroundColor: '#EF4444',
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ChannelList;
