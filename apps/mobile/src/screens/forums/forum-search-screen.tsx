/**
 * ForumSearchScreen — full-text search across forum threads, posts, and comments.
 *
 * Features:
 * - Debounced search input
 * - Type filter chips (All / Threads / Posts / Comments)
 * - FlatList results with type badge icons
 * - Empty state and loading skeleton
 * - Haptic feedback
 *
 * @module screens/forums/forum-search-screen
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/stores';
import { useForumStore } from '@/stores';
import { ForumsStackParamList } from '../../types';
import TagChips from '../../components/forums/tag-chips';
import type { Tag } from '../../components/forums/tag-chips';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FilterType = 'all' | 'threads' | 'posts' | 'comments';

interface SearchResultItem {
  id: string;
  type: 'thread' | 'post' | 'comment';
  title?: string;
  content?: string;
  author?: { username?: string; display_name?: string };
  forum?: { name?: string; slug?: string };
  inserted_at?: string;
  [key: string]: unknown;
}

type Props = {
  navigation: NativeStackNavigationProp<ForumsStackParamList, 'ForumSearch'>;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'threads', label: 'Threads' },
  { key: 'posts', label: 'Posts' },
  { key: 'comments', label: 'Comments' },
];

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  thread: 'document-text-outline',
  post: 'chatbox-outline',
  comment: 'chatbubble-outline',
};

const TYPE_COLORS: Record<string, string> = {
  thread: '#8B5CF6',
  post: '#3B82F6',
  comment: '#10B981',
};

const DEBOUNCE_MS = 350;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ForumSearchScreen({ navigation }: Props) {
  const { colors } = useThemeStore();
  const searchForums = useForumStore((s) => s.searchForums);
  const searchResults = useForumStore((s) => s.searchResults);
  const loading = useForumStore((s) => s.loading);
  const clearSearch = useForumStore((s) => s.clearSearch);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch available tags on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/v1/forums/tags');
        if (res.ok) {
          const json = (await res.json()) as { data?: Array<{ id: string; name: string; color?: string }> };
          setAvailableTags(json.data || []);
        }
      } catch {
        // Tags are a nice-to-have — fail silently
      }
    })();

    return () => {
      clearSearch();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleTagToggle = useCallback(
    (tagId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedTagIds((prev) => {
        const next = prev.includes(tagId)
          ? prev.filter((id) => id !== tagId)
          : [...prev, tagId];

        // Re-run search with new tag filters
        if (query.trim()) {
          const filterParam = filter === 'all' ? undefined : filter;
          searchForums(query.trim(), {
            ...(filterParam ? { type: filterParam } : {}),
            tag_ids: next.length > 0 ? next : undefined,
          });
        }

        return next;
      });
    },
    [query, filter, searchForums],
  );

  const handleSearch = useCallback(
    (text: string) => {
      setQuery(text);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!text.trim()) {
        clearSearch();
        return;
      }

      debounceRef.current = setTimeout(() => {
        const filterParam = filter === 'all' ? undefined : filter;
        searchForums(text.trim(), filterParam ? { type: filterParam } : undefined);
      }, DEBOUNCE_MS);
    },
    [filter, searchForums, clearSearch],
  );

  const handleFilterChange = useCallback(
    (f: FilterType) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setFilter(f);

      if (query.trim()) {
        const filterParam = f === 'all' ? undefined : f;
        searchForums(query.trim(), filterParam ? { type: filterParam } : undefined);
      }
    },
    [query, searchForums],
  );

  const handleResultPress = useCallback(
    (item: SearchResultItem) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (item.type === 'thread' || item.type === 'post') {
        navigation.navigate('Post', { postId: item.id });
      }
    },
    [navigation],
  );

  // ─── Renderers ──────────────────────────────────────────────────────

  const renderItem = useCallback(
    ({ item }: { item: SearchResultItem }) => {
      const icon = TYPE_ICONS[item.type] || 'document-outline';
      const badgeColor = TYPE_COLORS[item.type] || colors.textSecondary;
      const authorName = item.author?.username || item.author?.display_name || 'unknown';

      return (
        <TouchableOpacity
          style={[styles.resultItem, { backgroundColor: colors.surface }]}
          onPress={() => handleResultPress(item)}
          activeOpacity={0.7}
        >
          {/* Type badge */}
          <View style={[styles.typeBadge, { backgroundColor: badgeColor + '20' }]}>
            <Ionicons name={icon} size={18} color={badgeColor} />
          </View>

          <View style={styles.resultContent}>
            {item.title && (
              <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={2}>
                {item.title}
              </Text>
            )}
            {item.content && (
              <Text
                style={[styles.resultSnippet, { color: colors.textSecondary }]}
                numberOfLines={2}
              >
                {item.content}
              </Text>
            )}
            <View style={styles.resultMeta}>
              <Text style={[styles.resultMetaText, { color: colors.textTertiary }]}>
                {item.type} • u/{authorName}
                {item.forum ? ` • ${item.forum.name}` : ''}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [colors, handleResultPress],
  );

  const renderEmpty = useCallback(() => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={[styles.skeleton, { backgroundColor: colors.surfaceHover }]}
            />
          ))}
        </View>
      );
    }

    if (query.trim()) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No results found for &quot;{query}&quot;
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Search threads, posts, and comments
        </Text>
      </View>
    );
  }, [loading, query, colors]);

  // ─── Layout ─────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={[styles.inputWrapper, { backgroundColor: colors.input }]}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Search forums..."
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={handleSearch}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter chips */}
      <View style={[styles.filterRow, { backgroundColor: colors.surface }]}>
        {FILTERS.map((f) => {
          const isActive = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.chip,
                {
                  backgroundColor: isActive ? colors.primary + '20' : colors.surfaceHover,
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
              onPress={() => handleFilterChange(f.key)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: isActive ? colors.primary : colors.textSecondary },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tag filter chips */}
      {availableTags.length > 0 && (
        <TagChips
          tags={availableTags}
          selectedIds={selectedTagIds}
          onToggle={handleTagToggle}
        />
      )}

      {/* Results */}
      <FlatList
        data={searchResults as SearchResultItem[]}
        renderItem={renderItem}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          loading && searchResults.length > 0 ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginBottom: 12 }} />
          ) : null
        }
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
    flexGrow: 1,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    gap: 12,
  },
  typeBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  resultSnippet: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultMetaText: {
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  skeleton: {
    width: '100%',
    height: 64,
    borderRadius: 10,
    marginBottom: 8,
  },
});
