import { describe, it, expect } from 'vitest';
import {
  isValidLinkUrl,
  isValidImageUrl,
  sanitizeLinkUrl,
  sanitizeImageUrl,
  escapeHtml,
  isValidExternalUrl,
} from '../urlSecurity';

// =============================================================================
// isValidLinkUrl
// =============================================================================

describe('isValidLinkUrl', () => {
  it('should accept http URLs', () => {
    expect(isValidLinkUrl('http://example.com')).toBe(true);
  });

  it('should accept https URLs', () => {
    expect(isValidLinkUrl('https://example.com/path?q=1')).toBe(true);
  });

  it('should accept mailto: URLs', () => {
    expect(isValidLinkUrl('mailto:user@example.com')).toBe(true);
  });

  it('should accept tel: URLs', () => {
    expect(isValidLinkUrl('tel:+1234567890')).toBe(true);
  });

  it('should accept relative URLs starting with /', () => {
    expect(isValidLinkUrl('/profile/settings')).toBe(true);
  });

  it('should accept hash-only URLs', () => {
    expect(isValidLinkUrl('#section')).toBe(true);
  });

  it('should accept relative dot paths', () => {
    expect(isValidLinkUrl('./page')).toBe(true);
  });

  it('should reject javascript: protocol', () => {
    expect(isValidLinkUrl('javascript:alert(1)')).toBe(false);
  });

  it('should reject vbscript: protocol', () => {
    expect(isValidLinkUrl('vbscript:MsgBox("XSS")')).toBe(false);
  });

  it('should reject data: URLs (non-image)', () => {
    expect(isValidLinkUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
  });

  it('should reject null and undefined', () => {
    expect(isValidLinkUrl(null)).toBe(false);
    expect(isValidLinkUrl(undefined)).toBe(false);
  });

  it('should reject empty string', () => {
    expect(isValidLinkUrl('')).toBe(false);
    expect(isValidLinkUrl('   ')).toBe(false);
  });

  it('should reject ftp: protocol', () => {
    expect(isValidLinkUrl('ftp://files.example.com')).toBe(false);
  });
});

// =============================================================================
// isValidImageUrl
// =============================================================================

describe('isValidImageUrl', () => {
  it('should accept https image URLs', () => {
    expect(isValidImageUrl('https://cdn.example.com/img.png')).toBe(true);
  });

  it('should accept data:image/png URLs', () => {
    expect(isValidImageUrl('data:image/png;base64,iVBOR...')).toBe(true);
  });

  it('should accept data:image/jpeg URLs', () => {
    expect(isValidImageUrl('data:image/jpeg;base64,/9j/4AAQ...')).toBe(true);
  });

  it('should accept data:image/svg+xml URLs', () => {
    expect(isValidImageUrl('data:image/svg+xml;base64,PHN2Zy...')).toBe(true);
  });

  it('should accept relative image paths', () => {
    expect(isValidImageUrl('/images/logo.png')).toBe(true);
  });

  it('should reject javascript: protocol', () => {
    expect(isValidImageUrl('javascript:alert(1)')).toBe(false);
  });

  it('should reject data:text/html URLs', () => {
    expect(isValidImageUrl('data:text/html,<h1>XSS</h1>')).toBe(false);
  });

  it('should reject null/undefined/empty', () => {
    expect(isValidImageUrl(null)).toBe(false);
    expect(isValidImageUrl(undefined)).toBe(false);
    expect(isValidImageUrl('')).toBe(false);
  });
});

// =============================================================================
// sanitizeLinkUrl / sanitizeImageUrl
// =============================================================================

describe('sanitizeLinkUrl', () => {
  it('should return safe URLs as-is', () => {
    expect(sanitizeLinkUrl('https://example.com')).toBe('https://example.com');
  });

  it('should return "#" for unsafe URLs', () => {
    expect(sanitizeLinkUrl('javascript:alert(1)')).toBe('#');
  });

  it('should return "#" for null', () => {
    expect(sanitizeLinkUrl(null)).toBe('#');
  });
});

describe('sanitizeImageUrl', () => {
  it('should return safe image URLs as-is', () => {
    expect(sanitizeImageUrl('https://cdn.example.com/img.jpg')).toBe(
      'https://cdn.example.com/img.jpg'
    );
  });

  it('should return placeholder for unsafe URLs', () => {
    expect(sanitizeImageUrl('javascript:alert(1)', '/fallback.png')).toBe('/fallback.png');
  });

  it('should return empty string as default placeholder', () => {
    expect(sanitizeImageUrl(null)).toBe('');
  });
});

// =============================================================================
// escapeHtml
// =============================================================================

describe('escapeHtml', () => {
  it('should escape angle brackets', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
    );
  });

  it('should escape ampersands', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('should escape single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#x27;s');
  });

  it('should return empty string for empty input', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('should not modify strings without special characters', () => {
    expect(escapeHtml('Hello World 123')).toBe('Hello World 123');
  });
});

// =============================================================================
// isValidExternalUrl
// =============================================================================

describe('isValidExternalUrl', () => {
  it('should accept http external URLs', () => {
    expect(isValidExternalUrl('http://example.com')).toBe(true);
  });

  it('should accept https external URLs', () => {
    expect(isValidExternalUrl('https://example.com')).toBe(true);
  });

  it('should reject javascript: protocol', () => {
    expect(isValidExternalUrl('javascript:alert(1)')).toBe(false);
  });

  it('should reject mailto: (not http/https)', () => {
    expect(isValidExternalUrl('mailto:user@example.com')).toBe(false);
  });

  it('should reject relative URLs', () => {
    expect(isValidExternalUrl('/path')).toBe(false);
  });

  it('should reject null/undefined', () => {
    expect(isValidExternalUrl(null)).toBe(false);
    expect(isValidExternalUrl(undefined)).toBe(false);
  });
});
