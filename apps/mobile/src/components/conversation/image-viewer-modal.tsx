/**
 * ImageViewerModal Component
 *
 * Full-screen image viewer with gallery support and swipe navigation.
 * Optimized for viewing photos sent in conversations.
 *
 * @module components/conversation/ImageViewerModal
 * @since v0.7.29
 */

import React, { memo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  FlatList,
  TouchableOpacity,
  Alert,
  Linking,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import ReanimatedAnimated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface ImageViewerModalProps {
  /** Whether the viewer is visible */
  visible: boolean;
  /** Array of image URLs in the gallery */
  images: string[];
  /** Currently visible image index */
  currentIndex: number;
  /** Animation value for entrance/exit animations */
  viewerAnim: SharedValue<number>;
  /** Scale animation for zoom effect */
  scaleAnim: SharedValue<number>;
  /** Callback when index changes during swipe */
  onIndexChange: (index: number) => void;
  /** Callback to close the viewer */
  onClose: () => void;
}

/**
 * Full-screen image viewer with horizontal gallery swipe.
 *
 * Features:
 * - Swipeable gallery for multiple images
 * - Fade and scale entrance animation
 * - Image counter for gallery navigation
 * - Save and share action buttons
 * - Tap background to dismiss
 *
 * @example
 * ```tsx
 * <ImageViewerModal
 *   visible={showViewer}
 *   images={['url1', 'url2']}
 *   currentIndex={0}
 *   viewerAnim={fadeAnim}
 *   scaleAnim={scaleAnim}
 *   onIndexChange={setIndex}
 *   onClose={() => setShowViewer(false)}
 * />
 * ```
 */
export const ImageViewerModal = memo(function ImageViewerModal({
  visible,
  images,
  currentIndex,
  viewerAnim,
  scaleAnim,
  onIndexChange,
  onClose,
}: ImageViewerModalProps) {
  const galleryRef = useRef<FlatList>(null);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: viewerAnim.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
    opacity: viewerAnim.value,
  }));

  const actionsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: viewerAnim.value,
  }));

  const handleScroll = useCallback(
    (event: { nativeEvent: { contentOffset: { x: number } } }) => {
      const newIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < images.length) {
        onIndexChange(newIndex);
      }
    },
    [currentIndex, images.length, onIndexChange]
  );

  const handleSave = useCallback(() => {
    const currentImage = images[currentIndex];
    if (currentImage) {
      Linking.openURL(currentImage);
    }
  }, [images, currentIndex]);

  const handleShare = useCallback(() => {
    Alert.alert('Share', 'Sharing will be available soon!');
  }, []);

  const renderImage = useCallback(
    ({ item }: { item: string }) => (
      <View style={styles.imageContainer}>
        <Image source={{ uri: item }} style={styles.fullscreenImage} resizeMode="contain" />
      </View>
    ),
    []
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: SCREEN_WIDTH,
      offset: SCREEN_WIDTH * index,
      index,
    }),
    []
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <ReanimatedAnimated.View style={[styles.container, containerAnimatedStyle]}>
        {/* Backdrop - tap to close */}
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        {/* Image content */}
        <ReanimatedAnimated.View
          style={[
            styles.content,
            contentAnimatedStyle,
          ]}
        >
          {images.length > 1 ? (
            <FlatList
              ref={galleryRef}
              data={images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={currentIndex}
              getItemLayout={getItemLayout}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              keyExtractor={(item, index) => `gallery-${index}-${item}`}
              renderItem={renderImage}
            />
          ) : images[0] ? (
            <Image
              source={{ uri: images[0] }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          ) : null}
        </ReanimatedAnimated.View>

        {/* Image counter for gallery */}
        {images.length > 1 && (
          <View style={styles.counterContainer}>
            <Text style={styles.counterText}>
              {currentIndex + 1} / {images.length}
            </Text>
          </View>
        )}

        {/* Close button */}
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <View style={styles.closeBtnInner}>
            <Ionicons name="close" size={24} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Action buttons */}
        <ReanimatedAnimated.View style={[styles.actions, actionsAnimatedStyle]}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleSave}>
            <Ionicons name="download-outline" size={22} color="#fff" />
            <Text style={styles.actionText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color="#fff" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </ReanimatedAnimated.View>
      </ReanimatedAnimated.View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    width: SCREEN_WIDTH,
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: SCREEN_WIDTH - 20,
    height: '100%',
    borderRadius: 8,
  },
  counterContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  counterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  closeBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    zIndex: 10,
  },
  closeBtnInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 30,
    flexDirection: 'row',
    gap: 40,
  },
  actionBtn: {
    alignItems: 'center',
    padding: 12,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
});

export default ImageViewerModal;
