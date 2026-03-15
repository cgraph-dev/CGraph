/**
 * ProfileEffectPicker — modal for selecting profile background effects.
 *
 * Layout:
 * - Left: 3-column scrollable grid of effect thumbnails
 * - Right: large preview panel showing the selected effect on a ProfileCard
 * - Bottom: item details + "Apply" or "Go to Shop" action
 *
 * @module profile/pickers/ProfileEffectPicker
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
import LottieView from 'lottie-react-native';
import {
  PROFILE_EFFECT_REGISTRY,
  type ProfileEffectEntry,
  type ProfileEffectRarity,
} from '@cgraph/animation-constants/src/registries/profileEffects';
import { useThemeStore } from '@/stores';
import { getProfileEffectSource } from '@/assets/lottie/effects/effectMap';

// ─── Rarity colors (lowercase keys matching registry) ────────────────────────

const RARITY_COLORS: Record<ProfileEffectRarity, { bg: string; text: string; border: string }> = {
  free: { bg: '#374151', text: '#d1d5db', border: '#4b5563' },
  common: { bg: '#1f2937', text: '#9ca3af', border: '#4b5563' },
  uncommon: { bg: '#064e3b', text: '#6ee7b7', border: '#10b981' },
  rare: { bg: '#1e3a5f', text: '#60a5fa', border: '#3b82f6' },
  epic: { bg: '#2e1065', text: '#a78bfa', border: '#8b5cf6' },
  legendary: { bg: '#451a03', text: '#fbbf24', border: '#f59e0b' },
  mythic: { bg: '#4a0e2b', text: '#f472b6', border: '#ec4899' },
};

// ─── Props ───────────────────────────────────────────────────────────────────

interface ProfileEffectPickerProps {
  /** Currently equipped effect ID */
  equippedEffectId: string | null;
  /** Set of unlocked effect IDs (free effects are always unlocked) */
  unlockedEffectIds: ReadonlySet<string>;
  /** Called when user taps "Apply" on an unlocked effect */
  onApply: (effectId: string) => void;
  /** Called when user taps "Go to Shop" on a locked effect */
  onGoToShop: (effectId: string) => void;
  /** Optional close handler */
  onClose?: () => void;
}

// ─── Rarity filter ───────────────────────────────────────────────────────────

type RarityFilter = 'ALL' | ProfileEffectRarity;

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

// ─── Thumbnail Cell ──────────────────────────────────────────────────────────

interface ThumbnailCellProps {
  item: ProfileEffectEntry;
  isSelected: boolean;
  isLocked: boolean;
  onPress: (id: string) => void;
  cellWidth: number;
}

/** Thumbnail cell for a single profile effect. */
function ThumbnailCell({ item, isSelected, isLocked, onPress, cellWidth }: ThumbnailCellProps) {
  const rarityStyle = RARITY_COLORS[item.rarity];
  const cellHeight = Math.round(cellWidth * 1.25); // 80×100 ratio

  return (
    <Pressable
      onPress={() => onPress(item.id)}
      style={[
        styles.thumbnailCell,
        {
          width: cellWidth,
          height: cellHeight,
          borderColor: isSelected ? rarityStyle.border : 'transparent',
          backgroundColor: isSelected ? rarityStyle.bg : '#1a1a2e',
        },
      ]}
      accessibilityLabel={`${item.name} effect${isLocked ? ', locked' : ''}`}
      accessibilityRole="button"
    >
      {/* Gray card placeholder */}
      <View style={[styles.thumbnailPreview, { backgroundColor: '#2a2a3e' }]}>
        {item.lottieFile ? (
          <>
            {/* Play icon overlay */}
            <View style={styles.playIconOverlay}>
              <Text style={styles.playIcon}>▶</Text>
            </View>
          </>
        ) : (
          <Text style={styles.noneLabel}>—</Text>
        )}
      </View>

      {/* Lock overlay */}
      {isLocked && (
        <View style={styles.lockOverlay}>
          <Text style={styles.lockIcon}>🔒</Text>
        </View>
      )}

      {/* Effect name */}
      <Text style={styles.thumbnailName} numberOfLines={1}>
        {item.name}
      </Text>

      {/* Rarity badge */}
      <View style={[styles.rarityBadge, { backgroundColor: rarityStyle.bg }]}>
        <Text style={[styles.rarityText, { color: rarityStyle.text }]}>{item.rarity}</Text>
      </View>
    </Pressable>
  );
}

