/**
 * Inventory Screen — browse owned cosmetic items on mobile.
 *
 * Features:
 * - FlatList with filter chips (by cosmetic type)
 * - Rarity filter
 * - Pull-to-refresh
 * - Infinite scroll ready (onEndReached)
 * - Navigate to equip screen on item tap
 *
 * @module screens/cosmetics/inventory-screen
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '@/stores';

import type { CosmeticType, UserCosmeticInventory } from '@cgraph/shared-types';
import type { RarityTier } from '@cgraph/shared-types';
import { RARITY_TIERS, RARITY_HEX_COLORS } from '@cgraph/shared-types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 10;
const CARD_WIDTH = (SCREEN_WIDTH - 48 - CARD_GAP) / 2;

const TYPE_FILTERS: {
  id: CosmeticType | 'all';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: 'all', label: 'All', icon: 'grid-outline' },
  { id: 'border', label: 'Borders', icon: 'square-outline' },
  { id: 'title', label: 'Titles', icon: 'pricetag-outline' },
  { id: 'badge', label: 'Badges', icon: 'shield-outline' },
  { id: 'nameplate', label: 'Nameplates', icon: 'card-outline' },
  { id: 'profile_effect', label: 'Effects', icon: 'sparkles-outline' },
  { id: 'profile_frame', label: 'Frames', icon: 'image-outline' },
  { id: 'name_style', label: 'Styles', icon: 'text-outline' },
  { id: 'chat_bubble', label: 'Chat', icon: 'chatbubble-outline' },
];

const RARITY_FILTER_OPTIONS: (RarityTier | 'all')[] = ['all', ...RARITY_TIERS];

// ---------------------------------------------------------------------------
// Stub data
// ---------------------------------------------------------------------------

const STUB_INVENTORY: UserCosmeticInventory[] = [];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Inventory Screen for mobile.
 */
