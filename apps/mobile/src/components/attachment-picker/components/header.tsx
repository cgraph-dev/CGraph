/**
 * Header component for the attachment picker with album title, selection count, and action buttons.
 * @module components/attachment-picker/Header
 */
import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { styles } from '../styles';

interface HeaderProps {
  selectedAlbumTitle: string;
  selectedCount: number;
  onClose: () => void;
  onAlbumPress: () => void;
  onSend: () => void;
  textColor: string;
}

/**
 * Header component.
 *
 */
export function Header({
  selectedAlbumTitle,
  selectedCount,
  onClose,
  onAlbumPress,
  onSend,
  textColor,
}: HeaderProps) {
  const handleAlbumPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAlbumPress();
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Ionicons name="close" size={24} color={textColor} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.albumSelector} onPress={handleAlbumPress}>
        <Text style={[styles.albumTitle, { color: textColor }]}>{selectedAlbumTitle}</Text>
        <Ionicons name="chevron-down" size={18} color={textColor} />
      </TouchableOpacity>

      {selectedCount > 0 && (
        <TouchableOpacity style={styles.sendButton} onPress={onSend}>
          <Text style={styles.sendButtonText}>{selectedCount}</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}
