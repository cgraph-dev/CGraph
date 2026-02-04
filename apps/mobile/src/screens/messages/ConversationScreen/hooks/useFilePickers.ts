/**
 * useFilePickers Hook
 *
 * Handles image, camera, and document picker operations.
 *
 * @module screens/messages/ConversationScreen/hooks
 */

import { useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { createLogger } from '../../../../lib/logger';

const logger = createLogger('useFilePickers');

export interface PickedAsset {
  uri: string;
  type: 'image' | 'video' | 'file';
  name?: string;
  mimeType?: string;
  duration?: number;
}

interface UseFilePickersOptions {
  onAssetsSelected: (assets: PickedAsset[]) => void;
  onCloseMenu: () => void;
}

interface UseFilePickersReturn {
  handlePickImage: () => Promise<void>;
  handleTakePhoto: () => Promise<void>;
  handlePickDocument: () => Promise<void>;
  isPickerActive: boolean;
}

/**
 * Hook for handling file picker operations.
 */
export function useFilePickers({
  onAssetsSelected,
  onCloseMenu,
}: UseFilePickersOptions): UseFilePickersReturn {
  const isPickerActiveRef = useRef(false);

  // Handle image picker
  const handlePickImage = useCallback(async () => {
    if (isPickerActiveRef.current) {
      logger.debug('Picker already active, ignoring');
      return;
    }

    isPickerActiveRef.current = true;
    logger.debug('Starting image picker...');
    onCloseMenu();

    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      logger.debug('Requesting media library permission...');
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      logger.debug('Permission result:', permission.granted);
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow access to your photos to send images.');
        return;
      }

      logger.debug('Launching image library...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 10,
      });
      logger.debug(
        'Image picker result:',
        result.canceled ? 'canceled' : `${result.assets?.length} selected`
      );

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const assets: PickedAsset[] = result.assets.map((asset) => ({
          uri: asset.uri,
          type: 'image',
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          mimeType: asset.mimeType || 'image/jpeg',
        }));
        onAssetsSelected(assets);
      }
    } catch (error) {
      logger.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to open photo library');
    } finally {
      isPickerActiveRef.current = false;
    }
  }, [onAssetsSelected, onCloseMenu]);

  // Handle camera capture
  const handleTakePhoto = useCallback(async () => {
    if (isPickerActiveRef.current) {
      logger.debug('Picker already active, ignoring');
      return;
    }

    isPickerActiveRef.current = true;
    logger.debug('Starting camera...');
    onCloseMenu();

    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      logger.debug('Requesting camera permission...');
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      logger.debug('Camera permission:', cameraPermission.granted);
      if (!cameraPermission.granted) {
        Alert.alert('Permission needed', 'Please allow camera access.');
        return;
      }

      logger.debug('Launching camera with photo/video support...');
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images', 'videos'],
        quality: 0.8,
        videoMaxDuration: 60,
        videoQuality: 1,
      });
      logger.debug('Camera result:', result.canceled ? 'canceled' : 'selected');

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const isVideo = asset.type === 'video' || asset.mimeType?.startsWith('video/');
        logger.debug('Asset type:', asset.type, 'mimeType:', asset.mimeType, 'isVideo:', isVideo);

        onAssetsSelected([
          {
            uri: asset.uri,
            type: isVideo ? 'video' : 'image',
            name: asset.fileName || `camera_${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`,
            mimeType: asset.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg'),
            duration: asset.duration ?? undefined,
          },
        ]);
      }
    } catch (error) {
      logger.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to open camera');
    } finally {
      isPickerActiveRef.current = false;
    }
  }, [onAssetsSelected, onCloseMenu]);

  // Handle document picker
  const handlePickDocument = useCallback(async () => {
    if (isPickerActiveRef.current) {
      logger.debug('Picker already active, ignoring');
      return;
    }

    isPickerActiveRef.current = true;
    logger.debug('Starting document picker...');
    onCloseMenu();

    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      logger.debug('Launching document picker...');
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'text/*',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.*',
          'application/vnd.ms-excel',
          'image/*',
          'audio/*',
          'video/*',
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });
      logger.debug('Document picker result:', result.canceled ? 'canceled' : 'selected');

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        // Filter out directory bundles
        if (asset.name?.endsWith('.band') || asset.mimeType === 'application/octet-stream') {
          Alert.alert(
            'Unsupported File',
            'This file type is not supported. Please choose a different file.'
          );
          return;
        }

        onAssetsSelected([
          {
            uri: asset.uri,
            type: 'file',
            name: asset.name || `file_${Date.now()}`,
            mimeType: asset.mimeType || 'application/octet-stream',
          },
        ]);
      }
    } catch (error) {
      logger.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to open file picker');
    } finally {
      isPickerActiveRef.current = false;
    }
  }, [onAssetsSelected, onCloseMenu]);

  return {
    handlePickImage,
    handleTakePhoto,
    handlePickDocument,
    isPickerActive: isPickerActiveRef.current,
  };
}

export default useFilePickers;
