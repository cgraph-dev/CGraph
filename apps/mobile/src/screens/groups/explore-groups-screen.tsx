/**
 * Explore Groups screen for discovering and joining public groups.
 * @module screens/groups/explore-groups-screen
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore } from '@/stores';
import { GroupsStackParamList } from '../../types';
import {
  getPublicGroups,
  getFeaturedGroups,
  joinGroup,
  type Group,
} from '../../services/groupsService';

type Props = {
  navigation: NativeStackNavigationProp<GroupsStackParamList, 'ExploreGroups'>;
};

const SORT_OPTIONS = [
  { key: 'members' as const, label: 'Popular' },
  { key: 'created' as const, label: 'Newest' },
  { key: 'activity' as const, label: 'Active' },
];

/**
 * Explore Groups screen component.
 */
export default function ExploreGroupsScreen({ navigation }: Props) {
  const { colors } = useThemeStore();

  const [groups, setGroups] = useState<Group[]>([]);
  const [featuredGroups, setFeaturedGroups] = useState<Group[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'members' | 'activity' | 'created'>('members');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchGroups = useCallback(
    async (searchQuery?: string) => {
      try {
        const results = await getPublicGroups({
          search: searchQuery,
          sortBy,
          limit: 30,
        });
        setGroups(results);
      } catch (error) {
        console.error('Error fetching public groups:', error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [sortBy]
  );

  const fetchFeatured = useCallback(async () => {
    try {
      const results = await getFeaturedGroups();
      setFeaturedGroups(results);
    } catch {
      // Featured groups are non-critical
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchGroups();
    fetchFeatured();
  }, [fetchGroups, fetchFeatured]);

  // Debounced search
  const handleSearchChange = useCallback(
    (text: string) => {
      setSearch(text);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fetchGroups(text);
      }, 300);
    },
    [fetchGroups]
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchGroups(search);
    fetchFeatured();
  };

  const handleJoin = async (group: Group) => {
    setJoiningId(group.id);
    try {
      await joinGroup(group.id);
      navigation.navigate('Group', { groupId: group.id });
    } catch (error) {
      console.error('Error joining group:', error);
    } finally {
      setJoiningId(null);
    }
  };

  const renderFeaturedItem = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={[styles.featuredCard, { backgroundColor: colors.surface }]}
      onPress={() => navigation.navigate('Group', { groupId: item.id })}
    >
      {item.bannerUrl ? (
        <Image source={{ uri: item.bannerUrl }} style={styles.featuredBanner} />
      ) : (
        <View style={[styles.featuredBanner, { backgroundColor: colors.primary + '40' }]} />
      )}
      <View style={styles.featuredInfo}>
        <View style={[styles.featuredAvatar, { backgroundColor: colors.primary }]}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
          )}
        </View>
        <Text style={[styles.featuredName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.featuredMembers, { color: colors.textSecondary }]}>
          {item.memberCount} members
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderGroupItem = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={[styles.groupCard, { backgroundColor: colors.surface }]}
      onPress={() => navigation.navigate('Group', { groupId: item.id })}
    >
      <View style={[styles.groupAvatar, { backgroundColor: colors.primary }]}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.groupAvatarImage} />
        ) : (
          <Text style={styles.groupAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        )}
      </View>

      <View style={styles.groupInfo}>
        <Text style={[styles.groupName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        {item.description ? (
          <Text
            style={[styles.groupDescription, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        ) : null}
        <Text style={[styles.groupMembers, { color: colors.textTertiary }]}>
          {item.memberCount} members
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.joinButton,
          {
            backgroundColor: joiningId === item.id ? colors.primary + '80' : colors.primary,
          },
        ]}
        onPress={() => handleJoin(item)}
        disabled={joiningId === item.id}
      >
        {joiningId === item.id ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.joinButtonText}>Join</Text>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const ListHeader = () => (
    <View>
      {/* Featured Groups */}
      {featuredGroups.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured</Text>
          <FlatList
            data={featuredGroups}
            renderItem={renderFeaturedItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
          />
        </View>
      )}

      {/* Sort Options */}
      <View style={styles.sortRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.sortChip,
                {
                  backgroundColor: sortBy === opt.key ? colors.primary : colors.surfaceHover,
                },
              ]}
              onPress={() => setSortBy(opt.key)}
            >
              <Text
                style={[
                  styles.sortChipText,
                  { color: sortBy === opt.key ? '#fff' : colors.textSecondary },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results label */}
      <Text style={[styles.resultsLabel, { color: colors.textSecondary }]}>
        {search ? `Results for "${search}"` : 'All Public Groups'}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Ionicons name="search" size={20} color={colors.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search public groups..."
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={handleSearchChange}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => handleSearchChange('')}>
            <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={groups}
          renderItem={renderGroupItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="globe-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
                No groups found
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
                {search ? 'Try a different search term' : 'No public groups available yet'}
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={styles.listContent}
          // Performance
          windowSize={11}
          maxToRenderPerBatch={10}
          initialNumToRender={15}
          removeClippedSubviews
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    paddingVertical: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  featuredList: {
    paddingHorizontal: 16,
  },
  featuredCard: {
    width: 180,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
  },
  featuredBanner: {
    height: 80,
    width: '100%',
  },
  featuredInfo: {
    padding: 12,
    alignItems: 'center',
  },
  featuredAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -32,
    borderWidth: 3,
    borderColor: '#1a1a2e',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  featuredName: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
  },
  featuredMembers: {
    fontSize: 12,
    marginTop: 2,
  },
  sortRow: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sortChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  sortChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resultsLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 24,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
  },
  groupAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  groupAvatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  groupInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
  },
  groupDescription: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  groupMembers: {
    fontSize: 12,
    marginTop: 4,
  },
  joinButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
});
