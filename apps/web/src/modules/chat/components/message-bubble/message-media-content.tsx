/**
 * Message Media Content
 *
 * Renders the appropriate media content for a message based on its type.
 * Handles image, video, file, voice/audio, and GIF message types.
 */

import { VoiceMessagePlayer } from '@/components/media/voice-message-player';
import AdvancedVoiceVisualizer from '@/modules/chat/components/audio/advanced-voice-visualizer';
import { GifMessage } from '@/modules/chat/components/gif-message';
import { FileMessage } from '@/modules/chat/components/file-message';
import { FileIcon } from './icons';
import { mapVisualizerTheme } from './utils';

import type { Message } from '@/modules/chat/store';
import type { UIPreferences } from './types';

interface MessageMediaContentProps {
  message: Message;
  isOwn: boolean;
  voiceVisualizerTheme: string;
}

/**
 * Message Media Content component.
 */
export function MessageMediaContent({
  message,
  isOwn,
  voiceVisualizerTheme,
}: MessageMediaContentProps) {
  if (message.messageType === 'image' && message.metadata?.url) {
    return (
      <img
        src={message.metadata.url as string} // type assertion: message metadata field
        alt="Shared image"
        className="mb-2 max-w-xs cursor-pointer rounded-lg transition-opacity hover:opacity-90"
        onClick={() => window.open(message.metadata.url as string, '_blank')} // type assertion: message metadata field
      />
    );
  }

  if (message.messageType === 'video' && message.metadata?.url) {
    return (
      // type assertion: message metadata field is string for video messages
      <video src={message.metadata.url as string} controls className="mb-2 max-w-xs rounded-lg" />
    );
  }

  if (message.messageType === 'file' && message.metadata?.url) {
    return (
      <>
        <a
          href={message.metadata.url as string} // type assertion: message metadata field
          target="_blank"
          rel="noopener noreferrer"
          className="mb-2 flex items-center gap-2 rounded-lg bg-dark-600/50 p-2 transition-colors hover:bg-dark-600"
        >
          <FileIcon />
          <span className="truncate text-sm">
            {(message.metadata.filename as string) || 'File'}{' '}
            {/* type assertion: message metadata field */}
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
          // type assertion: message metadata URL is string for media messages
          audioUrl={message.metadata.url as string}
          variant="spectrum"
          // type assertion: voiceVisualizerTheme matches UIPreferences union
          theme={mapVisualizerTheme(voiceVisualizerTheme as UIPreferences['voiceVisualizerTheme'])}
          height={120}
          width={280}
          className="rounded-xl"
        />
        <VoiceMessagePlayer
          messageId={message.id}
          audioUrl={message.metadata.url as string} // type assertion: message metadata field
          duration={(message.metadata.duration as number) || 0} // type assertion: message metadata field
          waveformData={message.metadata.waveform as number[] | undefined} // type assertion: message metadata field
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
