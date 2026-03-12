/**
 * FileUnlockSheet Component
 *
 * Modal-based bottom sheet for confirming file unlock purchases.
 * Shows file info, price, user balance, and confirm/cancel actions.
 *
 * @module components/paid-dm/file-unlock-sheet
 * @since v1.0.0
 */
import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { useThemeStore } from '@/stores';

interface FileInfo {
  fileName: string;
  fileType: string;
  price: number;
}

interface FileUnlockSheetProps {
  visible: boolean;
  onClose: () => void;
  file: FileInfo | null;
  userBalance: number;
  onConfirm: () => void;
}

export default function FileUnlockSheet({
  visible,
  onClose,
  file,
  userBalance,
  onConfirm,
}: FileUnlockSheetProps): React.ReactElement {
  const { colors } = useThemeStore();

  if (!file) return <></>;

  const insufficientBalance = userBalance < file.price;

  const handleConfirm = () => {
    try {
      // Optional haptic feedback — expo-haptics may not be available in all envs
      const Haptics = require('expo-haptics');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Haptics unavailable — silently continue
    }
    onConfirm();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <Text style={[styles.title, { color: colors.text }]}>Unlock File</Text>

          {/* File info */}
          <View style={[styles.infoRow, { borderColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>File</Text>
            <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>
              {file.fileName}
            </Text>
          </View>

          <View style={[styles.infoRow, { borderColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Type</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {file.fileType.charAt(0).toUpperCase() + file.fileType.slice(1)}
            </Text>
          </View>

          <View style={[styles.infoRow, { borderColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Price</Text>
            <Text style={[styles.infoValue, { color: colors.primary }]}>
              {file.price} nodes
            </Text>
          </View>

          <View style={[styles.infoRow, { borderColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Your Balance</Text>
            <Text
              style={[
                styles.infoValue,
                { color: insufficientBalance ? '#ef4444' : colors.text },
              ]}
            >
              {userBalance} nodes
            </Text>
          </View>

          {/* Warning */}
          {insufficientBalance && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                Insufficient balance. You need {file.price - userBalance} more nodes.
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
            </Pressable>

            <Pressable
              style={[
                styles.confirmButton,
                { backgroundColor: insufficientBalance ? colors.border : colors.primary },
              ]}
              onPress={handleConfirm}
              disabled={insufficientBalance}
            >
              <Text style={styles.confirmText}>Confirm Unlock</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 15, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  warningBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
  },
  warningText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelText: { fontSize: 16, fontWeight: '600' },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
