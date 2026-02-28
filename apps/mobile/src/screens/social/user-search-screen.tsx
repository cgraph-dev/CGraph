/**
 * UserSearchScreen - Search and add friends on mobile.
 *
 * Debounced search against GET /api/v1/search/users (Meilisearch + ILIKE fallback).
 * Displays results in a FlatList with avatar, display name, @username, and "Add Friend" action.
 *
 * @module screens/social/user-search-screen
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import debounce from 'lodash.debounce';
import { useThemeStore } from '@/stores';
import api from '../../lib/api';
import { createLogger } from '../../lib/logger';

const logger = createLogger('UserSearch');

// ============================================================================
// Types
// ============================================================================

interface UserResult {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  status: string;
}

// ============================================================================
// Result Row
// ============================================================================

function UserResultRow({
  user,
  colors,
  onAddFriend,
  isPending,
}: {
  user: UserResult;
  colors: { text: string; textSecondary: string; card: string; border: string; primary: string; background: string };
  onAddFriend: (userId: string) => void;
  isPending: boolean;
}) {
  const initial = (user.display_name ?? user.username).charAt(0).toUpperCase();

  return (
    <View style={[styles.resultRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Avatar */}
      {user.avatar_url ? (
        <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatarFallback, { backgroundColor: colors.primary + '25' }]}>
          <Text style={[styles.avatarInitial, { color: colors.primary }]}>{initial}</Text>
        </View>
      )}

      {/* Name + username */}
      <View style={styles.nameContainer}>
        <Text style={[styles.displayName, { color: colors.text }]} numberOfLines={1}>
          {user.display_name ?? user.username}
        </Text>
        <Text style={[styles.username, { color: colors.textSecondary }]} numberOfLines={1}>
          @{user.username}
        </Text>
      </View>

      {/* Add Friend button */}
      <TouchableOpacity
        onPress={() => onAddFriend(user.id)}
        disabled={isPending}
        style={[styles.addButton, { backgroundColor: colors.primary, opacity: isPending ? 0.5 : 1 }]}
      >
        <Text style={styles.addButtonText}>{isPending ? 'Sending…' : 'Add Friend'}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================================================
// Empty State
// ============================================================================

function EmptyState({ query, colors }: { query: string; colors: { textSecondary: string } }) {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        {query.length >= 2 ? 'No users found' : 'Search by name or username'}
      </Text>
    </View>
  );
}

// ============================================================================
// Main Screen
// ============================================================================

/**
 * Mobile user search screen.
 *
 * Debounces input by 300ms, calls GET /api/v1/search/users,
 * renders FlatList with avatar, display_name, @username, and "Add Friend" action.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function UserSearchScreen({ navigation: _navigation }: { navigation: any }) {
  const { colors } = useThemeStore();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const latestQuery = useRef(query);
  latestQuery.current = query;

  // Debounced search function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const performSearch = useCallback(
    debounce(async (q: string) => {
      if (q !== latestQuery.current) return;

      setIsLoading(true);
      setError(null);

      try {
        const res = await api.get('/api/v1/search/users', { params: { q } });
        if (q === latestQuery.current) {
          const users = res.data?.users ?? res.data ?? [];
          setResults(Array.isArray(users) ? users : []);
        }
      } catch (err) {
        logger.error('User search failed:', err);
        if (q === latestQuery.current) {
          setError('Failed to search users');
          setResults([]);
        }
      } finally {
        if (q === latestQuery.current) {
          setIsLoading(false);
        }
      }
    }, 300),
    [],
  );

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }
    setIsLoading(true);
    performSearch(query);
  }, [query, performSearch]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      performSearch.cancel();
    };
  }, [performSearch]);

  // Add friend handler
  const handleAddFriend = async (userId: string) => {
    setPendingIds((prev) => new Set(prev).add(userId));
    try {
      await api.post('/api/v1/friends', { receiver_id: userId });
    } catch (err) {
      logger.error('Failed to send friend request:', err);
      Alert.alert('Error', 'Failed to send friend request. Please try again.');
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  // Render item for FlatList
  const renderItem = useCallback(
    ({ item }: { item: UserResult }) => (
      <UserResultRow
        user={item}
        colors={colors}
        onAddFriend={handleAddFriend}
        isPending={pendingIds.has(item.id)}
      />
    ),
    [colors, pendingIds],
  );

  const keyExtractor = useCallback((item: UserResult) => item.id, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search input */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Search users…"
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Error */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}

      {/* Results */}
      {!isLoading && !error && results.length > 0 && (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Empty state */}
      {!isLoading && !error && results.length === 0 && (
        <EmptyState query={query} colors={colors} />
      )}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  errorContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '600',
  },
  nameContainer: {
    flex: 1,
    minWidth: 0,
  },
  displayName: {
    fontSize: 15,
    fontWeight: '600',
  },
  username: {
    fontSize: 13,
    marginTop: 1,
  },
  addButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
});
