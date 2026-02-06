/**
 * Rich Media Embed Module Types
 *
 * Type definitions for the rich media embed components.
 *
 * @module modules/chat/components/rich-media-embed
 */

/** Metadata extracted from a URL for rich media display */
export interface LinkMetadata {
  /** Original URL */
  url: string;
  /** Page title from Open Graph or meta tags */
  title?: string;
  /** Page description */
  description?: string;
  /** Preview image URL */
  image?: string;
  /** Site name (e.g., 'YouTube', 'Twitter') */
  siteName?: string;
  /** Content type classification */
  type?: 'website' | 'video' | 'image' | 'audio' | 'article';
  /** Direct video embed URL */
  videoUrl?: string;
  /** Direct audio embed URL */
  audioUrl?: string;
  /** Site favicon URL */
  favicon?: string;
}

/** Props for the main RichMediaEmbed component */
export interface RichMediaEmbedProps {
  /** Raw message content containing URLs to detect */
  content: string;
  /** Whether this message was sent by the current user */
  isOwnMessage: boolean;
  /** Callback fired when all embeds have loaded */
  onLoad?: () => void;
}
