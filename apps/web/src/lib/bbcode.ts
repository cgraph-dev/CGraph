/**
 * BBCode Parser - barrel re-export
 *
 * All implementation has been split into submodules under ./bbcode/
 * This file re-exports everything for backward compatibility.
 */

export type { BBCodeTag } from './bbcode/types';
export {
  escapeHtml,
  extractYouTubeId,
  isValidColor,
  sanitizeFontSize,
  sanitizeFontFamily,
} from './bbcode/sanitizers';
export { bbcodeTags } from './bbcode/tags';
export {
  parseBBCode,
  stripBBCode,
  countBBCodeCharacters,
  validateBBCode,
  previewBBCode,
} from './bbcode/parser';

export { default } from './bbcode/index';
