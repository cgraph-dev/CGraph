/**
 * TagChips — horizontal ScrollView of colored, removable tag chips.
 *
 * Each chip background is derived from the tag's category color.
 * Supports selection (filter mode) and removal (edit mode).
 *
 * @module components/forums/tag-chips
 */

import React from 'react';
import {
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Tag {
  id: string;
  name: string;
  color?: string;
  category?: { name?: string; color?: string };
}

interface TagChipsProps {
  tags: Tag[];
  /** Currently selected tag IDs (filter mode) */
  selectedIds?: string[];
  /** Called when a chip is tapped — toggles selection */
  onToggle?: (tagId: string) => void;
  /** Show remove icon — calls onRemove when tapped */
  removable?: boolean;
  onRemove?: (tagId: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TagChips({
  tags,
  selectedIds = [],
  onToggle,
  removable = false,
  onRemove,
}: TagChipsProps) {
  if (tags.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.scrollView}
    >
      {tags.map((tag) => {
        const chipColor = tag.category?.color || tag.color || '#6366F1';
        const isSelected = selectedIds.includes(tag.id);

        return (
          <TouchableOpacity
            key={tag.id}
            style={[
              styles.chip,
              {
                backgroundColor: chipColor + (isSelected ? '30' : '15'),
                borderColor: isSelected ? chipColor : chipColor + '40',
              },
            ]}
            onPress={() => onToggle?.(tag.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, { color: chipColor }]}>{tag.name}</Text>

            {removable && (
              <TouchableOpacity
                onPress={() => onRemove?.(tag.id)}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
              >
                <Ionicons name="close-circle" size={14} color={chipColor} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
