/**
 * Fallback view displayed when media library permissions are unavailable, offering alternative attachment options.
 * @module components/attachment-picker/FallbackView
 */
import React from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';

interface FallbackViewProps {
  isLoading: boolean;
  onOpenImagePicker: () => void;
  onOpenCamera: () => void;
  primaryColor: string;
  textColor: string;
  textSecondaryColor: string;
}

/**
 *
 */
export function FallbackView({
  isLoading,
  onOpenImagePicker,
  onOpenCamera,
  primaryColor,
  textColor,
  textSecondaryColor,
}: FallbackViewProps) {
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={[styles.loadingText, { color: textSecondaryColor }]}>Loading media...</Text>
      </View>
    );
  }

  return (
    <View style={styles.fallbackContainer}>
      <View style={styles.fallbackIconContainer}>
        <Ionicons name="images-outline" size={64} color={textSecondaryColor} />
      </View>
      <Text style={[styles.fallbackTitle, { color: textColor }]}>Open Gallery</Text>
      <Text style={[styles.fallbackSubtitle, { color: textSecondaryColor }]}>
        Tap below to select photos and videos from your device
      </Text>
      <TouchableOpacity
        style={[styles.fallbackButton, { backgroundColor: primaryColor }]}
        onPress={onOpenImagePicker}
      >
        <Ionicons name="folder-open" size={24} color="#fff" />
        <Text style={styles.fallbackButtonText}>Browse Gallery</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.fallbackCameraButton, { borderColor: primaryColor }]}
        onPress={onOpenCamera}
      >
        <Ionicons name="camera" size={24} color={primaryColor} />
        <Text style={[styles.fallbackCameraButtonText, { color: primaryColor }]}>
          Take Photo/Video
        </Text>
      </TouchableOpacity>
    </View>
  );
}
