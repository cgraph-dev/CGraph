/**
 * Rich Media Embed hooks - URL detection and metadata extraction
 * @module modules/chat/components/rich-media-embed
 */
import { useState, useEffect } from 'react';
import type { LinkMetadata } from './types';
import {
  URL_REGEX,
  YOUTUBE_REGEX,
  TWITTER_REGEX,
  IMAGE_REGEX,
  VIDEO_REGEX,
  AUDIO_REGEX,
} from './constants';

/**
 * unknown for the chat module.
 */
/**
 * Hook for managing media embeds.
 *
 * @param content - The content to render.
 * @param onLoad - The on load.
 */
export function useMediaEmbeds(content: string, onLoad?: () => void) {
  const [embeds, setEmbeds] = useState<LinkMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const extractAndFetchMetadata = async () => {
      const urls = content.match(URL_REGEX);
      if (!urls || urls.length === 0) {
        setIsLoading(false);
        return;
      }

      const metadata = await Promise.all(
        urls.slice(0, 3).map(async (url) => {
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
            return {
              url,
              type: 'video' as const,
              videoUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`,
              title: 'YouTube Video',
              image: `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`,
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

          // Generic link - would fetch metadata from backend in production
          // For now, return basic metadata
          try {
            const domain = new URL(url).hostname;
            return {
              url,
              type: 'website' as const,
              title: domain,
              siteName: domain.replace('www.', ''),
              favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
            };
          } catch {
            return null;
          }
        })
      );

      setEmbeds(metadata.filter((m): m is NonNullable<typeof m> => m !== null) as LinkMetadata[]); // type assertion: post-filter null exclusion
      setIsLoading(false);
      onLoad?.();
    };

    extractAndFetchMetadata();
  }, [content, onLoad]);

  return { embeds, isLoading };
}
