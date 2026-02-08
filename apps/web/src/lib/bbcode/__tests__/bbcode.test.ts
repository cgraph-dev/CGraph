/**
 * BBCode Parser Tests
 *
 * Tests for BBCode parsing, tag handling, stripping, validation,
 * and sanitization helpers.
 */

import { describe, it, expect } from 'vitest';
import {
  parseBBCode,
  stripBBCode,
  countBBCodeCharacters,
  validateBBCode,
  escapeHtml,
  extractYouTubeId,
  isValidColor,
  sanitizeFontSize,
  sanitizeFontFamily,
} from '../index';

// ---------------------------------------------------------------------------
// parseBBCode
// ---------------------------------------------------------------------------

describe('parseBBCode', () => {
  it('returns empty string for empty input', () => {
    expect(parseBBCode('')).toBe('');
  });

  it('parses [b] bold tags', () => {
    const result = parseBBCode('[b]hello[/b]');
    expect(result).toContain('<strong');
    expect(result).toContain('hello');
  });

  it('parses [i] italic tags', () => {
    const result = parseBBCode('[i]italic[/i]');
    expect(result).toContain('<em');
    expect(result).toContain('italic');
  });

  it('parses [u] underline tags', () => {
    const result = parseBBCode('[u]underline[/u]');
    expect(result).toContain('underline');
    expect(result).toContain('class="underline"');
  });

  it('parses [s] strikethrough tags', () => {
    const result = parseBBCode('[s]deleted[/s]');
    expect(result).toContain('<del');
    expect(result).toContain('deleted');
  });

  it('parses nested formatting tags', () => {
    const result = parseBBCode('[b][i]bold italic[/i][/b]');
    expect(result).toContain('<strong');
    expect(result).toContain('<em');
  });

  it('parses [code] blocks and escapes HTML inside', () => {
    const result = parseBBCode('[code]<script>alert(1)</script>[/code]');
    expect(result).toContain('<pre');
    expect(result).toContain('<code');
    expect(result).not.toContain('<script>alert(1)</script>');
  });

  it('parses [quote] blocks', () => {
    const result = parseBBCode('[quote]some quote[/quote]');
    expect(result).toContain('<blockquote');
  });

  it('parses [quote=Author] blocks with author attribution', () => {
    const result = parseBBCode('[quote=John]words[/quote]');
    expect(result).toContain('John');
    expect(result).toContain('wrote:');
  });

  it('parses [spoiler] tags into <details>', () => {
    const result = parseBBCode('[spoiler]hidden[/spoiler]');
    expect(result).toContain('<details');
    expect(result).toContain('hidden');
  });

  it('converts newlines to <br />', () => {
    const result = parseBBCode('line1\nline2');
    expect(result).toContain('<br />');
  });

  it('parses [color=red] tags', () => {
    const result = parseBBCode('[color=red]colored[/color]');
    expect(result).toContain('color: red');
  });

  it('parses [hr] as a horizontal rule', () => {
    const result = parseBBCode('[hr]');
    expect(result).toContain('<hr');
  });

  it('handles [list] with items', () => {
    const result = parseBBCode('[list][*]one[*]two[/list]');
    expect(result).toContain('<ul');
    expect(result).toContain('<li');
  });
});

// ---------------------------------------------------------------------------
// stripBBCode
// ---------------------------------------------------------------------------

describe('stripBBCode', () => {
  it('returns empty string for empty input', () => {
    expect(stripBBCode('')).toBe('');
  });

  it('strips bold tags and keeps text', () => {
    expect(stripBBCode('[b]hello[/b]')).toBe('hello');
  });

  it('strips url tags and keeps the display text', () => {
    expect(stripBBCode('[url=https://example.com]Click here[/url]')).toBe('Click here');
  });

  it('strips [img] tags and their content', () => {
    // [img] content is replaced with [Image], then the cleanup regex strips bracket-wrapped text
    expect(stripBBCode('[img]https://example.com/photo.png[/img]')).toBe('');
  });

  it('replaces bullet points with •', () => {
    const result = stripBBCode('[list][*]item[/list]');
    expect(result).toContain('•');
  });
});

// ---------------------------------------------------------------------------
// countBBCodeCharacters
// ---------------------------------------------------------------------------

describe('countBBCodeCharacters', () => {
  it('counts only the visible text, not tags', () => {
    expect(countBBCodeCharacters('[b]hello[/b]')).toBe(5);
  });

  it('returns 0 for empty input', () => {
    expect(countBBCodeCharacters('')).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// validateBBCode
// ---------------------------------------------------------------------------

describe('validateBBCode', () => {
  it('returns valid for properly closed tags', () => {
    const result = validateBBCode('[b]text[/b]');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detects unclosed [b] tag', () => {
    const result = validateBBCode('[b]text');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('[b]');
  });

  it('detects extra closing tag without opener', () => {
    const result = validateBBCode('text[/i]');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('[/i]');
  });

  it('validates complex nested content as valid', () => {
    const result = validateBBCode('[b][i]nested[/i][/b]');
    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// BBCode sanitizer helpers
// ---------------------------------------------------------------------------

describe('escapeHtml (bbcode)', () => {
  it('escapes angle brackets', () => {
    expect(escapeHtml('<div>')).toContain('&lt;');
    expect(escapeHtml('<div>')).toContain('&gt;');
  });

  it('escapes ampersands', () => {
    expect(escapeHtml('a & b')).toContain('&amp;');
  });
});

describe('extractYouTubeId', () => {
  it('extracts ID from standard watch URL', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from short URL', () => {
    expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from embed URL', () => {
    expect(extractYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from shorts URL', () => {
    expect(extractYouTubeId('https://youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('returns null for non-YouTube URL', () => {
    expect(extractYouTubeId('https://vimeo.com/12345')).toBeNull();
  });
});

describe('isValidColor', () => {
  it('accepts hex colors', () => {
    expect(isValidColor('#ff0000')).toBe(true);
    expect(isValidColor('#abc')).toBe(true);
  });

  it('accepts named colors', () => {
    expect(isValidColor('red')).toBe(true);
    expect(isValidColor('Blue')).toBe(true);
  });

  it('rejects invalid color strings', () => {
    expect(isValidColor('notacolor')).toBe(false);
    expect(isValidColor('#xyz')).toBe(false);
  });
});

describe('sanitizeFontSize', () => {
  it('clamps numeric sizes between 8 and 36', () => {
    expect(sanitizeFontSize('4')).toBe('8px');
    expect(sanitizeFontSize('50')).toBe('36px');
    expect(sanitizeFontSize('16')).toBe('16px');
  });

  it('maps named sizes', () => {
    expect(sanitizeFontSize('small')).toBe('14px');
    expect(sanitizeFontSize('large')).toBe('18px');
  });

  it('defaults to 16px for unknown named sizes', () => {
    expect(sanitizeFontSize('huge')).toBe('16px');
  });
});

describe('sanitizeFontFamily', () => {
  it('allows whitelisted fonts', () => {
    expect(sanitizeFontFamily('Arial')).toContain('Arial');
  });

  it('falls back to Arial for unknown fonts', () => {
    expect(sanitizeFontFamily('EvilFont')).toBe('"Arial", sans-serif');
  });
});
