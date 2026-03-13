/**
 * Tip Button — small icon button to initiate a tip flow.
 *
 * Renders a compact heart-icon button that opens the TipModal.
 *
 * @module components/nodes/tip-button
 */

import React, { useState, useCallback } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/stores';
import TipModal from './tip-modal';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TipButtonProps {
  /** User ID of the tip recipient. */
  recipientId: string;
  /** Display name of the recipient (shown in modal). */
  recipientName: string;
  /** Callback fired after a successful tip. */
  onTipSent?: (amount: number) => void;
  /** Optional icon size override. */
  size?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/** Tip Button component. */
export default function TipButton({
  recipientId,
  recipientName,
  onTipSent,
  size = 20,
}: TipButtonProps): React.ReactElement {
  const { colors } = useThemeStore();
  const [modalVisible, setModalVisible] = useState(false);

  const handleOpen = useCallback(() => setModalVisible(true), []);
  const handleClose = useCallback(() => setModalVisible(false), []);

  const handleTipSent = useCallback(
    (amount: number) => {
      onTipSent?.(amount);
    },
    [onTipSent]
  );

  return (
    <>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primaryLight }]}
        onPress={handleOpen}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel={`Tip ${recipientName}`}
        accessibilityRole="button"
      >
        <Ionicons name="heart-outline" size={size} color={colors.primary} />
      </TouchableOpacity>

      <TipModal
        visible={modalVisible}
        recipientId={recipientId}
        recipientName={recipientName}
        onClose={handleClose}
        onTipSent={handleTipSent}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
