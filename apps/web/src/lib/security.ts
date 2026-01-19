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

// ============================================================================
// XSS Prevention
// ============================================================================

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(str: string): string {
  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Sanitize user input for safe rendering
 */
export function sanitizeInput(input: string): string {
  return escapeHtml(input.trim());
}

/**
 * Sanitize URL to prevent javascript: and data: attacks
 */
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim().toLowerCase();

  // Block dangerous protocols
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:')
  ) {
    return '#';
  }

  // Allow safe protocols
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('/') ||
    !trimmed.includes(':')
  ) {
    return url;
  }

  return '#';
}

/**
 * Check if URL is from a trusted domain
 */
export function isTrustedDomain(url: string, trustedDomains: string[]): boolean {
  try {
    const parsed = new URL(url);
    return trustedDomains.some(
      (domain) => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

// ============================================================================
// CSRF Protection
// ============================================================================

const CSRF_TOKEN_KEY = 'cgraph_csrf_token';

/**
 * Get CSRF token from meta tag or cookie
 */
export function getCsrfToken(): string | null {
  // Try meta tag first
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  if (metaTag) {
    return metaTag.getAttribute('content');
  }

  // Try cookie
  const match = document.cookie.match(new RegExp(`${CSRF_TOKEN_KEY}=([^;]+)`));
  return match ? (match[1] ?? null) : null;
}

/**
 * Add CSRF token to request headers
 */
export function addCsrfHeader(headers: Headers | Record<string, string>): void {
  const token = getCsrfToken();
  if (!token) return;

  if (headers instanceof Headers) {
    headers.set('X-CSRF-Token', token);
  } else {
    headers['X-CSRF-Token'] = token;
  }
}

/**
 * Create fetch wrapper with CSRF protection
 */
export function secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);

  // Add CSRF token for non-GET requests
  if (options.method && !['GET', 'HEAD', 'OPTIONS'].includes(options.method.toUpperCase())) {
    addCsrfHeader(headers);
  }

  // Ensure credentials are included
  return fetch(url, {
    ...options,
    headers,
    credentials: 'same-origin',
  });
}

// ============================================================================
// Secure Storage
// ============================================================================

const STORAGE_PREFIX = 'cgraph_';

interface StorageOptions {
  expires?: number; // TTL in milliseconds
  encrypted?: boolean;
}

interface StoredItem<T> {
  value: T;
  expires?: number;
  timestamp: number;
}

/**
 * Securely store data in localStorage
 */
export function secureStore<T>(key: string, value: T, options: StorageOptions = {}): void {
  const prefixedKey = STORAGE_PREFIX + key;
  const item: StoredItem<T> = {
    value,
    timestamp: Date.now(),
  };

  if (options.expires) {
    item.expires = Date.now() + options.expires;
  }

  try {
    localStorage.setItem(prefixedKey, JSON.stringify(item));
  } catch (e) {
    console.warn('[Security] Failed to store item:', e);
  }
}

/**
 * Retrieve securely stored data
 */
export function secureRetrieve<T>(key: string): T | null {
  const prefixedKey = STORAGE_PREFIX + key;

  try {
    const raw = localStorage.getItem(prefixedKey);
    if (!raw) return null;

    const item: StoredItem<T> = JSON.parse(raw);

    // Check expiration
    if (item.expires && Date.now() > item.expires) {
      localStorage.removeItem(prefixedKey);
      return null;
    }

    return item.value;
  } catch {
    return null;
  }
}

/**
 * Remove stored item
 */
export function secureRemove(key: string): void {
  localStorage.removeItem(STORAGE_PREFIX + key);
}

/**
 * Clear all CGraph stored items
 */
export function secureClear(): void {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith(STORAGE_PREFIX));
  keys.forEach((k) => localStorage.removeItem(k));
}

// ============================================================================
// Password Validation
// ============================================================================

export interface PasswordStrength {
  score: number; // 0-4
  label: 'weak' | 'fair' | 'good' | 'strong' | 'excellent';
  suggestions: string[];
}

