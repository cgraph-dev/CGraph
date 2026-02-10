/**
 * SavedMessagesScreen - Mobile screen for viewing bookmarked messages
 *
 * Fetches saved/bookmarked messages from the API and displays them
 * in a scrollable list with search, delete, and navigate-to-conversation.
 *
 * @module screens/messages/SavedMessagesScreen
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../lib/api';
import type { MessagesStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<MessagesStackParamList>;

interface SavedMessage {
  id: string;
  message_id: string;
  content: string;
  sender_name: string;
  sender_avatar?: string;
  conversation_id?: string;
  conversation_name?: string;
  saved_at: string;
  note?: string;
}

export default function SavedMessagesScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSaved = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;

      const response = await api.get('/api/v1/saved-messages', { params });
      if (response.data?.data) {
        setMessages(response.data.data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSaved();
  }, [fetchSaved]);

  const handleRemove = useCallback(
    async (id: string) => {
      Alert.alert('Remove Bookmark', 'Remove this saved message?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/v1/saved-messages/${id}`);
              setMessages((prev) => prev.filter((m) => m.id !== id));
            } catch {
              Alert.alert('Error', 'Failed to remove bookmark');
            }
          },
        },
      ]);
    },
    []
  );

  const handleNavigate = useCallback(
    (conversationId?: string) => {
      if (conversationId) {
        navigation.navigate('Conversation', { conversationId });
      }
    },
    [navigation]
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const renderItem = useCallback(
    ({ item }: { item: SavedMessage }) => (
      <TouchableOpacity
        onPress={() => handleNavigate(item.conversation_id)}
        activeOpacity={0.7}
        style={[styles.messageCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={styles.messageHeader}>
          <View style={styles.senderInfo}>
            <View style={[styles.avatar, { backgroundColor: colors.primary + '30' }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {(item.sender_name || '?')[0].toUpperCase()}
              </Text>
            </View>
            <View style={styles.senderMeta}>
              <Text style={[styles.senderName, { color: colors.text }]} numberOfLines={1}>
                {item.sender_name}
              </Text>
              {item.conversation_name && (
                <Text style={[styles.conversationName, { color: colors.textSecondary }]} numberOfLines={1}>
                  in {item.conversation_name}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.headerRight}>
            <Text style={[styles.date, { color: colors.textTertiary }]}>
              {formatDate(item.saved_at)}
            </Text>
            <TouchableOpacity
              onPress={() => handleRemove(item.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.content, { color: colors.text }]} numberOfLines={3}>
          {item.content}
        </Text>

        {item.note && (
          <View style={[styles.noteContainer, { backgroundColor: colors.primary + '10' }]}>
            <Ionicons name="document-text-outline" size={14} color={colors.primary} />
            <Text style={[styles.noteText, { color: colors.primary }]} numberOfLines={2}>
              {item.note}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    ),
    [colors, handleNavigate, handleRemove]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.input || colors.surfaceHover }]}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search saved messages..."
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={messages.length === 0 ? styles.emptyListContainer : styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Ionicons name="bookmark-outline" size={56} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No saved messages</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Long-press any message and tap "Save" to bookmark it here
              </Text>
            </View>
          }
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  emptyListContainer: {
    flex: 1,
  },
  messageCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
  },
  senderMeta: {
    flex: 1,
  },
  senderName: {
    fontSize: 14,
    fontWeight: '600',
  },
  conversationName: {
    fontSize: 12,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  date: {
    fontSize: 12,
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