// ─── Main Picker Component ───────────────────────────────────────────────────
/** Profile effect selection picker with thumbnail grid and live Lottie preview. */ export function ProfileEffectPicker({
  equippedEffectId,
  unlockedEffectIds,
  onApply,
  onGoToShop,
  onClose,
}: ProfileEffectPickerProps) {
  const { colors } = useThemeStore();
  const { width: screenWidth } = useWindowDimensions();

  // Selected effect for preview (not yet applied)
  const [selectedId, setSelectedId] = useState<string>(equippedEffectId ?? 'effect_none');
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('ALL');

  // Determine if we use landscape/tablet layout (side-by-side) or portrait (stacked)
  const isWide = screenWidth > 600;

  // Grid cell sizing: 3 columns with gaps
  const gridPadding = 12;
  const gridGap = 8;
  const gridWidth = isWide ? Math.round(screenWidth * 0.45) : screenWidth;
  const cellWidth = Math.floor((gridWidth - gridPadding * 2 - gridGap * 2) / 3);

  // Filtered effects
  const filteredEffects = useMemo(() => {
    if (rarityFilter === 'ALL') return [...PROFILE_EFFECT_REGISTRY];
    return PROFILE_EFFECT_REGISTRY.filter((e) => e.rarity === rarityFilter);
  }, [rarityFilter]);

  // Selected effect entry
  const selectedEffect = useMemo(
    () => PROFILE_EFFECT_REGISTRY.find((e) => e.id === selectedId),
    [selectedId]
  );

  // Ownership check
  const isOwned = useCallback(
    (id: string) => {
      const entry = PROFILE_EFFECT_REGISTRY.find((e) => e.id === id);
      if (!entry) return false;
      return entry.free || unlockedEffectIds.has(id);
    },
    [unlockedEffectIds]
  );

  const selectedIsOwned = isOwned(selectedId);
  const selectedRarity = selectedEffect ? RARITY_COLORS[selectedEffect.rarity] : RARITY_COLORS.free;

  // Preview dimensions
  const previewWidth = isWide ? Math.round(screenWidth * 0.45) : Math.round(screenWidth * 0.7);
  const previewHeight = Math.round(previewWidth * 1.4);

  // ── Render thumbnail ────────────────────────────────────────────────────

  const renderThumbnail = useCallback(
    ({ item }: { item: ProfileEffectEntry }) => (
      <ThumbnailCell
        item={item}
        isSelected={item.id === selectedId}
        isLocked={!isOwned(item.id)}
        onPress={setSelectedId}
        cellWidth={cellWidth}
      />
    ),
    [selectedId, isOwned, cellWidth]
  );

  const keyExtractor = useCallback((item: ProfileEffectEntry) => item.id, []);

  // ── Lottie source for preview ───────────────────────────────────────────

  const previewSource = getProfileEffectSource(selectedId);

  // ── Layout ──────────────────────────────────────────────────────────────

  const gridSection = (
    <View style={[styles.gridSection, { width: isWide ? '50%' : '100%' }]}>
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

      {/* Grid */}
      <FlatList
        data={filteredEffects}
        renderItem={renderThumbnail}
        keyExtractor={keyExtractor}
        numColumns={3}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  const previewSection = (
    <View style={[styles.previewSection, { width: isWide ? '50%' : '100%' }]}>
      {/* Preview card area */}
      <View
        style={[
          styles.previewCard,
          {
            width: previewWidth,
            height: previewHeight,
            backgroundColor: '#111827',
            borderColor: selectedRarity.border,
          },
        ]}
      >
        {/* Gray profile card placeholder */}
        <View style={styles.previewCardContent}>
          <View style={styles.previewBanner} />
          <View style={styles.previewAvatar} />
          <View style={styles.previewNameBar} />
          <View style={styles.previewBioBar} />
        </View>

        {/* Live Lottie effect overlay */}
        {previewSource ? (
          <View
            style={[styles.previewEffectOverlay, { width: previewWidth, height: previewHeight }]}
            pointerEvents="none"
          >
            <LottieView
              source={previewSource as LottieView['props']['source']}
              style={{ width: previewWidth, height: previewHeight }}
              autoPlay
              loop
              speed={1.0}
              renderMode="AUTOMATIC"
            />
          </View>
        ) : null}
      </View>

      {/* Effect info */}
      {selectedEffect && (
        <View style={styles.effectInfo}>
          <Text style={[styles.effectName, { color: colors.text }]}>{selectedEffect.name}</Text>
          <Text style={[styles.effectDescription, { color: colors.textSecondary }]}>
            {selectedEffect.description}
          </Text>
          <View style={[styles.rarityTag, { backgroundColor: selectedRarity.bg }]}>
            <Text style={[styles.rarityTagText, { color: selectedRarity.text }]}>
              {selectedEffect.rarity}
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
      {selectedId === equippedEffectId ? (
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile Effects</Text>
        {onClose && (
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Body */}
      <View style={[styles.body, isWide && styles.bodyWide]}>
        {gridSection}
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

  // Grid section
  gridSection: {
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
  gridContent: {
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  gridRow: {
    gap: 8,
    marginBottom: 8,
  },

  // Thumbnail
  thumbnailCell: {
    borderRadius: 8,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    paddingBottom: 4,
  },
  thumbnailPreview: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  playIconOverlay: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    color: '#ffffff',
    fontSize: 10,
  },
  noneLabel: {
    color: '#6b7280',
    fontSize: 18,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  lockIcon: {
    fontSize: 20,
  },
  thumbnailName: {
    color: '#d1d5db',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    paddingHorizontal: 2,
    textAlign: 'center',
  },
  rarityBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 1,
  },
  rarityText: {
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  // Preview section
  previewSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  previewCard: {
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
  },
  previewCardContent: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  previewBanner: {
    height: '30%',
    borderRadius: 8,
    backgroundColor: '#1f2937',
  },
  previewAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#374151',
    marginTop: -24,
  },
  previewNameBar: {
    height: 14,
    width: '60%',
    borderRadius: 4,
    backgroundColor: '#374151',
  },
  previewBioBar: {
    height: 10,
    width: '80%',
    borderRadius: 4,
    backgroundColor: '#1f2937',
  },
  previewEffectOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },

  // Effect info
  effectInfo: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
  },
  effectName: {
    fontSize: 16,
    fontWeight: '700',
  },
  effectDescription: {
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

export default ProfileEffectPicker;
