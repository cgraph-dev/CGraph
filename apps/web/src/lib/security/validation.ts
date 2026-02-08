/**
 * Password Validation, Rate Limiting, CSP, Session, and Security Headers utilities
 */

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
