import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../lib/api';
import { ForumsStackParamList, Forum, Post } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<ForumsStackParamList, 'Forum'>;
  route: RouteProp<ForumsStackParamList, 'Forum'>;
};

export default function ForumScreen({ navigation, route }: Props) {
  const { forumId } = route.params;
  const { colors } = useTheme();
  const [_forum, setForum] = useState<Forum | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    fetchForum();
    fetchPosts();
  }, [forumId]);
  
  const fetchForum = async () => {
    try {
      const response = await api.get(`/forums/${forumId}`);
      const forumData = response.data.data;
      setForum(forumData);
      navigation.setOptions({
        title: `r/${forumData.slug}`,
        headerRight: () => (
          <TouchableOpacity
            onPress={() => navigation.navigate('CreatePost', { forumId })}
            style={{ marginRight: 16 }}
          >
            <Ionicons name="create-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        ),
      });
    } catch (error) {
      console.error('Error fetching forum:', error);
    }
  };
  
  const fetchPosts = async () => {
    try {
      const response = await api.get(`/forums/${forumId}/posts`);
      setPosts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };
  
  const handleVote = async (postId: string, value: 1 | -1) => {
    try {
      await api.post(`/posts/${postId}/vote`, { value });
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            const oldVote = p.my_vote || 0;
            const newVote = p.my_vote === value ? undefined : value;
            return {
              ...p,
              my_vote: newVote,
              vote_count: p.vote_count - oldVote + (newVote || 0),
            };
          }
          return p;
        })
      );
    } catch (error) {
      console.error('Error voting:', error);
    }
  };
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 168) return `${Math.floor(diffHours / 24)}d ago`;
    return `${Math.floor(diffHours / 168)}w ago`;
  };
  
  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={[styles.postItem, { backgroundColor: colors.surface }]}
      onPress={() => navigation.navigate('Post', { postId: item.id })}
    >
      {/* Vote buttons */}
      <View style={styles.voteContainer}>
        <TouchableOpacity onPress={() => handleVote(item.id, 1)}>
          <Ionicons
            name={item.my_vote === 1 ? 'arrow-up' : 'arrow-up-outline'}
            size={24}
            color={item.my_vote === 1 ? colors.primary : colors.textSecondary}
          />
        </TouchableOpacity>
        <Text style={[styles.voteCount, { color: colors.text }]}>
          {item.vote_count}
        </Text>
        <TouchableOpacity onPress={() => handleVote(item.id, -1)}>
          <Ionicons
            name={item.my_vote === -1 ? 'arrow-down' : 'arrow-down-outline'}
            size={24}
            color={item.my_vote === -1 ? colors.error : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
      
      {/* Post content */}
      <View style={styles.postContent}>
        <View style={styles.postMeta}>
          <Text style={[styles.author, { color: colors.textSecondary }]}>
            u/{item.author.username} • {formatTime(item.inserted_at)}
          </Text>
          {item.flair && (
            <View style={[styles.flair, { backgroundColor: item.flair.color }]}>
              <Text style={styles.flairText}>{item.flair.name}</Text>
            </View>
          )}
        </View>
        
        <Text style={[styles.postTitle, { color: colors.text }]} numberOfLines={3}>
          {item.title}
        </Text>
        
        <View style={styles.postStats}>
          <TouchableOpacity style={styles.statItem}>
            <Ionicons name="chatbubble-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {item.comment_count}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statItem}>
            <Ionicons name="share-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
  
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No posts yet. Be the first to post!
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  postItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
  },
  voteContainer: {
    alignItems: 'center',
    marginRight: 12,
    paddingTop: 4,
  },
  voteCount: {
    fontSize: 14,
    fontWeight: '600',
    marginVertical: 4,
  },
  postContent: {
    flex: 1,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  author: {
    fontSize: 12,
  },
  flair: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  flairText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    marginBottom: 8,
  },
  postStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
  },
});
