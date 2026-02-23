/**
 * Community member list screen with search and filtering.
 * @module screens/community/member-list-screen
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, type ParamListBase } from '@react-navigation/native';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import api from '../../lib/api';

// ============================================================================
// Types
// ============================================================================

interface Member {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  userGroup: string;
  userGroupColor: string | null;
  isOnline: boolean;
  lastActive: string | null;
  joinedAt: string;
  postCount: number;
  reputation: number;
}

interface UserGroup {
  id: string;
  name: string;
  color: string | null;
  memberCount: number;
}

type SortField = 'username' | 'joined_at' | 'post_count' | 'reputation' | 'last_active';
type SortOrder = 'asc' | 'desc';

// ============================================================================
// FALLBACK DATA
// ============================================================================

function generateFallbackMembers(): Member[] {
  return [
    {
      id: '1',
      username: 'admin',
      displayName: 'Administrator',
      avatarUrl: null,
      userGroup: 'Admin',
      userGroupColor: '#ef4444',
      isOnline: true,
      lastActive: new Date().toISOString(),
      joinedAt: '2024-01-01T00:00:00Z',
      postCount: 1234,
      reputation: 999,
    },
    {
      id: '2',
      username: 'moderator',
      displayName: 'Mod User',
      avatarUrl: null,
      userGroup: 'Moderator',
      userGroupColor: '#3b82f6',
      isOnline: true,
      lastActive: new Date().toISOString(),
      joinedAt: '2024-02-15T00:00:00Z',
      postCount: 567,
      reputation: 450,
    },
    {
      id: '3',
      username: 'john_doe',
      displayName: 'John Doe',
      avatarUrl: null,
      userGroup: 'Member',
      userGroupColor: '#10b981',
      isOnline: false,
      lastActive: '2026-01-12T10:00:00Z',
      joinedAt: '2025-03-20T00:00:00Z',
      postCount: 89,
      reputation: 42,
    },
    {
      id: '4',
      username: 'jane_smith',
      displayName: 'Jane Smith',
      avatarUrl: null,
      userGroup: 'Premium',
      userGroupColor: '#8b5cf6',
      isOnline: true,
      lastActive: new Date().toISOString(),
      joinedAt: '2025-06-10T00:00:00Z',
      postCount: 234,
      reputation: 156,
    },
    {
      id: '5',
      username: 'new_user',
      displayName: null,
      avatarUrl: null,
      userGroup: 'Member',
      userGroupColor: '#10b981',
      isOnline: false,
      lastActive: '2026-01-10T15:30:00Z',
      joinedAt: '2026-01-05T00:00:00Z',
      postCount: 5,
      reputation: 2,
    },
  ];
}

// ============================================================================
// MEMBER ITEM COMPONENT
// ============================================================================

interface MemberItemProps {
  member: Member;
  onPress: () => void;
}

function MemberItem({ member, onPress }: MemberItemProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <TouchableOpacity
      style={styles.memberItem}
      onPress={() => {
        HapticFeedback.light();
        onPress();
      }}
      activeOpacity={0.7}
    >
      <View style={styles.memberAvatar}>
        {member.avatarUrl ? (
          <Image source={{ uri: member.avatarUrl }} style={styles.avatarImage} />
        ) : (
          <LinearGradient
            colors={[member.userGroupColor || '#10b981', '#059669']}
            style={styles.avatarPlaceholder}
          >
            <Text style={styles.avatarInitial}>
              {(member.displayName || member.username)[0].toUpperCase()}
            </Text>
          </LinearGradient>
        )}
        {member.isOnline && <View style={styles.onlineIndicator} />}
      </View>

      <View style={styles.memberInfo}>
        <View style={styles.memberNameRow}>
          <Text style={styles.memberName} numberOfLines={1}>
            {member.displayName || member.username}
          </Text>
          <View
            style={[
              styles.groupBadge,
              { backgroundColor: (member.userGroupColor || '#6b7280') + '30' },
            ]}
          >
            <Text style={[styles.groupBadgeText, { color: member.userGroupColor || '#6b7280' }]}>
              {member.userGroup}
            </Text>
          </View>
        </View>
        <Text style={styles.memberUsername}>@{member.username}</Text>
        <View style={styles.memberStats}>
          <Text style={styles.memberStat}>
            <Ionicons name="document-text" size={12} color="#9ca3af" /> {member.postCount} posts
          </Text>
          <Text style={styles.memberStat}>
            <Ionicons name="star" size={12} color="#f59e0b" /> {member.reputation}
          </Text>
          <Text style={styles.memberStat}>Joined {formatDate(member.joinedAt)}</Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#6b7280" />
    </TouchableOpacity>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MemberListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();

  const [members, setMembers] = useState<Member[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterGroup, setFilterGroup] = useState<string>('');
  const [filterOnlineOnly, setFilterOnlineOnly] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState<SortField>('username');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Transform API response
  const transformApiMembers = (data: Record<string, any>[]): Member[] => {
    return data.map((m) => ({
      id: m.id,
      username: m.username || 'Unknown',
      displayName: m.display_name || null,
      avatarUrl: m.avatar_url || null,
      userGroup: m.user_group || 'Member',
      userGroupColor: m.user_group_color || null,
      isOnline: m.is_online || false,
      lastActive: m.last_active || null,
      joinedAt: m.joined_at || new Date().toISOString(),
      postCount: m.post_count || 0,
      reputation: m.reputation || 0,
    }));
  };

  // Fetch members
  const fetchMembers = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      try {
        if (pageNum === 1) setIsLoading(true);
        else setIsLoadingMore(true);
        setError(null);

        const params: Record<string, any> = {
          page: pageNum,
          per_page: 20,
          sort_by: sortField,
          sort_order: sortOrder,
        };

        if (searchQuery) params.search = searchQuery;
        if (filterGroup) params.group_id = filterGroup;
        if (filterOnlineOnly) params.online_only = true;

        const response = await api.get('/api/v1/members', { params });
        const { data } = response;

        const memberList = transformApiMembers(data.members || []);

        if (append) {
          setMembers((prev) => [...prev, ...memberList]);
        } else {
          setMembers(memberList);
        }

        setTotalPages(data.total_pages || 1);
        setTotalMembers(data.total || memberList.length);
        setPage(pageNum);
      } catch (err) {
        console.error('[MemberList] API error, using fallback:', err);
        if (!append) {
          setMembers(generateFallbackMembers());
          setTotalMembers(5);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [sortField, sortOrder, searchQuery, filterGroup, filterOnlineOnly]
  );

  // Fetch user groups for filter
  const fetchUserGroups = useCallback(async () => {
    try {
      const response = await api.get('/api/v1/user-groups');
      const groups = response.data.groups || [];
      setUserGroups(
        groups.map((g: Record<string, unknown>) => ({
          id: g.id,
          name: g.name || 'Unknown',
          color: g.color || null,
          memberCount: g.member_count || 0,
        }))
      );
    } catch (err) {
      console.error('[MemberList] Failed to fetch groups:', err);
    }
  }, []);

  useEffect(() => {
    fetchMembers(1);
    fetchUserGroups();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMembers(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    HapticFeedback.light();
    await fetchMembers(1);
    setIsRefreshing(false);
  };

  // Load more
  const handleLoadMore = () => {
    if (!isLoadingMore && page < totalPages) {
      fetchMembers(page + 1, true);
    }
  };

  // Navigate to member profile
  const handleMemberPress = (member: Member) => {
    // Navigate to profile screen
    if (__DEV__) console.warn('Navigate to profile:', member.id);
  };

  // Toggle sort
  const handleSort = (field: SortField) => {
    HapticFeedback.light();
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    fetchMembers(1);
  };

  // Sort buttons
  const sortOptions: { field: SortField; label: string }[] = [
    { field: 'username', label: 'Name' },
    { field: 'joined_at', label: 'Joined' },
    { field: 'post_count', label: 'Posts' },
    { field: 'reputation', label: 'Rep' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#111827', '#0f172a', '#111827']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            HapticFeedback.light();
            navigation.goBack();
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Members</Text>
          <Text style={styles.headerSubtitle}>{totalMembers} total members</Text>
        </View>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            HapticFeedback.light();
            setShowFilters(!showFilters);
          }}
        >
          <Ionicons name="filter" size={22} color={showFilters ? '#10b981' : '#fff'} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search members..."
          placeholderTextColor="#6b7280"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      {showFilters && (
        <BlurView intensity={40} tint="dark" style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Sort by:</Text>
            <View style={styles.sortButtons}>
              {sortOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.field}
                  style={[styles.sortButton, sortField === opt.field && styles.sortButtonActive]}
                  onPress={() => handleSort(opt.field)}
                >
                  <Text
                    style={[
                      styles.sortButtonText,
                      sortField === opt.field && styles.sortButtonTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {sortField === opt.field && (
                    <Ionicons
                      name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
                      size={12}
                      color="#10b981"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TouchableOpacity
            style={[styles.filterChip, filterOnlineOnly && styles.filterChipActive]}
            onPress={() => {
              HapticFeedback.light();
              setFilterOnlineOnly(!filterOnlineOnly);
              fetchMembers(1);
            }}
          >
            <Ionicons
              name="radio-button-on"
              size={14}
              color={filterOnlineOnly ? '#22c55e' : '#6b7280'}
            />
            <Text style={[styles.filterChipText, filterOnlineOnly && styles.filterChipTextActive]}>
              Online Only
            </Text>
          </TouchableOpacity>
        </BlurView>
      )}

      {/* Member List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading members...</Text>
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MemberItem member={item} onPress={() => handleMemberPress(item)} />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#10b981"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color="#10b981" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people" size={48} color="#6b7280" />
              <Text style={styles.emptyText}>No members found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  filtersContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  filterRow: {
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 4,
  },
  sortButtonActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  sortButtonText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  sortButtonTextActive: {
    color: '#10b981',
    fontWeight: '600',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  filterChipText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  filterChipTextActive: {
    color: '#22c55e',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  memberAvatar: {
    position: 'relative',
    marginRight: 12,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#111827',
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flexShrink: 1,
  },
  groupBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  groupBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  memberUsername: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  memberStats: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 12,
  },
  memberStat: {
    fontSize: 12,
    color: '#6b7280',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9ca3af',
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
});
