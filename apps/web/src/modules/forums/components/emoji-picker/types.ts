/**
 * Custom Emoji Types
 */

export interface CustomEmoji {
  id: string;
  shortcode: string;
  name: string;
  description?: string;
  image_url: string;
  image_type: string;
  is_animated: boolean;
  category_id?: string;
  category?: EmojiCategory;
  usage_count: number;
  aliases: string[];
}

export interface EmojiCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  display_order: number;
}

export interface CustomEmojiPickerProps {
  /** Callback when an emoji is selected */
  onSelect: (emoji: CustomEmoji | string) => void;
  /** Optional forum ID for forum-specific emojis */
  forumId?: string;
  /** Whether the picker is open */
  isOpen: boolean;
  /** Close the picker */
  onClose: () => void;
  /** Position relative to trigger */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Show Unicode emojis tab */
  showUnicode?: boolean;
  /** Custom class name */
  className?: string;
  /** Max height */
  maxHeight?: number;
}
