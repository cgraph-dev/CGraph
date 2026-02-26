import { describe, it, expect } from 'vitest';
import {
  formatBBCodeQuote,
  formatMarkdownQuote,
  formatMultiQuote,
  stripQuotes,
} from '../quoteUtils';
import type { QuoteData } from '../quoteUtils';

const sampleQuote: QuoteData = {
  postId: '42',
  author: 'Alice',
  content: 'Hello world',
};

const quotedWithTimestamp: QuoteData = {
  postId: '100',
  author: 'Bob',
  content: 'Timestamped message',
  timestamp: '2024-01-15T10:30:00Z',
};

describe('quoteUtils', () => {
  describe('formatBBCodeQuote', () => {
    it('formats basic quote', () => {
      const result = formatBBCodeQuote(sampleQuote);
      expect(result).toContain('[quote="Alice" post_id="42"]');
      expect(result).toContain('Hello world');
      expect(result).toContain('[/quote]');
    });

    it('includes date when timestamp is provided', () => {
      const result = formatBBCodeQuote(quotedWithTimestamp);
      expect(result).toContain('date=');
      expect(result).toContain('2024-01-15');
    });

    it('trims content whitespace', () => {
      const result = formatBBCodeQuote({ ...sampleQuote, content: '  padded  ' });
      expect(result).toContain('\npadded\n');
    });
  });

  describe('formatMarkdownQuote', () => {
    it('formats with author header', () => {
      const result = formatMarkdownQuote(sampleQuote);
      expect(result).toContain('> **Alice** wrote:');
    });

    it('prefixes each line with >', () => {
      const multiLine = { ...sampleQuote, content: 'line1\nline2\nline3' };
      const result = formatMarkdownQuote(multiLine);
      expect(result).toContain('> line1');
      expect(result).toContain('> line2');
      expect(result).toContain('> line3');
    });
  });

  describe('formatMultiQuote', () => {
    it('formats multiple quotes separated by blank lines', () => {
      const quotes = [sampleQuote, quotedWithTimestamp];
      const result = formatMultiQuote(quotes, 'bbcode');
      expect(result.match(/\[quote=/g)?.length).toBe(2);
      expect(result.match(/\[\/quote\]/g)?.length).toBe(2);
    });

    it('uses markdown format when specified', () => {
      const quotes = [sampleQuote];
      const result = formatMultiQuote(quotes, 'markdown');
      expect(result).toContain('> **Alice** wrote:');
    });

    it('defaults to bbcode format', () => {
      const result = formatMultiQuote([sampleQuote]);
      expect(result).toContain('[quote=');
    });

    it('ends with double newline', () => {
      const result = formatMultiQuote([sampleQuote]);
      expect(result).toMatch(/\n\n$/);
    });
  });

  describe('stripQuotes', () => {
    it('removes BBCode quotes', () => {
      const input = 'Before [quote="A" post_id="1"]quoted[/quote] After';
      expect(stripQuotes(input)).toBe('Before  After');
    });

    it('removes Markdown quotes', () => {
      const input = '> quoted line\nNormal line';
      expect(stripQuotes(input)).toBe('Normal line');
    });

    it('handles mixed content', () => {
      const input = '> markdown quote\n[quote="A"]bbcode[/quote]\nKeep this';
      const result = stripQuotes(input);
      expect(result).toContain('Keep this');
      expect(result).not.toContain('[quote');
      expect(result).not.toContain('>');
    });

    it('trims result', () => {
      const result = stripQuotes('  \n> quoted\n  ');
      expect(result).toBe('');
    });
  });
});
