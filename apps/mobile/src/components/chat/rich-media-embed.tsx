import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
  Modal,
  Platform,
  Dimensions,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import GlassCard from '../ui/glass-card';

/**
 * Rich Media Embed Component (Mobile)
 *
 * Mobile-optimized component for displaying rich previews of URLs in messages.
 * Features:
 * - Automatic link detection and preview generation
 * - Support for images, videos, audio, and general links
 * - YouTube embed support with native player
 * - Touch-optimized interactions
 * - Haptic feedback on interactions
 * - Native modal for fullscreen media viewing
 * - Performance-optimized with lazy loading
 */

interface LinkMetadata {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  type?: 'website' | 'video' | 'image' | 'audio' | 'article';
  videoUrl?: string;
  audioUrl?: string;
  favicon?: string;
}

interface RichMediaEmbedProps {
  content: string;
  isOwnMessage?: boolean;
  onLoad?: () => void;
  maxEmbeds?: number;
}

// Regex patterns for detecting embeddable content
const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const YOUTUBE_REGEX = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
const TWITTER_REGEX = /twitter\.com\/\w+\/status\/(\d+)/;
const IMAGE_REGEX = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i;
const VIDEO_REGEX = /\.(mp4|webm|ogg|mov)(\?.*)?$/i;
const AUDIO_REGEX = /\.(mp3|wav|ogg|m4a)(\?.*)?$/i;

const RichMediaEmbed = memo(function RichMediaEmbed({
  content,
  isOwnMessage = false,
  onLoad,
  maxEmbeds = 3,
}: RichMediaEmbedProps): React.ReactElement | null {
  const [embeds, setEmbeds] = useState<LinkMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lightboxMedia, setLightboxMedia] = useState<{
    url: string;
    type: 'image' | 'video';
  } | null>(null);

  useEffect(() => {
    const extractAndFetchMetadata = async () => {
      const urls = content.match(URL_REGEX);
      if (!urls || urls.length === 0) {
        setIsLoading(false);
        return;
      }

      const metadata = await Promise.all(
        urls.slice(0, maxEmbeds).map(async (url) => {
          // Direct media detection
          if (IMAGE_REGEX.test(url)) {
            return {
              url,
              type: 'image' as const,
              title: url.split('/').pop() || 'Image',
            };
          }
          if (VIDEO_REGEX.test(url)) {
            return {
              url,
              type: 'video' as const,
              videoUrl: url,
              title: url.split('/').pop() || 'Video',
            };
          }
          if (AUDIO_REGEX.test(url)) {
            return {
              url,
              type: 'audio' as const,
              audioUrl: url,
              title: url.split('/').pop() || 'Audio',
            };
          }

          // YouTube embed
          const youtubeMatch = url.match(YOUTUBE_REGEX);
          if (youtubeMatch) {
            const videoId = youtubeMatch[1];
            return {
              url,
              type: 'video' as const,
              videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
              title: 'YouTube Video',
              image: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
              siteName: 'YouTube',
            };
          }

          // Twitter embed
          const twitterMatch = url.match(TWITTER_REGEX);
          if (twitterMatch) {
            return {
              url,
              type: 'article' as const,
              title: 'Tweet',
              siteName: 'Twitter',
            };
          }

          // Generic link - basic metadata
          try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname;
            return {
              url,
              type: 'website' as const,
              title: domain,
              siteName: domain.replace('www.', ''),
              favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
            };
          } catch {
            return null;
          }
        })
      );

      const validEmbeds = metadata.filter(
        (m): m is NonNullable<typeof m> => m !== null
      ) as LinkMetadata[];
      setEmbeds(validEmbeds);
      setIsLoading(false);
      onLoad?.();
    };

    extractAndFetchMetadata();
  }, [content, onLoad, maxEmbeds]);

  const handleOpenLightbox = useCallback((url: string, type: 'image' | 'video') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLightboxMedia({ url, type });
  }, []);

  const handleCloseLightbox = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLightboxMedia(null);
  }, []);

  if (isLoading || embeds.length === 0) {
    return null;
  }

  return (
    <>
      <View style={styles.container}>
        {embeds.map((embed, index) => (
          <View key={`${embed.url}-${index}`} style={styles.embedContainer}>
            {embed.type === 'image' && (
              <ImageEmbed
                embed={embed}
                onExpand={() => handleOpenLightbox(embed.url, 'image')}
              />
            )}
            {embed.type === 'video' && (
              <VideoEmbed
                embed={embed}
                onExpand={() => {
                  if (!embed.videoUrl?.includes('youtube')) {
                    handleOpenLightbox(embed.videoUrl || embed.url, 'video');
                  } else {
                    // Open YouTube in external app
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    Linking.openURL(embed.videoUrl);
                  }
                }}
              />
            )}
            {embed.type === 'audio' && <AudioEmbed embed={embed} />}
            {(embed.type === 'website' || embed.type === 'article') && (
              <LinkPreview embed={embed} />
            )}
          </View>
        ))}
      </View>

      {/* Lightbox Modal */}
      <Modal
        visible={!!lightboxMedia}
        transparent
        animationType="fade"
        onRequestClose={handleCloseLightbox}
      >
        <View style={styles.lightboxContainer}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleCloseLightbox}
          >
            <BlurView intensity={95} style={StyleSheet.absoluteFill} tint="dark" />
          </Pressable>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleCloseLightbox}
            activeOpacity={0.8}
          >
            <BlurView intensity={80} tint="dark" style={styles.closeButtonInner}>
              <Ionicons name="close" size={24} color="#fff" />
            </BlurView>
          </TouchableOpacity>

          {lightboxMedia && (
            <View style={styles.lightboxContent}>
              {lightboxMedia.type === 'image' ? (
                <Image
                  source={{ uri: lightboxMedia.url }}
                  style={styles.lightboxImage}
                  resizeMode="contain"
                />
              ) : (
                <LightboxVideo url={lightboxMedia.url} />
              )}
            </View>
          )}
        </View>
      </Modal>
    </>
  );
});

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

