/**
 * Search results display component.
 * @module screens/search/search-screen/search-results
 */
import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import {
  type SearchUser,
  type SearchGroup,
  type SearchForum,
  UserResultItem,
  GroupResultItem,
  ForumResultItem,
  DiscoverySection,
} from './components';
import type { SearchCategory } from './constants';
import { styles } from './styles';
import type { ThemeColors } from '@/stores';

interface SearchResultsProps {
  loading: boolean;
  hasSearched: boolean;
  totalResults: number;
  users: SearchUser[];
  groups: SearchGroup[];
  forums: SearchForum[];
  category: SearchCategory;
  setCategory: (cat: SearchCategory) => void;
  recentSearches: string[];
  onSearchSelect: (q: string) => void;
  onRemoveSearch: (q: string) => void;
  onClearRecentSearches: () => void;
  onFocusInput: () => void;
  colors: ThemeColors;
  isDark: boolean;
}

/** Description. */
/** Search Results component. */
export function SearchResults({
  loading,
  hasSearched,
  totalResults,
  users,
  groups,
  forums,
  category,
  setCategory,
  recentSearches,
  onSearchSelect,
  onRemoveSearch,
  onClearRecentSearches,
  onFocusInput,
  colors,
  isDark,
}: SearchResultsProps) {
  return (
    <ScrollView
      style={styles.results}
      contentContainerStyle={styles.resultsContent}
      showsVerticalScrollIndicator={false}
    >
      {loading && (
        <View style={styles.loadingContainer}>
          <LinearGradient colors={['#3b82f6', '#8b5cf6']} style={styles.loadingGradient}>
            <ActivityIndicator size="small" color="#fff" />
          </LinearGradient>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Searching...</Text>
        </View>
      )}

      {!loading && !hasSearched && (
        <DiscoverySection
          recentSearches={recentSearches}
          onSearchSelect={onSearchSelect}
          onRemoveSearch={onRemoveSearch}
          onClearRecentSearches={onClearRecentSearches}
          onCategorySelect={setCategory}
          onFocusInput={onFocusInput}
          colors={colors}
          isDark={isDark}
        />
      )}

      {!loading && hasSearched && totalResults === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>😕</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No results found</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Try different keywords or{'\n'}search in a specific category
          </Text>
        </View>
      )}

      {!loading && hasSearched && totalResults > 0 && (
        <>
          {(category === 'all' || category === 'users') && users.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <LinearGradient colors={['#10b981', '#059669']} style={styles.sectionIcon}>
                  <Ionicons name="person" size={12} color="#fff" />
                </LinearGradient>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  USERS ({users.length})
                </Text>
              </View>
              {(category === 'all' ? users.slice(0, 3) : users).map((user, i) => (
                <UserResultItem key={user.id} user={user} index={i} colors={colors} />
              ))}
              {category === 'all' && users.length > 3 && (
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCategory('users');
                  }}
                >
                  <Text style={[styles.viewAll, { color: colors.primary }]}>
                    View all {users.length} users →
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {(category === 'all' || category === 'groups') && groups.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <LinearGradient colors={['#f59e0b', '#f97316']} style={styles.sectionIcon}>
                  <Ionicons name="people" size={12} color="#fff" />
                </LinearGradient>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  GROUPS ({groups.length})
                </Text>
              </View>
              {(category === 'all' ? groups.slice(0, 3) : groups).map((group, i) => (
                <GroupResultItem key={group.id} group={group} index={i} colors={colors} />
              ))}
              {category === 'all' && groups.length > 3 && (
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCategory('groups');
                  }}
                >
                  <Text style={[styles.viewAll, { color: colors.primary }]}>
                    View all {groups.length} groups →
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {(category === 'all' || category === 'forums') && forums.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <LinearGradient colors={['#ec4899', '#f43f5e']} style={styles.sectionIcon}>
                  <Ionicons name="newspaper" size={12} color="#fff" />
                </LinearGradient>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  FORUMS ({forums.length})
                </Text>
              </View>
              {(category === 'all' ? forums.slice(0, 3) : forums).map((forum, i) => (
                <ForumResultItem key={forum.id} forum={forum} index={i} colors={colors} />
              ))}
              {category === 'all' && forums.length > 3 && (
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCategory('forums');
                  }}
                >
                  <Text style={[styles.viewAll, { color: colors.primary }]}>
                    View all {forums.length} forums →
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}
