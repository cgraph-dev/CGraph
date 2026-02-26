/**
 * useMediaViewer Hook
 *
 * Manages image gallery and video player modal state.
 *
 * @module screens/messages/ConversationScreen/hooks
 */

import { durations } from '@cgraph/animation-constants';
import { useState, useRef, useCallback } from 'react';
import { FlatList, Linking, Alert } from 'react-native';
import { useSharedValue, withTiming, withSpring, runOnJS, type SharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { createLogger } from '../../../../lib/logger';

const logger = createLogger('useMediaViewer');

/**
 * Hook for managing media viewing modals (images and videos).
 */
export function useMediaViewer() {
  // Image viewer state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageGallery, setImageGallery] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const imageGalleryRef = useRef<FlatList>(null);

  // Video player state
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [selectedVideoDuration, setSelectedVideoDuration] = useState<number>(0);

  // Animation refs
  const imageViewerAnim = useSharedValue(0);
  const imageScaleAnim = useSharedValue(0.8);

  /**
   * Open image viewer with optional gallery support.
   */
  const handleImagePress = useCallback(
    (imageUrl: string, allImages?: string[], startIndex?: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (allImages && allImages.length > 1) {
        setImageGallery(allImages);
        setCurrentImageIndex(startIndex ?? 0);
        setSelectedImage(allImages[startIndex ?? 0]);
      } else {
        setImageGallery([imageUrl]);
        setCurrentImageIndex(0);
        setSelectedImage(imageUrl);
      }

      setShowImageViewer(true);

      imageViewerAnim.value = withTiming(1, { duration: 250 });
      const afterOpen = () => {
        if (allImages && allImages.length > 1 && startIndex && startIndex > 0) {
          setTimeout(() => {
            imageGalleryRef.current?.scrollToIndex({ index: startIndex, animated: false });
          }, 50);
        }
      };
      imageScaleAnim.value = withSpring(1, { stiffness: 80, damping: 8 }, (finished) => {
        if (finished) runOnJS(afterOpen)();
      });
    },
    [imageViewerAnim, imageScaleAnim]
  );

  /**
   * Close image viewer with animation.
   */
  const closeImageViewer = useCallback(() => {
    imageViewerAnim.value = withTiming(0, { duration: durations.normal.ms });
    const afterClose = () => {
      setShowImageViewer(false);
      setSelectedImage(null);
      setImageGallery([]);
      setCurrentImageIndex(0);
    };
    imageScaleAnim.value = withTiming(0.8, { duration: durations.normal.ms }, (finished) => {
      if (finished) runOnJS(afterClose)();
    });
  }, [imageViewerAnim, imageScaleAnim]);

  /**
   * Open video player modal.
   */
  const handleVideoPress = useCallback((videoUrl: string, duration?: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedVideoUrl(videoUrl);
    setSelectedVideoDuration(duration || 0);
    setShowVideoPlayer(true);
  }, []);

  /**
   * Close video player modal.
   */
  const closeVideoPlayer = useCallback(() => {
    setShowVideoPlayer(false);
    setSelectedVideoUrl(null);
    setSelectedVideoDuration(0);
  }, []);

  /**
   * Open file in external app.
   */
  const handleFilePress = useCallback(async (fileUrl: string, filename?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const canOpen = await Linking.canOpenURL(fileUrl);
      if (canOpen) {
        await Linking.openURL(fileUrl);
      } else {
        Alert.alert('Open File', `Would you like to open "${filename || 'this file'}"?`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open', onPress: () => Linking.openURL(fileUrl) },
        ]);
      }
    } catch (error) {
      logger.error('Error opening file:', error);
      Alert.alert('Error', 'Could not open file. Please try again.');
    }
  }, []);

  return {
    // Image viewer
    selectedImage,
    setSelectedImage,
    imageGallery,
    currentImageIndex,
    setCurrentImageIndex,
    showImageViewer,
    imageGalleryRef,
    imageViewerAnim,
    imageScaleAnim,
    handleImagePress,
    closeImageViewer,
    // Video player
    showVideoPlayer,
    selectedVideoUrl,
    selectedVideoDuration,
    handleVideoPress,
    closeVideoPlayer,
    // File handling
    handleFilePress,
  };
}

export default useMediaViewer;
