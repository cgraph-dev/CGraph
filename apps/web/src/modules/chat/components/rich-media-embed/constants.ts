/**
 * Rich Media Embed constants - URL detection regex patterns
 * @module modules/chat/components/rich-media-embed
 */
// Regex patterns for detecting embeddable content
export const URL_REGEX = /(https?:\/\/[^\s]+)/g;
export const YOUTUBE_REGEX = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
export const TWITTER_REGEX = /twitter\.com\/\w+\/status\/(\d+)/;
export const IMAGE_REGEX = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i;
export const VIDEO_REGEX = /\.(mp4|webm|ogg|mov)(\?.*)?$/i;
export const AUDIO_REGEX = /\.(mp3|wav|ogg|m4a)(\?.*)?$/i;
