/**
 * GifPicker Types
 *
 * Type definitions for the GIF picker component.
 */

import type { ReactNode } from 'react';

/**
 * GIF result from API
 */
export interface GifResult {
  id: string;
  title: string;
  url: string;
  previewUrl: string;
  width: number;
  height: number;
  source: 'tenor' | 'giphy';
}

/**
 * Main GifPicker component props
 */
export interface GifPickerProps {
  /** Callback when a GIF is selected */
  onSelect: (gif: GifResult) => void;
  /** Callback to close the picker */
  onClose: () => void;
  /** Whether the picker is open */
  isOpen: boolean;
  /** Optional className for positioning */
  className?: string;
}

/**
 * GifItem component props
 */
export interface GifItemProps {
  gif: GifResult;
  onSelect: (gif: GifResult) => void;
  isFavorite: boolean;
  onToggleFavorite: (gif: GifResult) => void;
}

/**
 * CategoryButton component props
 */
export interface CategoryButtonProps {
  category: GifCategory;
  isActive: boolean;
  onClick: () => void;
}

/**
 * GIF category definition
 */
export interface GifCategory {
  id: string;
  name: string;
  icon: ReactNode;
  searchTerm: string;
}
