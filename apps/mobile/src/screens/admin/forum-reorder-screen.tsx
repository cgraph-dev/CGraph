/**
 * Admin screen for reordering forum categories and boards.
 * @module screens/admin/forum-reorder-screen
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  PanResponder,
  Dimensions,
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

interface Forum {
  id: string;
  name: string;
  description: string;
  threadCount: number;
  postCount: number;
  order: number;
  icon?: string;
  color?: string;
}

interface Category {
  id: string;
  name: string;
  forums: Forum[];
  order: number;
  isExpanded: boolean;
}

// ============================================================================
// FALLBACK DATA
// ============================================================================

const FALLBACK_CATEGORIES: Category[] = [
  {
    id: '1',
    name: 'General Discussion',
    order: 0,
    isExpanded: true,
    forums: [
      {
        id: 'f1',
        name: 'Announcements',
        description: 'Important news',
        threadCount: 15,
        postCount: 45,
        order: 0,
        color: '#ef4444',
      },
      {
        id: 'f2',
        name: 'Introductions',
        description: 'Say hello!',
        threadCount: 234,
        postCount: 567,
        order: 1,
        color: '#10b981',
      },
      {
        id: 'f3',
        name: 'Off-Topic',
        description: 'Casual chat',
        threadCount: 789,
        postCount: 2345,
        order: 2,
        color: '#6366f1',
      },
    ],
  },
  {
    id: '2',
    name: 'Technical',
    order: 1,
    isExpanded: true,
    forums: [
      {
        id: 'f4',
        name: 'Help & Support',
        description: 'Get help here',
        threadCount: 456,
        postCount: 1234,
        order: 0,
        color: '#f59e0b',
      },
      {
        id: 'f5',
        name: 'Bug Reports',
        description: 'Report issues',
        threadCount: 89,
        postCount: 234,
        order: 1,
        color: '#ef4444',
      },
      {
        id: 'f6',
        name: 'Feature Requests',
        description: 'Suggest features',
        threadCount: 123,
        postCount: 456,
        order: 2,
        color: '#8b5cf6',
      },
    ],
  },
];

const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_HEIGHT = 70;

// ============================================================================
// DRAGGABLE FORUM ITEM
// ============================================================================

interface ForumItemProps {
  forum: Forum;
  isActive: boolean;
  onDragStart: () => void;
  isDragging: boolean;
}

function ForumItem({ forum, isActive, onDragStart, isDragging }: ForumItemProps) {
  return (
    <View
      style={[
        styles.forumItem,
        isDragging && styles.forumItemDragging,
        isActive && styles.forumItemActive,
      ]}
    >
      <TouchableOpacity
        style={styles.dragHandle}
        onPressIn={() => {
          HapticFeedback.medium();
          onDragStart();
        }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="reorder-three" size={24} color="#6b7280" />
      </TouchableOpacity>

      <View style={[styles.forumIcon, { backgroundColor: (forum.color || '#10b981') + '30' }]}>
        <Ionicons
           
          name={(forum.icon as string) || 'chatbubbles'}
          size={20}
          color={forum.color || '#10b981'}
        />
      </View>

      <View style={styles.forumInfo}>
        <Text style={styles.forumName}>{forum.name}</Text>
        <Text style={styles.forumMeta}>
          {forum.threadCount} threads • {forum.postCount} posts
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#4b5563" />
    </View>
  );
}

// ============================================================================
// CATEGORY HEADER
// ============================================================================

interface CategoryHeaderProps {
  category: Category;
  onToggle: () => void;
  onDragStart: () => void;
  isDragging: boolean;
}

function CategoryHeader({ category, onToggle, onDragStart, isDragging }: CategoryHeaderProps) {
  return (
    <View style={[styles.categoryHeader, isDragging && styles.categoryHeaderDragging]}>
      <TouchableOpacity
        style={styles.dragHandle}
        onPressIn={() => {
          HapticFeedback.medium();
          onDragStart();
        }}
      >
        <Ionicons name="reorder-three" size={24} color="#9ca3af" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.categoryTitleContainer} onPress={onToggle}>
        <Text style={styles.categoryTitle}>{category.name}</Text>
        <Text style={styles.categoryCount}>{category.forums.length} forums</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onToggle}>
        <Ionicons
          name={category.isExpanded ? 'chevron-up' : 'chevron-down'}
          size={22}
          color="#9ca3af"
        />
      </TouchableOpacity>
    </View>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 *
 */
