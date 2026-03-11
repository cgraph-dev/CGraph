/**
 * Profile Layouts Screen — browse and equip profile layout options.
 *
 * Layout option cards with before/after preview, rarity indicators,
 * and equip/unequip toggle. Uses the standard customization screen pattern.
 *
 * @module screens/customize/profile-layouts-screen
 */

import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '@/stores';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

interface ProfileLayout {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly rarity: Rarity;
  readonly icon: keyof typeof Ionicons.glyphMap;
  readonly previewColor: string;
  readonly isEquipped: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 48 - CARD_GAP) / 2;

const RARITY_COLORS: Record<Rarity, string> = {
  common: '#6b7280',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
  mythic: '#ec4899',
};

const PLACEHOLDER_LAYOUTS: ProfileLayout[] = [
  {
    id: 'pl1',
    name: 'Classic',
    description: 'Standard profile layout',
    rarity: 'common',
    icon: 'grid-outline',
    previewColor: '#6b7280',
    isEquipped: true,
  },
  {
    id: 'pl2',
    name: 'Showcase',
    description: 'Large banner with pinned items',
    rarity: 'uncommon',
    icon: 'easel-outline',
    previewColor: '#22c55e',
    isEquipped: false,
  },
  {
    id: 'pl3',
    name: 'Timeline',
    description: 'Chronological activity feed layout',
    rarity: 'rare',
    icon: 'time-outline',
    previewColor: '#3b82f6',
    isEquipped: false,
  },
  {
    id: 'pl4',
    name: 'Gallery',
    description: 'Media-focused mosaic grid',
    rarity: 'rare',
    icon: 'images-outline',
    previewColor: '#60a5fa',
    isEquipped: false,
  },
  {
    id: 'pl5',
    name: 'Minimal',
    description: 'Clean minimal design',
    rarity: 'epic',
    icon: 'remove-outline',
    previewColor: '#a855f7',
    isEquipped: false,
  },
  {
    id: 'pl6',
    name: 'Creator',
    description: 'Optimised for content creators',
    rarity: 'legendary',
    icon: 'videocam-outline',
    previewColor: '#f59e0b',
    isEquipped: false,
  },
  {
    id: 'pl7',
    name: 'Custom',
    description: 'Fully customisable drag-and-drop',
    rarity: 'mythic',
    icon: 'construct-outline',
    previewColor: '#ec4899',
    isEquipped: false,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/** Profile layouts customization screen. */
export default function ProfileLayoutsScreen() {
  const navigation = useNavigation();
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';

  const [layouts, setLayouts] = useState<ProfileLayout[]>(PLACEHOLDER_LAYOUTS);

  const handleEquipToggle = useCallback((id: string) => {
    setLayouts((prev) =>
      prev.map((l) => ({
        ...l,
        isEquipped: l.id === id ? !l.isEquipped : false,
      }))
    );
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: ProfileLayout }) => {
      const rarityColor = RARITY_COLORS[item.rarity];

      return (
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              borderColor: item.isEquipped ? rarityColor : isDark ? '#374151' : '#e5e7eb',
              borderWidth: item.isEquipped ? 2 : 1,
            },
          ]}
        >
          {/* Preview area */}
          <View style={[styles.previewArea, { backgroundColor: `${item.previewColor}20` }]}>
            <View style={styles.layoutPreview}>
              <View style={[styles.previewBanner, { backgroundColor: `${item.previewColor}40` }]} />
              <View style={styles.previewContent}>
                <View style={[styles.previewAvatar, { backgroundColor: item.previewColor }]} />
                <View style={styles.previewLines}>
                  <View
                    style={[
                      styles.previewLine,
                      { backgroundColor: `${item.previewColor}60`, width: '80%' },
                    ]}
                  />
                  <View
                    style={[
                      styles.previewLine,
                      { backgroundColor: `${item.previewColor}40`, width: '60%' },
                    ]}
                  />
                </View>
              </View>
            </View>
            <Ionicons
              name={item.icon}
              size={20}
              color={item.previewColor}
              style={styles.previewIcon}
            />
          </View>

          {/* Info */}
          <View style={styles.cardInfo}>
            <Text
              style={[styles.cardName, { color: isDark ? '#f3f4f6' : '#111827' }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <Text
              style={[styles.cardDesc, { color: isDark ? '#9ca3af' : '#6b7280' }]}
              numberOfLines={2}
            >
              {item.description}
            </Text>

            {/* Rarity badge */}
            <View style={[styles.rarityBadge, { backgroundColor: `${rarityColor}20` }]}>
              <View style={[styles.rarityDot, { backgroundColor: rarityColor }]} />
              <Text style={[styles.rarityText, { color: rarityColor }]}>
                {item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}
              </Text>
            </View>
          </View>

          {/* Equip button */}
          <TouchableOpacity
            style={[
              styles.equipBtn,
              {
                backgroundColor: item.isEquipped ? rarityColor : isDark ? '#374151' : '#e5e7eb',
              },
            ]}
            onPress={() => handleEquipToggle(item.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={item.isEquipped ? 'checkmark-circle' : 'add-circle-outline'}
              size={16}
              color={item.isEquipped ? '#ffffff' : isDark ? '#d1d5db' : '#374151'}
            />
            <Text
              style={[
                styles.equipText,
                { color: item.isEquipped ? '#ffffff' : isDark ? '#d1d5db' : '#374151' },
              ]}
            >
              {item.isEquipped ? 'Equipped' : 'Equip'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    },
    [isDark, handleEquipToggle]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#111827' : '#f9fafb' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#f3f4f6' : '#111827'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#f3f4f6' : '#111827' }]}>
          Profile Layouts
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Grid */}
      <FlatList
        data={layouts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  headerSpacer: { width: 32 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  row: { gap: CARD_GAP, marginBottom: CARD_GAP },
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    overflow: 'hidden',
  },
  previewArea: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  layoutPreview: {
    width: '70%',
    height: 70,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  previewBanner: {
    height: 24,
  },
  previewContent: {
    flexDirection: 'row',
    padding: 6,
    gap: 6,
  },
  previewAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  previewLines: {
    flex: 1,
    gap: 4,
    justifyContent: 'center',
  },
  previewLine: {
    height: 4,
    borderRadius: 2,
  },
  previewIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  cardInfo: { padding: 12, gap: 4 },
  cardName: { fontSize: 14, fontWeight: '600' },
  cardDesc: { fontSize: 11, lineHeight: 15 },
  rarityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
    gap: 4,
  },
  rarityDot: { width: 6, height: 6, borderRadius: 3 },
  rarityText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  equipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 10,
  },
  equipText: { fontSize: 13, fontWeight: '600' },
});
