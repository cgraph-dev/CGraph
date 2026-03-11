/**
 * Explore Screen — Mobile
 *
 * Unified community discovery screen that aggregates public groups
 * and forums. Supports search, category filtering, sort, pull-to-refresh,
 * and infinite scroll.
 *
 * @module screens/explore/explore-screen
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore, useDiscoveryStore } from '@/stores';
import api from '../../lib/api';
import CommunityCard, { type Community } from './community-card';
import FrequencyPicker from '../../components/discovery/frequency-picker';
import TopicSelector from '../../components/discovery/topic-selector';

type ExploreNavigation = NativeStackNavigationProp<{
  Group: { groupId: string };
  Forum: { forumId: string };
}>;

const SORT_OPTIONS = [
  { key: 'popular' as const, label: 'Popular' },
  { key: 'newest' as const, label: 'Newest' },
  { key: 'alphabetical' as const, label: 'A–Z' },
];

const CATEGORIES = [
  'gaming',
  'technology',
  'art',
  'music',
  'education',
  'programming',
  'science',
  'social',
  'sports',
  'entertainment',
];

/**
 * Mobile explore screen for community discovery.
 */
export default function ExploreScreen() {
  const { colors } = useThemeStore();
  const navigation = useNavigation<ExploreNavigation>();
  const discoveryStore = useDiscoveryStore();

  const [communities, setCommunities] = useState<Community[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<'popular' | 'newest' | 'alphabetical'>('popular');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchCommunities = useCallback(
    async (reset = false) => {
      try {
        if (reset) setIsLoading(true);
        const currentOffset = reset ? 0 : offset;

        const response = await api.get('/api/v1/explore', {
          params: {
            category: category || undefined,
            sort,
            q: search || undefined,
            limit: 20,
            offset: currentOffset,
          },
        });

        const payload = response.data?.data ?? response.data;
        const items: Community[] = payload?.communities ?? [];

        if (reset) {
          setCommunities(items);
          setOffset(items.length);
        } else {
          setCommunities((prev) => [...prev, ...items]);
          setOffset((prev) => prev + items.length);
        }
        setHasMore(items.length >= 20);
      } catch (error) {
        console.error('Explore fetch error:', error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [category, sort, search, offset]
  );

  // Reset on filter changes
  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    fetchCommunities(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, sort]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.length === 0 || search.length >= 2) {
        setOffset(0);
        setHasMore(true);
        fetchCommunities(true);
      }
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setOffset(0);
    setHasMore(true);
    fetchCommunities(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, sort, search]);

  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchCommunities(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, hasMore, offset]);

  const handleCommunityPress = useCallback(
    (community: Community) => {
      if (community.type === 'group') {
        navigation.navigate('Group', { groupId: community.id });
      } else {
        navigation.navigate('Forum', { forumId: community.id });
      }
    },
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }: { item: Community }) => (
      <CommunityCard community={item} onPress={handleCommunityPress} />
    ),
    [handleCommunityPress]
  );

  const keyExtractor = useCallback((item: Community) => `${item.type}-${item.id}`, []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <Ionicons name="globe-outline" size={24} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Explore</Text>
        </View>

        {/* Search bar */}
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search communities..."
            placeholderTextColor={colors.textSecondary}
            style={[styles.searchInput, { color: colors.text }]}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryContainer}
          contentContainerStyle={styles.categoryContent}
        >
          <TouchableOpacity
            onPress={() => setCategory(null)}
            style={[
              styles.categoryPill,
              category === null
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                { color: category === null ? '#fff' : colors.textSecondary },
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategory(cat === category ? null : cat)}
              style={[
                styles.categoryPill,
                category === cat
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  {
                    color: category === cat ? '#fff' : colors.textSecondary,
                    textTransform: 'capitalize',
                  },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sort pills */}
        <View style={styles.sortRow}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              onPress={() => setSort(opt.key)}
              style={[
                styles.sortPill,
                sort === opt.key
                  ? { backgroundColor: colors.primary + '22', borderColor: colors.primary }
                  : { borderColor: colors.border },
              ]}
            >
              <Text
                style={[
                  styles.sortText,
                  { color: sort === opt.key ? colors.primary : colors.textSecondary },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Discovery feed mode selector */}
      <FrequencyPicker
        activeMode={discoveryStore.activeMode}
        onModeChange={(mode) => discoveryStore.setMode(mode)}
      />

      {/* Topic filter chips */}
      <TopicSelector
        topics={discoveryStore.topics}
        selected={discoveryStore.filters.topics ?? []}
        onToggle={(topic) => {
          const current = discoveryStore.filters.topics ?? [];
          const next = current.includes(topic)
            ? current.filter((t) => t !== topic)
            : [...current, topic];
          discoveryStore.setFilters({ ...discoveryStore.filters, topics: next });
        }}
      />

      {/* Community list */}
      {isLoading && communities.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={communities}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="sparkles-outline" size={48} color={colors.textSecondary + '44'} />
              <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
                No communities found
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary + '88' }]}>
                {search ? 'Try a different search term' : 'No public communities available yet'}
              </Text>
            </View>
          }
          ListFooterComponent={
            isLoading && communities.length > 0 ? (
              <ActivityIndicator style={styles.footerLoader} color={colors.primary} />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  categoryContainer: {
    marginBottom: 8,
  },
  categoryContent: {
    gap: 8,
    paddingRight: 16,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
  },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sortPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  sortText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  footerLoader: {
    paddingVertical: 20,
  },
});
