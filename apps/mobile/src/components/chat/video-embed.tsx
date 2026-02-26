import React, { memo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../ui/glass-card';
import type { LinkMetadata } from './rich-media-embed.types';

// ============================================================================
// Video Embed Component
// ============================================================================

interface VideoEmbedProps {
  embed: LinkMetadata;
  onExpand: () => void;
}

const VideoEmbed = memo(function VideoEmbed({ embed, onExpand }: VideoEmbedProps): React.ReactElement | null {
  const isYouTube = embed.videoUrl?.includes('youtube');

  return (
    <TouchableOpacity
      style={styles.videoContainer}
      onPress={onExpand}
      activeOpacity={0.9}
    >
      <GlassCard variant="crystal" intensity="medium" style={styles.videoCard}>
        {/* Video Thumbnail */}
        <View style={styles.videoThumbnail}>
          {embed.image ? (
            <Image
              source={{ uri: embed.image }}
              style={styles.videoThumbnailImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.videoPlaceholder}>
              <Ionicons name="videocam-outline" size={48} color="rgba(255,255,255,0.5)" />
            </View>
          )}

          {/* Play Button Overlay */}
          <View style={styles.videoPlayOverlay}>
            <LinearGradient
              colors={isYouTube ? ['#ff0000', '#cc0000'] : ['#10b981', '#059669']}
              style={styles.playButton}
            >
              <Ionicons
                name="play"
                size={32}
                color="#fff"
                style={styles.playIcon}
              />
            </LinearGradient>
          </View>
        </View>

        {/* Video Info */}
        {(embed.title || embed.siteName) && (
          <View style={styles.videoInfo}>
            {embed.title && (
              <Text style={styles.videoTitle} numberOfLines={2}>
                {embed.title}
              </Text>
            )}
            {embed.siteName && (
              <Text style={styles.videoSite}>{embed.siteName}</Text>
            )}
          </View>
        )}
      </GlassCard>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  videoContainer: {
    maxWidth: 320,
  },
  videoCard: {
    padding: 0,
    overflow: 'hidden',
  },
  videoThumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
  },
  videoThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playIcon: {
    marginLeft: 4,
  },
  videoInfo: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  videoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  videoSite: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});

export default VideoEmbed;
