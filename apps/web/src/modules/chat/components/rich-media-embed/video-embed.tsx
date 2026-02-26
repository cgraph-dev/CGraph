/**
 * VideoEmbed Component - Video player with YouTube iframe support
 * @module modules/chat/components/rich-media-embed
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { PlayCircleIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { LinkMetadata } from './types';
import { tweens, loop } from '@/lib/animation-presets';

interface VideoEmbedProps {
  embed: LinkMetadata;
  onExpand: () => void;
}

/**
 * Video Embed component.
 */
export default function VideoEmbed({ embed, onExpand }: VideoEmbedProps) {
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
                  transition={loop(tweens.verySlow)}
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
