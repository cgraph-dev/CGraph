/**
 * CustomEmojiScreen - Main Screen
 *
 * Custom emoji management screen with grid display,
 * category filtering, search, and add modal.
 *
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, type ParamListBase } from '@react-navigation/native';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import api from '../../../lib/api';
import type { CustomEmoji, FALLBACK_CATEGORIES, FALLBACK_EMOJIS } from './types';
import { EmojiItem } from './emoji-item';
import { AddEmojiModal } from './add-emoji-modal';
import { styles } from './styles';

/**
 *
 */
export default function CustomEmojiScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();

  const [emojis, setEmojis] = useState<CustomEmoji[]>(FALLBACK_EMOJIS);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch emojis
  const fetchEmojis = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/v1/emojis/custom');
      const data = response.data;

      if (data.emojis) {
        setEmojis(
          data.emojis.map((e: Record<string, unknown>) => ({
            id: e.id,
            name: e.name || 'Unnamed',
            shortcode: e.shortcode || 'emoji',
            imageUrl: e.image_url || '',
            category: e.category || 'custom',
            createdBy: e.created_by || 'Unknown',
            createdAt: e.created_at || '',
            usageCount: e.usage_count || 0,
            isAnimated: e.is_animated || false,
          }))
        );
      }

      if (data.categories) {
        setCategories([
          { id: 'all', name: 'All', count: data.emojis?.length || 0 },
          ...data.categories,
        ]);
      }
    } catch (error) {
      console.error('[CustomEmoji] Error fetching emojis:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmojis();
  }, [fetchEmojis]);

  // Filter emojis
  const filteredEmojis = emojis.filter((emoji) => {
    const matchesCategory = selectedCategory === 'all' || emoji.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      emoji.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emoji.shortcode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Handle emoji details
  const handleEmojiPress = (emoji: CustomEmoji) => {
    Alert.alert(
      emoji.name,
      `Shortcode: :${emoji.shortcode}:\nCategory: ${emoji.category}\nUsed ${emoji.usageCount} times`,
      [{ text: 'Copy Shortcode', onPress: () => {} }, { text: 'Close' }]
    );
  };

  // Handle emoji options
  const handleEmojiLongPress = (emoji: CustomEmoji) => {
    Alert.alert(emoji.name, 'What would you like to do?', [
      { text: 'Copy Shortcode', onPress: () => {} },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setEmojis(emojis.filter((e) => e.id !== emoji.id));
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // Handle add emoji
  const handleAddEmoji = async (
    name: string,
    shortcode: string,
    imageUri: string,
    category: string
  ) => {
    try {
      HapticFeedback.medium();

      const newEmoji: CustomEmoji = {
        id: Date.now().toString(),
        name,
        shortcode,
        imageUrl: imageUri,
        category,
        createdBy: 'me',
        createdAt: new Date().toISOString(),
        usageCount: 0,
        isAnimated: false,
      };

      setEmojis([newEmoji, ...emojis]);
      setShowAddModal(false);
      HapticFeedback.success();
    } catch (error) {
      console.error('[CustomEmoji] Error adding emoji:', error);
      Alert.alert('Error', 'Failed to add emoji');
    }
  };

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
          <Text style={styles.headerTitle}>Custom Emojis</Text>
          <Text style={styles.headerSubtitle}>{emojis.length} emojis</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            HapticFeedback.light();
            setShowAddModal(true);
          }}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search emojis..."
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

      {/* Category Tabs */}
      <View style={styles.categoryTabs}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryTabsContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryTab,
                selectedCategory === item.id && styles.categoryTabSelected,
              ]}
              onPress={() => {
                HapticFeedback.light();
                setSelectedCategory(item.id);
              }}
            >
              <Text
                style={[
                  styles.categoryTabText,
                  selectedCategory === item.id && styles.categoryTabTextSelected,
                ]}
              >
                {item.name}
              </Text>
              <View
                style={[
                  styles.categoryCount,
                  selectedCategory === item.id && styles.categoryCountSelected,
                ]}
              >
                <Text
                  style={[
                    styles.categoryCountText,
                    selectedCategory === item.id && styles.categoryCountTextSelected,
                  ]}
                >
                  {item.count}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Emoji Grid */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading emojis...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredEmojis}
          keyExtractor={(item) => item.id}
          numColumns={4}
          contentContainerStyle={styles.emojiGrid}
          renderItem={({ item }) => (
            <EmojiItem
              emoji={item}
              onPress={() => handleEmojiPress(item)}
              onLongPress={() => handleEmojiLongPress(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="happy-outline" size={48} color="#6b7280" />
              <Text style={styles.emptyText}>No emojis found</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={() => setShowAddModal(true)}>
                <Text style={styles.emptyButtonText}>Add your first emoji</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Add Emoji Modal */}
      <AddEmojiModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddEmoji}
        categories={categories}
      />
    </View>
  );
}
