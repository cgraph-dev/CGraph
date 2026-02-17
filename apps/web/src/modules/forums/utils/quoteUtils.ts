/**
 * Multi-Quote Utilities
 *
 * BBCode/Markdown formatting for quoted post content.
 * Follows forum conventions (phpBB, MyBB, Discourse) for quote blocks.
 *
 * @module modules/forums/utils
 */

export interface QuoteData {
  postId: string;
  author: string;
  content: string;
  timestamp?: string;
}

/**
 * Format a single post into a BBCode quote block.
 * Compatible with standard forum BBCode parsers.
 */
export function formatBBCodeQuote(quote: QuoteData): string {
  const dateStr = quote.timestamp ? ` date=${new Date(quote.timestamp).toISOString()}` : '';
  return `[quote="${quote.author}" post_id="${quote.postId}"${dateStr}]\n${quote.content.trim()}\n[/quote]`;
}

/**
 * Format a single post into a Markdown quote block.
 * Uses GitHub-Flavored Markdown blockquote syntax.
 */
export function formatMarkdownQuote(quote: QuoteData): string {
  const header = `> **${quote.author}** wrote:`;
  const body = quote.content
    .trim()
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n');
  return `${header}\n${body}`;
}

/**
 * Format multiple posts into a combined quote block.
 * Separates each quote with a blank line.
 */
export function formatMultiQuote(
  quotes: QuoteData[],
  format: 'bbcode' | 'markdown' = 'bbcode'
): string {
  const formatter = format === 'bbcode' ? formatBBCodeQuote : formatMarkdownQuote;
  return quotes.map(formatter).join('\n\n') + '\n\n';
}

/**
 * Strip existing quote blocks from content to prevent nesting.
 */
export function stripQuotes(content: string): string {
  // Remove BBCode quotes
  let stripped = content.replace(/\[quote[^\]]*\][\s\S]*?\[\/quote\]/gi, '');
  // Remove Markdown quotes (lines starting with >)
  stripped = stripped
    .split('\n')
    .filter((line) => !line.startsWith('>'))
    .join('\n');
  return stripped.trim();
}
