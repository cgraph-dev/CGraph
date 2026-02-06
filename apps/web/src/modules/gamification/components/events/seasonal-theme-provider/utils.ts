import type { SeasonalTheme } from './types';

/**
 * Detects the current seasonal theme based on the current date.
 *
 * Seasons:
 * - Halloween: October 1-31
 * - Winter/Holiday: December 1 - January 7
 * - Valentine's: February 1-14
 * - Spring: March 20 - May 31
 * - Summer: June 1 - August 31
 * - Fall: September 1 - November 30 (excluding Halloween)
 */
export function detectSeasonalTheme(): SeasonalTheme {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const day = now.getDate();

  // Halloween (October 1-31)
  if (month === 10) {
    return 'halloween';
  }

  // Winter/Holiday (December 1 - January 7)
  if (month === 12 || (month === 1 && day <= 7)) {
    return 'winter';
  }

  // Valentine's (February 1-14)
  if (month === 2 && day <= 14) {
    return 'valentines';
  }

  // Spring (March 20 - May 31)
  if (month === 3 || month === 4 || month === 5) {
    return 'spring';
  }

  // Summer (June 1 - August 31)
  if (month === 6 || month === 7 || month === 8) {
    return 'summer';
  }

  // Fall (September 1 - November 30, excluding Halloween)
  if (month === 9 || month === 11) {
    return 'fall';
  }

  return 'default';
}
