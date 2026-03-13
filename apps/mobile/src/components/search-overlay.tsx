/**
 * Search Overlay (Mobile) — Full-screen search with grouped results
 *
 * Features:
 * - Search input with cancel
 * - Results grouped by type
 * - Recent searches section
 * - Trending/suggested searches
 *
 * @module components/search-overlay
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  Platform,
  Keyboard,
} from 'react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ── Types ──────────────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  type: 'message' | 'user' | 'channel' | 'thread';
  title: string;
  subtitle?: string;
  avatar?: string;
}

interface SearchOverlayProps {
  visible: boolean;
  onClose: () => void;
  results?: SearchResult[];
  recentSearches?: string[];
  trendingSearches?: string[];
  onSearch?: (query: string) => void;
  onSelectResult?: (result: SearchResult) => void;
  onSelectRecent?: (query: string) => void;
}

// ── Type Icons ─────────────────────────────────────────────────────────

const typeIcons: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  message: 'chat-outline',
  user: 'account-outline',
  channel: 'pound',
  thread: 'text-box-outline',
};

// ── Component ──────────────────────────────────────────────────────────

/** Description. */
/** Search Overlay component. */
export function SearchOverlay({
  visible,
  onClose,
  results = [],
  recentSearches = [],
  trendingSearches = [],
  onSearch,
  onSelectResult,
  onSelectRecent,
}: SearchOverlayProps): React.ReactElement | null {
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [visible]);

  useEffect(() => {
    if (!query.trim()) return;
    const t = setTimeout(() => onSearch?.(query), 200);
    return () => clearTimeout(t);
  }, [query, onSearch]);

  const handleCancel = useCallback(() => {
    Keyboard.dismiss();
    onClose();
  }, [onClose]);

  if (!visible) return null;

  return (
    <Animated.View entering={SlideInUp.duration(250)} style={styles.container}>
      {/* Search bar */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color="rgba(255,255,255,0.3)" />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Search..."
            placeholderTextColor="rgba(255,255,255,0.25)"
            style={styles.input}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={16} color="rgba(255,255,255,0.3)" />
            </Pressable>
          )}
        </View>
        <Pressable onPress={handleCancel} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>

      {/* Content */}
      {!query.trim() ? (
        /* Recent + trending */
        <FlatList
          data={[
            ...recentSearches.map((s) => ({ type: 'recent' as const, value: s })),
            ...trendingSearches.map((s) => ({ type: 'trending' as const, value: s })),
          ]}
          keyExtractor={(item, i) => `${item.type}-${i}`}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                setQuery(item.value);
                onSelectRecent?.(item.value);
              }}
              style={styles.recentItem}
            >
              <MaterialCommunityIcons
                name={item.type === 'recent' ? 'clock-outline' : 'trending-up'}
                size={16}
                color="rgba(255,255,255,0.3)"
              />
              <Text style={styles.recentText}>{item.value}</Text>
            </Pressable>
          )}
          ListHeaderComponent={
            recentSearches.length > 0 ? (
              <Text style={styles.sectionHeader}>Recent Searches</Text>
            ) : null
          }
          style={styles.list}
        />
      ) : (
        /* Results */
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable onPress={() => onSelectResult?.(item)} style={styles.resultItem}>
              {item.avatar ? (
                <Animated.Image
                  entering={FadeIn.duration(200)}
                  source={{ uri: item.avatar }}
                  style={styles.resultAvatar}
                />
              ) : (
                <View style={styles.resultIcon}>
                  <MaterialCommunityIcons
                    name={typeIcons[item.type] || 'magnify'}
                    size={18}
                    color="rgba(255,255,255,0.3)"
                  />
                </View>
              )}
              <View style={styles.resultContent}>
                <Text style={styles.resultTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.subtitle && (
                  <Text style={styles.resultSubtitle} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                )}
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={16}
                color="rgba(255,255,255,0.15)"
              />
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="magnify" size={40} color="rgba(255,255,255,0.1)" />
              <Text style={styles.emptyText}>No results found</Text>
            </View>
          }
          style={styles.list}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </Animated.View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1b1e',
    paddingTop: Platform.OS === 'ios' ? 54 : 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
  },
  cancelBtn: {
    paddingVertical: 4,
  },
  cancelText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
  },
  list: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.2)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  recentText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  resultAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  resultIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  resultSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.2)',
  },
});

export default SearchOverlay;
