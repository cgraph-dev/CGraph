/**
 * Post editor constant definitions.
 * @module
 */
import {
  BoldIcon,
  ItalicIcon,
  ListBulletIcon,
  LinkIcon,
  PhotoIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline';
import { UnderlineIcon, StrikethroughIcon, QuoteIcon, HeadingIcon } from './icons';
import type { ToolbarButton } from './types';

/**
 * Default maximum length for post titles
 */
export const DEFAULT_MAX_TITLE_LENGTH = 300;

/**
 * Default maximum length for post content
 */
export const DEFAULT_MAX_CONTENT_LENGTH = 40000;

/**
 * Autosave interval in milliseconds (30 seconds)
 */
export const AUTOSAVE_INTERVAL = 30000;

/**
 * Maximum number of poll options allowed
 */
export const MAX_POLL_OPTIONS = 10;

/**
 * Minimum number of poll options required
 */
export const MIN_POLL_OPTIONS = 2;

/**
 * Poll duration options in hours
 */
export const POLL_DURATION_OPTIONS = [
  { value: '', label: 'No end date' },
  { value: '24', label: '1 day' },
  { value: '72', label: '3 days' },
  { value: '168', label: '1 week' },
] as const;

/**
 * Toolbar button configuration for the editor
 */
export const TOOLBAR_BUTTONS: ToolbarButton[] = [
  { tag: 'bold', icon: BoldIcon, label: 'Bold' },
  { tag: 'italic', icon: ItalicIcon, label: 'Italic' },
  { tag: 'underline', icon: UnderlineIcon, label: 'Underline' },
  { tag: 'strikethrough', icon: StrikethroughIcon, label: 'Strikethrough' },
  { tag: 'divider' },
  { tag: 'heading', icon: HeadingIcon, label: 'Heading' },
  { tag: 'quote', icon: QuoteIcon, label: 'Quote' },
  { tag: 'code', icon: CodeBracketIcon, label: 'Code' },
  { tag: 'list', icon: ListBulletIcon, label: 'List' },
  { tag: 'divider' },
  { tag: 'link', icon: LinkIcon, label: 'Link' },
  { tag: 'image', icon: PhotoIcon, label: 'Image' },
];
