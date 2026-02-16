/**
 * Shared application constants — single source of truth
 *
 * All URL and environment constants used across the landing site.
 * Import from '@/constants' instead of defining inline.
 *
 * @since v0.9.26
 */

/** Web application base URL (authenticated app at app.cgraph.org) */
export const WEB_APP_URL = 'https://web.cgraph.org';

/** Landing site base URL */
export const LANDING_URL = 'https://cgraph.org';

/** External links used across the site */
export const EXTERNAL_LINKS = {
  register: `${WEB_APP_URL}/register`,
  login: `${WEB_APP_URL}/login`,
  forum: `${WEB_APP_URL}/forum`,
  twitter: 'https://twitter.com/cgraph',
  github: 'https://github.com/cgraph',
} as const;