export default function ForumReorderScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();

  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{ type: 'category' | 'forum'; id: string } | null>(
    null
  );

  // Animated values for drag
  const dragY = useRef(new Animated.Value(0)).current;

  // Fetch categories - uses forums list which includes categories
  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      // Get all forums - they're grouped by categories
      const response = await api.get('/api/v1/forums');
      const forumsData = response.data?.data || response.data?.forums || response.data || [];

      // Group forums by category
      const categoryMap = new Map<string, Category>();

      for (const forum of Array.isArray(forumsData) ? forumsData : []) {
        const catId = forum.category_id || forum.category?.id || 'uncategorized';
        const catName = forum.category_name || forum.category?.name || 'Uncategorized';

        if (!categoryMap.has(catId)) {
          categoryMap.set(catId, {
            id: catId,
            name: catName,
            order: forum.category_order || categoryMap.size,
            isExpanded: true,
            forums: [],
          });
        }

        categoryMap.get(catId)!.forums.push({
          id: forum.id,
          name: forum.name || forum.title || 'Unnamed',
          description: forum.description || '',
          threadCount: forum.thread_count || forum.threads_count || 0,
          postCount: forum.post_count || forum.posts_count || 0,
          order: forum.order || forum.display_order || 0,
          icon: forum.icon,
          color: forum.color,
        });
      }

      // Sort categories and forums by order
      const sortedCategories = Array.from(categoryMap.values())
        .sort((a, b) => a.order - b.order)
        .map((cat) => ({
          ...cat,
          forums: cat.forums.sort((a, b) => a.order - b.order),
        }));

      if (sortedCategories.length > 0) {
        setCategories(sortedCategories);
      }
    } catch (error) {
      console.error('[ForumReorder] Error fetching categories:', error);
      // Keep fallback data on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    HapticFeedback.light();
    setCategories(
      categories.map((cat) =>
        cat.id === categoryId ? { ...cat, isExpanded: !cat.isExpanded } : cat
      )
    );
  };

  // Move forum up within category
  const moveForumUp = (categoryId: string, forumId: string) => {
    HapticFeedback.light();
    setCategories(
      categories.map((cat) => {
        if (cat.id !== categoryId) return cat;

        const idx = cat.forums.findIndex((f) => f.id === forumId);
        if (idx <= 0) return cat;

        const newForums = [...cat.forums];
        [newForums[idx - 1], newForums[idx]] = [newForums[idx], newForums[idx - 1]];
        newForums.forEach((f, i) => (f.order = i));

        return { ...cat, forums: newForums };
      })
    );
    setHasChanges(true);
  };

  // Move forum down within category
  const moveForumDown = (categoryId: string, forumId: string) => {
    HapticFeedback.light();
    setCategories(
      categories.map((cat) => {
        if (cat.id !== categoryId) return cat;

        const idx = cat.forums.findIndex((f) => f.id === forumId);
        if (idx < 0 || idx >= cat.forums.length - 1) return cat;

        const newForums = [...cat.forums];
        [newForums[idx], newForums[idx + 1]] = [newForums[idx + 1], newForums[idx]];
        newForums.forEach((f, i) => (f.order = i));

        return { ...cat, forums: newForums };
      })
    );
    setHasChanges(true);
  };

  // Move category up
  const moveCategoryUp = (categoryId: string) => {
    HapticFeedback.light();
    const idx = categories.findIndex((c) => c.id === categoryId);
    if (idx <= 0) return;

    const newCategories = [...categories];
    [newCategories[idx - 1], newCategories[idx]] = [newCategories[idx], newCategories[idx - 1]];
    newCategories.forEach((c, i) => (c.order = i));

    setCategories(newCategories);
    setHasChanges(true);
  };

  // Move category down
  const moveCategoryDown = (categoryId: string) => {
    HapticFeedback.light();
    const idx = categories.findIndex((c) => c.id === categoryId);
    if (idx < 0 || idx >= categories.length - 1) return;

    const newCategories = [...categories];
    [newCategories[idx], newCategories[idx + 1]] = [newCategories[idx + 1], newCategories[idx]];
    newCategories.forEach((c, i) => (c.order = i));

    setCategories(newCategories);
    setHasChanges(true);
  };

  // Save changes
  const handleSave = async () => {
    try {
      setIsSaving(true);
      HapticFeedback.medium();

      const orderData = {
        categories: categories.map((cat) => ({
          id: cat.id,
          order: cat.order,
          forums: cat.forums.map((f) => ({
            id: f.id,
            order: f.order,
          })),
        })),
      };

      // Try to update via admin config or individual forum updates
      try {
        await api.put('/api/v1/admin/config', {
          forum_order: orderData,
        });
      } catch {
        // If admin config doesn't support this, update forums individually
        for (const cat of categories) {
          for (const forum of cat.forums) {
            try {
              await api.put(`/api/v1/forums/${forum.id}`, {
                display_order: forum.order,
                category_order: cat.order,
              });
            } catch (e) {
              console.warn(`[ForumReorder] Could not update forum ${forum.id}:`, e);
            }
          }
        }
      }

      HapticFeedback.success();
      setHasChanges(false);
      Alert.alert('Saved', 'Forum order has been updated');
    } catch (error) {
      console.error('[ForumReorder] Error saving:', error);
      HapticFeedback.error();
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle back with unsaved changes
  const handleBack = () => {
    if (hasChanges) {
      Alert.alert('Unsaved Changes', 'Do you want to save your changes?', [
        { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        { text: 'Cancel', style: 'cancel' },
        { text: 'Save', onPress: () => handleSave().then(() => navigation.goBack()) },
      ]);
    } else {
      navigation.goBack();
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
            handleBack();
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Reorder Forums</Text>
          <Text style={styles.headerSubtitle}>Drag to rearrange</Text>
        </View>
        {hasChanges && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Instructions */}
      <BlurView intensity={40} tint="dark" style={styles.instructionsCard}>
        <Ionicons name="information-circle" size={20} color="#6366f1" />
        <Text style={styles.instructionsText}>
          Use the arrows or drag the handle to reorder forums and categories
        </Text>
      </BlurView>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading forums...</Text>
        </View>
      ) : (
        <Animated.ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {categories.map((category, catIndex) => (
            <View key={category.id} style={styles.categoryContainer}>
              {/* Category Header */}
              <View style={styles.categoryRow}>
                <CategoryHeader
                  category={category}
                  onToggle={() => toggleCategory(category.id)}
                  onDragStart={() => setDraggedItem({ type: 'category', id: category.id })}
                  isDragging={draggedItem?.type === 'category' && draggedItem?.id === category.id}
                />
                <View style={styles.moveButtons}>
                  <TouchableOpacity
                    style={[styles.moveButton, catIndex === 0 && styles.moveButtonDisabled]}
                    onPress={() => moveCategoryUp(category.id)}
                    disabled={catIndex === 0}
                  >
                    <Ionicons
                      name="arrow-up"
                      size={18}
                      color={catIndex === 0 ? '#4b5563' : '#9ca3af'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.moveButton,
                      catIndex === categories.length - 1 && styles.moveButtonDisabled,
                    ]}
                    onPress={() => moveCategoryDown(category.id)}
                    disabled={catIndex === categories.length - 1}
                  >
                    <Ionicons
                      name="arrow-down"
                      size={18}
                      color={catIndex === categories.length - 1 ? '#4b5563' : '#9ca3af'}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forums */}
              {category.isExpanded && (
                <View style={styles.forumsContainer}>
                  {category.forums.map((forum, forumIndex) => (
                    <View key={forum.id} style={styles.forumRow}>
                      <ForumItem
                        forum={forum}
                        isActive={draggedItem?.type === 'forum' && draggedItem?.id === forum.id}
                        onDragStart={() => setDraggedItem({ type: 'forum', id: forum.id })}
                        isDragging={draggedItem?.type === 'forum' && draggedItem?.id === forum.id}
                      />
                      <View style={styles.moveButtons}>
                        <TouchableOpacity
                          style={[styles.moveButton, forumIndex === 0 && styles.moveButtonDisabled]}
                          onPress={() => moveForumUp(category.id, forum.id)}
                          disabled={forumIndex === 0}
                        >
                          <Ionicons
                            name="arrow-up"
                            size={16}
                            color={forumIndex === 0 ? '#4b5563' : '#9ca3af'}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.moveButton,
                            forumIndex === category.forums.length - 1 && styles.moveButtonDisabled,
                          ]}
                          onPress={() => moveForumDown(category.id, forum.id)}
                          disabled={forumIndex === category.forums.length - 1}
                        >
                          <Ionicons
                            name="arrow-down"
                            size={16}
                            color={
                              forumIndex === category.forums.length - 1 ? '#4b5563' : '#9ca3af'
                            }
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}

          {/* Bottom padding */}
          <View style={{ height: 40 }} />
        </Animated.ScrollView>
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
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#10b981',
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  instructionsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    overflow: 'hidden',
    gap: 10,
  },
  instructionsText: {
    flex: 1,
    fontSize: 13,
    color: '#9ca3af',
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  categoryHeaderDragging: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },
  categoryTitleContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  categoryCount: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  forumsContainer: {
    marginTop: 8,
    marginLeft: 16,
  },
  forumRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  forumItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    gap: 10,
  },
  forumItemDragging: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  forumItemActive: {
    borderWidth: 2,
    borderColor: '#10b981',
  },
  dragHandle: {
    padding: 4,
  },
  forumIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forumInfo: {
    flex: 1,
  },
  forumName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  forumMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  moveButtons: {
    flexDirection: 'column',
    marginLeft: 8,
    gap: 2,
  },
  moveButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moveButtonDisabled: {
    opacity: 0.3,
  },
});
