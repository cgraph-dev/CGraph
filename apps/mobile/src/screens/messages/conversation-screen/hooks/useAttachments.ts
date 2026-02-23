/**
 * useAttachments Hook
 *
 * Manages attachment state, picking, and preview.
 *
 * @module screens/messages/ConversationScreen/hooks
 */

import { useState, useRef, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { useSharedValue, withSpring, withTiming, runOnJS, type SharedValue } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { createLogger } from '../../../../lib/logger';

const logger = createLogger('useAttachments');

export interface AttachmentItem {
  uri: string;
  type: 'image' | 'file' | 'video';
  name?: string;
  mimeType?: string;
  duration?: number;
}

export interface UseAttachmentsReturn {
  // State
  pendingAttachments: AttachmentItem[];
  showAttachmentPreview: boolean;
  attachmentCaption: string;
  attachmentPreviewAnim: SharedValue<number>;
  showAttachMenu: boolean;
  attachMenuAnim: SharedValue<number>;
  isPickerActive: boolean;
  // Actions
  setPendingAttachments: React.Dispatch<React.SetStateAction<AttachmentItem[]>>;
  setAttachmentCaption: (caption: string) => void;
  openAttachmentPreview: () => void;
  closeAttachmentPreview: () => void;
  openAttachMenu: () => void;
  closeAttachMenu: () => void;
  toggleAttachMenu: () => void;
  handleImagePicker: () => Promise<void>;
  handleCameraCapture: () => Promise<void>;
  handleDocumentPicker: () => Promise<void>;
  clearAttachments: () => void;
  removeAttachment: (index: number) => void;
}

/**
 * Hook for managing attachment selection and preview.
 */
export function useAttachments(): UseAttachmentsReturn {
  // State
  const [pendingAttachments, setPendingAttachments] = useState<AttachmentItem[]>([]);
  const [showAttachmentPreview, setShowAttachmentPreview] = useState(false);
  const [attachmentCaption, setAttachmentCaption] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  // Animation refs
  const attachmentPreviewAnim = useSharedValue(0);
  const attachMenuAnim = useSharedValue(0);

  // Picker lock to prevent concurrent picker operations
  const isPickerActiveRef = useRef(false);

  /**
   * Open attachment preview with animation.
   */
  const openAttachmentPreview = useCallback(() => {
    setShowAttachmentPreview(true);
    attachmentPreviewAnim.value = withSpring(1, { stiffness: 100, damping: 10 });
  }, [attachmentPreviewAnim]);

  /**
   * Close attachment preview with animation.
   */
  const closeAttachmentPreview = useCallback(() => {
    const onFinish = () => {
      setShowAttachmentPreview(false);
      setPendingAttachments([]);
      setAttachmentCaption('');
    };
    attachmentPreviewAnim.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) runOnJS(onFinish)();
    });
  }, [attachmentPreviewAnim]);

  /**
   * Open attachment menu with animation.
   */
  const openAttachMenu = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAttachMenu(true);
    attachMenuAnim.value = withSpring(1, { stiffness: 80, damping: 10 });
  }, [attachMenuAnim]);

  /**
   * Close attachment menu with animation.
   */
  const closeAttachMenu = useCallback(() => {
    const onFinish = () => {
      setShowAttachMenu(false);
    };
    attachMenuAnim.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) runOnJS(onFinish)();
    });
  }, [attachMenuAnim]);

  /**
   * Toggle attachment menu.
   */
  const toggleAttachMenu = useCallback(() => {
    if (showAttachMenu) {
      closeAttachMenu();
    } else {
      openAttachMenu();
    }
  }, [showAttachMenu, closeAttachMenu, openAttachMenu]);

  /**
   * Handle image picker - opens gallery.
   */
  const handleImagePicker = useCallback(async () => {
    if (isPickerActiveRef.current) {
      logger.warn('Picker already active, ignoring duplicate request');
      return;
    }

    isPickerActiveRef.current = true;
    closeAttachMenu();

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to send images.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 10,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const attachments: AttachmentItem[] = result.assets.map((asset) => {
          const isVideo =
            asset.type === 'video' || asset.uri.includes('.mp4') || asset.uri.includes('.mov');
          return {
            uri: asset.uri,
            type: isVideo ? 'video' : 'image',
            name: asset.fileName || `attachment_${Date.now()}`,
            mimeType: asset.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg'),
            duration: asset.duration ?? undefined,
          };
        });

        setPendingAttachments(attachments);
        openAttachmentPreview();
      }
    } catch (error) {
      logger.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images. Please try again.');
    } finally {
      isPickerActiveRef.current = false;
    }
  }, [closeAttachMenu, openAttachmentPreview]);

  /**
   * Handle camera capture.
   */
  const handleCameraCapture = useCallback(async () => {
    if (isPickerActiveRef.current) {
      logger.warn('Picker already active, ignoring duplicate request');
      return;
    }

    isPickerActiveRef.current = true;
    closeAttachMenu();

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your camera to take photos.', [
          { text: 'OK' },
        ]);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images', 'videos'],
        quality: 0.8,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const isVideo =
          asset.type === 'video' || asset.uri.includes('.mp4') || asset.uri.includes('.mov');

        const attachment: AttachmentItem = {
          uri: asset.uri,
          type: isVideo ? 'video' : 'image',
          name: asset.fileName || `capture_${Date.now()}`,
          mimeType: asset.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg'),
          duration: asset.duration ?? undefined,
        };

        setPendingAttachments([attachment]);
        openAttachmentPreview();
      }
    } catch (error) {
      logger.error('Error capturing from camera:', error);
      Alert.alert('Error', 'Failed to capture from camera. Please try again.');
    } finally {
      isPickerActiveRef.current = false;
    }
  }, [closeAttachMenu, openAttachmentPreview]);

  /**
   * Handle document picker.
   */
  const handleDocumentPicker = useCallback(async () => {
    if (isPickerActiveRef.current) {
      logger.warn('Picker already active, ignoring duplicate request');
      return;
    }

    isPickerActiveRef.current = true;
    closeAttachMenu();

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const attachments: AttachmentItem[] = result.assets.map((asset) => ({
          uri: asset.uri,
          type: 'file' as const,
          name: asset.name,
          mimeType: asset.mimeType || 'application/octet-stream',
        }));

        setPendingAttachments(attachments);
        openAttachmentPreview();
      }
    } catch (error) {
      logger.error('Error picking documents:', error);
      Alert.alert('Error', 'Failed to pick documents. Please try again.');
    } finally {
      isPickerActiveRef.current = false;
    }
  }, [closeAttachMenu, openAttachmentPreview]);

  /**
   * Clear all pending attachments.
   */
  const clearAttachments = useCallback(() => {
    setPendingAttachments([]);
    setAttachmentCaption('');
    setShowAttachmentPreview(false);
  }, []);

  /**
   * Remove a specific attachment by index.
   */
  const removeAttachment = useCallback((index: number) => {
    setPendingAttachments((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0) {
        setShowAttachmentPreview(false);
        setAttachmentCaption('');
      }
      return updated;
    });
  }, []);

  return {
    // State
    pendingAttachments,
    showAttachmentPreview,
    attachmentCaption,
    attachmentPreviewAnim,
    showAttachMenu,
    attachMenuAnim,
    isPickerActive: isPickerActiveRef.current,
    // Actions
    setPendingAttachments,
    setAttachmentCaption,
    openAttachmentPreview,
    closeAttachmentPreview,
    openAttachMenu,
    closeAttachMenu,
    toggleAttachMenu,
    handleImagePicker,
    handleCameraCapture,
    handleDocumentPicker,
    clearAttachments,
    removeAttachment,
  };
}

export default useAttachments;
