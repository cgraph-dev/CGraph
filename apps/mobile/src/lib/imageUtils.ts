/**
 * Image URL utilities
 *
 * Handles validation and sanitization of image URLs, particularly
 * for iOS photo library URLs that can't be loaded directly.
 *
 * @since v0.7.32
 */

/**
 * Invalid URL schemes that React Native's Image component cannot load directly.
 * - ph:// - iOS Photos library internal reference
 * - assets-library:// - Legacy iOS photo library format
 */
const INVALID_IMAGE_SCHEMES = ['ph://', 'assets-library://'];

/**
 * Validates an image URL for use with React Native's Image component.
 * Returns null for URLs that cannot be loaded directly (like iOS photo library URLs).
 *
 * @param url - The URL to validate
 * @returns The original URL if valid, or null if it cannot be loaded
 *
 * @example
 * ```tsx
 * const validUrl = getValidImageUrl(user.avatar_url);
 * {validUrl && <Image source={{ uri: validUrl }} />}
 * ```
 */
export function getValidImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // Check for invalid schemes
  for (const scheme of INVALID_IMAGE_SCHEMES) {
    if (url.startsWith(scheme)) {
      return null;
    }
  }

  return url;
}

/**
 * Checks if a URL is a valid loadable image URL.
 *
 * @param url - The URL to check
 * @returns true if the URL can be loaded by Image component
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  return getValidImageUrl(url) !== null;
}
