/**
 * PostIconPicker — Mobile post icon picker
 *
 * Bottom sheet with grid of board post icons.
 * Tap to select, shows selected icon above thread title input.
 * Integrated into thread creation flow on mobile.
 *
 * Lives under screens/settings/custom-emoji/ following existing pattern.
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
  Image,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import api from '../../../lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PostIcon {
  id: string;
  name: string;
  icon_url: string;
  emoji: string | null;
  display_order: number;
}

interface PostIconPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (icon: PostIcon | null) => void;
  forumId: string;
  boardId: string;
  selectedIconId?: string | null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PostIconPicker({
  visible,
  onClose,
  onSelect,
  forumId,
  boardId,
  selectedIconId = null,
}: PostIconPickerProps) {
  const [icons, setIcons] = useState<PostIcon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;

    let cancelled = false;
    async function fetchIcons() {
      setLoading(true);
      try {
        const res = await api.get(
          `/api/v1/forums/${forumId}/boards/${boardId}/post-icons`
        );
        const data = (res.data as { data: PostIcon[] }).data || [];
        if (!cancelled) setIcons(data);
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchIcons();
    return () => { cancelled = true; };
  }, [visible, forumId, boardId]);

  const handleSelect = useCallback(
    (icon: PostIcon | null) => {
      HapticFeedback.light();
      onSelect(icon);
      onClose();
    },
    [onSelect, onClose]
  );

  const renderIcon = useCallback(
    ({ item }: { item: PostIcon }) => {
      const isSelected = item.id === selectedIconId;

      return (
        <TouchableOpacity
          style={[styles.iconCell, isSelected && styles.iconCellSelected]}
          activeOpacity={0.7}
          onPress={() => handleSelect(item)}
        >
          {item.emoji ? (
            <Text style={styles.iconEmoji}>{item.emoji}</Text>
          ) : (
            <Image source={{ uri: item.icon_url }} style={styles.iconImage} />
          )}
          <Text
            style={[styles.iconName, isSelected && styles.iconNameSelected]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          {isSelected && (
            <View style={styles.checkBadge}>
              <Ionicons name="checkmark" size={10} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [selectedIconId, handleSelect]
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Select Post Icon</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* None option */}
          <TouchableOpacity
            style={[styles.noneButton, !selectedIconId && styles.noneButtonActive]}
            onPress={() => handleSelect(null)}
          >
            <Ionicons
              name="close-circle-outline"
              size={20}
              color={!selectedIconId ? '#818cf8' : '#9ca3af'}
            />
            <Text
              style={[styles.noneText, !selectedIconId && styles.noneTextActive]}
            >
              No Icon
            </Text>
          </TouchableOpacity>

          {/* Grid */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#818cf8" />
            </View>
          ) : icons.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No icons available for this board</Text>
            </View>
          ) : (
            <FlatList
              data={icons}
              renderItem={renderIcon}
              keyExtractor={(item) => item.id}
              numColumns={4}
              contentContainerStyle={styles.grid}
              showsVerticalScrollIndicator={false}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default PostIconPicker;

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1f2937',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    maxHeight: '60%',
  },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: '#4b5563',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  noneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: '#374151',
  },
  noneButtonActive: {
    borderColor: '#818cf8',
    backgroundColor: 'rgba(129,140,248,0.1)',
  },
  noneText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  noneTextActive: {
    color: '#818cf8',
  },
  grid: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  iconCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginHorizontal: 4,
    marginVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative',
  },
  iconCellSelected: {
    borderColor: '#818cf8',
    backgroundColor: 'rgba(129,140,248,0.1)',
  },
  iconEmoji: {
    fontSize: 28,
  },
  iconImage: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  iconName: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
    maxWidth: 72,
    textAlign: 'center',
  },
  iconNameSelected: {
    color: '#818cf8',
  },
  checkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#818cf8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#6b7280',
  },
});
