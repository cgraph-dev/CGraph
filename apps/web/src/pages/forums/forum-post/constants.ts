/**
 * Constants for the ForumPost module
 */

/**
 * Report reason options for the report modal
 */
export const REPORT_REASONS = [
  { value: '', label: 'Select a reason...' },
  { value: 'spam', label: 'Spam or misleading' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'hate_speech', label: 'Hate speech' },
  { value: 'violence', label: 'Violence or threats' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'copyright', label: 'Copyright violation' },
  { value: 'other', label: 'Other' },
] as const;

/**
 * Maximum nesting depth for comment indentation (in pixels)
 */
export const MAX_COMMENT_INDENT = 120;

/**
 * Indent per level (in pixels)
 */
export const COMMENT_INDENT_PER_LEVEL = 24;
