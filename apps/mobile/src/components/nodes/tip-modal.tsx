/**
 * Tip Modal — bottom sheet for sending a Node tip.
 *
 * Preset amounts (10, 50, 100, 500) plus custom input.
 * Validates minimum of 10 nodes, sends via nodesStore.tip(),
 * and provides success feedback with a "Tip again" shortcut.
 *
 * @module components/nodes/tip-modal
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNodesStore, useThemeStore } from '@/stores';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PRESET_AMOUNTS = [10, 50, 100, 500] as const;
const MIN_TIP = 10;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TipModalProps {
  visible: boolean;
  recipientId: string;
  recipientName: string;
  onClose: () => void;
  onTipSent?: (amount: number) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TipModal({
  visible,
  recipientId,
  recipientName,
  onClose,
  onTipSent,
}: TipModalProps): React.ReactElement {
  const { colors } = useThemeStore();
  const { tip, balance } = useNodesStore();

  const [selectedAmount, setSelectedAmount] = useState<number>(PRESET_AMOUNTS[0]);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const effectiveAmount = isCustom ? parseInt(customAmount, 10) || 0 : selectedAmount;

  // ─── Validation ───────────────────────────────────────────────────
  const validate = useCallback((): string | null => {
    if (effectiveAmount < MIN_TIP) return `Minimum tip is ${MIN_TIP} Nodes`;
    if (effectiveAmount > balance) return 'Insufficient balance';
    return null;
  }, [effectiveAmount, balance]);

  // ─── Send tip ─────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const error = validate();
    if (error) {
      Alert.alert('Cannot Send Tip', error);
      return;
    }

    setIsSending(true);
    try {
      await tip(recipientId, effectiveAmount, { type: 'direct_tip' });
      // Haptic feedback concept: Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setSuccess(true);
      onTipSent?.(effectiveAmount);
    } catch {
      Alert.alert('Tip Failed', 'Something went wrong. Please try again.');
    } finally {
      setIsSending(false);
    }
  }, [validate, tip, recipientId, effectiveAmount, onTipSent]);

  // ─── Tip again ────────────────────────────────────────────────────
  const handleTipAgain = useCallback(() => {
    setSuccess(false);
    setSelectedAmount(PRESET_AMOUNTS[0]);
    setCustomAmount('');
    setIsCustom(false);
  }, []);

  // ─── Close & reset ────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    setSuccess(false);
    setSelectedAmount(PRESET_AMOUNTS[0]);
    setCustomAmount('');
    setIsCustom(false);
    onClose();
  }, [onClose]);

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {success ? (
            /* ── Success state ──────────────────────────────────── */
            <View style={styles.successContainer}>
              <View style={[styles.successIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="checkmark-circle" size={48} color={colors.primary} />
              </View>
              <Text style={[styles.successTitle, { color: colors.text }]}>Tip Sent!</Text>
              <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
                You sent {effectiveAmount} Nodes to {recipientName}
              </Text>
              <View style={styles.successActions}>
                <TouchableOpacity
                  style={[styles.tipAgainBtn, { backgroundColor: colors.primary }]}
                  onPress={handleTipAgain}
                >
                  <Text style={styles.tipAgainText}>Tip Again</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.doneBtn, { borderColor: colors.border }]}
                  onPress={handleClose}
                >
                  <Text style={[styles.doneBtnText, { color: colors.text }]}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* ── Tip form ───────────────────────────────────────── */
            <>
              <Text style={[styles.title, { color: colors.text }]}>
                Tip {recipientName}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Balance: {balance.toLocaleString()} Nodes
              </Text>

              {/* Preset amounts */}
              <View style={styles.presetsRow}>
                {PRESET_AMOUNTS.map((amount) => {
                  const isActive = !isCustom && selectedAmount === amount;
                  return (
                    <TouchableOpacity
                      key={amount}
                      style={[
                        styles.presetChip,
                        {
                          backgroundColor: isActive ? colors.primary : colors.surfaceSecondary,
                          borderColor: isActive ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => {
                        setIsCustom(false);
                        setSelectedAmount(amount);
                      }}
                    >
                      <Text
                        style={[
                          styles.presetText,
                          { color: isActive ? '#fff' : colors.text },
                        ]}
                      >
                        {amount}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom input */}
              <TouchableOpacity
                style={[
                  styles.customInputRow,
                  {
                    borderColor: isCustom ? colors.primary : colors.border,
                    backgroundColor: colors.surfaceSecondary,
                  },
                ]}
                onPress={() => setIsCustom(true)}
                activeOpacity={1}
              >
                <Text style={[styles.customLabel, { color: colors.textSecondary }]}>Custom:</Text>
                <TextInput
                  style={[styles.customInput, { color: colors.text }]}
                  value={customAmount}
                  onChangeText={(text) => {
                    setIsCustom(true);
                    setCustomAmount(text.replace(/[^0-9]/g, ''));
                  }}
                  onFocus={() => setIsCustom(true)}
                  placeholder="Enter amount"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="number-pad"
                  returnKeyType="done"
                />
                <Text style={[styles.customSuffix, { color: colors.textSecondary }]}>Nodes</Text>
              </TouchableOpacity>

              {/* Confirm button */}
              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  {
                    backgroundColor: effectiveAmount >= MIN_TIP ? colors.primary : colors.disabled,
                  },
                ]}
                onPress={handleSend}
                disabled={isSending || effectiveAmount < MIN_TIP}
              >
                {isSending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmText}>
                    Send {effectiveAmount > 0 ? `${effectiveAmount} Nodes` : 'Tip'}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1 },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', marginTop: 4, marginBottom: 20 },
  presetsRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 16 },
  presetChip: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  presetText: { fontSize: 15, fontWeight: '600' },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
  customLabel: { fontSize: 14, marginRight: 8 },
  customInput: { flex: 1, fontSize: 16, fontWeight: '500', padding: 0 },
  customSuffix: { fontSize: 14 },
  confirmBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  confirmText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  // Success state
  successContainer: { alignItems: 'center', paddingVertical: 24 },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: { fontSize: 22, fontWeight: '700' },
  successSubtitle: { fontSize: 15, marginTop: 4, marginBottom: 24 },
  successActions: { flexDirection: 'row', gap: 12 },
  tipAgainBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  tipAgainText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  doneBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
  },
  doneBtnText: { fontSize: 15, fontWeight: '600' },
});
