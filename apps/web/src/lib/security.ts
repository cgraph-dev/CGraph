/**
 * Security Utilities for CGraph — thin re-export barrel.
 * All implementation lives in ./security/ submodules.
 */
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
  checkPasswordStrength,
  isRateLimited,
  getRemainingAttempts,
  generateNonce,
  hasContentSecurityPolicy,
  getSessionFingerprint,
  validateSessionFingerprint,
  checkSecurityHeaders,
  sanitizeCss,
  isSafeCss,
  security,
} from './security/index';

export type { StorageOptions, PasswordStrength, SecurityHeadersCheck } from './security/index';

export { default } from './security/index';
