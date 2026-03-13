/**
 * Category header with drag handle and expand/collapse toggle.
 * @module screens/admin/forum-reorder-screen/components/category-header
 */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { Category } from '../types';
import { styles } from '../styles';

interface CategoryHeaderProps {
  category: Category;
  onToggle: () => void;
  onDragStart: () => void;
  isDragging: boolean;
}

/** Description. */
/** Category Header component. */
export function CategoryHeader({
  category,
  onToggle,
  onDragStart,
  isDragging,
}: CategoryHeaderProps) {
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
