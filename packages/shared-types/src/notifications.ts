/**
 * Notification preference types for per-conversation/channel/group settings.
 * @module shared-types/notifications
 */

/** Available notification delivery modes */
export type NotificationMode = 'all' | 'mentions_only' | 'none';

/** Target types that support notification preferences */
export type NotificationTargetType = 'conversation' | 'channel' | 'group';

/** A user's notification preference for a specific target */
export interface NotificationPreference {
  id?: string;
  targetType: NotificationTargetType;
  targetId: string;
  mode: NotificationMode;
  mutedUntil?: string | null; // ISO 8601 datetime
  insertedAt?: string;
  updatedAt?: string;
}

/** Request payload for upserting a notification preference */
export interface UpsertNotificationPreferenceRequest {
  mode: NotificationMode;
  mutedUntil?: string | null;
}

/** Response from the notification preferences API */
export interface NotificationPreferencesResponse {
  preferences: NotificationPreference[];
}

/** Response for a single preference */
export interface NotificationPreferenceResponse {
  preference: NotificationPreference;
}

/** Mute duration presets (in seconds) */
export const MUTE_DURATIONS = {
  '1h': 3600,
  '8h': 28800,
  '24h': 86400,
  '1w': 604800,
  forever: null,
} as const;

export type MuteDurationKey = keyof typeof MUTE_DURATIONS;
