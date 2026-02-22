/**
 * Rich Media Embed Module
 *
 * Auto-detects and renders rich embeds for URLs in chat messages.
 * Supports images, videos, audio, YouTube, Twitter, and generic link previews
 * with a fullscreen lightbox viewer.
 *
 * @module modules/chat/components/rich-media-embed
 */

// Main component
export { default } from './rich-media-embed';

// Sub-components
export { default as ImageEmbed } from './image-embed';
export { default as VideoEmbed } from './video-embed';
export { default as AudioEmbed } from './audio-embed';
export { default as LinkPreview } from './link-preview';
export { default as Lightbox } from './lightbox';

// Hooks
export { useMediaEmbeds } from './hooks';

// Types
export type { LinkMetadata, RichMediaEmbedProps } from './types';

// Constants
export {
  URL_REGEX,
  YOUTUBE_REGEX,
  TWITTER_REGEX,
  IMAGE_REGEX,
  VIDEO_REGEX,
  AUDIO_REGEX,
} from './constants';
