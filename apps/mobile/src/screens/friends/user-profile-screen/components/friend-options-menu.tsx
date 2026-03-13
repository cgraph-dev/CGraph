/**
 * Friend options bottom-sheet menu modal.
 * @module screens/friends/user-profile-screen/components/friend-options-menu
 */
import React from 'react';
import { View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';
import type { ThemeColors } from '@/stores';

interface FriendOptionsMenuProps {
  visible: boolean;
  colors: ThemeColors;
  onClose: () => void;
  onInviteToForum: () => void;
  onMute: () => void;
  onRemoveFriend: () => void;
  onBlock: () => void;
}

export function FriendOptionsMenu({
  visible,
  colors,
  onClose,
  onInviteToForum,
  onMute,
  onRemoveFriend,
  onBlock,
}: FriendOptionsMenuProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.menuContainer, { backgroundColor: colors.surface }]}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>Friend Options</Text>

              <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={onInviteToForum}>
                <Ionicons name="people" size={22} color={colors.text} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>Invite to Forum</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={onMute}>
                <Ionicons name="notifications-off" size={22} color={colors.text} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>Mute</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={onRemoveFriend}>
                <Ionicons name="person-remove" size={22} color={colors.error} />
                <Text style={[styles.menuItemText, { color: colors.error }]}>Remove Friend</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={onBlock}>
                <Ionicons name="ban" size={22} color={colors.error} />
                <Text style={[styles.menuItemText, { color: colors.error }]}>Block</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.cancelButton, { backgroundColor: colors.surfaceHover }]} onPress={onClose}>
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
