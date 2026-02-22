/**
 * Feature flag defaults — client-side feature toggle keys.
 *
 * Actual flag values are resolved at runtime from the backend.
 * These serve as keys and documentation for available flags.
 * @module @cgraph/config/features
 */

export const FEATURE_FLAGS = {
  /** E2EE messaging support */
  E2EE: 'e2ee_enabled',
  /** Voice messages */
  VOICE_MESSAGES: 'voice_messages_enabled',
  /** WebRTC video calls */
  VIDEO_CALLS: 'video_calls_enabled',
  /** Marketplace trading */
  MARKETPLACE: 'marketplace_enabled',
  /** Gamification features (XP, levels, daily bonus) */
  GAMIFICATION: 'gamification_enabled',
  /** Premium subscription features */
  PREMIUM: 'premium_enabled',
  /** Forum system */
  FORUMS: 'forums_enabled',
  /** Calendar/events system */
  CALENDAR: 'calendar_enabled',
  /** Data export (GDPR) */
  DATA_EXPORT: 'data_export_enabled',
} as const;
