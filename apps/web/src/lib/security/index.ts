/**
 * Security Utilities for CGraph
 *
 * Features:
 * - XSS prevention
 * - CSRF protection
 * - Input sanitization
 * - Content Security Policy helpers
 * - Secure storage wrappers
 * - Authentication helpers
 */

// XSS, CSRF, Secure Storage
export {
  escapeHtml,
  sanitizeInput,
  sanitizeUrl,
  isTrustedDomain,
  safeRedirect,
  getCsrfToken,
  addCsrfHeader,
  secureFetch,
  secureStore,
  secureRetrieve,
  secureRemove,
  secureClear,
} from './xss-csrf';
export type { StorageOptions } from './xss-csrf';

// Password, Rate Limiting, CSP, Session, Headers
export {
  checkPasswordStrength,
  isRateLimited,
  getRemainingAttempts,
  generateNonce,
  hasContentSecurityPolicy,
  getSessionFingerprint,
  validateSessionFingerprint,
  checkSecurityHeaders,
} from './validation';
export type { PasswordStrength, SecurityHeadersCheck } from './validation';

// CSS Sanitization
export { sanitizeCss, isSafeCss } from './css-sanitization';

// Aggregate namespace object
import { escapeHtml, sanitizeInput, sanitizeUrl, isTrustedDomain, safeRedirect } from './xss-csrf';
import { getCsrfToken, addCsrfHeader, secureFetch } from './xss-csrf';
import { secureStore, secureRetrieve, secureRemove, secureClear } from './xss-csrf';
import { checkPasswordStrength } from './validation';
import { isRateLimited, getRemainingAttempts } from './validation';
import { generateNonce, hasContentSecurityPolicy } from './validation';
import { getSessionFingerprint, validateSessionFingerprint } from './validation';
import { checkSecurityHeaders } from './validation';
import { sanitizeCss, isSafeCss } from './css-sanitization';

export const security = {
  // XSS
  escapeHtml,
  sanitizeInput,
  sanitizeUrl,
  isTrustedDomain,
  safeRedirect,

  // CSS Sanitization
  sanitizeCss,
  isSafeCss,

  // CSRF
  getCsrfToken,
  addCsrfHeader,
  secureFetch,

  // Storage
  secureStore,
  secureRetrieve,
  secureRemove,
  secureClear,

  // Password
  checkPasswordStrength,

  // Rate Limiting
  isRateLimited,
  getRemainingAttempts,

  // CSP
  generateNonce,
  hasContentSecurityPolicy,

  // Session
  getSessionFingerprint,
  validateSessionFingerprint,

  // Headers
  checkSecurityHeaders,
};

export default security;
