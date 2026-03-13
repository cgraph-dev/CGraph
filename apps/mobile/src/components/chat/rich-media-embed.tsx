import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import * as Haptics from 'expo-haptics';

import {
  URL_REGEX,
  YOUTUBE_REGEX,
  TWITTER_REGEX,
  IMAGE_REGEX,
  VIDEO_REGEX,
  AUDIO_REGEX,
  type LinkMetadata,
  type RichMediaEmbedProps,
} from './rich-media-embed.types';
import ImageEmbed from './image-embed';
import VideoEmbed from './video-embed';
import AudioEmbed from './audio-embed';
import LinkPreview from './link-preview';
import LightboxModal from './lightbox-modal';

/**
 * Rich Media Embed Component (Mobile)
 *
 * Mobile-optimized component for displaying rich previews of URLs in messages.
 * Delegates rendering to dedicated sub-components per media type.
 */

const RichMediaEmbed = memo(function RichMediaEmbed({
  content,
  _isOwnMessage = false,
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

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
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
              <ImageEmbed embed={embed} onExpand={() => handleOpenLightbox(embed.url, 'image')} />
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

      <LightboxModal media={lightboxMedia} onClose={handleCloseLightbox} />
    </>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    gap: 8,
  },
  embedContainer: {
    marginBottom: 4,
  },
});

export default RichMediaEmbed;
export type { LinkMetadata, RichMediaEmbedProps } from './rich-media-embed.types';
