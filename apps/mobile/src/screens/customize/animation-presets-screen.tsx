/**
 * Animation Presets Screen — browse and equip animation presets.
 *
 * List of animation presets with preview, rarity indicators, and
 * equip/unequip toggle. Standard customization screen pattern.
 *
 * @module screens/customize/animation-presets-screen
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

interface AnimationPreset {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly rarity: Rarity;
  readonly icon: keyof typeof Ionicons.glyphMap;
  readonly color: string;
  readonly isEquipped: boolean;
  readonly category: 'transition' | 'hover' | 'entrance' | 'idle';
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

const PLACEHOLDER_PRESETS: AnimationPreset[] = [
  {
    id: 'ap1',
    name: 'Smooth Slide',
    description: 'Smooth sliding transitions between screens',
    rarity: 'common',
    icon: 'swap-horizontal-outline',
    color: '#3b82f6',
    isEquipped: true,
    category: 'transition',
  },
  {
    id: 'ap2',
    name: 'Bounce Pop',
    description: 'Bouncy pop-in entrance animations',
    rarity: 'uncommon',
    icon: 'resize-outline',
    color: '#10b981',
    isEquipped: false,
    category: 'entrance',
  },
  {
    id: 'ap3',
    name: 'Fade Drift',
    description: 'Ethereal fade-in with drift effect',
    rarity: 'rare',
    icon: 'eye-outline',
    color: '#8b5cf6',
    isEquipped: false,
    category: 'entrance',
  },
  {
    id: 'ap4',
    name: 'Pulse Glow',
    description: 'Gentle pulsating glow on hover',
    rarity: 'epic',
    icon: 'radio-button-on-outline',
    color: '#ec4899',
    isEquipped: false,
    category: 'hover',
  },
  {
    id: 'ap5',
    name: 'Float Drift',
    description: 'Subtle floating idle animation',
    rarity: 'rare',
    icon: 'boat-outline',
    color: '#06b6d4',
    isEquipped: false,
    category: 'idle',
  },
  {
    id: 'ap6',
    name: 'Glitch Warp',
    description: 'Digital glitch transition effect',
    rarity: 'legendary',
    icon: 'flash-outline',
    color: '#f59e0b',
    isEquipped: false,
    category: 'transition',
  },
  {
    id: 'ap7',
    name: 'Quantum Shift',
    description: 'Reality-bending teleport animation',
    rarity: 'mythic',
    icon: 'git-branch-outline',
    color: '#6366f1',
    isEquipped: false,
    category: 'transition',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Animation presets customization screen.
 */
export default function AnimationPresetsScreen() {
  const navigation = useNavigation();
  const { colors } = useThemeStore();
  const [presets] = useState<AnimationPreset[]>(PLACEHOLDER_PRESETS);

  const handleToggleEquip = useCallback((_id: string) => {
    // TODO: integrate with customization store
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: AnimationPreset }) => {
      const rarityColor = RARITY_COLORS[item.rarity];

      return (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {/* Icon preview */}
          <View style={[styles.iconWrapper, { backgroundColor: item.color + '15' }]}>
            <Ionicons name={item.icon} size={28} color={item.color} />
          </View>

          {/* Content */}
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={[styles.categoryBadge, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
                  {item.category}
                </Text>
              </View>
            </View>
            <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.description}
            </Text>

            {/* Rarity badge */}
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
                : { backgroundColor: colors.surface, borderColor: colors.primary, borderWidth: 1 },
            ]}
            onPress={() => handleToggleEquip(item.id)}
            activeOpacity={0.7}
          >
            {item.isEquipped && <Ionicons name="checkmark-circle" size={14} color="#fff" />}
            <Text
              style={[styles.equipButtonText, { color: item.isEquipped ? '#fff' : colors.primary }]}
            >
              {item.isEquipped ? 'On' : 'Equip'}
            </Text>
          </TouchableOpacity>
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Animation Presets</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Motion and transitions
          </Text>
        </View>
      </View>

      <FlatList
        data={presets}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
        )}
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
  separator: { height: 1, marginVertical: 6 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: { flex: 1, marginLeft: 12, gap: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardName: { fontSize: 15, fontWeight: '600' },
  cardDesc: { fontSize: 12 },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
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
