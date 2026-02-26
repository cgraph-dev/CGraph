import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal } from 'react-native';
import type { UserBasic } from '../types';
import { styles } from '../styles';

interface Props {
  visible: boolean;
  selectedUser: UserBasic | null;
  banReason: string;
  onBanReasonChange: (text: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  colors: {
    text: string;
    textSecondary: string;
    surface: string;
    background: string;
    border: string;
    error: string;
  };
}

export function BanUserModal({
  visible, selectedUser, banReason, onBanReasonChange, onConfirm, onCancel, colors,
}: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Ban User</Text>
          <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
            Banning u/{selectedUser?.username}
          </Text>
          <TextInput
            style={[styles.reasonInput, { color: colors.text, borderColor: colors.border }]}
            placeholder="Reason for ban"
            placeholderTextColor={colors.textSecondary}
            value={banReason}
            onChangeText={onBanReasonChange}
            multiline
            numberOfLines={3}
          />
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.background }]}
              onPress={onCancel}
            >
              <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.error }]}
              onPress={onConfirm}
            >
              <Text style={[styles.modalButtonText, { color: '#fff' }]}>Ban User</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
