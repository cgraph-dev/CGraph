/**
 * EarningsSummary Component
 *
 * Displays a breakdown of creator earnings across categories
 * (DM Files, Subscriptions, Boosts, Tips) with a total.
 *
 * @module components/creator/earnings-summary
 * @since v1.0.0
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '@/stores';

interface EarningsEntry {
  type: 'dm_files' | 'subscriptions' | 'boosts' | 'tips' | string;
  amount: number;
}

interface EarningsSummaryProps {
  earnings: EarningsEntry[];
}

const CATEGORY_META: Record<string, { label: string; emoji: string }> = {
  dm_files: { label: 'DM Files', emoji: '📎' },
  subscriptions: { label: 'Subscriptions', emoji: '⭐' },
  boosts: { label: 'Boosts', emoji: '🚀' },
  tips: { label: 'Tips', emoji: '💰' },
};

function formatNodes(amount: number): string {
  return `${amount.toLocaleString()} nodes`;
}

/** Earnings Summary component. */
export default function EarningsSummary({ earnings }: EarningsSummaryProps): React.ReactElement {
  const { colors } = useThemeStore();

  const total = earnings.reduce((sum, e) => sum + e.amount, 0);

  // Ensure all 4 categories appear even if missing from data
  const categories = ['dm_files', 'subscriptions', 'boosts', 'tips'];
  const earningsMap = new Map(earnings.map((e) => [e.type, e.amount]));

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: colors.text }]}>Earnings Summary</Text>

      {categories.map((cat) => {
        const meta = CATEGORY_META[cat] ?? { label: cat, emoji: '💎' };
        const amount = earningsMap.get(cat) ?? 0;
        return (
          <View
            key={cat}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.cardLeft}>
              <Text style={styles.emoji}>{meta.emoji}</Text>
              <Text style={[styles.catLabel, { color: colors.text }]}>{meta.label}</Text>
            </View>
            <Text style={[styles.amount, { color: colors.primary }]}>{formatNodes(amount)}</Text>
          </View>
        );
      })}

      {/* Total */}
      <View style={[styles.totalRow, { borderColor: colors.border }]}>
        <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
        <Text style={[styles.totalAmount, { color: colors.primary }]}>{formatNodes(total)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8 },
  heading: { fontSize: 17, fontWeight: '600', marginBottom: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emoji: { fontSize: 22 },
  catLabel: { fontSize: 15, fontWeight: '500' },
  amount: { fontSize: 15, fontWeight: '700' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    marginTop: 4,
    borderTopWidth: 1,
  },
  totalLabel: { fontSize: 16, fontWeight: '700' },
  totalAmount: { fontSize: 18, fontWeight: '700' },
});
