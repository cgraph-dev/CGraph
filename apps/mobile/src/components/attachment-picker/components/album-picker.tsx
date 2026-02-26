/**
 * Album picker component for browsing and selecting media library albums.
 * @module components/attachment-picker/AlbumPicker
 */
import React from 'react';
import { View, TouchableOpacity, Text, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import { styles } from '../styles';

interface AlbumPickerProps {
  visible: boolean;
  albums: MediaLibrary.Album[];
  selectedAlbum: MediaLibrary.Album | null;
  onSelect: (album: MediaLibrary.Album | null) => void;
  onClose: () => void;
  isDark: boolean;
  colors: {
    text: string;
    border: string;
    surface: string;
    primary: string;
    textSecondary: string;
  };
}

/**
 *
 */
export function AlbumPicker({
  visible,
  albums,
  selectedAlbum,
  onSelect,
  onClose,
  isDark,
  colors,
}: AlbumPickerProps) {
  if (!visible) return null;

  return (
    <View style={styles.albumPickerOverlay}>
      <TouchableOpacity style={styles.albumPickerBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={[styles.albumPickerContainer, { backgroundColor: isDark ? '#1c1c1e' : '#fff' }]}>
        <View style={styles.albumPickerHeader}>
          <Text style={[styles.albumPickerTitle, { color: colors.text }]}>Select Album</Text>
          <TouchableOpacity onPress={onClose} style={styles.albumPickerCloseBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={[null, ...albums]}
          keyExtractor={(item, index) => item?.id || `recents-${index}`}
          renderItem={({ item }) => {
            const isSelected =
              (item === null && selectedAlbum === null) || item?.id === selectedAlbum?.id;

            return (
              <TouchableOpacity
                style={[
                  styles.albumItem,
                  { borderBottomColor: colors.border },
                  isSelected ? { backgroundColor: colors.surface } : {},
                ]}
                onPress={() => onSelect(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.albumIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons
                    name={item === null ? 'time-outline' : 'folder-outline'}
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.albumInfo}>
                  <Text style={[styles.albumName, { color: colors.text }]}>
                    {item === null ? 'Recents' : item.title}
                  </Text>
                  {item !== null && (
                    <Text style={[styles.albumCount, { color: colors.textSecondary }]}>
                      {item.assetCount} items
                    </Text>
                  )}
                </View>
                {isSelected && <Ionicons name="checkmark" size={24} color={colors.primary} />}
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.albumListContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}
