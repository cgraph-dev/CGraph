/**
 * Community member list screen with search and filtering.
 * @module screens/community/member-list-screen
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, type ParamListBase } from '@react-navigation/native';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import api from '../../lib/api';

import { generateFallbackMembers, transformApiMembers, type Member, type UserGroup, type SortField, type SortOrder } from './member-list-screen/types';
import { MemberItem } from './member-list-screen/components/member-item';
import { SearchBar, FilterPanel } from './member-list-screen/components/filter-bar';
import { styles } from './member-list-screen/styles';

/**
 *
 */
export default function MemberListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();

  const [members, setMembers] = useState<Member[]>([]);
  const [_userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [_error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterGroup, _setFilterGroup] = useState<string>('');
  const [filterOnlineOnly, setFilterOnlineOnly] = useState(false);
  const [sortField, setSortField] = useState<SortField>('username');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const fetchMembers = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      try {
        if (pageNum === 1) setIsLoading(true);
        else setIsLoadingMore(true);
        setError(null);
        const params: Record<string, unknown> = { page: pageNum, per_page: 20, sort_by: sortField, sort_order: sortOrder };
        if (searchQuery) params.search = searchQuery;
        if (filterGroup) params.group_id = filterGroup;
        if (filterOnlineOnly) params.online_only = true;

        const response = await api.get('/api/v1/members', { params });
        const { data } = response;
        const memberList = transformApiMembers(data.members || []);
        if (append) setMembers((prev) => [...prev, ...memberList]);
        else setMembers(memberList);
        setTotalPages(data.total_pages || 1);
        setTotalMembers(data.total || memberList.length);
        setPage(pageNum);
      } catch (err) {
        console.error('[MemberList] API error, using fallback:', err);
        if (!append) { setMembers(generateFallbackMembers()); setTotalMembers(5); }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [sortField, sortOrder, searchQuery, filterGroup, filterOnlineOnly]
  );

  const fetchUserGroups = useCallback(async () => {
    try {
      const response = await api.get('/api/v1/user-groups');
      const groups = response.data.groups || [];
      setUserGroups(groups.map((g: Record<string, unknown>) => ({
        id: g.id as string, name: (g.name as string) || 'Unknown', color: (g.color as string) || null, memberCount: (g.member_count as number) || 0,
      })));
    } catch (err) { console.error('[MemberList] Failed to fetch groups:', err); }
  }, []);

  useEffect(() => { fetchMembers(1); fetchUserGroups(); }, []);
  useEffect(() => { const t = setTimeout(() => fetchMembers(1), 300); return () => clearTimeout(t); }, [searchQuery]);

  const handleRefresh = async () => { setIsRefreshing(true); HapticFeedback.light(); await fetchMembers(1); setIsRefreshing(false); };
  const handleLoadMore = () => { if (!isLoadingMore && page < totalPages) fetchMembers(page + 1, true); };
  const handleMemberPress = (member: Member) => { if (__DEV__) console.warn('Navigate to profile:', member.id); };

  const handleSort = (field: SortField) => {
    HapticFeedback.light();
    if (sortField === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
    fetchMembers(1);
  };

  const handleToggleOnline = () => {
    setFilterOnlineOnly(!filterOnlineOnly);
    fetchMembers(1);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#111827', '#0f172a', '#111827']} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => { HapticFeedback.light(); navigation.goBack(); }}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Members</Text>
          <Text style={styles.headerSubtitle}>{totalMembers} total members</Text>
        </View>
        <TouchableOpacity style={styles.headerButton} onPress={() => { HapticFeedback.light(); setShowFilters(!showFilters); }}>
          <Ionicons name="filter" size={22} color={showFilters ? '#10b981' : '#fff'} />
        </TouchableOpacity>
      </View>

      <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <FilterPanel
        visible={showFilters}
        sortField={sortField}
        sortOrder={sortOrder}
        filterOnlineOnly={filterOnlineOnly}
        onSort={handleSort}
        onToggleOnline={handleToggleOnline}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading members...</Text>
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MemberItem member={item} onPress={() => handleMemberPress(item)} />}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#10b981" />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={isLoadingMore ? <View style={styles.loadingMore}><ActivityIndicator size="small" color="#10b981" /></View> : null}
          ListEmptyComponent={<View style={styles.emptyContainer}><Ionicons name="people" size={48} color="#6b7280" /><Text style={styles.emptyText}>No members found</Text></View>}
        />
      )}
    </View>
  );
}
