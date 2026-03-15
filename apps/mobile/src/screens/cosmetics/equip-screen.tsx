/**
 * Equip Screen — full-screen cosmetic preview with equip/unequip action.
 *
 * Features:
 * - Full-screen preview of cosmetic item
 * - Item details (name, rarity, description)
 * - Equip/Unequip button with haptic feedback
 * - Equipped animation indicator
 *
 * @module screens/cosmetics/equip-screen
 */

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/stores';

import { RARITY_HEX_COLORS, RARITY_LABELS, type UserCosmeticInventory } from '@cgraph/shared-types';
import { CosmeticRenderer } from '@/components/cosmetics/cosmetic-renderer';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface RouteParams {
  itemId: string;
  item: UserCosmeticInventory;
}

/**
 * Full-screen equip screen with preview and action button.
 */
export default function EquipScreen() {
  const { colors } = useThemeStore();
  const navigation = useNavigation();
  const route = useRoute();
  const params: RouteParams | undefined = route.params
    ?  
      (route.params as unknown as RouteParams)
    : undefined;

  const entry = params?.item;
  const [isEquipped, setIsEquipped] = useState(entry?.equipped ?? false);

  const handleToggleEquip = useCallback(async () => {
    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // TODO: Wire to real API
    setIsEquipped((prev) => !prev);

    // Success haptic
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  if (!entry) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>Item not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.errorLink, { color: colors.primary }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { cosmetic } = entry;
  const rarityColor = RARITY_HEX_COLORS[cosmetic.rarity] ?? '#9ca3af';
  const rarityLabel = RARITY_LABELS[cosmetic.rarity] ?? cosmetic.rarity;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: `${colors.border}20` }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Item Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Preview area */}
        <View style={[styles.previewArea, { backgroundColor: `${colors.surface}80` }]}>
          <CosmeticRenderer item={cosmetic} size={120} />

          {/* Equipped indicator */}
          {isEquipped && (
            <View style={[styles.equippedIndicator, { backgroundColor: `${colors.primary}20` }]}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={[styles.equippedText, { color: colors.primary }]}>Equipped</Text>
            </View>
          )}
        </View>

        {/* Item info */}
        <View style={styles.infoSection}>
          <Text style={[styles.itemName, { color: colors.text }]}>{cosmetic.name}</Text>

          {/* Rarity */}
          <View
            style={[
              styles.rarityBadge,
              { backgroundColor: `${rarityColor}20`, borderColor: rarityColor },
            ]}
          >
            <View style={[styles.rarityDot, { backgroundColor: rarityColor }]} />
            <Text style={[styles.rarityLabel, { color: rarityColor }]}>{rarityLabel}</Text>
          </View>

          {/* Description */}
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {cosmetic.description}
          </Text>

          {/* Meta tags */}
          <View style={styles.metaRow}>
            <View style={[styles.metaTag, { backgroundColor: `${colors.border}15` }]}>
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {cosmetic.type.replace('_', ' ')}
              </Text>
            </View>
            <View style={[styles.metaTag, { backgroundColor: `${colors.border}15` }]}>
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {cosmetic.unlockType}
              </Text>
            </View>
            {cosmetic.animationType !== 'none' && (
              <View style={[styles.metaTag, { backgroundColor: `${colors.border}15` }]}>
                <Ionicons name="sparkles" size={10} color={colors.textSecondary} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>Animated</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Action footer */}
      <View style={[styles.footer, { borderTopColor: `${colors.border}20` }]}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: isEquipped ? `${colors.error ?? '#ef4444'}15` : colors.primary,
            },
          ]}
          onPress={handleToggleEquip}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isEquipped ? 'close-circle-outline' : 'checkmark-circle-outline'}
            size={20}
            color={isEquipped ? (colors.error ?? '#ef4444') : '#fff'}
          />
          <Text
            style={[
              styles.actionText,
              { color: isEquipped ? (colors.error ?? '#ef4444') : '#fff' },
            ]}
          >
            {isEquipped ? 'Unequip' : 'Equip'}
          </Text>
        </TouchableOpacity>
      </View>
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
  headerTitle: { fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  headerSpacer: { width: 32 },
  scrollContent: { paddingBottom: 24 },
  previewArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    gap: 16,
  },
  equippedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  equippedText: { fontSize: 13, fontWeight: '600' },
  infoSection: { paddingHorizontal: 24, paddingTop: 24, gap: 12, alignItems: 'center' },
  itemName: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  rarityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  rarityDot: { width: 8, height: 8, borderRadius: 4 },
  rarityLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  description: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  metaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaText: { fontSize: 11, fontWeight: '500', textTransform: 'capitalize' },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  actionText: { fontSize: 16, fontWeight: '700' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { fontSize: 16, fontWeight: '600' },
  errorLink: { fontSize: 14, fontWeight: '600' },
});
