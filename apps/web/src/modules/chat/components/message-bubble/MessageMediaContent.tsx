/**
 * Message Media Content
 *
 * Renders the appropriate media content for a message based on its type.
 * Handles image, video, file, voice/audio, and GIF message types.
 */

import { VoiceMessagePlayer } from '@/components/VoiceMessagePlayer';
import AdvancedVoiceVisualizer from '@/modules/chat/components/audio/AdvancedVoiceVisualizer';
import { GifMessage } from '@/modules/chat/components/GifMessage';
import { FileMessage } from '@/modules/chat/components/FileMessage';
import { FileIcon } from './icons';
import { mapVisualizerTheme } from './utils';

import type { Message } from '@/modules/chat/store';

interface MessageMediaContentProps {
  message: Message;
  isOwn: boolean;
  voiceVisualizerTheme: string;
}

export function MessageMediaContent({
  message,
  isOwn,
  voiceVisualizerTheme,
}: MessageMediaContentProps) {
  if (message.messageType === 'image' && message.metadata?.url) {
    return (
      <img
        src={message.metadata.url as string}
        alt="Shared image"
        className="mb-2 max-w-xs cursor-pointer rounded-lg transition-opacity hover:opacity-90"
        onClick={() => window.open(message.metadata.url as string, '_blank')}
      />
    );
  }

  if (message.messageType === 'video' && message.metadata?.url) {
    return (
      <video src={message.metadata.url as string} controls className="mb-2 max-w-xs rounded-lg" />
    );
  }

  if (message.messageType === 'file' && message.metadata?.url) {
    return (
      <>
        <a
          href={message.metadata.url as string}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-2 flex items-center gap-2 rounded-lg bg-dark-600/50 p-2 transition-colors hover:bg-dark-600"
        >
          <FileIcon />
          <span className="truncate text-sm">
            {(message.metadata.filename as string) || 'File'}
          </span>
        </a>
        <FileMessage message={message} isOwnMessage={isOwn} className="mb-2" />
      </>
    );
  }

  if (
    (message.messageType === 'voice' || message.messageType === 'audio') &&
    message.metadata?.url
  ) {
    return (
      <div className="min-w-[280px] space-y-2">
        <AdvancedVoiceVisualizer
          audioUrl={message.metadata.url as string}
          variant="spectrum"
          theme={mapVisualizerTheme(voiceVisualizerTheme)}
          height={120}
          width={280}
          className="rounded-xl"
        />
        <VoiceMessagePlayer
          messageId={message.id}
          audioUrl={message.metadata.url as string}
          duration={(message.metadata.duration as number) || 0}
          waveformData={message.metadata.waveform as number[] | undefined}
          className={isOwn ? 'voice-player-own' : ''}
        />
      </div>
    );
  }

  if (message.messageType === 'gif') {
    return <GifMessage message={message} isOwnMessage={isOwn} className="mb-2" />;
  }

  return null;
}
