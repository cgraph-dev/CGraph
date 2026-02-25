import { describe, it, expect } from 'vitest';
import {
  highlightContent,
  loadRecentSearches,
  saveRecentSearch,
  RECENT_SEARCHES_KEY,
  MAX_RECENT_SEARCHES,
} from '../utils';

describe('highlightContent', () => {
  it('wraps matching text in mark tags', () => {
    const result = highlightContent('hello world', 'world');
    expect(result).toContain('<mark');
    expect(result).toContain('world');
  });

  it('is case-insensitive', () => {
    const result = highlightContent('Hello World', 'hello');
    expect(result).toContain('<mark');
  });

  it('returns unchanged text for empty search', () => {
    expect(highlightContent('hello', '')).toBe('hello');
    expect(highlightContent('hello', '   ')).toBe('hello');
  });

  it('escapes regex special characters in search term', () => {
    const result = highlightContent('price is $10.00', '$10.00');
    expect(result).toContain('<mark');
  });

  it('highlights multiple occurrences', () => {
    const result = highlightContent('the cat and the cat', 'cat');
    const matches = result.match(/<mark/g);
    expect(matches).toHaveLength(2);
  });
});

describe('loadRecentSearches', () => {
  it('returns empty array when nothing stored', () => {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
    expect(loadRecentSearches()).toEqual([]);
  });

  it('returns stored searches', () => {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(['foo', 'bar']));
    expect(loadRecentSearches()).toEqual(['foo', 'bar']);
  });

  it('returns empty array for invalid JSON', () => {
    localStorage.setItem(RECENT_SEARCHES_KEY, 'invalid');
    expect(loadRecentSearches()).toEqual([]);
  });
});

describe('saveRecentSearch', () => {
  it('adds new term at the beginning', () => {
    const result = saveRecentSearch('new', ['old1', 'old2']);
    expect(result[0]).toBe('new');
  });

  it('removes duplicates', () => {
    const result = saveRecentSearch('old1', ['old1', 'old2']);
    expect(result.filter((s) => s === 'old1')).toHaveLength(1);
  });

  it('limits to MAX_RECENT_SEARCHES', () => {
    const current = Array.from({ length: MAX_RECENT_SEARCHES }, (_, i) => `search${i}`);
    const result = saveRecentSearch('new', current);
    expect(result.length).toBeLessThanOrEqual(MAX_RECENT_SEARCHES);
  });

  it('returns current list for empty/whitespace term', () => {
    const current = ['a', 'b'];
    expect(saveRecentSearch('', current)).toEqual(current);
    expect(saveRecentSearch('   ', current)).toEqual(current);
  });

  it('persists to localStorage', () => {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
    saveRecentSearch('test', []);
    const stored = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
    expect(stored).toContain('test');
  });
});
