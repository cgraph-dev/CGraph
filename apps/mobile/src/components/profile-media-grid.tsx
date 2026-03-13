/**
 * ProfileMediaGrid — 3-column grid of shared media for mobile profile.
 * @module components/profile-media-grid
 */
import React, { memo, useCallback } from 'react';
import { View, FlatList, Image, Pressable, Text, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_SIZE = (SCREEN_WIDTH - 2) / 3; // 0.5px gaps

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  thumbnailUrl: string;
}

interface ProfileMediaGridProps {
  items: MediaItem[];
  onItemPress?: (item: MediaItem) => void;
}

export const ProfileMediaGrid = memo(function ProfileMediaGrid({
  items,
  onItemPress,
}: ProfileMediaGridProps) {
  const renderItem = useCallback(
    ({ item }: { item: MediaItem }) => (
      <Pressable onPress={() => onItemPress?.(item)} style={styles.item}>
        <Image source={{ uri: item.thumbnailUrl }} style={styles.image} resizeMode="cover" />
        {item.type === 'video' && (
          <View style={styles.playOverlay}>
            <Text style={styles.playIcon}>▶</Text>
          </View>
        )}
      </Pressable>
    ),
    [onItemPress]
  );

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No media shared yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      numColumns={3}
      scrollEnabled={false}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.grid}
    />
  );
});

const styles = StyleSheet.create({
  grid: {
    gap: 1,
  },
  row: {
    gap: 1,
  },
  item: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playIcon: {
    fontSize: 20,
    color: 'white',
  },
  empty: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.3)',
  },
});

export default ProfileMediaGrid;