export default function InventoryScreen() {
  const { colors } = useThemeStore();
  const navigation = useNavigation();

  const [refreshing, setRefreshing] = useState(false);
  const [activeType, setActiveType] = useState<CosmeticType | 'all'>('all');
  const [rarityFilter, setRarityFilter] = useState<RarityTier | 'all'>('all');
  const [inventory] = useState<UserCosmeticInventory[]>(STUB_INVENTORY);

  // Filter items
  const filteredItems = useMemo(() => {
    return inventory.filter((entry) => {
      if (activeType !== 'all' && entry.cosmetic.type !== activeType) return false;
      if (rarityFilter !== 'all' && entry.cosmetic.rarity !== rarityFilter) return false;
      return true;
    });
  }, [inventory, activeType, rarityFilter]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    // TODO: Wire to real API fetch
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleSelectItem = useCallback(
    (entry: UserCosmeticInventory) => {
      // Navigate to equip screen with the item
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- navigation typing workaround
      const nav = navigation as unknown as {
        navigate: (screen: string, params: Record<string, unknown>) => void;
      };
      nav.navigate('CosmeticsEquip', { itemId: entry.cosmetic.id, item: entry });
    },
    [navigation]
  );

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const renderFilterChip = useCallback(
    (filter: (typeof TYPE_FILTERS)[0]) => (
      <TouchableOpacity
        key={filter.id}
        style={[
          styles.filterChip,
          {
            backgroundColor: activeType === filter.id ? colors.primary : `${colors.surface}cc`,
            borderColor: activeType === filter.id ? colors.primary : `${colors.border}40`,
          },
        ]}
        onPress={() => setActiveType(filter.id)}
      >
        <Ionicons
          name={filter.icon}
          size={14}
          color={activeType === filter.id ? '#fff' : colors.textSecondary}
        />
        <Text
          style={[
            styles.filterChipText,
            { color: activeType === filter.id ? '#fff' : colors.textSecondary },
          ]}
        >
          {filter.label}
        </Text>
      </TouchableOpacity>
    ),
    [activeType, colors]
  );

  const renderItem = useCallback(
    ({ item: entry }: { item: UserCosmeticInventory }) => {
      const { cosmetic } = entry;
      const rarityColor = RARITY_HEX_COLORS[cosmetic.rarity] ?? '#9ca3af';

      return (
        <TouchableOpacity
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: entry.equipped ? colors.primary : `${colors.border}30`,
              borderWidth: entry.equipped ? 2 : 1,
              width: CARD_WIDTH,
            },
          ]}
          onPress={() => handleSelectItem(entry)}
          activeOpacity={0.7}
        >
          {/* Thumbnail */}
          <View style={[styles.cardThumb, { backgroundColor: `${colors.border}10` }]}>
            {cosmetic.previewUrl ? (
              <Image
                source={{ uri: cosmetic.previewUrl }}
                style={styles.cardImage}
                resizeMode="contain"
              />
            ) : (
              <Ionicons name="cube-outline" size={32} color={colors.textSecondary} />
            )}

            {/* Equipped badge */}
            {entry.equipped && (
              <View style={[styles.equippedBadge, { backgroundColor: colors.primary }]}>
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
            )}
          </View>

          {/* Info */}
          <View style={styles.cardInfo}>
            <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>
              {cosmetic.name}
            </Text>
            <View style={styles.cardMeta}>
              <View style={[styles.rarityDot, { backgroundColor: rarityColor }]} />
              <Text style={[styles.rarityText, { color: rarityColor }]}>{cosmetic.rarity}</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [colors, handleSelectItem]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: `${colors.border}20` }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Inventory</Text>
        <Text style={[styles.headerCount, { color: colors.textSecondary }]}>
          {inventory.length} items
        </Text>
      </View>

      {/* Type filter chips */}
      <FlatList
        horizontal
        data={TYPE_FILTERS}
        renderItem={({ item: filter }) => renderFilterChip(filter)}
        keyExtractor={(f) => f.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterList}
      />

      {/* Rarity filter */}
      <FlatList
        horizontal
        data={RARITY_FILTER_OPTIONS}
        renderItem={({ item: tier }) => {
          const isActive = rarityFilter === tier;
          const tierColor =
            tier === 'all' ? colors.textSecondary : (RARITY_HEX_COLORS[tier] ?? '#9ca3af');

          return (
            <TouchableOpacity
              style={[
                styles.rarityChip,
                {
                  backgroundColor: isActive ? `${tierColor}20` : 'transparent',
                  borderColor: isActive ? tierColor : `${colors.border}30`,
                },
              ]}
              onPress={() => setRarityFilter(tier)}
            >
              <Text
                style={[
                  styles.rarityChipText,
                  { color: isActive ? tierColor : colors.textSecondary },
                ]}
              >
                {tier === 'all' ? 'All' : tier.charAt(0).toUpperCase() + tier.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        }}
        keyExtractor={(t) => t}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.rarityFilterList}
      />

      {/* Item grid */}
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(entry) => entry.cosmetic.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color={`${colors.textSecondary}40`} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No items found</Text>
            <Text style={[styles.emptySubtitle, { color: `${colors.textSecondary}80` }]}>
              {inventory.length === 0
                ? 'Visit the shop to start collecting!'
                : 'Try adjusting your filters'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', flex: 1 },
  headerCount: { fontSize: 13 },
  filterList: { flexGrow: 0 },
  filterRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 12, fontWeight: '600' },
  rarityFilterList: { flexGrow: 0, marginBottom: 4 },
  rarityChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  rarityChipText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  gridContent: { paddingHorizontal: 16, paddingBottom: 32 },
  gridRow: { gap: CARD_GAP, marginBottom: CARD_GAP },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardThumb: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: { width: '70%', height: '70%' },
  equippedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { padding: 8, gap: 4 },
  cardName: { fontSize: 13, fontWeight: '600' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rarityDot: { width: 6, height: 6, borderRadius: 3 },
  rarityText: { fontSize: 11, fontWeight: '500', textTransform: 'capitalize' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptySubtitle: { fontSize: 13 },
});
