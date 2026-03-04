/**
 * RichMediaEmbed Component - Auto-detecting rich media embed renderer
 * @module modules/chat/components/rich-media-embed
 */
import { useState } from 'react';
import { motion } from 'motion/react';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { RichMediaEmbedProps } from './types';
import { useMediaEmbeds } from './hooks';
import Lightbox from './lightbox';
import ImageEmbed from './image-embed';
import VideoEmbed from './video-embed';
import AudioEmbed from './audio-embed';
import LinkPreview from './link-preview';

/**
 * Rich Media Embed Component
 *
 * Provides intelligent media embeds for messages containing URLs.
 * Features:
 * - Automatic link detection and preview generation
 * - Support for images, videos, audio, and general links
 * - Open Graph metadata parsing for rich previews
 * - YouTube, Twitter, and other platform-specific embeds
 * - Lazy loading for performance optimization
 * - Interactive lightbox for media viewing
 * - Security-hardened iframe sandboxing
 */
export default function RichMediaEmbed({
  content,
  isOwnMessage: _isOwnMessage,
  onLoad,
}: RichMediaEmbedProps) {
  const { embeds, isLoading } = useMediaEmbeds(content, onLoad);
  const [lightboxMedia, setLightboxMedia] = useState<{
    url: string;
    type: 'image' | 'video';
  } | null>(null);

  if (isLoading || embeds.length === 0) {
    return null;
  }

  return (
    <>
      <div className="mt-2 space-y-2">
        {embeds.map((embed, index) => (
          <motion.div
            key={embed.url}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {embed.type === 'image' && (
              <ImageEmbed
                embed={embed}
                onExpand={() => {
                  setLightboxMedia({ url: embed.url, type: 'image' });
                  HapticFeedback.medium();
                }}
              />
            )}
            {embed.type === 'video' && (
              <VideoEmbed
                embed={embed}
                onExpand={() => {
                  if (!embed.videoUrl?.includes('youtube')) {
                    setLightboxMedia({ url: embed.videoUrl || embed.url, type: 'video' });
                    HapticFeedback.medium();
                  }
                }}
              />
            )}
            {embed.type === 'audio' && <AudioEmbed embed={embed} />}
            {embed.type === 'website' && <LinkPreview embed={embed} />}
            {embed.type === 'article' && <LinkPreview embed={embed} />}
          </motion.div>
        ))}
      </div>

      <Lightbox lightboxMedia={lightboxMedia} setLightboxMedia={setLightboxMedia} />
    </>
  );
}
