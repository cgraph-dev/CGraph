/**
 * ImageViewerModal Component
 *
 * Full-screen image viewer with gallery support.
 *
 * @module screens/messages/ConversationScreen/components
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  TouchableOpacity,
  FlatList,
  Animated,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles, SCREEN_WIDTH, SCREEN_HEIGHT } from '../styles';

interface ImageViewerModalProps {
  visible: boolean;
  selectedImage: string | null;
  imageGallery: string[];
  currentIndex: number;
  galleryRef: React.RefObject<FlatList<string>>;
  animValue: Animated.Value;
  scaleAnim: Animated.Value;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  onImageSelect: (image: string) => void;
}

/**
 * Full-screen image viewer with swipeable gallery.
 */
export function ImageViewerModal({
  visible,
  selectedImage,
  imageGallery,
  currentIndex,
  galleryRef,
  animValue,
  scaleAnim,
  onClose,
  onIndexChange,
  onImageSelect,
}: ImageViewerModalProps) {
  const handleScroll = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < imageGallery.length) {
      onIndexChange(newIndex);
      onImageSelect(imageGallery[newIndex]);
    }
  };

  const handleSave = () => {
    if (selectedImage) {
      Linking.openURL(selectedImage);
    }
  };

  const handleShare = () => {
    if (selectedImage) {
      Alert.alert('Share', 'Sharing will be available soon!');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.imageViewerContainer, { opacity: animValue }]}>
        <TouchableOpacity style={styles.imageViewerBackdrop} activeOpacity={1} onPress={onClose} />
        <Animated.View
          style={[
            styles.imageViewerContent,
            {
              transform: [{ scale: scaleAnim }],
              opacity: animValue,
            },
          ]}
        >
          {imageGallery.length > 1 ? (
            <FlatList
              ref={galleryRef}
              data={imageGallery}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={currentIndex}
              getItemLayout={(_, index) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * index,
                index,
              })}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              keyExtractor={(item, index) => `gallery-${index}-${item}`}
              renderItem={({ item }) => (
                <View
                  style={{
                    width: SCREEN_WIDTH,
                    height: SCREEN_HEIGHT,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Image
                    source={{ uri: item }}
                    style={styles.fullscreenImage}
                    resizeMode="contain"
                  />
                </View>
              )}
            />
          ) : (
            selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
            )
          )}
        </Animated.View>

        {/* Image counter for gallery */}
        {imageGallery.length > 1 && (
          <View style={styles.imageCounterContainer}>
            <Text style={styles.imageCounterText}>
              {currentIndex + 1} / {imageGallery.length}
            </Text>
          </View>
        )}

        {/* Close button */}
        <TouchableOpacity
          style={styles.imageViewerCloseBtn}
          onPress={onClose}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <View style={styles.imageViewerCloseBtnInner}>
            <Ionicons name="close" size={24} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Action buttons */}
        <Animated.View style={[styles.imageViewerActions, { opacity: animValue }]}>
          <TouchableOpacity style={styles.imageViewerActionBtn} onPress={handleSave}>
            <Ionicons name="download-outline" size={22} color="#fff" />
            <Text style={styles.imageViewerActionText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.imageViewerActionBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color="#fff" />
            <Text style={styles.imageViewerActionText}>Share</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export default ImageViewerModal;
