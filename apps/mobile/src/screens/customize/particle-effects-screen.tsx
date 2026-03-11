/**
 * Particle Effects Screen — browse and equip particle effects.
 *
 * Grid of particle effects with animated previews, rarity indicators,
 * and equip/unequip toggle. Uses the standard customization screen pattern.
 *
 * @module screens/customize/particle-effects-screen
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

interface ParticleEffect {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly rarity: Rarity;
  readonly icon: keyof typeof Ionicons.glyphMap;
  readonly color: string;
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

const PLACEHOLDER_EFFECTS: ParticleEffect[] = [
  {
    id: 'pe1',
    name: 'Sparkle Trail',
    description: 'Glittering particles follow your cursor',
    rarity: 'common',
    icon: 'sparkles',
    color: '#fbbf24',
    isEquipped: false,
  },
  {
    id: 'pe2',
    name: 'Matrix Rain',
    description: 'Green code rain effect',
    rarity: 'rare',
    icon: 'code-slash',
    color: '#10b981',
    isEquipped: true,
  },
  {
    id: 'pe3',
    name: 'Fire Embers',
    description: 'Floating ember particles',
    rarity: 'epic',
    icon: 'flame',
    color: '#ef4444',
    isEquipped: false,
  },
  {
    id: 'pe4',
    name: 'Snow Drift',
    description: 'Gentle snowfall particles',
    rarity: 'uncommon',
    icon: 'snow',
    color: '#60a5fa',
    isEquipped: false,
  },
  {
    id: 'pe5',
    name: 'Star Burst',
    description: 'Exploding star particles on actions',
    rarity: 'legendary',
    icon: 'star',
    color: '#f59e0b',
    isEquipped: false,
  },
  {
    id: 'pe6',
    name: 'Void Tendrils',
    description: 'Dark energy wisps',
    rarity: 'mythic',
    icon: 'planet',
    color: '#8b5cf6',
    isEquipped: false,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Particle effects customization screen.
 */
export default function ParticleEffectsScreen() {
  const navigation = useNavigation();
  const { colors } = useThemeStore();
  const [effects] = useState<ParticleEffect[]>(PLACEHOLDER_EFFECTS);

  const handleToggleEquip = useCallback((_id: string) => {
    // TODO: integrate with customization store
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: ParticleEffect }) => {
      const rarityColor = RARITY_COLORS[item.rarity];

      return (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {/* Preview area */}
          <View style={[styles.cardPreview, { backgroundColor: item.color + '15' }]}>
            <Ionicons name={item.icon} size={36} color={item.color} />
          </View>

          {/* Info */}
          <View style={styles.cardInfo}>
            <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={2}>
              {item.description}
            </Text>

            {/* Rarity badge */}
            <View style={[styles.rarityBadge, { backgroundColor: rarityColor + '22' }]}>
              <View style={[styles.rarityDot, { backgroundColor: rarityColor }]} />
              <Text style={[styles.rarityText, { color: rarityColor }]}>{item.rarity}</Text>
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Particle Effects</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Add flair to your profile
          </Text>
        </View>
      </View>

      <FlatList
        data={effects}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
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
  gridContent: { padding: 16, paddingBottom: 40 },
  gridRow: { gap: CARD_GAP, marginBottom: CARD_GAP },
  card: { width: CARD_WIDTH, borderRadius: 14, overflow: 'hidden' },
  cardPreview: {
    width: '100%',
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: { padding: 10, gap: 6 },
  cardName: { fontSize: 14, fontWeight: '600' },
  cardDesc: { fontSize: 11, lineHeight: 15 },
  rarityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  rarityDot: { width: 6, height: 6, borderRadius: 3 },
  rarityText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  equipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: 8,
  },
  equipButtonText: { fontSize: 12, fontWeight: '600' },
});
