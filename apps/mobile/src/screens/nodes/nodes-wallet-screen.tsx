/**
 * Nodes Wallet Screen — balance display, transaction history, quick actions.
 *
 * Shows the user's Node balance with EUR conversion, action buttons,
 * and a filterable transaction list with pull-to-refresh + infinite scroll.
 *
 * @module screens/nodes/nodes-wallet-screen
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, type ParamListBase } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNodesStore } from '@/stores';
import { useThemeStore } from '@/stores';
import type { NodeTransaction, NodeTransactionType } from '@cgraph/shared-types/src/nodes';
import { NODES_EXCHANGE_RATE_EUR } from '@cgraph/shared-types/src/nodes';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20;

const FILTER_TABS: { label: string; value: string | null }[] = [
  { label: 'All', value: null },
  { label: 'Purchases', value: 'purchase' },
  { label: 'Tips', value: 'tip_sent' },
  { label: 'Received', value: 'tip_received' },
  { label: 'Unlocks', value: 'content_unlock' },
  { label: 'Withdrawals', value: 'withdrawal' },
];

const TX_ICON_MAP: Record<NodeTransactionType, { name: string; color: string }> = {
  purchase: { name: 'cart-outline', color: '#2563eb' },
  tip_received: { name: 'arrow-down-circle-outline', color: '#059669' },
  tip_sent: { name: 'arrow-up-circle-outline', color: '#dc2626' },
  content_unlock: { name: 'lock-open-outline', color: '#7c3aed' },
  subscription_received: { name: 'star-outline', color: '#059669' },
  subscription_sent: { name: 'star-outline', color: '#dc2626' },
  withdrawal: { name: 'wallet-outline', color: '#d97706' },
  cosmetic_purchase: { name: 'color-palette-outline', color: '#ec4899' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NodesWalletScreen(): React.ReactElement {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const { colors } = useThemeStore();
  const {
    balance,
    eurBalance,
    pendingBalance,
    transactions,
    isLoading,
    fetchWallet,
    fetchTransactions,
  } = useNodesStore();

  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ─── Initial load ──────────────────────────────────────────────────
  useEffect(() => {
    fetchWallet();
    fetchTransactions({ page: 1, per_page: PAGE_SIZE });
  }, [fetchWallet, fetchTransactions]);

  // ─── Pull-to-refresh ──────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    await Promise.all([
      fetchWallet(),
      fetchTransactions({ page: 1, per_page: PAGE_SIZE, type: activeFilter ?? undefined }),
    ]);
    setRefreshing(false);
  }, [fetchWallet, fetchTransactions, activeFilter]);

  // ─── Infinite scroll ──────────────────────────────────────────────
  const handleLoadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchTransactions({
      page: nextPage,
      per_page: PAGE_SIZE,
      type: activeFilter ?? undefined,
    });
    // If fewer items returned than page size, no more pages
    if (transactions.length < nextPage * PAGE_SIZE) {
      setHasMore(false);
    }
  }, [hasMore, isLoading, page, activeFilter, fetchTransactions, transactions.length]);

  // ─── Filter change ────────────────────────────────────────────────
  const handleFilterChange = useCallback(
    (value: string | null) => {
      setActiveFilter(value);
      setPage(1);
      setHasMore(true);
      fetchTransactions({ page: 1, per_page: PAGE_SIZE, type: value ?? undefined });
    },
    [fetchTransactions],
  );

  // ─── Transaction row ─────────────────────────────────────────────
  const renderTransaction = useCallback(
    ({ item }: { item: NodeTransaction }) => {
      const meta = TX_ICON_MAP[item.type] ?? { name: 'ellipse-outline', color: '#6b7280' };
      const isCredit = item.amount > 0;
      const sign = isCredit ? '+' : '';
      const amountColor = isCredit ? '#059669' : '#dc2626';
      const dateStr = new Date(item.inserted_at).toLocaleDateString();

      return (
        <View style={[styles.txRow, { borderBottomColor: colors.border }]}>
          <View style={[styles.txIcon, { backgroundColor: meta.color + '18' }]}>
            <Ionicons name={meta.name as never} size={20} color={meta.color} />
          </View>
          <View style={styles.txInfo}>
            <Text style={[styles.txType, { color: colors.text }]}>
              {item.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </Text>
            <Text style={[styles.txDate, { color: colors.textSecondary }]}>{dateStr}</Text>
          </View>
          <Text style={[styles.txAmount, { color: amountColor }]}>
            {sign}{item.amount} N
          </Text>
        </View>
      );
    },
    [colors],
  );

  // ─── Empty state ──────────────────────────────────────────────────
  const renderEmpty = useCallback(
    () =>
      !isLoading ? (
        <View style={styles.emptyState}>
          <Ionicons name="wallet-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No transactions yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Purchase nodes or receive tips to see your history here.
          </Text>
        </View>
      ) : null,
    [isLoading, colors],
  );

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Balance Card */}
      <View style={[styles.balanceCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Your Balance</Text>
        <Text style={[styles.balanceAmount, { color: colors.text }]}>
          {balance.toLocaleString()} <Text style={styles.balanceCurrency}>Nodes</Text>
        </Text>
        <Text style={[styles.balanceEur, { color: colors.textSecondary }]}>
          ≈ €{eurBalance.toFixed(2)}
        </Text>
        {pendingBalance > 0 && (
          <Text style={[styles.pendingBadge, { color: colors.warning }]}>
            {pendingBalance.toLocaleString()} pending
          </Text>
        )}

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('NodesShop')}
          >
            <Ionicons name="cart-outline" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>Buy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('NodesTip')}
          >
            <Ionicons name="heart-outline" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>Tip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('NodesWithdrawal')}
          >
            <Ionicons name="cash-outline" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>Withdraw</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <FlatList
        horizontal
        data={FILTER_TABS}
        keyExtractor={(item) => item.label}
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
        renderItem={({ item }) => {
          const isActive = activeFilter === item.value;
          return (
            <TouchableOpacity
              style={[
                styles.filterTab,
                {
                  backgroundColor: isActive ? colors.primary : colors.surfaceSecondary,
                },
              ]}
              onPress={() => handleFilterChange(item.value)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  { color: isActive ? '#fff' : colors.textSecondary },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Transaction List */}
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransaction}
        ListEmptyComponent={renderEmpty}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        ListFooterComponent={
          isLoading && transactions.length > 0 ? (
            <ActivityIndicator style={styles.footer} color={colors.primary} />
          ) : null
        }
        contentContainerStyle={transactions.length === 0 ? styles.emptyList : undefined}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  balanceCard: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  balanceLabel: { fontSize: 14, marginBottom: 4 },
  balanceAmount: { fontSize: 36, fontWeight: '700' },
  balanceCurrency: { fontSize: 18, fontWeight: '400' },
  balanceEur: { fontSize: 16, marginTop: 4 },
  pendingBadge: { fontSize: 13, marginTop: 8, fontStyle: 'italic' },
  actionRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    gap: 6,
  },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  filterRow: { maxHeight: 44, marginBottom: 4 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  filterTabText: { fontSize: 13, fontWeight: '500' },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txInfo: { flex: 1 },
  txType: { fontSize: 15, fontWeight: '500' },
  txDate: { fontSize: 12, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  emptyList: { flexGrow: 1 },
  footer: { paddingVertical: 16 },
});
