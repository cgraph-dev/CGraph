import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/ThemeContext';
import { ForumCardSkeleton } from '../../components/Skeleton';
import api from '../../lib/api';
import { ForumsStackParamList, Forum } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<ForumsStackParamList, 'ForumList'>;
};

export default function ForumListScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [forums, setForums] = useState<Forum[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchForums();
  }, []);
  
  const fetchForums = async () => {
    try {
      const response = await api.get('/api/v1/forums');
      setForums(response.data.data || []);
    } catch (error) {
      console.error('Error fetching forums:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchForums();
    setRefreshing(false);
  };
  
  const renderForum = ({ item }: { item: Forum }) => (
    <TouchableOpacity
      style={[styles.forumItem, { backgroundColor: colors.surface }]}
      onPress={() => navigation.navigate('Forum', { forumId: item.id })}
    >
      <View style={styles.forumIcon}>
        {item.icon_url ? (
          <Image source={{ uri: item.icon_url }} style={styles.forumIconImage} />
        ) : (
          <View style={[styles.forumIconPlaceholder, { backgroundColor: colors.secondary }]}>
            <Text style={styles.forumIconText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.forumInfo}>
        <Text style={[styles.forumName, { color: colors.text }]} numberOfLines={1}>
          r/{item.slug}
        </Text>
        <Text style={[styles.forumStats, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.member_count} members • {item.post_count} posts
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );
  
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="newspaper-outline" size={64} color={colors.textTertiary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Forums</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Join a forum or create your own
      </Text>
      <View style={styles.emptyButtons}>
        <TouchableOpacity 
          style={[styles.emptyButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('CreateForum')}
        >
          <Text style={styles.emptyButtonText}>Create Forum</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.emptyButtonOutline, { borderColor: colors.border }]}
        >
          <Text style={[styles.emptyButtonOutlineText, { color: colors.text }]}>
            Browse Forums
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  const renderSkeletons = () => (
    <View style={{ padding: 16, gap: 12 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <ForumCardSkeleton key={i} />
      ))}
    </View>
  );
  
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderSkeletons()}
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={forums}
        renderItem={renderForum}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={[
          styles.listContent,
          forums.length === 0 && styles.emptyContainer,
        ]}
        ListEmptyComponent={renderEmptyState}
      />
      
      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('CreateForum')}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
  },
  forumItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  forumIcon: {
    marginRight: 12,
  },
  forumIconImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  forumIconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  forumIconText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  forumInfo: {
    flex: 1,
  },
  forumName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  forumStats: {
    fontSize: 13,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButtons: {
    gap: 12,
    width: '100%',
    maxWidth: 240,
  },
  emptyButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyButtonOutline: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyButtonOutlineText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
