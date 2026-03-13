/**
 * Admin screen for reordering forum categories and boards.
 * @module screens/admin/forum-reorder-screen
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, type ParamListBase } from '@react-navigation/native';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import api from '../../lib/api';

import { FALLBACK_CATEGORIES, type Category } from './forum-reorder-screen/types';
import { ForumItem } from './forum-reorder-screen/components/forum-item';
import { CategoryHeader } from './forum-reorder-screen/components/category-header';
import { ReorderHeader } from './forum-reorder-screen/components/reorder-header';
import { styles } from './forum-reorder-screen/styles';

/**
 * Forum Reorder Screen component.
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
  const _dragY = useRef(new Animated.Value(0)).current;

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/v1/forums');
      const forumsData = response.data?.data || response.data?.forums || response.data || [];
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
        categoryMap.get(catId)?.forums.push({
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

      const sortedCategories = Array.from(categoryMap.values())
        .sort((a, b) => a.order - b.order)
        .map((cat) => ({ ...cat, forums: cat.forums.sort((a, b) => a.order - b.order) }));
      if (sortedCategories.length > 0) setCategories(sortedCategories);
    } catch (error) {
      console.error('[ForumReorder] Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleCategory = (categoryId: string) => {
    HapticFeedback.light();
    setCategories(
      categories.map((cat) =>
        cat.id === categoryId ? { ...cat, isExpanded: !cat.isExpanded } : cat
      )
    );
  };

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

  const moveCategoryUp = (categoryId: string) => {
    HapticFeedback.light();
    const idx = categories.findIndex((c) => c.id === categoryId);
    if (idx <= 0) return;
    const nc = [...categories];
    [nc[idx - 1], nc[idx]] = [nc[idx], nc[idx - 1]];
    nc.forEach((c, i) => (c.order = i));
    setCategories(nc);
    setHasChanges(true);
  };

  const moveCategoryDown = (categoryId: string) => {
    HapticFeedback.light();
    const idx = categories.findIndex((c) => c.id === categoryId);
    if (idx < 0 || idx >= categories.length - 1) return;
    const nc = [...categories];
    [nc[idx], nc[idx + 1]] = [nc[idx + 1], nc[idx]];
    nc.forEach((c, i) => (c.order = i));
    setCategories(nc);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      HapticFeedback.medium();
      const orderData = {
        categories: categories.map((cat) => ({
          id: cat.id,
          order: cat.order,
          forums: cat.forums.map((f) => ({ id: f.id, order: f.order })),
        })),
      };
      try {
        await api.put('/api/v1/admin/config', { forum_order: orderData });
      } catch {
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

      <ReorderHeader
        hasChanges={hasChanges}
        isSaving={isSaving}
        onBack={handleBack}
        onSave={handleSave}
      />

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
          <View style={{ height: 40 }} />
        </Animated.ScrollView>
      )}
    </View>
  );
}