/**
 * Check password strength
 */
export function checkPasswordStrength(password: string): PasswordStrength {
  const suggestions: string[] = [];
  let score = 0;

  // Length checks
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length < 8) suggestions.push('Use at least 8 characters');

  // Character variety
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score++;
  } else {
    suggestions.push('Use both uppercase and lowercase letters');
  }

  if (/\d/.test(password)) {
    score++;
  } else {
    suggestions.push('Include at least one number');
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score++;
  } else {
    suggestions.push('Include at least one special character');
  }

  // Common patterns to avoid
  if (/(.)\1{2,}/.test(password)) {
    score--;
    suggestions.push('Avoid repeated characters');
  }

  if (/^(123|abc|qwerty|password)/i.test(password)) {
    score--;
    suggestions.push('Avoid common patterns');
  }

  const labels: PasswordStrength['label'][] = ['weak', 'fair', 'good', 'strong', 'excellent'];

  return {
    score: Math.max(0, Math.min(4, score)),
    label: labels[Math.max(0, Math.min(4, score))] ?? 'weak',
    suggestions,
  };
}

// ============================================================================
// Rate Limiting (Client-side)
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check if action is rate limited
 */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (entry.count >= limit) {
    return true;
  }

  entry.count++;
  return false;
}

/**
 * Get remaining attempts
 */
export function getRemainingAttempts(key: string, limit: number): number {
  const entry = rateLimitStore.get(key);
  if (!entry || Date.now() > entry.resetAt) {
    return limit;
  }
  return Math.max(0, limit - entry.count);
}

// ============================================================================
// Content Security Policy
// ============================================================================

/**
 * Generate nonce for inline scripts
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

/**
 * Check if current page has CSP
 */
export function hasContentSecurityPolicy(): boolean {
  const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  return !!cspMeta;
}

// ============================================================================
// Session Security
// ============================================================================

/**
 * Check if session is likely hijacked (fingerprint mismatch)
 */
export function getSessionFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen.width + 'x' + screen.height,
  ];

  return btoa(components.join('|'));
}

/**
 * Validate session fingerprint
 */
export function validateSessionFingerprint(storedFingerprint: string): boolean {
  return getSessionFingerprint() === storedFingerprint;
}

// ============================================================================
// Secure Headers Check
// ============================================================================

export interface SecurityHeadersCheck {
  hasHSTS: boolean;
  hasCSP: boolean;
  hasXFrameOptions: boolean;
  hasXContentTypeOptions: boolean;
  recommendations: string[];
}

/**
 * Check security headers (for debugging in dev)
 */
export async function checkSecurityHeaders(
  url: string = window.location.href
): Promise<SecurityHeadersCheck> {
  const recommendations: string[] = [];

  try {
    const response = await fetch(url, { method: 'HEAD' });
    const headers = response.headers;

    const hasHSTS = headers.has('Strict-Transport-Security');
    const hasCSP = headers.has('Content-Security-Policy') || hasContentSecurityPolicy();
    const hasXFrameOptions = headers.has('X-Frame-Options');
    const hasXContentTypeOptions = headers.has('X-Content-Type-Options');

    if (!hasHSTS) recommendations.push('Add Strict-Transport-Security header');
    if (!hasCSP) recommendations.push('Add Content-Security-Policy header');
    if (!hasXFrameOptions) recommendations.push('Add X-Frame-Options header');
    if (!hasXContentTypeOptions) {
      recommendations.push('Add X-Content-Type-Options header');
    }

    return {
      hasHSTS,
      hasCSP,
      hasXFrameOptions,
      hasXContentTypeOptions,
      recommendations,
    };
  } catch {
    return {
      hasHSTS: false,
      hasCSP: false,
      hasXFrameOptions: false,
      hasXContentTypeOptions: false,
      recommendations: ['Unable to check headers'],
    };
  }
}

// ============================================================================
// Export
// ============================================================================

export const security = {
  // XSS
  escapeHtml,
  sanitizeInput,
  sanitizeUrl,
  isTrustedDomain,

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
