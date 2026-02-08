/**
 * XSS Prevention, CSRF Protection, and Secure Storage utilities
 */

import { createLogger } from '@/lib/logger';

const logger = createLogger('Security');

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

export interface StorageOptions {
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
    logger.warn('Failed to store item:', e);
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