// ============================================================================
// Audio Embed Component
// ============================================================================

interface AudioEmbedProps {
  embed: LinkMetadata;
}

const AudioEmbed = memo(function AudioEmbed({ embed }: AudioEmbedProps): React.ReactElement | null {
  const audioUrl = embed.audioUrl || embed.url;
  const player = useAudioPlayer(audioUrl);
  const status = useAudioPlayerStatus(player);
  const [isLoading, setIsLoading] = useState(false);

  // Configure audio mode on mount
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
    });
  }, []);

  const handlePlayPause = useCallback(() => {
    try {
      if (isLoading) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (status.playing) {
        player.pause();
      } else {
        player.play();
      }
    } catch (error) {
      console.error('Audio playback error:', error);
    }
  }, [isLoading, status.playing, player]);

  // Handle loading state
  useEffect(() => {
    if (status.playing || status.currentTime > 0) {
      setIsLoading(false);
    }
  }, [status.playing, status.currentTime]);

  return (
    <GlassCard variant="frosted" intensity="medium" style={styles.audioCard}>
      <View style={styles.audioContainer}>
        <TouchableOpacity
          style={styles.audioButton}
          onPress={handlePlayPause}
          disabled={isLoading}
        >
          <LinearGradient
            colors={['#8b5cf6', '#ec4899']}
            style={styles.audioButtonGradient}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons
                name={status.playing ? 'pause' : 'play'}
                size={20}
                color="#fff"
              />
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.audioInfo}>
          <Text style={styles.audioTitle} numberOfLines={1}>
            {embed.title || 'Audio File'}
          </Text>
          <Text style={styles.audioSubtitle}>
            {status.playing 
              ? 'Playing...' 
              : status.currentTime > 0 
              ? 'Paused' 
              : 'Tap to play'}
          </Text>
        </View>

        <Ionicons name="musical-notes-outline" size={24} color="rgba(255,255,255,0.5)" />
      </View>
    </GlassCard>
  );
});

// ============================================================================
// Link Preview Component
// ============================================================================

interface LinkPreviewProps {
  embed: LinkMetadata;
}

const LinkPreview = memo(function LinkPreview({ embed }: LinkPreviewProps): React.ReactElement | null {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(embed.url);
  };

  return (
    <TouchableOpacity
      style={styles.linkContainer}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <GlassCard
        variant="crystal"
        intensity="medium"
        style={styles.linkCard}
        borderGradient
      >
        {embed.image && (
          <View style={styles.linkImageContainer}>
            <Image
              source={{ uri: embed.image }}
              style={styles.linkImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(17, 24, 39, 0.9)']}
              style={styles.linkImageGradient}
            />
          </View>
        )}

        <View style={styles.linkContent}>
          <View style={styles.linkHeader}>
            {embed.favicon && (
              <Image
                source={{ uri: embed.favicon }}
                style={styles.linkFavicon}
                resizeMode="contain"
              />
            )}
            <View style={styles.linkTextContainer}>
              {embed.title && (
                <Text style={styles.linkTitle} numberOfLines={2}>
                  {embed.title}
                </Text>
              )}
              {embed.description && (
                <Text style={styles.linkDescription} numberOfLines={2}>
                  {embed.description}
                </Text>
              )}
              <View style={styles.linkFooter}>
                {embed.siteName && (
                  <Text style={styles.linkSite}>{embed.siteName}</Text>
                )}
                <Ionicons name="open-outline" size={12} color="rgba(255,255,255,0.5)" />
              </View>
            </View>
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
});

// ============================================================================
// Lightbox Video Player
// ============================================================================

interface LightboxVideoProps {
  url: string;
}

function LightboxVideo({ url }: LightboxVideoProps): React.ReactElement | null {
  const player = useVideoPlayer(url, (player) => {
    player.loop = false;
    player.play();
  });

  return (
    <VideoView
      player={player}
      style={styles.lightboxVideo}
      nativeControls
      contentFit="contain"
    />
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    gap: 8,
  },
  embedContainer: {
    marginBottom: 4,
  },

  // Image Embed
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

  // Video Embed
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

  // Audio Embed
  audioCard: {
    padding: 12,
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  audioButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  audioButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioInfo: {
    flex: 1,
  },
  audioTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  audioSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },

  // Link Preview
  linkContainer: {
    maxWidth: 320,
  },
  linkCard: {
    padding: 0,
    overflow: 'hidden',
  },
  linkImageContainer: {
    width: '100%',
    height: 160,
    position: 'relative',
  },
  linkImage: {
    width: '100%',
    height: '100%',
  },
  linkImageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  linkContent: {
    padding: 12,
  },
  linkHeader: {
    flexDirection: 'row',
    gap: 10,
  },
  linkFavicon: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginTop: 2,
  },
  linkTextContainer: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  linkDescription: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 6,
    lineHeight: 16,
  },
  linkFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  linkSite: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
  },

  // Lightbox
  lightboxContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    zIndex: 10,
  },
  closeButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxContent: {
    width: '100%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  lightboxImage: {
    width: '100%',
    height: '100%',
  },
  lightboxVideo: {
    width: '100%',
    height: '100%',
  },
});

export default RichMediaEmbed;
