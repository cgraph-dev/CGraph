/**
 * Content Unlock Button — pay Nodes to unlock gated content.
 *
 * Shows the unlock price. On press, confirms via Alert then
 * calls nodesStore.unlock(postId).
 *
 * @module components/nodes/content-unlock-button
 */

import React, { useState, useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNodesStore, useThemeStore } from '@/stores';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ContentUnlockButtonProps {
  /** Post ID to unlock. */
  postId: string;
  /** Price in Nodes. */
  price: number;
  /** Callback fired after successful unlock. */
  onUnlocked?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ContentUnlockButton({
  postId,
  price,
  onUnlocked,
}: ContentUnlockButtonProps): React.ReactElement {
  const { colors } = useThemeStore();
  const { unlock, balance } = useNodesStore();
  const [isUnlocking, setIsUnlocking] = useState(false);

  const handlePress = useCallback(() => {
    if (balance < price) {
      Alert.alert('Insufficient Nodes', `You need ${price} Nodes but have ${balance}.`);
      return;
    }

    Alert.alert(
      'Unlock Content',
      `This will cost ${price} Nodes. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlock',
          onPress: async () => {
            setIsUnlocking(true);
            try {
              await unlock(postId);
              // Haptic concept: Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
              onUnlocked?.();
            } catch {
              Alert.alert('Unlock Failed', 'Something went wrong. Please try again.');
            } finally {
              setIsUnlocking(false);
            }
          },
        },
      ],
    );
  }, [balance, price, unlock, postId, onUnlocked]);

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: colors.primary }]}
      onPress={handlePress}
      disabled={isUnlocking}
      activeOpacity={0.7}
      accessibilityLabel={`Unlock for ${price} nodes`}
      accessibilityRole="button"
    >
      {isUnlocking ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <>
          <Ionicons name="lock-open-outline" size={16} color="#fff" />
          <Text style={styles.buttonText}>Unlock · {price} Nodes</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
