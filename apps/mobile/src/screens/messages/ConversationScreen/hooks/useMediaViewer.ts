/**
 * useMediaViewer Hook
 *
 * Manages image gallery and video player modal state.
 *
 * @module screens/messages/ConversationScreen/hooks
 */

import { useState, useRef, useCallback } from 'react';
import { Animated, FlatList, Linking, Alert } from 'react-native';
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
  const imageViewerAnim = useRef(new Animated.Value(0)).current;
  const imageScaleAnim = useRef(new Animated.Value(0.8)).current;

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

      Animated.parallel([
        Animated.timing(imageViewerAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(imageScaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 8,
        }),
      ]).start(() => {
        if (allImages && allImages.length > 1 && startIndex && startIndex > 0) {
          setTimeout(() => {
            imageGalleryRef.current?.scrollToIndex({ index: startIndex, animated: false });
          }, 50);
        }
      });
    },
    [imageViewerAnim, imageScaleAnim]
  );

  /**
   * Close image viewer with animation.
   */
  const closeImageViewer = useCallback(() => {
    Animated.parallel([
      Animated.timing(imageViewerAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(imageScaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowImageViewer(false);
      setSelectedImage(null);
      setImageGallery([]);
      setCurrentImageIndex(0);
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
