/**
 * Nodes Shop Screen — purchase Node bundles.
 *
 * Displays available bundles in a grid layout with purchase flow stub
 * (Stripe Payment Sheet placeholder).
 *
 * @module screens/nodes/shop-screen
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNodesStore } from '@/stores';
import { useThemeStore } from '@/stores';
import type { NodeBundle } from '@cgraph/shared-types/src/nodes';

// ---------------------------------------------------------------------------
// Default bundles (fallback if API hasn't loaded)
// ---------------------------------------------------------------------------

const DEFAULT_BUNDLES: NodeBundle[] = [
  { id: '1', name: 'Starter', node_amount: 100, price_eur: 0.99, bonus_percent: 0, is_active: true },
  { id: '2', name: 'Popular', node_amount: 500, price_eur: 3.99, bonus_percent: 5, is_active: true },
  { id: '3', name: 'Value', node_amount: 1200, price_eur: 8.99, bonus_percent: 10, is_active: true },
  { id: '4', name: 'Premium', node_amount: 5000, price_eur: 34.99, bonus_percent: 15, is_active: true },
  { id: '5', name: 'Mega', node_amount: 12000, price_eur: 79.99, bonus_percent: 20, is_active: true },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ShopScreen(): React.ReactElement {
  const { colors } = useThemeStore();
  const { bundles, isLoading, fetchBundles, balance } = useNodesStore();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    fetchBundles();
  }, [fetchBundles]);

  const displayBundles = bundles.length > 0 ? bundles : DEFAULT_BUNDLES;

  // ─── Purchase flow (stub) ─────────────────────────────────────────
  const handlePurchase = useCallback(
    async (bundle: NodeBundle) => {
      Alert.alert(
        `Buy ${bundle.name}`,
        `${bundle.node_amount.toLocaleString()} Nodes for €${bundle.price_eur.toFixed(2)}${
          bundle.bonus_percent > 0 ? ` (+${bundle.bonus_percent}% bonus!)` : ''
        }\n\nProceed to payment?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Purchase',
            onPress: async () => {
              setPurchasing(bundle.id);
              try {
                // TODO: integrate Stripe Payment Sheet
                // await stripeService.presentPaymentSheet({ bundleId: bundle.id });
                await new Promise((resolve) => setTimeout(resolve, 1500));
                Alert.alert(
                  'Purchase Complete! 🎉',
                  `You received ${bundle.node_amount.toLocaleString()} Nodes!`,
                );
                await fetchBundles();
              } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Payment failed';
                Alert.alert('Purchase Failed', message);
              } finally {
                setPurchasing(null);
              }
            },
          },
        ],
      );
    },
    [fetchBundles],
  );

  // ─── Bundle card ──────────────────────────────────────────────────
  const renderBundle = useCallback(
    ({ item }: { item: NodeBundle }) => {
      const isPurchasing = purchasing === item.id;

      return (
        <TouchableOpacity
          style={[styles.bundleCard, { backgroundColor: colors.surface }]}
          onPress={() => handlePurchase(item)}
          disabled={isPurchasing}
          activeOpacity={0.7}
        >
          {item.bonus_percent > 0 && (
            <View style={styles.bonusBadge}>
              <Text style={styles.bonusBadgeText}>+{item.bonus_percent}%</Text>
            </View>
          )}

          <View style={[styles.bundleIcon, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="diamond-outline" size={28} color={colors.primary} />
          </View>

          <Text style={[styles.bundleName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.bundleAmount, { color: colors.primary }]}>
            {item.node_amount.toLocaleString()} Nodes
          </Text>

          <TouchableOpacity
            style={[styles.buyButton, { backgroundColor: colors.primary }]}
            onPress={() => handlePurchase(item)}
            disabled={isPurchasing}
          >
            {isPurchasing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buyButtonText}>€{item.price_eur.toFixed(2)}</Text>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      );
    },
    [colors, purchasing, handlePurchase],
  );

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Balance header */}
      <View style={[styles.balanceBar, { backgroundColor: colors.surface }]}>
        <Ionicons name="wallet-outline" size={20} color={colors.primary} />
        <Text style={[styles.balanceText, { color: colors.text }]}>
          {balance.toLocaleString()} Nodes
        </Text>
      </View>

      {isLoading && bundles.length === 0 ? (
        <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={displayBundles}
          keyExtractor={(item) => item.id}
          renderItem={renderBundle}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={[styles.headerText, { color: colors.textSecondary }]}>
              Choose a bundle to add Nodes to your wallet
            </Text>
          }
        />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  balanceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  balanceText: { fontSize: 16, fontWeight: '600' },
  headerText: { fontSize: 14, textAlign: 'center', marginBottom: 16, paddingHorizontal: 16 },
  grid: { padding: 12 },
  row: { justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  bundleCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  bonusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  bonusBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  bundleIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  bundleName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  bundleAmount: { fontSize: 13, fontWeight: '500', marginBottom: 12 },
  buyButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  buyButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  loader: { flex: 1, justifyContent: 'center' },
});
