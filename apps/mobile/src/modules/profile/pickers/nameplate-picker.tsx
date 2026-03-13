/**
 * NameplatePicker — modal for selecting decorative username nameplates.
 *
 * Layout:
 * - Left: vertical list of nameplate previews (full-width, 60px each)
 * - Right: large preview at 'lg' size with name, rarity, description
 * - Bottom: "Apply" or "Go to Shop" action bar
 *
 * @module profile/pickers/NameplatePicker
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import {
  NAMEPLATE_REGISTRY,
  type NameplateEntry,
  type NameplateRarity,
} from '@cgraph/animation-constants/src/registries/nameplates';
import { useThemeStore } from '@/stores';
import { Nameplate } from '../components/ProfileCard/Nameplate';

// ─── Rarity colors ───────────────────────────────────────────────────────────

const RARITY_COLORS: Record<NameplateRarity, { bg: string; text: string; border: string }> = {
  free: { bg: '#374151', text: '#d1d5db', border: '#4b5563' },
  common: { bg: '#1f2937', text: '#9ca3af', border: '#4b5563' },
  uncommon: { bg: '#064e3b', text: '#6ee7b7', border: '#10b981' },
  rare: { bg: '#1e3a5f', text: '#60a5fa', border: '#3b82f6' },
  epic: { bg: '#2e1065', text: '#a78bfa', border: '#8b5cf6' },
  legendary: { bg: '#451a03', text: '#fbbf24', border: '#f59e0b' },
  mythic: { bg: '#4a0e2b', text: '#f472b6', border: '#ec4899' },
};

// ─── Props ───────────────────────────────────────────────────────────────────

interface NameplatePickerProps {
  /** The user's display name for live preview */
  displayName: string;
  /** Currently equipped nameplate ID */
  equippedNameplateId: string | null;
  /** Set of unlocked nameplate IDs (free items are always unlocked) */
  unlockedNameplateIds: ReadonlySet<string>;
  /** Called when user taps "Apply" on an unlocked nameplate */
  onApply: (nameplateId: string) => void;
  /** Called when user taps "Go to Shop" on a locked nameplate */
  onGoToShop: (nameplateId: string) => void;
  /** Optional close handler */
  onClose?: () => void;
}

// ─── Rarity filter ───────────────────────────────────────────────────────────

type RarityFilter = 'ALL' | NameplateRarity;

const RARITY_FILTERS: { label: string; value: RarityFilter }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Free', value: 'free' },
  { label: 'Common', value: 'common' },
  { label: 'Uncommon', value: 'uncommon' },
  { label: 'Rare', value: 'rare' },
  { label: 'Epic', value: 'epic' },
  { label: 'Legendary', value: 'legendary' },
  { label: 'Mythic', value: 'mythic' },
];

// ─── List Row ────────────────────────────────────────────────────────────────

interface NameplateRowProps {
  item: NameplateEntry;
  isSelected: boolean;
  isLocked: boolean;
  displayName: string;
  onPress: (id: string) => void;
}

/** Nameplate list row with preview, rarity badge, and lock indicator. */
function NameplateRow({ item, isSelected, isLocked, displayName, onPress }: NameplateRowProps) {
  const rarityStyle = RARITY_COLORS[item.rarity];

  return (
    <Pressable
      onPress={() => onPress(item.id)}
      style={[
        styles.rowCell,
        {
          borderColor: isSelected ? rarityStyle.border : 'transparent',
          backgroundColor: isSelected ? rarityStyle.bg : '#111827',
        },
      ]}
      accessibilityLabel={`${item.name} nameplate${isLocked ? ', locked' : ''}`}
      accessibilityRole="button"
    >
      {/* Live nameplate preview at 'md' size */}
      <View style={styles.rowPreview}>
        <Nameplate
          nameplateId={item.id}
          displayName={displayName}
          size="md"
          autoPlay={isSelected}
        />
      </View>

      {/* Rarity tag */}
      <View style={[styles.rowRarityBadge, { backgroundColor: rarityStyle.bg }]}>
        <Text style={[styles.rowRarityText, { color: rarityStyle.text }]}>{item.rarity}</Text>
      </View>

      {/* Lock badge */}
      {isLocked && (
        <View style={styles.lockBadge}>
          <Text style={styles.lockIcon}>🔒</Text>
        </View>
      )}
    </Pressable>
  );
}

