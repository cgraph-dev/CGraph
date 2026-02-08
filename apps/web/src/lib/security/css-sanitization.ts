/**
 * CSS Sanitization - Prevents CSS injection attacks
 */

// ============================================================================
// CSS Sanitization
// ============================================================================

/**
 * List of dangerous CSS properties that can be exploited for attacks
 * - behavior/expression: IE-specific, allows JS execution
 * - -moz-binding: Firefox XBL binding, can execute JS
 * - url() with javascript:/data:: Can execute scripts
 */
const DANGEROUS_CSS_PATTERNS = [
  /expression\s*\(/gi, // IE expression()
  /javascript\s*:/gi, // javascript: URLs
  /behavior\s*:/gi, // IE behavior property
  /-moz-binding\s*:/gi, // Firefox XBL
  /data\s*:\s*text\/html/gi, // data: HTML URLs
  /vbscript\s*:/gi, // VBScript URLs
  /@import/gi, // External stylesheet imports (potential data exfiltration)
  /@charset/gi, // Charset manipulation
  /<\s*\/?\s*style/gi, // Nested style tags
  /<\s*\/?\s*script/gi, // Script tags
  /\\[0-9a-f]+/gi, // Unicode escape sequences that could bypass filters
];

/**
 * CSS properties that could be used for data exfiltration or keylogging
 */
const EXFILTRATION_PATTERNS = [
  /background(-image)?\s*:\s*url\s*\(\s*['"]?https?:\/\/(?!cgraph\.org)/gi, // External URLs (allow own domain)
  /list-style(-image)?\s*:\s*url\s*\(\s*['"]?https?:\/\/(?!cgraph\.org)/gi,
  /content\s*:\s*url\s*\(\s*['"]?https?:\/\/(?!cgraph\.org)/gi,
  /cursor\s*:\s*url\s*\(\s*['"]?https?:\/\/(?!cgraph\.org)/gi,
];

/**
 * Sanitize custom CSS to prevent injection attacks
 *
 * This function removes or neutralizes dangerous CSS patterns that could:
 * 1. Execute JavaScript (expression, javascript:, behavior)
 * 2. Load external resources for data exfiltration
 * 3. Perform keylogging via CSS selectors
 * 4. Escape the style context
 *
 * @param css - Raw CSS string from user input
 * @returns Sanitized CSS safe for dangerouslySetInnerHTML
 */
export function sanitizeCss(css: string): string {
  if (!css || typeof css !== 'string') {
    return '';
  }

  let sanitized = css;

  // Remove dangerous patterns
  for (const pattern of DANGEROUS_CSS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '/* blocked */');
  }

  // Remove potential exfiltration patterns (external URLs)
  for (const pattern of EXFILTRATION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '/* external-url-blocked */');
  }

  // Remove HTML tags that might have slipped through
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Escape any remaining angle brackets
  sanitized = sanitized.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Remove any null bytes or other control characters
  // eslint-disable-next-line no-control-regex
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return sanitized;
}

/**
 * Validate CSS for a specific context (stricter validation)
 * Returns true if CSS appears safe, false otherwise
 */
export function isSafeCss(css: string): boolean {
  if (!css || typeof css !== 'string') {
    return true; // Empty is safe
  }

  // Check for any dangerous patterns
  for (const pattern of DANGEROUS_CSS_PATTERNS) {
    if (pattern.test(css)) {
      return false;
    }
  }

  return true;
}
