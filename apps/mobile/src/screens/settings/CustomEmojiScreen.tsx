import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import api from '../../lib/api';

// ============================================================================
// Types
// ============================================================================

interface CustomEmoji {
  id: string;
  name: string;
  shortcode: string;
  imageUrl: string;
  category: string;
  createdBy: string;
  createdAt: string;
  usageCount: number;
  isAnimated: boolean;
}

interface EmojiCategory {
  id: string;
  name: string;
  count: number;
}

// ============================================================================
// FALLBACK DATA
// ============================================================================

const FALLBACK_CATEGORIES: EmojiCategory[] = [
  { id: 'all', name: 'All', count: 12 },
  { id: 'reactions', name: 'Reactions', count: 5 },
  { id: 'memes', name: 'Memes', count: 4 },
  { id: 'custom', name: 'Custom', count: 3 },
];

const FALLBACK_EMOJIS: CustomEmoji[] = [
  { id: '1', name: 'Party Parrot', shortcode: 'partyparrot', imageUrl: '', category: 'reactions', createdBy: 'admin', createdAt: '2025-01-01', usageCount: 1234, isAnimated: true },
  { id: '2', name: 'Thumbs Up', shortcode: 'thumbsup', imageUrl: '', category: 'reactions', createdBy: 'admin', createdAt: '2025-01-01', usageCount: 892, isAnimated: false },
  { id: '3', name: 'Fire', shortcode: 'fire', imageUrl: '', category: 'reactions', createdBy: 'admin', createdAt: '2025-01-01', usageCount: 756, isAnimated: false },
  { id: '4', name: 'LOL', shortcode: 'lol', imageUrl: '', category: 'memes', createdBy: 'user1', createdAt: '2025-02-15', usageCount: 543, isAnimated: true },
  { id: '5', name: 'Sad Cat', shortcode: 'sadcat', imageUrl: '', category: 'memes', createdBy: 'user2', createdAt: '2025-03-20', usageCount: 321, isAnimated: false },
];

// ============================================================================
// EMOJI ITEM COMPONENT
// ============================================================================

interface EmojiItemProps {
  emoji: CustomEmoji;
  onPress: () => void;
  onLongPress: () => void;
}

function EmojiItem({ emoji, onPress, onLongPress }: EmojiItemProps) {
  return (
    <TouchableOpacity
      style={styles.emojiItem}
      onPress={() => {
        HapticFeedback.light();
        onPress();
      }}
      onLongPress={() => {
        HapticFeedback.medium();
        onLongPress();
      }}
      activeOpacity={0.7}
    >
      <View style={styles.emojiPreview}>
        {emoji.imageUrl ? (
          <Image source={{ uri: emoji.imageUrl }} style={styles.emojiImage} />
        ) : (
          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.emojiPlaceholder}
          >
            <Text style={styles.emojiPlaceholderText}>
              :{emoji.shortcode.substring(0, 2)}:
            </Text>
          </LinearGradient>
        )}
        {emoji.isAnimated && (
          <View style={styles.animatedBadge}>
            <Ionicons name="play" size={8} color="#fff" />
          </View>
        )}
      </View>
      <Text style={styles.emojiName} numberOfLines={1}>
        {emoji.name}
      </Text>
      <Text style={styles.emojiShortcode}>:{emoji.shortcode}:</Text>
    </TouchableOpacity>
  );
}

// ============================================================================
// ADD EMOJI MODAL
// ============================================================================

interface AddEmojiModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (name: string, shortcode: string, imageUri: string, category: string) => void;
  categories: EmojiCategory[];
}

