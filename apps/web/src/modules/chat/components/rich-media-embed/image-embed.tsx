/**
 * ImageEmbed Component - Image preview with lightbox expand
 * @module modules/chat/components/rich-media-embed
 */
import { useState } from 'react';
import { motion } from 'motion/react';
import { PhotoIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import type { LinkMetadata } from './types';

interface ImageEmbedProps {
  embed: LinkMetadata;
  onExpand: () => void;
}

/**
 * Image Embed component.
 */
export default function ImageEmbed({ embed, onExpand }: ImageEmbedProps) {
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
