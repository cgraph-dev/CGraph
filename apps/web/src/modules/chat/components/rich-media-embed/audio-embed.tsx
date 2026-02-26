/**
 * AudioEmbed Component - Audio player with metadata display
 * @module modules/chat/components/rich-media-embed
 */
import { MusicalNoteIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import type { LinkMetadata } from './types';

interface AudioEmbedProps {
  embed: LinkMetadata;
}

/**
 * Audio Embed component.
 */
export default function AudioEmbed({ embed }: AudioEmbedProps) {
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
