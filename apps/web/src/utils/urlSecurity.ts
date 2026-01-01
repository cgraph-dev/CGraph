/**
 * URL Validation Utilities
 * 
 * Provides security-focused URL validation to prevent:
 * - javascript: protocol attacks
 * - data: protocol attacks (for images)
 * - Other malicious URL schemes
 */

/**
 * List of allowed URL protocols for links
 */
const ALLOWED_LINK_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

/**
 * List of allowed URL protocols for images
 */
const ALLOWED_IMAGE_PROTOCOLS = ['http:', 'https:', 'data:'];

/**
 * List of allowed image data: mime types
 */
const ALLOWED_DATA_IMAGE_TYPES = [
  'data:image/jpeg',
  'data:image/jpg',
  'data:image/png',
  'data:image/gif',
  'data:image/webp',
  'data:image/svg+xml',
];

/**
 * Validates if a URL is safe for use in links
 * Returns true for safe URLs, false for potentially malicious URLs
 */
export function isValidLinkUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  
  // Trim and lowercase for checking
  const trimmedUrl = url.trim().toLowerCase();
  
  // Check for empty string
  if (!trimmedUrl) return false;
  
  // Check for javascript: protocol (case insensitive, including obfuscation attempts)
  if (trimmedUrl.startsWith('javascript:')) return false;
  if (trimmedUrl.startsWith('vbscript:')) return false;
  if (trimmedUrl.startsWith('data:') && !trimmedUrl.startsWith('data:image/')) return false;
  
  // Try to parse as URL to check protocol
  try {
    // Handle relative URLs (they're generally safe)
    if (url.startsWith('/') || url.startsWith('#') || url.startsWith('.')) {
      return true;
    }
    
    const parsedUrl = new URL(url, window.location.origin);
    return ALLOWED_LINK_PROTOCOLS.includes(parsedUrl.protocol);
  } catch {
    // If URL parsing fails, reject for safety
    return false;
  }
}

/**
 * Validates if a URL is safe for use in image src attributes
 * Returns true for safe URLs, false for potentially malicious URLs
 */
export function isValidImageUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  
  const trimmedUrl = url.trim().toLowerCase();
  
  // Check for empty string
  if (!trimmedUrl) return false;
  
  // Check for javascript: protocol
  if (trimmedUrl.startsWith('javascript:')) return false;
  if (trimmedUrl.startsWith('vbscript:')) return false;
  
  // Allow data: URLs only for specific image types
  if (trimmedUrl.startsWith('data:')) {
    return ALLOWED_DATA_IMAGE_TYPES.some(type => trimmedUrl.startsWith(type));
  }
  
  // Try to parse as URL to check protocol
  try {
    // Handle relative URLs
    if (url.startsWith('/')) {
      return true;
    }
    
    const parsedUrl = new URL(url, window.location.origin);
    return ALLOWED_IMAGE_PROTOCOLS.includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitizes a URL for use in links
 * Returns the URL if safe, or '#' if unsafe
 */
export function sanitizeLinkUrl(url: string | undefined | null): string {
  if (isValidLinkUrl(url)) {
    return url!;
  }
  return '#';
}

/**
 * Sanitizes a URL for use in image src
 * Returns the URL if safe, or a placeholder if unsafe
 */
export function sanitizeImageUrl(url: string | undefined | null, placeholder = ''): string {
  if (isValidImageUrl(url)) {
    return url!;
  }
  return placeholder;
}

/**
 * Sanitizes user-provided content that might be displayed as HTML
 * Uses a simple escape approach for text content
 */
export function escapeHtml(str: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return str.replace(/[&<>"'/]/g, (match) => htmlEscapes[match] || match);
}

/**
 * Validates an external URL for opening in a new window
 * More restrictive - only allows http and https
 */
export function isValidExternalUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}
