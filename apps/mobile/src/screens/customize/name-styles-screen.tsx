/**
 * Name Styles Screen — browse and equip name style effects.
 *
 * Name style examples with preview text showing the applied style,
 * rarity indicators, and equip/unequip toggle.
 *
 * @module screens/customize/name-styles-screen
 */

import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '@/stores';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

interface NameStyle {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly rarity: Rarity;
  readonly previewColor: string;
  readonly isEquipped: boolean;
  readonly fontStyle: 'normal' | 'italic';
  readonly fontWeight: 'normal' | 'bold';
  readonly textDecorationLine?: 'none' | 'underline';
  readonly letterSpacing?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RARITY_COLORS: Record<Rarity, string> = {
  common: '#6b7280',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
  mythic: '#ec4899',
};

const PLACEHOLDER_STYLES: NameStyle[] = [
  {
    id: 'ns1',
    name: 'Default',
    description: 'Standard display name',
    rarity: 'common',
    previewColor: '#f8fafc',
    isEquipped: true,
    fontStyle: 'normal',
    fontWeight: 'normal',
  },
  {
    id: 'ns2',
    name: 'Bold Statement',
    description: 'Bold weighted name',
    rarity: 'common',
    previewColor: '#f8fafc',
    isEquipped: false,
    fontStyle: 'normal',
    fontWeight: 'bold',
  },
  {
    id: 'ns3',
    name: 'Matrix Green',
    description: 'Glowing green text',
    rarity: 'uncommon',
    previewColor: '#10b981',
    isEquipped: false,
    fontStyle: 'normal',
    fontWeight: 'bold',
  },
  {
    id: 'ns4',
    name: 'Royal Purple',
    description: 'Regal purple styling',
    rarity: 'rare',
    previewColor: '#8b5cf6',
    isEquipped: false,
    fontStyle: 'normal',
    fontWeight: 'bold',
  },
  {
    id: 'ns5',
    name: 'Elegant Italic',
    description: 'Refined italic styling',
    rarity: 'rare',
    previewColor: '#f59e0b',
    isEquipped: false,
    fontStyle: 'italic',
    fontWeight: 'normal',
  },
  {
    id: 'ns6',
    name: 'Spaced Out',
    description: 'Wide letter spacing',
    rarity: 'epic',
    previewColor: '#06b6d4',
    isEquipped: false,
    fontStyle: 'normal',
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  {
    id: 'ns7',
    name: 'Legendary Gold',
    description: 'Gold shimmer effect',
    rarity: 'legendary',
    previewColor: '#fbbf24',
    isEquipped: false,
    fontStyle: 'normal',
    fontWeight: 'bold',
  },
  {
    id: 'ns8',
    name: 'Mythic Flame',
    description: 'Blazing fire style',
    rarity: 'mythic',
    previewColor: '#ef4444',
    isEquipped: false,
    fontStyle: 'italic',
    fontWeight: 'bold',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Name styles customization screen.
 */
export default function NameStylesScreen() {
  const navigation = useNavigation();
  const { colors } = useThemeStore();
  const [nameStyles] = useState<NameStyle[]>(PLACEHOLDER_STYLES);

  const handleToggleEquip = useCallback((_id: string) => {
    // TODO: integrate with customization store
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: NameStyle }) => {
      const rarityColor = RARITY_COLORS[item.rarity];

      return (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {/* Name preview */}
          <View style={[styles.previewArea, { backgroundColor: colors.background }]}>
            <Text
              style={[
                styles.previewText,
                {
                  color: item.previewColor,
                  fontStyle: item.fontStyle,
                  fontWeight: item.fontWeight,
                  textDecorationLine: item.textDecorationLine ?? 'none',
                  letterSpacing: item.letterSpacing ?? 0,
                },
              ]}
            >
              YourName
            </Text>
          </View>

          {/* Info row */}
          <View style={styles.infoRow}>
            <View style={styles.infoContent}>
              <Text style={[styles.cardName, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.description}
              </Text>
              <View style={[styles.rarityBadge, { backgroundColor: rarityColor + '22' }]}>
                <View style={[styles.rarityDot, { backgroundColor: rarityColor }]} />
                <Text style={[styles.rarityText, { color: rarityColor }]}>{item.rarity}</Text>
              </View>
            </View>

            {/* Equip toggle */}
            <TouchableOpacity
              style={[
                styles.equipButton,
                item.isEquipped
                  ? { backgroundColor: colors.primary }
                  : {
                      backgroundColor: colors.surface,
                      borderColor: colors.primary,
                      borderWidth: 1,
                    },
              ]}
              onPress={() => handleToggleEquip(item.id)}
              activeOpacity={0.7}
            >
              {item.isEquipped && <Ionicons name="checkmark-circle" size={14} color="#fff" />}
              <Text
                style={[
                  styles.equipButtonText,
                  { color: item.isEquipped ? '#fff' : colors.primary },
                ]}
              >
                {item.isEquipped ? 'Equipped' : 'Equip'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [colors, handleToggleEquip]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Name Styles</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Stand out from the crowd
          </Text>
        </View>
      </View>

      <FlatList
        data={nameStyles}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 24, fontWeight: '700' },
  headerSubtitle: { fontSize: 14, marginTop: 2 },
  listContent: { padding: 16, paddingBottom: 40 },
  separator: { height: 12 },
  card: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  previewArea: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewText: {
    fontSize: 22,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  infoContent: { flex: 1, gap: 4 },
  cardName: { fontSize: 15, fontWeight: '600' },
  cardDesc: { fontSize: 12 },
  rarityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  rarityDot: { width: 6, height: 6, borderRadius: 3 },
  rarityText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  equipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  equipButtonText: { fontSize: 12, fontWeight: '600' },
});
