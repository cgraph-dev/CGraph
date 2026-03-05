/**
 * StoriesRow — Instagram-style stories row at top of conversation list.
 * @module components/conversation/stories-row
 */
import React, { memo } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { Avatar } from '../ui/avatar';
import { space } from '../../theme/tokens';

interface StoryUser {
  id: string;
  name: string;
  avatarUrl?: string;
  hasUnseenStory: boolean;
}

interface StoriesRowProps {
  stories: StoryUser[];
  onStoryPress?: (userId: string) => void;
  onCreateStory?: () => void;
}

/**
 * Horizontal FlatList of story avatars with gradient ring, "Your story" first.
 */
export const StoriesRow = memo(function StoriesRow({
  stories,
  onStoryPress,
  onCreateStory,
}: StoriesRowProps) {
  const renderItem = ({ item }: { item: StoryUser }) => (
    <Pressable
      onPress={() => onStoryPress?.(item.id)}
      style={styles.storyItem}
    >
      <Avatar
        size="lg"
        name={item.name}
        src={item.avatarUrl}
        storyRing={item.hasUnseenStory}
      />
      <Text style={styles.storyName} numberOfLines={1}>
        {item.name.split(' ')[0]}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={stories}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={72}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Pressable onPress={onCreateStory} style={styles.storyItem}>
            <View style={styles.createWrapper}>
              <Avatar size="lg" name="You" />
              <View style={styles.createBadge}>
                <Text style={styles.createPlus}>+</Text>
              </View>
            </View>
            <Text style={styles.storyName}>Your story</Text>
          </Pressable>
        }
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingVertical: space[2],
  },
  listContent: {
    gap: space[3],
    paddingHorizontal: space[3],
  },
  storyItem: {
    alignItems: 'center',
    gap: space[1],
    width: 64,
  },
  storyName: {
    maxWidth: 60,
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
  },
  createWrapper: {
    position: 'relative',
  },
  createBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#5865F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgb(18,18,24)',
  },
  createPlus: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 16,
  },
});

export default StoriesRow;
