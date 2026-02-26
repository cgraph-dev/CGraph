import React, { useState, useEffect, memo } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { LinkMetadata } from './rich-media-embed.types';

// ============================================================================
// Image Embed Component
// ============================================================================

interface ImageEmbedProps {
  embed: LinkMetadata;
  onExpand: () => void;
}

const ImageEmbed = memo(function ImageEmbed({ embed, onExpand }: ImageEmbedProps): React.ReactElement | null {
  const [isLoaded, setIsLoaded] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    Image.getSize(
      embed.url,
      (width, height) => {
        const screenWidth = Dimensions.get('window').width - 80; // Account for padding
        const aspectRatio = height / width;
        const displayWidth = Math.min(width, screenWidth);
        const displayHeight = displayWidth * aspectRatio;
        setDimensions({
          width: displayWidth,
          height: Math.min(displayHeight, 300), // Max height
        });
      },
      () => {
        setDimensions({ width: 300, height: 200 }); // Fallback
      }
    );
  }, [embed.url]);

  return (
    <TouchableOpacity
      style={[styles.imageContainer, dimensions]}
      onPress={onExpand}
      activeOpacity={0.9}
    >
      {!isLoaded && (
        <View style={styles.imageLoader}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      )}
      <Image
        source={{ uri: embed.url }}
        style={[styles.image, dimensions]}
        resizeMode="cover"
        onLoad={() => setIsLoaded(true)}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)']}
        style={styles.imageOverlay}
      >
        <Ionicons name="image-outline" size={20} color="#fff" />
        <Ionicons name="expand-outline" size={20} color="#fff" />
      </LinearGradient>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  imageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(17, 24, 39, 0.5)',
  },
  imageLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    zIndex: 1,
  },
  image: {
    borderRadius: 16,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
});

export default ImageEmbed;
