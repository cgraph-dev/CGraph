/**
 * PII Stripping & Sanitization
 *
 * Recursively strips personally identifiable information
 * from error payloads before transmission.
 *
 * @module lib/error-tracking/pii
 */

/** Keys that should be redacted */
const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'apikey',
  'api_key',
  'authorization',
  'cookie',
  'session',
  'credit_card',
  'ssn',
  'social_security',
  'private_key',
  'privatekey',
];

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const IP_REGEX = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;
const JWT_REGEX = /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g;

/** Strip PII from a string value */
export function stripPiiFromString(value: string): string {
  return value
    .replace(EMAIL_REGEX, '[EMAIL]')
    .replace(PHONE_REGEX, '[PHONE]')
    .replace(IP_REGEX, '[IP]')
    .replace(JWT_REGEX, '[JWT]');
}

/** Recursively strip PII from an object */
export function stripPii(obj: unknown, depth = 0): unknown {
  if (depth > 10) return '[MAX_DEPTH]';
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') return stripPiiFromString(obj);

  if (Array.isArray(obj)) {
    return obj.map((item) => stripPii(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (SENSITIVE_KEYS.some((sk) => key.toLowerCase().includes(sk))) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = stripPii(value, depth + 1);
      }
    }
    return result;
  }

  return obj;
}
