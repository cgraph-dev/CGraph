/**
 * Custom Emoji Screen - Types & Fallback Data
 *
 * @version 1.0.0
 */

// ============================================================================
// TYPES
// ============================================================================

/** Supported animation formats for custom emojis */
export type AnimationFormat = 'gif' | 'apng' | 'webp' | 'lottie' | null;

export interface CustomEmoji {
  id: string;
  name: string;
  shortcode: string;
  imageUrl: string;
  category: string;
  createdBy: string;
  createdAt: string;
  usageCount: number;
  isAnimated: boolean;
  /** URL to Lottie JSON animation (when animationFormat is 'lottie') */
  lottieUrl?: string;
  /** Format of the animation */
  animationFormat?: AnimationFormat;
}

export interface EmojiCategory {
  id: string;
  name: string;
  count: number;
}

// ============================================================================
// FALLBACK DATA
// ============================================================================

export const FALLBACK_CATEGORIES: EmojiCategory[] = [
  { id: 'all', name: 'All', count: 12 },
  { id: 'reactions', name: 'Reactions', count: 5 },
  { id: 'memes', name: 'Memes', count: 4 },
  { id: 'custom', name: 'Custom', count: 3 },
];

export const FALLBACK_EMOJIS: CustomEmoji[] = [
  {
    id: '1',
    name: 'Party Parrot',
    shortcode: 'partyparrot',
    imageUrl: '',
    category: 'reactions',
    createdBy: 'admin',
    createdAt: '2025-01-01',
    usageCount: 1234,
    isAnimated: true,
  },
  {
    id: '2',
    name: 'Thumbs Up',
    shortcode: 'thumbsup',
    imageUrl: '',
    category: 'reactions',
    createdBy: 'admin',
    createdAt: '2025-01-01',
    usageCount: 892,
    isAnimated: false,
  },
  {
    id: '3',
    name: 'Fire',
    shortcode: 'fire',
    imageUrl: '',
    category: 'reactions',
    createdBy: 'admin',
    createdAt: '2025-01-01',
    usageCount: 756,
    isAnimated: false,
  },
  {
    id: '4',
    name: 'LOL',
    shortcode: 'lol',
    imageUrl: '',
    category: 'memes',
    createdBy: 'user1',
    createdAt: '2025-02-15',
    usageCount: 543,
    isAnimated: true,
  },
  {
    id: '5',
    name: 'Sad Cat',
    shortcode: 'sadcat',
    imageUrl: '',
    category: 'memes',
    createdBy: 'user2',
    createdAt: '2025-03-20',
    usageCount: 321,
    isAnimated: false,
  },
];
