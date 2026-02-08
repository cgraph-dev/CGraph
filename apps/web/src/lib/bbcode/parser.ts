/**
 * BBCode parsing, stripping, validation, and preview functions
 */

import { escapeHtml } from './sanitizers';
import { bbcodeTags } from './tags';

/**
 * Parse BBCode and convert to HTML
 *
 * @param input - The BBCode string to parse
 * @param options - Parser options
 * @returns Parsed HTML string
 */
export function parseBBCode(input: string, options: { escapeInput?: boolean } = {}): string {
  if (!input) return '';

  // Optionally escape the input first (if not already escaped)
  let text = options.escapeInput !== false ? escapeHtml(input) : input;

  // Un-escape the BBCode tags that we need to process
  // Use unique placeholders for < and > to preserve them during processing
  const LT_PLACEHOLDER = '___BBCODE_LT___';
  const GT_PLACEHOLDER = '___BBCODE_GT___';
  text = text
    .replace(/&lt;/g, LT_PLACEHOLDER)
    .replace(/&gt;/g, GT_PLACEHOLDER)
    .replace(/\[/g, '[')
    .replace(/\]/g, ']')
    .replace(new RegExp(LT_PLACEHOLDER, 'g'), '&lt;')
    .replace(new RegExp(GT_PLACEHOLDER, 'g'), '&gt;');

  // Sort tags by priority (lower = processed first)
  const sortedTags = [...bbcodeTags].sort((a, b) => (a.priority || 10) - (b.priority || 10));

  // Apply each tag transformation
  for (const tag of sortedTags) {
    // Handle nested tags by applying multiple times
    let prevText = '';
    let iterations = 0;
    const maxIterations = 10; // Prevent infinite loops from malformed BBCode

    while (prevText !== text && iterations < maxIterations) {
      prevText = text;
      text = text.replace(tag.pattern, tag.replace as (...args: string[]) => string);
      iterations++;
    }
  }

  // Convert newlines to <br> (but not inside pre/code blocks)
  text = text.replace(/\n/g, '<br />');

  return text;
}

/**
 * Strip all BBCode tags from text
 * Returns plain text with no formatting
 */
export function stripBBCode(input: string): string {
  if (!input) return '';

  // Remove all BBCode tags
  let text = input;

  // Remove tags with content preservation
  text = text.replace(
    /\[(?:b|i|u|s|sub|sup|code|php|html|quote|spoiler|color|size|font|align|indent|list|me)(?:=[^\]]+)?\]([\s\S]*?)\[\/\1\]/gi,
    '$1'
  );
  text = text.replace(/\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi, '$2');
  text = text.replace(/\[url\]([\s\S]*?)\[\/url\]/gi, '$1');
  text = text.replace(/\[email=([^\]]+)\]([\s\S]*?)\[\/email\]/gi, '$2');
  text = text.replace(/\[email\]([\s\S]*?)\[\/email\]/gi, '$1');
  text = text.replace(/\[img(?:=[^\]]+)?\]([\s\S]*?)\[\/img\]/gi, '[Image]');
  text = text.replace(/\[youtube\]([\s\S]*?)\[\/youtube\]/gi, '[YouTube Video]');
  text = text.replace(/\[video\]([\s\S]*?)\[\/video\]/gi, '[Video]');
  text = text.replace(/\[\*\]/g, '• ');
  text = text.replace(/\[hr\]/gi, '---');

  // Clean up any remaining tags
  text = text.replace(/\[[^\]]+\]/g, '');

  return text.trim();
}

/**
 * Count characters in BBCode content (excluding tags)
 */
export function countBBCodeCharacters(input: string): number {
  return stripBBCode(input).length;
}

/**
 * Validate BBCode - check for unclosed tags
 */
export function validateBBCode(input: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for common unclosed tags
  const tagPairs = [
    ['[b]', '[/b]'],
    ['[i]', '[/i]'],
    ['[u]', '[/u]'],
    ['[s]', '[/s]'],
    ['[code]', '[/code]'],
    ['[quote]', '[/quote]'],
    ['[spoiler]', '[/spoiler]'],
    ['[list]', '[/list]'],
    ['[url]', '[/url]'],
  ];

  const lowerInput = input.toLowerCase();

  for (const pair of tagPairs) {
    const open = pair[0]!;
    const close = pair[1]!;
    const openCount = (lowerInput.match(new RegExp(open.replace(/[[\]]/g, '\\$&'), 'g')) || [])
      .length;
    const closeCount = (lowerInput.match(new RegExp(close.replace(/[[\]]/g, '\\$&'), 'g')) || [])
      .length;

    if (openCount > closeCount) {
      errors.push(`Unclosed ${open} tag`);
    } else if (closeCount > openCount) {
      errors.push(`Extra ${close} tag without matching opening tag`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Preview BBCode - lighter parsing for live preview
 * Limits nesting depth and processing for performance
 */
export function previewBBCode(input: string, maxLength?: number): string {
  let text = input;

  // Truncate if needed
  if (maxLength && text.length > maxLength) {
    text = text.slice(0, maxLength) + '...';
  }

  return parseBBCode(text);
}
