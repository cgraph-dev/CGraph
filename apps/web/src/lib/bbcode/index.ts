/**
 * BBCode Parser - Full MyBB-compatible BBCode/MyCode implementation
 *
 * Supports all standard BBCode tags plus MyBB extensions:
 * - Basic: [b], [i], [u], [s], [sub], [sup]
 * - Links: [url], [email]
 * - Media: [img], [video], [youtube]
 * - Code: [code], [php], [html]
 * - Formatting: [color], [size], [font], [align], [indent]
 * - Lists: [list], [*]
 * - Quotes: [quote], [quote=author]
 * - Special: [spoiler], [hr], [me]
 *
 * Security:
 * - XSS prevention through HTML escaping
 * - URL validation for links and images
 * - Content sanitization
 */

// Re-export everything from submodules
export type { BBCodeTag } from './types';
export {
  escapeHtml,
  extractYouTubeId,
  isValidColor,
  sanitizeFontSize,
  sanitizeFontFamily,
} from './sanitizers';
export { bbcodeTags } from './tags';
export {
  parseBBCode,
  stripBBCode,
  countBBCodeCharacters,
  validateBBCode,
  previewBBCode,
} from './parser';

// Default export for convenience
import {
  parseBBCode,
  stripBBCode,
  validateBBCode,
  previewBBCode,
  countBBCodeCharacters,
} from './parser';

export default {
  parse: parseBBCode,
  strip: stripBBCode,
  validate: validateBBCode,
  preview: previewBBCode,
  countCharacters: countBBCodeCharacters,
};
