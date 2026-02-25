import { describe, it, expect } from 'vitest';
import {
  formatDate,
  truncateText,
  sanitizeFilename,
  splitTextIntoLines,
  htmlToPlainText,
} from '../utils';

describe('formatDate', () => {
  it('formats a Date object', () => {
    const d = new Date('2025-06-15T14:30:00Z');
    const result = formatDate(d);
    expect(result).toContain('2025');
    expect(result).toContain('June');
    expect(result).toContain('15');
  });

  it('formats a date string', () => {
    const result = formatDate('2025-12-25T10:00:00Z');
    expect(result).toContain('December');
    expect(result).toContain('25');
  });
});

describe('truncateText', () => {
  it('returns text unchanged if shorter than maxLength', () => {
    expect(truncateText('hello', 10)).toBe('hello');
  });

  it('returns text unchanged if exactly maxLength', () => {
    expect(truncateText('hello', 5)).toBe('hello');
  });

  it('truncates with ellipsis when exceeding maxLength', () => {
    expect(truncateText('hello world!', 8)).toBe('hello...');
  });
});

describe('sanitizeFilename', () => {
  it('replaces invalid characters with underscores', () => {
    expect(sanitizeFilename('hello world!')).toBe('hello_world_');
  });

  it('preserves alphanumeric characters', () => {
    expect(sanitizeFilename('file123')).toBe('file123');
  });

  it('truncates to maxLength', () => {
    expect(sanitizeFilename('a'.repeat(100), 10)).toBe('a'.repeat(10));
  });

  it('uses default maxLength of 50', () => {
    expect(sanitizeFilename('a'.repeat(100)).length).toBe(50);
  });
});

describe('splitTextIntoLines', () => {
  it('keeps short text on one line', () => {
    expect(splitTextIntoLines('hello', 80)).toEqual(['hello']);
  });

  it('splits long text into multiple lines', () => {
    const lines = splitTextIntoLines('one two three four five', 10);
    expect(lines.length).toBeGreaterThan(1);
    lines.forEach((line) => {
      expect(line.length).toBeLessThanOrEqual(10);
    });
  });

  it('handles empty string', () => {
    expect(splitTextIntoLines('', 80)).toEqual([]);
  });

  it('handles single long word', () => {
    const lines = splitTextIntoLines('superlongword', 5);
    expect(lines).toEqual(['superlongword']);
  });
});

describe('htmlToPlainText', () => {
  it('strips HTML tags', () => {
    expect(htmlToPlainText('<p>hello</p>')).toBe('hello');
  });

  it('strips multiple nested tags', () => {
    const result = htmlToPlainText('<div><strong>bold</strong> text</div>');
    expect(result).toContain('bold');
    expect(result).toContain('text');
    expect(result).not.toContain('<');
  });

  it('handles empty string', () => {
    expect(htmlToPlainText('')).toBe('');
  });
});