// ─── Main Picker Component ───────────────────────────────────────────────────
/** Nameplate selection picker with rarity filtering and live preview. */ export function NameplatePicker({
  displayName,
  equippedNameplateId,
  unlockedNameplateIds,
  onApply,
  onGoToShop,
  onClose,
}: NameplatePickerProps) {
  const { colors } = useThemeStore();
  const { width: screenWidth } = useWindowDimensions();

  const [selectedId, setSelectedId] = useState<string>(equippedNameplateId ?? 'plate_none');
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('ALL');

  const isWide = screenWidth > 600;

  // Filtered items
  const filteredItems = useMemo(() => {
    if (rarityFilter === 'ALL') return [...NAMEPLATE_REGISTRY];
    return NAMEPLATE_REGISTRY.filter((n) => n.rarity === rarityFilter);
  }, [rarityFilter]);

  // Selected entry
  const selectedEntry = useMemo(
    () => NAMEPLATE_REGISTRY.find((n) => n.id === selectedId),
    [selectedId]
  );

  // Ownership check
  const isOwned = useCallback(
    (id: string) => {
      const entry = NAMEPLATE_REGISTRY.find((n) => n.id === id);
      if (!entry) return false;
      return entry.free || unlockedNameplateIds.has(id);
    },
    [unlockedNameplateIds]
  );

  const selectedIsOwned = isOwned(selectedId);
  const selectedRarity = selectedEntry ? RARITY_COLORS[selectedEntry.rarity] : RARITY_COLORS.free;

  // ── Render row ──────────────────────────────────────────────────────────

  const renderRow = useCallback(
    ({ item }: { item: NameplateEntry }) => (
      <NameplateRow
        item={item}
        isSelected={item.id === selectedId}
        isLocked={!isOwned(item.id)}
        displayName={displayName}
        onPress={setSelectedId}
      />
    ),
    [selectedId, isOwned, displayName]
  );

  const keyExtractor = useCallback((item: NameplateEntry) => item.id, []);

  // ── Sections ────────────────────────────────────────────────────────────

  const listSection = (
    <View style={[styles.listSection, { width: isWide ? '50%' : '100%' }]}>
      {/* Rarity filter row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterRowContent}
      >
        {RARITY_FILTERS.map((f) => (
          <Pressable
            key={f.value}
            onPress={() => setRarityFilter(f.value)}
            style={[
              styles.filterChip,
              {
                backgroundColor: rarityFilter === f.value ? colors.primary : colors.surfaceHover,
                borderColor: rarityFilter === f.value ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                {
                  color: rarityFilter === f.value ? '#ffffff' : colors.textSecondary,
                },
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Vertical list */}
      <FlatList
        data={filteredItems}
        renderItem={renderRow}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  const previewSection = (
    <View style={[styles.previewSection, { width: isWide ? '50%' : '100%' }]}>
      {/* Large preview */}
      <View style={styles.previewBox}>
        <Nameplate nameplateId={selectedId} displayName={displayName} size="lg" autoPlay />
      </View>

      {/* Info */}
      {selectedEntry && (
        <View style={styles.infoBlock}>
          <Text style={[styles.infoName, { color: colors.text }]}>{selectedEntry.name}</Text>
          <Text style={[styles.infoDescription, { color: colors.textSecondary }]}>
            {selectedEntry.description}
          </Text>
          <View style={[styles.rarityTag, { backgroundColor: selectedRarity.bg }]}>
            <Text style={[styles.rarityTagText, { color: selectedRarity.text }]}>
              {selectedEntry.rarity}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  // ── Action bar ──────────────────────────────────────────────────────────

  const actionBar = (
    <View
      style={[styles.actionBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}
    >
      {selectedId === equippedNameplateId ? (
        <View style={[styles.actionButton, styles.equippedButton]}>
          <Text style={styles.equippedButtonText}>Equipped</Text>
        </View>
      ) : selectedIsOwned ? (
        <Pressable
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => onApply(selectedId)}
        >
          <Text style={styles.actionButtonText}>Apply</Text>
        </Pressable>
      ) : (
        <Pressable
          style={[styles.actionButton, styles.shopButton]}
          onPress={() => onGoToShop(selectedId)}
        >
          <Text style={styles.shopButtonText}>Go to Shop</Text>
        </Pressable>
      )}
    </View>
  );

  // ── Root ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Nameplates</Text>
        {onClose && (
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Body */}
      <View style={[styles.body, isWide && styles.bodyWide]}>
        {listSection}
        {previewSection}
      </View>

      {/* Action bar */}
      {actionBar}
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
  },

  // Body
  body: {
    flex: 1,
  },
  bodyWide: {
    flexDirection: 'row',
  },

  // List section
  listSection: {
    flex: 1,
  },
  filterRow: {
    maxHeight: 44,
    marginBottom: 4,
  },
  filterRowContent: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center',
    paddingVertical: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 16,
    gap: 8,
  },

  // Row cell
  rowCell: {
    height: 60,
    borderRadius: 10,
    borderWidth: 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  rowPreview: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowRarityBadge: {
    position: 'absolute',
    bottom: 4,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  rowRarityText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  lockBadge: {
    position: 'absolute',
    top: 4,
    right: 8,
  },
  lockIcon: {
    fontSize: 16,
  },

  // Preview section
  previewSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 16,
  },
  previewBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#111827',
    borderRadius: 12,
  },

  // Info
  infoBlock: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
  },
  infoName: {
    fontSize: 16,
    fontWeight: '700',
  },
  infoDescription: {
    fontSize: 13,
    textAlign: 'center',
  },
  rarityTag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
  },
  rarityTagText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  // Action bar
  actionBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  actionButton: {
    width: '100%',
    maxWidth: 320,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  equippedButton: {
    backgroundColor: '#374151',
  },
  equippedButtonText: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: '700',
  },
  shopButton: {
    backgroundColor: '#f59e0b',
  },
  shopButtonText: {
    color: '#1a1a2e',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default NameplatePicker;
