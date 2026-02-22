/**
 * Core application configuration constants.
 * @module @cgraph/config/app
 */

export const APP_CONFIG = {
  /** Application name */
  name: 'CGraph',
  /** Current version */
  version: '0.9.37',
  /** Minimum supported client version for API compatibility */
  minClientVersion: '0.9.0',
  /** Default locale */
  defaultLocale: 'en',
  /** Supported locales */
  supportedLocales: ['en'] as const,
} as const;
