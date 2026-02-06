export interface LinkMetadata {
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

export interface RichMediaEmbedProps {
  content: string;
  isOwnMessage: boolean;
  onLoad?: () => void;
}
