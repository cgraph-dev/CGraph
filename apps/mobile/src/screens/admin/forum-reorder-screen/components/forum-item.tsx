/**
 * Draggable forum item for the reorder screen.
 * @module screens/admin/forum-reorder-screen/components/forum-item
 */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { Forum } from '../types';
import { styles } from '../styles';

interface ForumItemProps {
  forum: Forum;
  isActive: boolean;
  onDragStart: () => void;
  isDragging: boolean;
}

export function ForumItem({ forum, isActive, onDragStart, isDragging }: ForumItemProps) {
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
