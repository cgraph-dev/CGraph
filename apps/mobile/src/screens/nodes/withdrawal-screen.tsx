/**
 * Withdrawal Screen — request a Node withdrawal to real currency.
 *
 * Amount input with min 1000 validation, EUR conversion display,
 * payout method selection, fee breakdown, and confirm button.
 *
 * @module screens/nodes/withdrawal-screen
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNodesStore, useThemeStore } from '@/stores';
import {
  NODES_EXCHANGE_RATE_EUR,
  MIN_WITHDRAWAL,
  PLATFORM_CUT_PERCENT,
} from '@cgraph/shared-types/nodes';

// ---------------------------------------------------------------------------
// Payout methods
// ---------------------------------------------------------------------------

const PAYOUT_METHODS = [
  { id: 'bank_transfer', label: 'Bank Transfer', icon: 'business-outline' as const },
  { id: 'paypal', label: 'PayPal', icon: 'logo-paypal' as const },
  { id: 'stripe', label: 'Stripe Connect', icon: 'card-outline' as const },
] as const;

type PayoutMethodId = (typeof PAYOUT_METHODS)[number]['id'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WithdrawalScreen(): React.ReactElement {
  const { colors } = useThemeStore();
  const { balance, withdraw, isLoading: _isLoading } = useNodesStore();

  const [amountStr, setAmountStr] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethodId>('bank_transfer');
  const [submitting, setSubmitting] = useState(false);

  const amount = parseInt(amountStr, 10) || 0;
  const eurAmount = amount * NODES_EXCHANGE_RATE_EUR;
  const creatorReceivePercent = 100 - PLATFORM_CUT_PERCENT;
  const creatorReceiveEur = eurAmount * (creatorReceivePercent / 100);

  // ─── Validation ───────────────────────────────────────────────────
  const validationError = useMemo((): string | null => {
    if (amount === 0) return null; // No input yet
    if (amount < MIN_WITHDRAWAL) return `Minimum withdrawal is ${MIN_WITHDRAWAL.toLocaleString()} Nodes`;
    if (amount > balance) return 'Exceeds available balance';
    return null;
  }, [amount, balance]);

  const canSubmit = amount >= MIN_WITHDRAWAL && amount <= balance && !submitting;

  // ─── Submit ───────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;

    Alert.alert(
      'Confirm Withdrawal',
      `Withdraw ${amount.toLocaleString()} Nodes (€${creatorReceiveEur.toFixed(2)} after fees) via ${
        PAYOUT_METHODS.find((m) => m.id === payoutMethod)?.label
      }?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setSubmitting(true);
            try {
              await withdraw(amount, payoutMethod);
              Alert.alert(
                'Withdrawal Requested',
                'Your withdrawal is being processed. You\'ll receive funds within 5-7 business days.',
              );
              setAmountStr('');
            } catch {
              Alert.alert('Withdrawal Failed', 'Something went wrong. Please try again.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  }, [canSubmit, amount, creatorReceiveEur, payoutMethod, withdraw]);

  // ─── Max button ───────────────────────────────────────────────────
  const handleMax = useCallback(() => {
    setAmountStr(String(balance));
  }, [balance]);

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Available balance */}
      <View style={[styles.balanceCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Available Balance</Text>
        <Text style={[styles.balanceAmount, { color: colors.text }]}>
          {balance.toLocaleString()} Nodes
        </Text>
      </View>

      {/* Amount input */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Amount to Withdraw</Text>
      <View
        style={[
          styles.inputRow,
          {
            borderColor: validationError ? colors.error : colors.border,
            backgroundColor: colors.surfaceSecondary,
          },
        ]}
      >
        <TextInput
          style={[styles.amountInput, { color: colors.text }]}
          value={amountStr}
          onChangeText={(text) => setAmountStr(text.replace(/[^0-9]/g, ''))}
          placeholder={`Min ${MIN_WITHDRAWAL.toLocaleString()}`}
          placeholderTextColor={colors.textTertiary}
          keyboardType="number-pad"
          returnKeyType="done"
        />
        <TouchableOpacity style={[styles.maxBtn, { backgroundColor: colors.primary }]} onPress={handleMax}>
          <Text style={styles.maxBtnText}>MAX</Text>
        </TouchableOpacity>
      </View>

      {validationError && (
        <Text style={[styles.errorText, { color: colors.error }]}>{validationError}</Text>
      )}

      {/* EUR conversion */}
      {amount > 0 && (
        <View style={[styles.conversionCard, { backgroundColor: colors.surface }]}>
          <View style={styles.conversionRow}>
            <Text style={[styles.conversionLabel, { color: colors.textSecondary }]}>
              Gross Amount
            </Text>
            <Text style={[styles.conversionValue, { color: colors.text }]}>
              €{eurAmount.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.conversionRow}>
            <Text style={[styles.conversionLabel, { color: colors.textSecondary }]}>
              Platform Fee ({PLATFORM_CUT_PERCENT}%)
            </Text>
            <Text style={[styles.conversionValue, { color: colors.error }]}>
              -€{(eurAmount - creatorReceiveEur).toFixed(2)}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.conversionRow}>
            <Text style={[styles.conversionLabelBold, { color: colors.text }]}>
              Creator Receives ({creatorReceivePercent}%)
            </Text>
            <Text style={[styles.conversionValueBold, { color: colors.primary }]}>
              €{creatorReceiveEur.toFixed(2)}
            </Text>
          </View>
        </View>
      )}

      {/* Payout method */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Payout Method</Text>
      {PAYOUT_METHODS.map((method) => {
        const isActive = payoutMethod === method.id;
        return (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.payoutOption,
              {
                backgroundColor: colors.surface,
                borderColor: isActive ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setPayoutMethod(method.id)}
          >
            <Ionicons
              name={method.icon as never}
              size={22}
              color={isActive ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.payoutLabel,
                { color: isActive ? colors.primary : colors.text },
              ]}
            >
              {method.label}
            </Text>
            {isActive && (
              <Ionicons name="checkmark-circle" size={22} color={colors.primary} style={styles.payoutCheck} />
            )}
          </TouchableOpacity>
        );
      })}

      {/* Confirm button */}
      <TouchableOpacity
        style={[
          styles.confirmBtn,
          { backgroundColor: canSubmit ? colors.primary : colors.disabled },
        ]}
        onPress={handleSubmit}
        disabled={!canSubmit}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.confirmText}>
            {amount >= MIN_WITHDRAWAL
              ? `Withdraw €${creatorReceiveEur.toFixed(2)}`
              : 'Request Withdrawal'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Note */}
      <Text style={[styles.note, { color: colors.textTertiary }]}>
        Withdrawals are processed within 5-7 business days. A {PLATFORM_CUT_PERCENT}% platform fee
        applies to all withdrawals. Minimum withdrawal is {MIN_WITHDRAWAL.toLocaleString()} Nodes.
      </Text>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  balanceCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceLabel: { fontSize: 14, marginBottom: 4 },
  balanceAmount: { fontSize: 28, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 14,
    marginBottom: 6,
  },
  amountInput: { flex: 1, fontSize: 18, fontWeight: '500', paddingVertical: 14 },
  maxBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginRight: 8,
  },
  maxBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  errorText: { fontSize: 13, marginBottom: 12 },
  conversionCard: {
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    marginBottom: 24,
  },
  conversionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  conversionLabel: { fontSize: 14 },
  conversionValue: { fontSize: 14 },
  conversionLabelBold: { fontSize: 15, fontWeight: '600' },
  conversionValueBold: { fontSize: 15, fontWeight: '700' },
  divider: { height: StyleSheet.hairlineWidth },
  payoutOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 12,
  },
  payoutLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  payoutCheck: { marginLeft: 'auto' },
  confirmBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  note: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
});