function AddEmojiModal({ visible, onClose, onSubmit, categories }: AddEmojiModalProps) {
  const [name, setName] = useState('');
  const [shortcode, setShortcode] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [category, setCategory] = useState('custom');

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter an emoji name');
      return;
    }
    if (!shortcode.trim()) {
      Alert.alert('Error', 'Please enter a shortcode');
      return;
    }
    if (!imageUri) {
      Alert.alert('Error', 'Please select an image');
      return;
    }

    onSubmit(name.trim(), shortcode.trim().toLowerCase(), imageUri, category);
    setName('');
    setShortcode('');
    setImageUri('');
    setCategory('custom');
  };

  const filteredCategories = categories.filter(c => c.id !== 'all');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={80} tint="dark" style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Custom Emoji</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* Image Picker */}
          <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.pickedImage} />
            ) : (
              <View style={styles.imagePickerPlaceholder}>
                <Ionicons name="image" size={32} color="#6b7280" />
                <Text style={styles.imagePickerText}>Tap to select image</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Party Parrot"
              placeholderTextColor="#6b7280"
            />
          </View>

          {/* Shortcode Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Shortcode</Text>
            <View style={styles.shortcodeInput}>
              <Text style={styles.shortcodePrefix}>:</Text>
              <TextInput
                style={styles.shortcodeField}
                value={shortcode}
                onChangeText={(text) => setShortcode(text.replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder="partyparrot"
                placeholderTextColor="#6b7280"
                autoCapitalize="none"
              />
              <Text style={styles.shortcodeSuffix}>:</Text>
            </View>
          </View>

          {/* Category Selector */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryButtons}>
              {filteredCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    category === cat.id && styles.categoryButtonSelected,
                  ]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    category === cat.id && styles.categoryButtonTextSelected,
                  ]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={styles.submitButtonGradient}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Add Emoji</Text>
            </LinearGradient>
          </TouchableOpacity>
        </BlurView>
      </View>
    </Modal>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CustomEmojiScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  
  const [emojis, setEmojis] = useState<CustomEmoji[]>(FALLBACK_EMOJIS);
  const [categories, setCategories] = useState<EmojiCategory[]>(FALLBACK_CATEGORIES);
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
        setEmojis(data.emojis.map((e: any) => ({
          id: e.id,
          name: e.name || 'Unnamed',
          shortcode: e.shortcode || 'emoji',
          imageUrl: e.image_url || '',
          category: e.category || 'custom',
          createdBy: e.created_by || 'Unknown',
          createdAt: e.created_at || '',
          usageCount: e.usage_count || 0,
          isAnimated: e.is_animated || false,
        })));
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
  }, []);

  // Filter emojis
  const filteredEmojis = emojis.filter((emoji) => {
    const matchesCategory = selectedCategory === 'all' || emoji.category === selectedCategory;
    const matchesSearch = searchQuery === '' ||
      emoji.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emoji.shortcode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Handle emoji details
  const handleEmojiPress = (emoji: CustomEmoji) => {
    Alert.alert(
      emoji.name,
      `Shortcode: :${emoji.shortcode}:\nCategory: ${emoji.category}\nUsed ${emoji.usageCount} times`,
      [
        { text: 'Copy Shortcode', onPress: () => {} },
        { text: 'Close' },
      ]
    );
  };

  // Handle emoji options
  const handleEmojiLongPress = (emoji: CustomEmoji) => {
    Alert.alert(
      emoji.name,
      'What would you like to do?',
      [
        { text: 'Copy Shortcode', onPress: () => {} },
        { text: 'Delete', style: 'destructive', onPress: () => {
          setEmojis(emojis.filter(e => e.id !== emoji.id));
        }},
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Handle add emoji
  const handleAddEmoji = async (name: string, shortcode: string, imageUri: string, category: string) => {
    try {
      HapticFeedback.medium();
      
      // In real app, upload image and create emoji via API
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
              <Text style={[
                styles.categoryTabText,
                selectedCategory === item.id && styles.categoryTabTextSelected,
              ]}>
                {item.name}
              </Text>
              <View style={[
                styles.categoryCount,
                selectedCategory === item.id && styles.categoryCountSelected,
              ]}>
                <Text style={[
                  styles.categoryCountText,
                  selectedCategory === item.id && styles.categoryCountTextSelected,
                ]}>
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
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowAddModal(true)}
              >
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b981',
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
  categoryTabs: {
    marginBottom: 12,
  },
  categoryTabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 6,
  },
  categoryTabSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  categoryTabText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  categoryTabTextSelected: {
    color: '#10b981',
    fontWeight: '600',
  },
  categoryCount: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryCountSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
  },
  categoryCountText: {
    fontSize: 11,
    color: '#6b7280',
  },
  categoryCountTextSelected: {
    color: '#10b981',
  },
  emojiGrid: {
    paddingHorizontal: 12,
    paddingBottom: 40,
  },
  emojiItem: {
    width: '25%',
    padding: 8,
    alignItems: 'center',
  },
  emojiPreview: {
    position: 'relative',
    width: 56,
    height: 56,
    marginBottom: 6,
  },
  emojiImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  emojiPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiPlaceholderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  animatedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
    textAlign: 'center',
  },
  emojiShortcode: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#10b981',
    borderRadius: 20,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  imagePicker: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    marginBottom: 20,
  },
  pickedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  imagePickerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#374151',
    borderStyle: 'dashed',
    borderRadius: 12,
    margin: 2,
  },
  imagePickerText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#fff',
  },
  shortcodeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  shortcodePrefix: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
  },
  shortcodeField: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
  },
  shortcodeSuffix: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  categoryButtonSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  categoryButtonTextSelected: {
    color: '#10b981',
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
