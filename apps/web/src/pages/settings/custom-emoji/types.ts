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
}

export type EmojiCategory = 'all' | 'reactions' | 'memes' | 'people' | 'custom';
