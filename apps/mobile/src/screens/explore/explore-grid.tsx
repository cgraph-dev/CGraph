/**
 * Explore Grid — Instagram-style masonry/staggered content grid
 *
 * Companion to existing ExploreScreen. Provides the trending content grid view
 * with mixed content types (threads, groups, users, events).
 *
 * Features:
 * - Staggered height grid (alternating tall/short items for visual interest)
 * - Category pills at top (All, Groups, Forums, People, Events)
 * - Tap to navigate to content
 * - Animated entry with stagger
 *
 * @module screens/explore/explore-grid
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ── Types ──────────────────────────────────────────────────────────────

type ContentType = 'thread' | 'group' | 'user' | 'event';
type Category = 'all' | 'groups' | 'forums' | 'people' | 'events';

interface ExploreItem {
  id: string;
  type: ContentType;
  title: string;
  subtitle?: string;
  image?: string;
  stats?: string;
  isTall?: boolean;
}

interface ExploreGridProps {
  items?: ExploreItem[];
  onItemPress?: (item: ExploreItem) => void;
  onCategoryChange?: (category: Category) => void;
}

// ── Constants ──────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 4;
const NUM_COLUMNS = 3;
const ITEM_WIDTH = (SCREEN_WIDTH - GRID_GAP * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

const categories: { value: Category; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { value: 'all', label: 'All', icon: 'compass-outline' },
  { value: 'groups', label: 'Groups', icon: 'account-group-outline' },
  { value: 'forums', label: 'Forums', icon: 'forum-outline' },
  { value: 'people', label: 'People', icon: 'account-outline' },
  { value: 'events', label: 'Events', icon: 'calendar-outline' },
];

const typeOverlayIcons: Record<ContentType, keyof typeof MaterialCommunityIcons.glyphMap> = {
  thread: 'text-box-outline',
  group: 'account-group',
  user: 'account',
  event: 'calendar-star',
};

// ── Component ──────────────────────────────────────────────────────────

export function ExploreGrid({
  items = [],
  onItemPress,
  onCategoryChange,
}: ExploreGridProps): React.ReactElement {
  const [activeCategory, setActiveCategory] = useState<Category>('all');

  const handleCategory = useCallback(
    (cat: Category) => {
      setActiveCategory(cat);
      onCategoryChange?.(cat);
    },
    [onCategoryChange],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: ExploreItem; index: number }) => {
      const isTall = item.isTall ?? index % 5 === 0;
      const height = isTall ? ITEM_WIDTH * 1.6 : ITEM_WIDTH;

      return (
        <Animated.View
          entering={FadeInUp.delay(index * 30).duration(250)}
        >
          <Pressable
            onPress={() => onItemPress?.(item)}
            style={[styles.gridItem, { width: ITEM_WIDTH, height }]}
          >
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.gridImage} />
            ) : (
              <View style={styles.gridPlaceholder}>
                <MaterialCommunityIcons
                  name={typeOverlayIcons[item.type]}
                  size={28}
                  color="rgba(255,255,255,0.15)"
                />
              </View>
            )}

            {/* Overlay */}
            <View style={styles.gridOverlay}>
              <View style={styles.typeBadge}>
                <MaterialCommunityIcons
                  name={typeOverlayIcons[item.type]}
                  size={10}
                  color="rgba(255,255,255,0.8)"
                />
              </View>
              <Text style={styles.gridTitle} numberOfLines={2}>
                {item.title}
              </Text>
              {item.stats && (
                <Text style={styles.gridStats}>{item.stats}</Text>
              )}
            </View>
          </Pressable>
        </Animated.View>
      );
    },
    [onItemPress],
  );

  return (
    <View style={styles.container}>
      {/* Category pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryBar}
      >
        {categories.map((cat) => (
          <Pressable
            key={cat.value}
            onPress={() => handleCategory(cat.value)}
            style={[
              styles.categoryPill,
              activeCategory === cat.value && styles.categoryPillActive,
            ]}
          >
            <MaterialCommunityIcons
              name={cat.icon}
              size={14}
              color={activeCategory === cat.value ? '#FFFFFF' : 'rgba(255,255,255,0.4)'}
            />
            <Text
              style={[
                styles.categoryText,
                activeCategory === cat.value && styles.categoryTextActive,
              ]}
            >
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Grid */}
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Animated.View entering={FadeIn.duration(300)} style={styles.emptyState}>
            <MaterialCommunityIcons name="compass-outline" size={48} color="rgba(255,255,255,0.1)" />
            <Text style={styles.emptyText}>Nothing to explore yet</Text>
          </Animated.View>
        }
      />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1b1e',
  },
  categoryBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  categoryPillActive: {
    backgroundColor: '#6366f1',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  gridContent: {
    paddingHorizontal: GRID_GAP,
    paddingBottom: 100,
  },
  row: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  gridItem: {
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 6,
    paddingTop: 20,
    // gradient fallback
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  typeBadge: {
    position: 'absolute',
    top: -14,
    left: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 13,
  },
  gridStats: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.2)',
  },
});

export default ExploreGrid;
