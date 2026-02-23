/**
 * Media tile component for displaying a selectable photo or video thumbnail in the attachment picker grid.
 * @module components/attachment-picker/MediaTile
 */
import React from 'react';
import { View, TouchableOpacity, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Asset } from '../types';
import { styles } from '../styles';

interface MediaTileProps {
  item: Asset;
  isSelected: boolean;
  selectionOrder: number;
  onPress: () => void;
}

export function MediaTile({ item, isSelected, selectionOrder, onPress }: MediaTileProps) {
  return (
    <TouchableOpacity style={styles.mediaTile} onPress={onPress} activeOpacity={0.8}>
      <Image source={{ uri: item.uri }} style={styles.mediaImage} resizeMode="cover" />

      {/* Video duration badge */}
      {item.mediaType === 'video' && item.duration && (
        <View style={styles.videoDurationBadge}>
          <Ionicons name="play" size={10} color="#fff" />
          <Text style={styles.videoDurationText}>
            {Math.floor(item.duration / 60)}:
            {String(Math.floor(item.duration % 60)).padStart(2, '0')}
          </Text>
        </View>
      )}

      {/* Selection indicator */}
      <View style={[styles.selectionCircle, isSelected && styles.selectionCircleSelected]}>
        {isSelected && <Text style={styles.selectionNumber}>{selectionOrder}</Text>}
      </View>

      {/* Selected overlay */}
      {isSelected && <View style={styles.selectedOverlay} />}
    </TouchableOpacity>
  );
}
