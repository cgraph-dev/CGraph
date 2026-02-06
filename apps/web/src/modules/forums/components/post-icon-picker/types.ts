/**
 * Type definitions for PostIconPicker
 * @module modules/forums/components/post-icon-picker
 */

export interface PostIcon {
  id: string;
  name: string;
  icon_url: string;
  emoji?: string;
  display_order: number;
  is_active: boolean;
  forum_id?: string;
  usage_count: number;
}

export interface PostIconPickerProps {
  /** Currently selected icon */
  selectedIcon?: PostIcon | null;
  /** Callback when an icon is selected */
  onSelect: (icon: PostIcon | null) => void;
  /** Available icons to display */
  icons: PostIcon[];
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show as inline or dropdown */
  variant?: 'inline' | 'dropdown';
  /** Placeholder text when no icon selected */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
  /** Forum ID for context */
  forumId?: string;
}

export interface PostIconDisplayProps {
  icon: PostIcon;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

export interface IconButtonProps {
  icon: PostIcon;
  isSelected: boolean;
  onClick: () => void;
  size: 'sm' | 'md' | 'lg';
}

export interface IconSearchProps {
  value: string;
  onChange: (value: string) => void;
}
