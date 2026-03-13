/**
 * Camera tile component that provides a quick-access button to open the device camera.
 * @module components/attachment-picker/CameraTile
 */
import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';

interface CameraTileProps {
  onPress: () => void;
  surfaceColor: string;
  textSecondaryColor: string;
}

/**
 * Camera Tile component.
 *
 */
export function CameraTile({ onPress, surfaceColor, textSecondaryColor }: CameraTileProps) {
  return (
    <TouchableOpacity style={styles.cameraTile} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cameraPreviewContainer}>
        <View style={[styles.cameraPlaceholder, { backgroundColor: surfaceColor }]}>
          <Ionicons name="camera" size={40} color={textSecondaryColor} />
        </View>
        <View style={styles.cameraOverlay}>
          <View style={styles.cameraIconCircle}>
            <Ionicons name="camera" size={28} color="#fff" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
