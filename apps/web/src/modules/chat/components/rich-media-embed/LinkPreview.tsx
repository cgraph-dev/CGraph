/**
 * LinkPreview Component - Open Graph link preview card
 * @module modules/chat/components/rich-media-embed
 */
import { motion } from 'framer-motion';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/AnimationEngine';
import type { LinkMetadata } from './types';

interface LinkPreviewProps {
  embed: LinkMetadata;
}

export default function LinkPreview({ embed }: LinkPreviewProps) {
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
