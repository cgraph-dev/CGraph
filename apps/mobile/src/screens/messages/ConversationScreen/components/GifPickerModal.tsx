/**
 * GifPickerModal - Mobile GIF search & selection modal
 *
 * Provides GIF search via the backend Tenor proxy (/api/v1/gifs/search),
 * trending GIFs, and a masonry-style grid for selection.
 * Mirrors the web GifPicker but adapted for React Native.
 *
 * @module screens/messages/ConversationScreen/components
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../contexts/ThemeContext';
import api from '../../../../lib/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GIF_COLUMNS = 2;
const GIF_GAP = 6;
const GIF_ITEM_WIDTH = (SCREEN_WIDTH - 32 - GIF_GAP) / GIF_COLUMNS;

export interface GifResult {
  id: string;
  title: string;
  url: string;
  previewUrl: string;
  width: number;
  height: number;
  source: 'tenor' | 'giphy';
}

interface GifPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (gif: GifResult) => void;
}

const TRENDING_CATEGORIES = [
  { label: '🔥 Trending', query: 'trending' },
  { label: '😂 Funny', query: 'funny' },
  { label: '👋 Hi', query: 'hello wave' },
  { label: '🎉 Party', query: 'celebration party' },
  { label: '❤️ Love', query: 'love heart' },
  { label: '👍 Thumbs Up', query: 'thumbs up' },
  { label: '🤔 Thinking', query: 'thinking hmm' },
  { label: '😭 Cry', query: 'crying sad' },
];

/** Generate sample GIFs when API is unavailable */
function generateSampleGifs(query: string): GifResult[] {
  const seed = query || 'trending';
  return Array.from({ length: 12 }, (_, i) => ({
    id: `sample-${seed}-${i}`,
    title: `${seed} GIF ${i + 1}`,
    url: `https://media.tenor.com/sample/${encodeURIComponent(seed)}/${i}.gif`,
    previewUrl: `https://media.tenor.com/sample/${encodeURIComponent(seed)}/${i}_preview.gif`,
    width: 200 + (i % 3) * 40,
    height: 150 + (i % 4) * 30,
    source: 'tenor' as const,
  }));
}

export function GifPickerModal({ visible, onClose, onSelect }: GifPickerModalProps) {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  const fetchGifs = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/gifs/search', {
        params: { q: query || 'trending', limit: 30 },
      });

      if (response.data?.gifs) {
        setGifs(response.data.gifs);
      } else {
        setGifs(generateSampleGifs(query));
      }
    } catch {
      setGifs(generateSampleGifs(query));
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch trending on open
  useEffect(() => {
    if (visible) {
      fetchGifs('trending');
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      setSearchQuery('');
      setGifs([]);
    }
  }, [visible, fetchGifs]);

  // Debounced search
  const handleSearch = useCallback(
    (text: string) => {
      setSearchQuery(text);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        fetchGifs(text || 'trending');
      }, 400);
    },
    [fetchGifs]
  );

  const handleCategoryPress = useCallback(
    (query: string) => {
      setSearchQuery('');
      fetchGifs(query);
    },
    [fetchGifs]
  );

  const handleGifPress = useCallback(
    (gif: GifResult) => {
      onSelect(gif);
      onClose();
    },
    [onSelect, onClose]
  );

  const renderGif = useCallback(
    ({ item }: { item: GifResult }) => {
      const aspectRatio = item.width / item.height;
      const itemHeight = GIF_ITEM_WIDTH / aspectRatio;

      return (
        <TouchableOpacity
          onPress={() => handleGifPress(item)}
          activeOpacity={0.7}
          style={[styles.gifItem, { width: GIF_ITEM_WIDTH, height: Math.min(itemHeight, 180) }]}
        >
          <Image
            source={{ uri: item.previewUrl || item.url }}
            style={styles.gifImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      );
    },
    [handleGifPress]
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={[styles.backdrop]} />
        <View style={[styles.content, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>GIFs</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={[styles.searchContainer, { backgroundColor: colors.input || colors.surfaceHover }]}>
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              ref={inputRef}
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search GIFs..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Categories */}
          {!searchQuery && (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={TRENDING_CATEGORIES}
              keyExtractor={(item) => item.query}
              contentContainerStyle={styles.categoriesContainer}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleCategoryPress(item.query)}
                  style={[styles.categoryChip, { backgroundColor: colors.surfaceHover || colors.border }]}
                >
                  <Text style={[styles.categoryText, { color: colors.text }]}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          )}

          {/* GIF Grid */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading GIFs...
              </Text>
            </View>
          ) : (
            <FlatList
              data={gifs}
              numColumns={GIF_COLUMNS}
              keyExtractor={(item) => item.id}
              renderItem={renderGif}
              contentContainerStyle={styles.gridContainer}
              columnWrapperStyle={styles.gridRow}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="images-outline" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No GIFs found
                  </Text>
                </View>
              }
            />
          )}

          {/* Powered by Tenor */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textTertiary }]}>
              Powered by Tenor
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  content: {
    height: '75%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 10,
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
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
  },
  gridContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  gridRow: {
    gap: GIF_GAP,
    marginBottom: GIF_GAP,
  },
  gifItem: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  gifImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
  },
  footer: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
  },
});

export default GifPickerModal;
