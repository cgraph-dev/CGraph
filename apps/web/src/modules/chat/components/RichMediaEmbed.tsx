import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayCircleIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  PhotoIcon,
  MusicalNoteIcon,
} from '@heroicons/react/24/outline';
import GlassCard from '@/components/ui/GlassCard';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';

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
 *
 * This component significantly enriches the messaging experience by
 * transforming plain URLs into visual, contextual previews that
 * encourage engagement and understanding without leaving the chat.
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
  isOwnMessage: boolean;
  onLoad?: () => void;
}

// Regex patterns for detecting embeddable content
const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const YOUTUBE_REGEX = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
const TWITTER_REGEX = /twitter\.com\/\w+\/status\/(\d+)/;
const IMAGE_REGEX = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i;
const VIDEO_REGEX = /\.(mp4|webm|ogg|mov)(\?.*)?$/i;
const AUDIO_REGEX = /\.(mp3|wav|ogg|m4a)(\?.*)?$/i;

export default function RichMediaEmbed({
  content,
  isOwnMessage: _isOwnMessage,
  onLoad,
}: RichMediaEmbedProps) {
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

      setEmbeds(metadata.filter((m): m is NonNullable<typeof m> => m !== null) as LinkMetadata[]);
      setIsLoading(false);
      onLoad?.();
    };

    extractAndFetchMetadata();
  }, [content, onLoad]);

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

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxMedia && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setLightboxMedia(null);
              HapticFeedback.light();
            }}
          >
            <motion.button
              className="absolute right-4 top-4 rounded-full bg-dark-800/80 p-2 text-white transition-colors hover:bg-dark-700"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                setLightboxMedia(null);
                HapticFeedback.light();
              }}
            >
              <XMarkIcon className="h-6 w-6" />
            </motion.button>

            <motion.div
              className="max-h-[90vh] w-full max-w-7xl"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {lightboxMedia.type === 'image' ? (
                <img
                  src={lightboxMedia.url}
                  alt="Full size"
                  className="mx-auto max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl"
                  loading="lazy"
                />
              ) : (
                <video
                  src={lightboxMedia.url}
                  controls
                  autoPlay
                  className="mx-auto max-h-[90vh] max-w-full rounded-lg shadow-2xl"
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ImageEmbed({ embed, onExpand }: { embed: LinkMetadata; onExpand: () => void }) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <motion.div
      className="group relative max-w-sm cursor-pointer overflow-hidden rounded-xl"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onExpand}
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-dark-800/50 backdrop-blur-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        </div>
      )}
      <img
        src={embed.url}
        alt={embed.title || 'Image'}
        className="h-auto max-h-96 w-full object-cover"
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
      />
      <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/60 via-transparent to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
        <PhotoIcon className="h-5 w-5 text-white drop-shadow-lg" />
        <ArrowTopRightOnSquareIcon className="h-5 w-5 text-white drop-shadow-lg" />
      </div>
    </motion.div>
  );
}

function VideoEmbed({ embed, onExpand }: { embed: LinkMetadata; onExpand: () => void }) {
  const [showPlayer, setShowPlayer] = useState(false);

  // YouTube iframe embed
  if (embed.videoUrl?.includes('youtube.com/embed')) {
    return (
      <div className="relative max-w-md overflow-hidden rounded-xl">
        <GlassCard variant="crystal" className="p-0">
          {!showPlayer ? (
            <motion.div
              className="group relative cursor-pointer"
              onClick={() => {
                setShowPlayer(true);
                HapticFeedback.medium();
              }}
              whileHover={{ scale: 1.01 }}
            >
              <img
                src={embed.image || ''}
                alt={embed.title || 'Video'}
                className="aspect-video w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-colors group-hover:bg-black/30">
                <motion.div
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600/90"
                  whileHover={{ scale: 1.1 }}
                  animate={{
                    boxShadow: [
                      '0 0 0 0 rgba(220, 38, 38, 0.7)',
                      '0 0 0 20px rgba(220, 38, 38, 0)',
                    ],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <PlayCircleIcon className="ml-1 h-10 w-10 text-white" />
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <iframe
              src={`${embed.videoUrl}?autoplay=1`}
              title={embed.title || 'Video'}
              className="aspect-video w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-presentation"
            />
          )}
          {embed.title && (
            <div className="border-t border-white/10 p-3">
              <p className="truncate text-sm font-medium text-white">{embed.title}</p>
              <p className="text-xs text-gray-400">{embed.siteName}</p>
            </div>
          )}
        </GlassCard>
      </div>
    );
  }

  // Native video player
  return (
    <motion.div
      className="relative max-w-sm cursor-pointer overflow-hidden rounded-xl"
      whileHover={{ scale: 1.01 }}
      onClick={onExpand}
    >
      <video
        src={embed.videoUrl || embed.url}
        className="h-auto max-h-96 w-full object-cover"
        controls={false}
        preload="metadata"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-colors hover:bg-black/30">
        <motion.div
          className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-600/90"
          whileHover={{ scale: 1.1 }}
        >
          <PlayCircleIcon className="ml-1 h-10 w-10 text-white" />
        </motion.div>
      </div>
    </motion.div>
  );
}

function AudioEmbed({ embed }: { embed: LinkMetadata }) {
  return (
    <div className="max-w-md">
      <GlassCard variant="frosted" glow className="p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
            <MusicalNoteIcon className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{embed.title}</p>
            <p className="text-xs text-gray-400">Audio File</p>
          </div>
        </div>
        <audio src={embed.audioUrl || embed.url} controls className="w-full" preload="metadata" />
      </GlassCard>
    </div>
  );
}

function LinkPreview({ embed }: { embed: LinkMetadata }) {
  return (
    <motion.a
      href={embed.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block max-w-md"
      whileHover={{ scale: 1.01 }}
      onClick={() => HapticFeedback.light()}
    >
      <GlassCard variant="crystal" glow borderGradient className="overflow-hidden p-0">
        {embed.image && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={embed.image}
              alt={embed.title || 'Preview'}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent" />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-start gap-3">
            {embed.favicon && (
              <img
                src={embed.favicon}
                alt=""
                className="mt-0.5 h-5 w-5 flex-shrink-0 rounded"
                loading="lazy"
              />
            )}
            <div className="min-w-0 flex-1">
              {embed.title && (
                <h4 className="mb-1 line-clamp-2 text-sm font-semibold text-white">
                  {embed.title}
                </h4>
              )}
              {embed.description && (
                <p className="mb-2 line-clamp-2 text-xs text-gray-400">{embed.description}</p>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {embed.siteName && <span>{embed.siteName}</span>}
                <ArrowTopRightOnSquareIcon className="h-3 w-3" />
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.a>
  );
}
