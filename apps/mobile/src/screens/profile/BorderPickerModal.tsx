/**
 * BorderPickerModal — grid of all 42 borders, grouped by rarity.
 *
 * Each border renders an AvatarBorder at 64px, animated.
 * Tap to equip. Current equipped border gets a highlight ring.
 *
 * @module profile/screens/BorderPickerModal
 */
/* eslint-disable check-file/filename-naming-convention */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import {
  getBordersByRarity,
  type BorderRarity,
  type BorderRegistryEntry,
} from '@cgraph/animation-constants';
import { useThemeStore } from '@/stores';
// TODO(phase-26): Rewire — gamification components deleted

interface BorderPickerModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Currently equipped border ID */
  currentBorderId?: string;
  /** Callback when a border is selected */
  onSelect: (borderId: string) => void;
  /** Callback to close the modal */
  onClose: () => void;
}

const RARITY_ORDER: BorderRarity[] = [
  'free',
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'mythic',
];

const RARITY_COLORS: Record<BorderRarity, string> = {
  free: '#9ca3af',
  common: '#d1d5db',
  uncommon: '#10b981',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
  mythic: '#ef4444',
};

const PREVIEW_SIZE = 64;

/**
 * Modal showing all 42 borders in a grid, grouped by rarity tier.
 */
export function BorderPickerModal({
  visible,
  currentBorderId,
  onSelect,
  onClose,
}: BorderPickerModalProps) {
  const { colors } = useThemeStore();

  const renderBorderItem = useCallback(
    (border: BorderRegistryEntry) => {
      const isEquipped = border.id === currentBorderId;

      return (
        <TouchableOpacity
          key={border.id}
          style={[
            styles.borderItem,
            isEquipped && { borderColor: RARITY_COLORS[border.rarity], borderWidth: 2 },
          ]}
          onPress={() => onSelect(border.id)}
          activeOpacity={0.7}
        >
          {/* TODO(phase-26): Rewire — gamification components deleted (AvatarBorder) */}
          <View style={styles.previewAvatar} />
          <Text style={[styles.borderName, { color: colors.text }]} numberOfLines={1}>
            {border.name}
          </Text>
          {isEquipped && (
            <View style={[styles.equippedBadge, { backgroundColor: RARITY_COLORS[border.rarity] }]}>
              <Text style={styles.equippedText}>Equipped</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [currentBorderId, colors.text, onSelect]
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Avatar Borders</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.closeButton, { color: colors.primary }]}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {RARITY_ORDER.map((rarity) => {
            const borders = getBordersByRarity(rarity);
            if (borders.length === 0) return null;

            return (
              <View key={rarity} style={styles.raritySection}>
                <View style={styles.rarityHeader}>
                  <View style={[styles.rarityDot, { backgroundColor: RARITY_COLORS[rarity] }]} />
                  <Text style={[styles.rarityLabel, { color: RARITY_COLORS[rarity] }]}>
                    {rarity}
                  </Text>
                  <Text style={[styles.rarityCount, { color: colors.textSecondary }]}>
                    ({borders.length})
                  </Text>
                </View>
                <View style={styles.grid}>{borders.map(renderBorderItem)}</View>
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  raritySection: {
    marginTop: 20,
  },
  rarityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  rarityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rarityLabel: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  rarityCount: {
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  borderItem: {
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    width: 96,
  },
  previewAvatar: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    borderRadius: PREVIEW_SIZE / 2,
    backgroundColor: '#374151',
  },
  borderName: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  equippedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  equippedText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
  },
});
