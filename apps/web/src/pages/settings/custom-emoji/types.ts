/**
 * Custom emoji type definitions.
 * @module
 */
export type AnimationFormat = 'gif' | 'apng' | 'webp' | 'lottie' | null;

export interface CustomEmoji {
  id: string;
  name: string;
  shortcode: string;
  imageUrl: string;
  category: string;
  createdBy: string;
  usageCount: number;
  isAnimated: boolean;
  createdAt: string;
  lottieUrl?: string;
  animationFormat?: AnimationFormat;
}

export interface CustomEmojiUpload {
  name: string;
  shortcode: string;
  file: File;
  animationFormat?: AnimationFormat;
  lottieData?: Record<string, unknown>;
}

export type EmojiCategory = 'all' | 'reactions' | 'memes' | 'people' | 'custom';
